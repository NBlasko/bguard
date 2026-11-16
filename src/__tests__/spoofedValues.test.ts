import { runInNewContext } from 'node:vm';
import { hasErrors } from '../../jest/setup';
import { parse, parseOrFail, toJSONSchema } from '../';
import { coerce } from '../asserts/coerce';
import { date } from '../asserts/date';
import { oneOfTypes } from '../asserts/mix';
import { object } from '../asserts/object';
import { _cloneValue } from '../helpers/cloneValue';
import { integer } from '../asserts/number/integer';
import { RequiredValidation } from '../core';
import { _isPlainObject, _timeOf, _unbox } from '../helpers/intrinsics';

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
