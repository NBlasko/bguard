import { runInNewContext } from 'node:vm';
import { hasErrors } from '../../jest/setup';
import { parse, parseOrFail, toJSONSchema } from '../';
import { coerce } from '../asserts/coerce';
import { date } from '../asserts/date';
import { oneOfTypes } from '../asserts/mix';
import { object } from '../asserts/object';
import { _cloneValue } from '../helpers/cloneValue';
import { integer } from '../asserts/number/integer';
import { ExceptionContext } from '../core';
import { RequiredValidation } from '../core';
import { _isPlainObject, _timeOf, _unbox } from '../helpers/intrinsics';
import { _countDefinedKeys } from '../helpers/checkKeyCount';
import { dateMin } from '../asserts/date/dateMin';
import { dateMax } from '../asserts/date/dateMax';

/**
 * Values that claim to be something they are not, through `Symbol.toStringTag` or a method of their own,
 * and real ones from another realm. What a value is gets asked of the engine (`Date.prototype.getTime`,
 * `String.prototype.valueOf`, …), which checks an internal slot no object can fake and every realm shares.
 */
const fakeDate = { [Symbol.toStringTag]: 'Date', getTime: () => 0 };
const fakeString = { [Symbol.toStringTag]: 'String', valueOf: () => 'hello' };
const fakeStringWithoutPrototype = Object.assign(Object.create(null) as object, { [Symbol.toStringTag]: 'String' });

describe('values that only claim to be a Date or a boxed primitive', () => {
  it.each([
    ['an object tagged Date', fakeDate],
    ['an object tagged String with its own valueOf', fakeString],
    ['a prototype-free object tagged String', fakeStringWithoutPrototype],
  ])('coerceString rejects %s by type, without throwing', (_name, value) => {
    // These threw inside the coercion and came back as 'Something unexpected happened'.
    expect(parse(coerce.string(), value)[0]![0]!.code).toBe('c:invalidType');
  });

  it('date() rejects an object tagged Date with a getTime of its own', () => {
    // isValidDateInner trusted the tag and called the object's own getTime, so this passed as a Date.
    expect(parse(date(), fakeDate)[0]![0]!.code).toBe('c:date');
  });

  it('a default tagged Date is copied as the plain object it is, not called as a Date', () => {
    const schema = object({ a: oneOfTypes(['object']).default(fakeDate as object) });
    expect(parseOrFail(schema, {}).a).toEqual(expect.objectContaining({ [Symbol.toStringTag]: 'Date' }));
  });
});

describe('real values from another realm', () => {
  it('date() accepts a Date from another realm, as before', () => {
    expect(hasErrors(parse(date(), runInNewContext('new Date(0)')))).toBe(false);
  });

  it('coerceString unboxes a boxed string from another realm', () => {
    expect(parseOrFail(coerce.string(), runInNewContext('new String("x")'))).toBe('x');
  });
});

describe('intrinsics', () => {
  it('_timeOf reads a real Date, valid or not, and nothing else', () => {
    expect(_timeOf(new Date(5))).toBe(5);
    expect(_timeOf(new Date(NaN))).toBeNaN();
    expect(_timeOf(fakeDate)).toBeUndefined();
    expect(_timeOf(5)).toBeUndefined();
    expect(_timeOf(null)).toBeUndefined();
  });

  it('_unbox opens real boxes only', () => {
    expect(_unbox(new String('a'))).toBe('a');
    expect(_unbox(new Number(1))).toBe(1);
    expect(_unbox(new Boolean(false))).toBe(false);
    expect(_unbox(Object(2n))).toBe(2n);
    expect(_unbox(fakeString)).toBe(fakeString);
    expect(_unbox('a')).toBe('a');
  });

  it('_isPlainObject is true for plain objects from any realm and false for anything inheriting more', () => {
    const prototypeFree = Object.create(null) as object;
    expect(_isPlainObject({})).toBe(true);
    expect(_isPlainObject(prototypeFree)).toBe(true);
    expect(_isPlainObject(runInNewContext('({})') as object)).toBe(true);
    expect(_isPlainObject(Object.create(prototypeFree) as object)).toBe(false);
    expect(_isPlainObject(new (class Point {})())).toBe(false);
  });
});

describe('_cloneValue', () => {
  it('keeps an object that inherits from a prototype-free object, inherited fields and all', () => {
    // It used to be rebuilt as {}, losing what it inherited.
    const base = Object.assign(Object.create(null) as Record<string, number>, { inherited: 1 });
    const value = Object.create(base) as Record<string, number>;
    expect(_cloneValue(value)).toBe(value);
    expect(_cloneValue(value)['inherited']).toBe(1);
  });
});

describe('integer() on a number type list', () => {
  it('narrows the type, so nullable still lets null through', () => {
    // The narrowing used to apply to `type: 'number'` alone; a list put `type: 'integer'` into allOf,
    // where it rejected the null that nullable() had added to `type`.
    const schema = oneOfTypes(['number', 'string'])
      .custom(integer() as RequiredValidation<number | string>)
      .nullable();
    expect(toJSONSchema(schema, { dialect: null })).toEqual({ type: ['integer', 'null'] });
    expect(hasErrors(parse(schema, null))).toBe(false);
  });
});

