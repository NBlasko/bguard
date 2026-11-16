import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { BuildSchemaError, parse, parseAsync, parseOrFail, toJSONSchema } from '../';
import { InferInput, InferType } from '../InferType';
import { array } from '../asserts/array';
import { boolean } from '../asserts/boolean';
import { coerce } from '../asserts/coerce';
import { date } from '../asserts/date';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { union } from '../asserts/union';
import { oneOfTypes } from '../asserts/mix';
import { min } from '../asserts/number/min';

/**
 * `default(value)` supplies a value when the input is `undefined` — a missing property, a hole in an
 * array, or `undefined` itself. These pin down where it applies, where it does not, and what the value
 * that comes back is.
 */
describe('default()', () => {
  describe('which values it replaces', () => {
    it.each([
      ['false', boolean().default(false), false],
      ['0', number().default(0), 0],
      ['the empty string', string().default(''), ''],
    ])('applies a falsy default such as %s', (_name, schema, expected) => {
      // A truthiness check would skip these; the check is for `undefined`.
      expect(parseOrFail(schema, undefined)).toBe(expected);
    });

    it('does not replace a value that is present', () => {
      expect(parseOrFail(number().default(8), 3)).toBe(3);
    });

    it('does not replace null, which is a value rather than an absence', () => {
      expect(parse(number().default(8), null)[0]![0]!.code).toBe('c:nullable');
    });

    it('lets a nullable schema keep a null it receives', () => {
      expect(parseOrFail(number().nullable().default(1), null)).toBeNull();
    });

    it('can itself be null on a nullable schema', () => {
      expect(parseOrFail(number().nullable().default(null), undefined)).toBeNull();
    });
  });

  describe('where it applies', () => {
    it('to a missing object property', () => {
      expect(parseOrFail(object({ a: number().default(5) }), {})).toEqual({ a: 5 });
    });

    it('to an object property that is present but undefined', () => {
      expect(parseOrFail(object({ a: number().default(5) }), { a: undefined })).toEqual({ a: 5 });
    });

    it('to undefined elements and holes of an array', () => {
      expect(parseOrFail(array(number().default(0)), [undefined, 1])).toEqual([0, 1]);
      expect(parseOrFail(array(number().default(0)), [, 1])).toEqual([0, 1]);
    });

    it('to a tuple position', () => {
      expect(parseOrFail(tuple([number(), string().default('d')]), [1, undefined])).toEqual([1, 'd']);
    });

    it('to a record value', () => {
      expect(parseOrFail(record(string(), number().default(7)), { a: undefined })).toEqual({ a: 7 });
    });

    it('to a union as a whole', () => {
      expect(parseOrFail(union([number(), string()]).default('u'), undefined)).toBe('u');
    });

    it('not to a union through one of its members: the union itself is still required', () => {
      // Put the default on the union. A member's default would make every union optional by accident.
      expect(hasErrors(parse(union([number().default(3), string()]), undefined))).toBe(true);
    });

    it('through Standard Schema', () => {
      expect(number().default(4)['~standard'].validate(undefined)).toEqual({ value: 4 });
    });

    it('under parseAsync', async () => {
      expect(await parseAsync(number().default(9), undefined)).toEqual([null, 9]);
    });
  });

  describe('how it interacts with transforms and coercion', () => {
    it('does not run transformBeforeValidation on the default, which is already the final value', () => {
      const schema = string()
        .transformBeforeValidation((value: string) => `${value}!`)
        .default('x');
      expect(parseOrFail(schema, undefined)).toBe('x');
      expect(parseOrFail(schema, 'y')).toBe('y!');
    });

    it('applies to a coerced schema only when the input is undefined', () => {
      expect(parseOrFail(coerce.number().default(1), undefined)).toBe(1);
      // An empty string is a value, and coerceNumber rejects it rather than the default stepping in.
      expect(parse(coerce.number().default(1), '')[0]![0]!.code).toBe('c:nan');
    });
  });

  describe('validation of the default itself', () => {
    it('rejects, when the schema is built, a default that fails one of its rules', () => {
      expect(() => number().custom(min(5)).default(1)).toThrow(BuildSchemaError);
      expect(() => number().custom(min(5)).default(1)).toThrow('The received value is less than expected');
    });

    it('rejects a default that is not one of the literal values', () => {
      expect(() =>
        string()
          .equalTo('a')
          .default('b' as 'a'),
      ).toThrow(BuildSchemaError);
      expect(parseOrFail(string().equalTo('a').default('a'), undefined)).toBe('a');
    });

    it('rejects undefined as a default, which would not supply anything', () => {
      expect(() => number().default(undefined as unknown as number)).toThrow(BuildSchemaError);
    });

    it.each([
      ['nullable', () => number().default(1).nullable()],
      ['optional', () => number().default(1).optional()],
      ['custom', () => number().default(1).custom(min(0))],
    ])('has to come last: %s after it is refused', (_name, build) => {
      expect(build).toThrow('Default value must be the last method called in schema');
    });

    it('cannot follow optional, which would make it unreachable', () => {
      expect(() => number().optional().default(8)).toThrow(`Cannot call method 'default' after method 'optional'`);
    });
  });

  describe('the value that comes back', () => {
    it('is a fresh object on every parse', () => {
      const schema = object({ tags: array(string()) }).default({ tags: ['a'] });
      (parseOrFail(schema, undefined) as { tags: string[] }).tags.push('changed');
      expect(parseOrFail(schema, undefined)).toEqual({ tags: ['a'] });
    });

    it('is a fresh Date on every parse', () => {
      // A Date is not rebuilt by validation, so the same instance used to come back every time and
      // changing one result moved the default for every later parse.
      const schema = date().default(new Date(0));
      parseOrFail(schema, undefined).setFullYear(2030);
      expect(parseOrFail(schema, undefined).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    });

    it('does not follow later changes, at any depth, to the value it was given', () => {
      // Only the top level used to be copied, so changing a nested object made a later parse fail.
      const given = [{ a: 1 }];
      const schema = array(object({ a: number() })).default(given);
      (given[0] as { a: unknown }).a = 'x';
      expect(parseOrFail(schema, undefined)).toEqual([{ a: 1 }]);
    });

    it('is fresh on every parse even where validation does not rebuild it', () => {
      // oneOfTypes(['object']) checks the type and walks nothing, so the default object came back as
      // one shared instance.
      const schema = oneOfTypes(['object']).default({ a: 1 } as object);
      (parseOrFail(schema, undefined) as { a: number }).a = 99;
      expect(parseOrFail(schema, undefined)).toEqual({ a: 1 });
    });

    it('keeps a class instance as it is, prototype and all', () => {
      class Money {
        constructor(public cents: number) {}
      }
      const schema = oneOfTypes(['object']).default(new Money(5) as object);
      expect(parseOrFail(schema, undefined)).toBeInstanceOf(Money);
    });

    it('does not follow later changes to the Date it was given', () => {
      const given = new Date(0);
      const schema = date().default(given);
      given.setFullYear(2030);
      expect(parseOrFail(schema, undefined).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('types and generated output', () => {
    it('makes the property required in the output and optional in the input', () => {
      const schema = object({ page: number().default(1), q: string() });

      expectEqualTypes<{ page: number; q: string }, InferType<typeof schema>>(true);
      expectEqualTypes<{ page?: number | undefined; q: string }, InferInput<typeof schema>>(true);
      expect(parseOrFail(schema, { q: 'x' })).toEqual({ page: 1, q: 'x' });
    });

    it('is emitted as a JSON Schema default, and the property is not required', () => {
      expect(toJSONSchema(object({ page: number().default(1) }), { dialect: null })).toEqual({
        type: 'object',
        properties: { page: { type: 'number', default: 1 } },
        additionalProperties: false,
      });
    });
  });
});
