import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, coerce, BuildSchemaError } from '../';
import { coerceBigInt } from '../asserts/coerce/bigint';
import { coerceBoolean } from '../asserts/coerce/boolean';
import { coerceDate } from '../asserts/coerce/date';
import { coerceNumber } from '../asserts/coerce/number';
import { coerceString } from '../asserts/coerce/string';
import * as barrel from '../asserts/coerce/index';
import { InferInput, InferOutput, InferType } from '../InferType';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { min } from '../asserts/number/min';

const parsed = (result: ReturnType<typeof parse>) => result[1];

/**
 * Coercion is for input that does not arrive already typed: query strings, form data, environment
 * variables. Each helper accepts `unknown` and says so in its inferred input type, while the output
 * type is unchanged — which is the whole reason `InferInput` exists.
 *
 * The transforms must never throw. They run before validation, so a throw would replace a clear type
 * error with an unexplained failure. Anything a helper cannot convert is passed through for validation
 * to reject.
 */
describe('each helper is its own module', () => {
  // The barrel object references all five, so a bundler has to keep all five wherever it is used. That
  // is contrary to how the rest of the package is built, where every assertion has its own subpath.
  // Measured: importing coerceNumber on its own costs 87 bytes over a plain number(), against 2033 for
  // reaching it through the barrel, and the bigint schema is genuinely absent rather than merely unused.
  it('exports the same function through its own module and through the barrel', () => {
    expect(coerceString).toBe(coerce.string);
    expect(coerceNumber).toBe(coerce.number);
    expect(coerceBoolean).toBe(coerce.boolean);
    expect(coerceBigInt).toBe(coerce.bigint);
    expect(coerceDate).toBe(coerce.date);
  });

  it('behaves identically either way', () => {
    expect(parseOrFail(coerceNumber(), '3')).toBe(3);
    expect(parseOrFail(coerce.number(), '3')).toBe(3);
    expect(parseOrFail(coerceString().equalTo('yes'), 'yes')).toBe('yes');
  });

  it('re-exports each one by name from the barrel, which is a public subpath too', () => {
    // bguard/coerce is an entry point in its own right, so what it names is part of the API.
    expect(barrel.coerceString).toBe(coerceString);
    expect(barrel.coerceNumber).toBe(coerceNumber);
    expect(barrel.coerceBoolean).toBe(coerceBoolean);
    expect(barrel.coerceBigInt).toBe(coerceBigInt);
    expect(barrel.coerceDate).toBe(coerceDate);
  });

  it('works when reached through its own module', () => {
    // Identity alone never calls them, which would leave each module's factory uncovered.
    expect(parseOrFail(coerceString(), 42)).toBe('42');
    expect(parseOrFail(coerceNumber(), '42')).toBe(42);
    expect(parseOrFail(coerceBoolean(), 'true')).toBe(true);
    expect(parseOrFail(coerceBigInt(), '42')).toBe(42n);
    expect(parseOrFail(coerceDate(), '2024-01-01')).toEqual(new Date('2024-01-01'));
  });
});

describe('a coercion never throws', () => {
  // A throwing transform is reported as 'Something unexpected happened' instead of a validation error.
  // Number(Symbol()), new Date(1n) and new Date(Symbol()) all threw.
  const awkward: unknown[] = [
    Symbol('x'),
    1n,
    -1n,
    () => 1,
    {},
    [],
    [''],
    [5],
    Object.create(null),
    new Date(NaN),
    NaN,
    -0,
    ' ',
  ];

  it.each([
    ['number', coerceNumber],
    ['bigint', coerceBigInt],
    ['date', coerceDate],
    ['string', coerceString],
    ['boolean', coerceBoolean],
  ])('coerce.%s reports a validation error or a value for every awkward input', (_name, factory) => {
    for (const received of awkward) {
      const [errors] = parse(factory(), received);
      expect(errors?.map((error) => error.message) ?? []).not.toContain('Something unexpected happened');
    }
  });
});

