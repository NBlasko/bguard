import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, coerce } from '../';
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
describe('coerce', () => {
  describe('number', () => {
    it.each([
      ['3', 3],
      [3, 3],
      ['3.5', 3.5],
      ['', 0],
      [true, 1],
    ])('turns %p into %p', (received, expected) => {
      expect(parseOrFail(coerce.number(), received)).toBe(expected);
    });

    it('rejects a value Number cannot read, rather than passing NaN', () => {
      // Number('abc') is NaN, which number() rejects, so this fails validation instead of parsing.
      expect(parse(coerce.number(), 'abc')[0]![0]!.code).toBe('c:nan');
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

    it('leaves a Date alone', () => {
      const received = new Date('2024-01-01');

      expect(parseOrFail(coerce.date(), received)).toBe(received);
    });

    it('rejects a string that is not a date', () => {
      expect(parse(coerce.date(), 'nonsense')[0]![0]!.code).toBe('c:date');
    });

    it('leaves null for nullable to decide', () => {
      expect(hasErrors(parse(coerce.date(), null))).toBe(true);
      expect(parseOrFail(coerce.date().nullable(), null)).toBeNull();
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