describe('_cloneValue and symbol keys', () => {
  it('copies enumerable symbol-keyed properties, which Object.keys leaves out', () => {
    const tag = Symbol('tag');
    const copy = _cloneValue({ [tag]: { n: 1 }, plain: 1 });
    expect(copy[tag]).toEqual({ n: 1 });
    expect(copy.plain).toBe(1);
  });

  it('leaves out a non-enumerable symbol property, as it leaves out non-enumerable string keys', () => {
    const hidden = Symbol('hidden');
    const value = Object.defineProperty({ plain: 1 }, hidden, { value: 1, enumerable: false });
    expect(Object.getOwnPropertySymbols(_cloneValue(value))).toEqual([]);
  });
});

// Found in the review of b662c35.
describe('review of b662c35', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks the engine about a Date only when the tag says Date, so plain objects cost no exception', () => {
    // Every nested object of a copied default used to be passed to Date.prototype.getTime.call, which
    // threw and was caught, once per object on every parse.
    const getTime = jest.spyOn(Date.prototype, 'getTime');
    const nested = Array.from({ length: 50 }, (_, i) => ({ i, inner: { list: [{ deep: i }] } }));
    _cloneValue(nested);
    expect(getTime).not.toHaveBeenCalled();
  });

  it('asks the engine about a box only when the tag names a box', () => {
    const valueOfs = [
      jest.spyOn(String.prototype, 'valueOf'),
      jest.spyOn(Number.prototype, 'valueOf'),
      jest.spyOn(Boolean.prototype, 'valueOf'),
    ];
    parse(coerce.string(), { a: 1 });
    parse(coerce.string(), [1, 2]);
    for (const spy of valueOfs) expect(spy).not.toHaveBeenCalled();
  });

  it('coerceNumber reads a Date from another realm, and rejects an object built from Date.prototype', () => {
    expect(parseOrFail(coerce.number(), runInNewContext('new Date(5)'))).toBe(5);
    // Number() on this threw inside the coercion.
    expect(parse(coerce.number(), Object.create(Date.prototype))[0]![0]!.code).toBe('c:invalidType');
  });

  it('coerceBigInt reads a Date from another realm', () => {
    expect(parseOrFail(coerce.bigint(), runInNewContext('new Date(5)'))).toBe(5n);
  });

  it("an issue's expected Date is a copy even when the Date came from another realm", () => {
    // Reported straight through addIssue, so it is snapshot's copy and nothing else that is checked.
    const bound = runInNewContext('new Date(0)') as Date;
    const schema = date().custom((received: Date, ctx: ExceptionContext) => {
      ctx.addIssue(bound, received, 'u:afterBound');
    });
    const issue = parse(schema, new Date(1000))[0]![0]!;
    expect(issue.expected).not.toBe(bound);
    expect((issue.expected as Date).getTime()).toBe(0);
  });

  it('dateMin compares the real timestamp, not what a Date with its own valueOf claims', () => {
    // `>` called the received Date's own valueOf, so this 1970 date passed a 2023 minimum.
    const disguised = Object.assign(new Date(0), { valueOf: () => 8.64e15 });
    expect(parse(date().custom(dateMin('2023-01-01')), disguised)[0]![0]!.code).toBe('dt:min');
    expect(
      parse(date().custom(dateMax('2023-01-01')), Object.assign(new Date('2030-01-01'), { valueOf: () => 0 }))[0]![0]!
        .code,
    ).toBe('dt:max');
  });

  it('a date bound does not move when the Date passed to it changes afterwards', () => {
    const bound = new Date('2023-01-01');
    const schema = date().custom(dateMin(bound));
    bound.setFullYear(1990);
    expect(parse(schema, new Date('2000-01-01'))[0]![0]!.code).toBe('dt:min');
  });

  it('a date bound reports nothing for a value that is not a Date, which date() has already reported', () => {
    const [errors] = parse(date().custom(dateMin('2023-01-01'), dateMax('2024-01-01')), 'x', { getAllErrors: true });
    const codes = errors!.map((error) => error.code);
    expect(codes).toContain('c:date');
    expect(codes).not.toContain('dt:min');
    expect(codes).not.toContain('dt:max');
  });

  it('copies the enumerable symbol keys of an array as well', () => {
    const tag = Symbol('tag');
    const copy = _cloneValue(Object.assign([1], { [tag]: { n: 1 } }));
    expect((copy as unknown as Record<symbol, unknown>)[tag]).toEqual({ n: 1 });
  });

  it('counts only own keys for minKeys and maxKeys, not inherited ones', () => {
    const value = Object.assign(Object.create({ inherited: 1 }) as Record<string, unknown>, { own: 1 });
    expect(_countDefinedKeys(value)).toBe(1);
  });
});