describe('coerce', () => {
  describe('number', () => {
    it.each([
      ['3', 3],
      [3, 3],
      ['3.5', 3.5],
      [' 3 ', 3],
      ['0', 0],
      [true, 1],
    ])('turns %p into %p', (received, expected) => {
      expect(parseOrFail(coerce.number(), received)).toBe(expected);
    });

    it('rejects a value Number cannot read, rather than passing NaN', () => {
      // Number('abc') is NaN, which number() rejects, so this fails validation instead of parsing.
      expect(parse(coerce.number(), 'abc')[0]![0]!.code).toBe('c:nan');
    });

    it.each([[''], [' '], ['\t\n']])('rejects the empty string %p rather than reading it as 0', (received) => {
      // Number('') is 0, so an empty form field used to arrive as a real zero.
      expect(parse(coerce.number(), received)[0]![0]!.code).toBe('c:nan');
    });

    it.each([
      ['an empty array', []],
      ['an array holding an empty string', ['']],
      ['an array holding a number', [5]],
      ['an object', {}],
      ['a function', () => 5],
      ['a symbol', Symbol('x')],
    ])('rejects %s by type rather than handing it to Number', (_name, received) => {
      // Number([]) and Number(['']) are 0, Number([5]) is 5, and Number(Symbol()) throws.
      expect(parse(coerce.number(), received)[0]![0]!.code).toBe('c:invalidType');
    });

    it.each([
      [false, 0],
      [10n, 10],
      [new Date(1234), 1234],
    ])('still converts %p, a primitive or a Date, to %p', (received, expected) => {
      expect(parseOrFail(coerce.number(), received)).toBe(expected);
    });

    it('rejects Infinity, which Number reads from the string', () => {
      expect(parse(coerce.number(), 'Infinity')[0]![0]!.code).toBe('c:infinity');
    });

    it('leaves null for nullable to decide', () => {
      // Number(null) is 0, which would quietly turn a missing value into a real one.
      expect(hasErrors(parse(coerce.number(), null))).toBe(true);
      expect(parseOrFail(coerce.number().nullable(), null)).toBeNull();
    });

    it('composes with assertions on the coerced value', () => {
      const schema = coerce.number().custom(min(10));

      expect(parseOrFail(schema, '20')).toBe(20);
      expect(parse(schema, '5')[0]![0]!.code).toBe('n:min');
    });
  });

  describe('string', () => {
    it('rejects an object with no prototype, which String throws on', () => {
      expect(parse(coerce.string(), Object.create(null))[0]![0]!.code).toBe('c:invalidType');
    });

    it.each([
      [3, '3'],
      ['x', 'x'],
      [true, 'true'],
    ])('turns %p into %p', (received, expected) => {
      expect(parseOrFail(coerce.string(), received)).toBe(expected);
    });

    it('leaves null for nullable to decide', () => {
      // String(null) is 'null', which is never what was meant.
      expect(hasErrors(parse(coerce.string(), null))).toBe(true);
      expect(parseOrFail(coerce.string().nullable(), null)).toBeNull();
    });
  });

  describe('boolean', () => {
    it.each([
      ['true', true],
      ['TRUE', true],
      ['false', false],
      ['False', false],
      [1, true],
      [0, false],
      [true, true],
    ])('turns %p into %p', (received, expected) => {
      expect(parseOrFail(coerce.boolean(), received)).toBe(expected);
    });

    it.each(['yes', 'no', '', 2, -1, {}])('rejects %p rather than guessing', (received) => {
      // Deliberately narrower than Boolean(value), which accepts everything and reads 'false' as true.
      expect(hasErrors(parse(coerce.boolean(), received))).toBe(true);
    });

    it('leaves null for nullable to decide', () => {
      expect(hasErrors(parse(coerce.boolean(), null))).toBe(true);
      expect(parseOrFail(coerce.boolean().nullable(), null)).toBeNull();
    });
  });

  describe('bigint', () => {
    it.each([
      ['5', 5n],
      [5, 5n],
      [5n, 5n],
    ])('turns %p into %p', (received, expected) => {
      expect(parseOrFail(coerce.bigint(), received)).toBe(expected);
    });

    it.each([
      ['an empty string', ''],
      ['a whitespace-only string', '  '],
      ['an empty array', []],
      ['an array holding an empty string', ['']],
      ['an array holding a number', [5]],
      ['an object', {}],
      ['a symbol', Symbol('x')],
    ])('rejects %s rather than reading it as a bigint', (_name, received) => {
      // BigInt(''), BigInt('  ') and BigInt([]) are all 0n.
      expect(parse(coerce.bigint(), received)[0]![0]!.code).toBe('c:invalidType');
    });

    it.each([
      [true, 1n],
      [false, 0n],
      [new Date(1234), 1234n],
    ])('still converts %p to %p', (received, expected) => {
      expect(parseOrFail(coerce.bigint(), received)).toBe(expected);
    });

    it.each(['abc', 1.5])('rejects %p, which BigInt throws on', (received) => {
      // The transform catches and passes the value through, so validation reports the type problem.
      expect(hasErrors(parse(coerce.bigint(), received))).toBe(true);
    });

    it('leaves null for nullable to decide', () => {
      expect(hasErrors(parse(coerce.bigint(), null))).toBe(true);
      expect(parseOrFail(coerce.bigint().nullable(), null)).toBeNull();
    });
  });

  describe('date', () => {
    it('turns a string into a Date', () => {
      expect(parseOrFail(coerce.date(), '2024-01-01')).toEqual(new Date('2024-01-01'));
    });

    it('turns a number into the Date at that timestamp', () => {
      expect(parseOrFail(coerce.date(), 86_400_000)).toEqual(new Date('1970-01-02T00:00:00Z'));
    });

    it.each([
      ['true, which new Date read as 1 ms after the epoch', true],
      ['false', false],
      ['an array holding a number, read as May 2001', [5]],
      ['an array holding a date string', ['2021-01-01']],
      ['a bigint, which new Date throws on', 1n],
      ['a symbol, which new Date throws on', Symbol('x')],
      ['an object', {}],
    ])('rejects %s', (_name, received) => {
      expect(parse(coerce.date(), received)[0]![0]!.code).toBe('c:date');
    });

    it('leaves a Date alone', () => {
      const received = new Date('2024-01-01');

      expect(parseOrFail(coerce.date(), received)).toBe(received);
    });

    it('rejects a string that is not a date', () => {
      expect(parse(coerce.date(), 'nonsense')[0]![0]!.code).toBe('c:date');
    });

    it.each([
      ['2021-02-30'],
      ['2021-02-29'],
      ['2021-04-31'],
      ['2021-2-30'],
      ['2021-02-30T10:00:00Z'],
      ['2021-04-31T00:00'],
      ['02/30/2021'],
      ['2/29/2021'],
      ['2021-00-10'],
      ['13/01/2021'],
      // Found in review: the same rollover through other separators and shapes.
      ['2021/02/30'],
      ['2021.02.30'],
      [' 2021-02-30'],
      ['+002021-02-30'],
      ['02-30-2021'],
      ['02.30.2021'],
      ['2021/02/30 10:00'],
    ])('rejects %p, a day that does not exist, rather than rolling it into the next month', (received) => {
      // new Date('2021-02-30') is March 2nd.
      expect(parse(coerce.date(), received)[0]![0]!.code).toBe('c:date');
    });

    it.each([
      ['2020-02-29', '2020-02-29T00:00:00.000Z'],
      ['2021-12-31T23:59:59Z', '2021-12-31T23:59:59.000Z'],
      ['2021-2-3', null],
      ['02/28/2021', null],
      ['2021/02/28', null],
      [' 2021-02-28', null],
      ['02-28-2021', null],
      ['+002020-02-29', '2020-02-29T00:00:00.000Z'],
    ])('still reads %p, a day that exists', (received, iso) => {
      const parsed = parseOrFail(coerce.date(), received);
      expect(parsed.getTime()).toBe(new Date(received).getTime());
      if (iso) expect(parsed.toISOString()).toBe(iso);
    });

    it('leaves null for nullable to decide', () => {
      expect(hasErrors(parse(coerce.date(), null))).toBe(true);
      expect(parseOrFail(coerce.date().nullable(), null)).toBeNull();
    });
  });

  describe('the schema class survives coercion', () => {
    // The return types used to be written out as `WithBGuardType<CommonSchema, string>`, which flattened
    // each schema to CommonSchema and silently dropped the methods only the concrete classes define. A
    // coerced schema has to stay as refinable as the plain one it came from.
    it('keeps equalTo, coercing before the literal is checked', () => {
      const schema = coerce.number().equalTo(5);

      expectEqualTypes<5, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, '5')).toBe(5);
      expect(hasErrors(parse(schema, '6'))).toBe(true);
    });

    it('keeps oneOfValues', () => {
      const schema = coerce.string().oneOfValues(['en', 'sr']);

      expectEqualTypes<'en' | 'sr', InferType<typeof schema>>(true);
      expect(parseOrFail(schema, 'sr')).toBe('sr');
      expect(hasErrors(parse(schema, 'de'))).toBe(true);
    });

    it('keeps onlyTrue and onlyFalse', () => {
      const onlyTrue = coerce.boolean().onlyTrue();

      expectEqualTypes<true, InferType<typeof onlyTrue>>(true);
      expect(parseOrFail(onlyTrue, 'true')).toBe(true);
      expect(hasErrors(parse(onlyTrue, 'false'))).toBe(true);
      expect(parseOrFail(coerce.boolean().onlyFalse(), 0)).toBe(false);
    });

    it('keeps the once-only guard those methods carry', () => {
      expect(() => coerce.string().equalTo('a').equalTo('b')).toThrow(BuildSchemaError);
    });

    it('still reports unknown as the input after a literal is applied', () => {
      const schema = coerce.string().equalTo('yes');

      expectEqualTypes<unknown, InferInput<typeof schema>>(true);
      expect(parseOrFail(schema, 'yes')).toBe('yes');
    });
  });

  describe('inferred input and output', () => {
    it('accepts unknown and produces the target type', () => {
      const schema = coerce.number();

      expectEqualTypes<unknown, InferInput<typeof schema>>(true);
      expectEqualTypes<number, InferType<typeof schema>>(true);
      expectEqualTypes<number, InferInput<typeof schema>>(false);
      expect(parseOrFail(schema, '3')).toBe(3);
    });

    it('leaves input and output identical without coercion', () => {
      const schema = object({ a: string(), b: number() });

      expectEqualTypes<InferInput<typeof schema>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
    });

    it('exposes InferOutput as InferType', () => {
      const schema = object({ a: string() });

      expectEqualTypes<InferOutput<typeof schema>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x' })).toEqual({ a: 'x' });
    });

    it('records the parameter type of an explicit transform', () => {
      const schema = number().transformBeforeValidation((received: string) => Number(received));

      expectEqualTypes<string, InferInput<typeof schema>>(true);
      expectEqualTypes<number, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, '7')).toBe(7);
    });

    it('carries the input type through nesting', () => {
      const schema = object({ rows: array(object({ n: coerce.number() })) });

      expectEqualTypes<{ rows: { n: unknown }[] }, InferInput<typeof schema>>(true);
      expectEqualTypes<{ rows: { n: number }[] }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { rows: [{ n: '1' }] })).toEqual({ rows: [{ n: 1 }] });
    });
  });

  describe('defaults on the input side', () => {
    it('makes the value optional on input and present on output', () => {
      const schema = number().default(5);

      expectEqualTypes<number | undefined, InferInput<typeof schema>>(true);
      expectEqualTypes<number, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, undefined)).toBe(5);
    });

    it('makes an object property optional on input and required on output', () => {
      const schema = object({ page: number().default(1), q: string() });

      expectEqualTypes<{ q: string; page?: number | undefined }, InferInput<typeof schema>>(true);
      expectEqualTypes<{ page: number; q: string }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { q: 'x' })).toEqual({ page: 1, q: 'x' });
    });
  });

  describe('a query object, which is what this is for', () => {
    const querySchema = object({
      page: coerce.number().default(1),
      limit: coerce.number(),
      active: coerce.boolean(),
    });

    it('reads everything from strings', () => {
      expect(parsed(parse(querySchema, { page: '3', limit: '20', active: 'false' }))).toEqual({
        page: 3,
        limit: 20,
        active: false,
      });
    });

    it('fills the default when the parameter is absent', () => {
      expect(parsed(parse(querySchema, { limit: '20', active: 'true' }))).toEqual({
        page: 1,
        limit: 20,
        active: true,
      });
    });

    it('reports the field that could not be read', () => {
      const [errors] = parse(querySchema, { limit: 'abc', active: 'true' }, { getAllErrors: true });

      expect(errors!.map((error) => error.path)).toEqual([['limit']]);
    });

    it('says it accepts unknown values but produces typed ones', () => {
      expectEqualTypes<{ limit: unknown; active: unknown; page?: unknown }, InferInput<typeof querySchema>>(true);
      expectEqualTypes<{ page: number; limit: number; active: boolean }, InferType<typeof querySchema>>(true);
    });
  });

  describe('Standard Schema reports both sides', () => {
    it('reports the input and output types separately', () => {
      const schema = object({ page: coerce.number() });
      type Props = (typeof schema)['~standard'];

      expectEqualTypes<NonNullable<Props['types']>['input'], InferInput<typeof schema>>(true);
      expectEqualTypes<NonNullable<Props['types']>['output'], InferType<typeof schema>>(true);
      // They are genuinely different for a coercing schema, which is the point.
      expectEqualTypes<NonNullable<Props['types']>['input'], NonNullable<Props['types']>['output']>(false);
      expect(parseOrFail(schema, { page: '3' })).toEqual({ page: 3 });
    });

    it('validates a coerced value through the interface', () => {
      const schema = object({ page: coerce.number() });

      expect(schema['~standard'].validate({ page: '3' })).toEqual({ value: { page: 3 } });
    });
  });
});
