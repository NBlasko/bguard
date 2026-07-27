import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, BuildSchemaError, setLocale } from '../';
import { InferType } from '../InferType';
import { CommonSchema, ExceptionContext, RequiredValidation } from '../core';
import { array } from '../asserts/array';
import { boolean } from '../asserts/boolean';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { union } from '../asserts/union';
import { email } from '../asserts/string/email';
import { min } from '../asserts/number/min';

const messagesOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.message);

describe('union', () => {
  describe('construction', () => {
    it('rejects an empty member list', () => {
      expect(() => union([] as unknown as [CommonSchema])).toThrow(BuildSchemaError);
      expect(() => union([] as unknown as [CommonSchema])).toThrow('Missing schemas in union method');
    });

    it('rejects a value that is not an array of schemas', () => {
      expect(() => union(string() as unknown as [CommonSchema])).toThrow('Missing schemas in union method');
    });

    it('names the offending index when a member is not a schema', () => {
      expect(() => union([string(), 'nope'] as unknown as [CommonSchema])).toThrow(
        "Invalid schema in union method at index '1'",
      );
    });

    it('does not alias the array it was given', () => {
      const members: [CommonSchema, CommonSchema] = [string(), number()];
      const schema = union(members);

      members.push(boolean());

      // Mutating the caller's array must not extend the schema.
      expect(hasErrors(parse(schema, true))).toBe(true);
    });
  });

  describe('validation', () => {
    const schema = union([string().custom(email()), number().custom(min(0))]);

    it('accepts a value matching the first member', () => {
      expect(parseOrFail(schema, 'a@b.com')).toBe('a@b.com');
    });

    it('accepts a value matching a later member', () => {
      expect(parseOrFail(schema, 42)).toBe(42);
    });

    it('rejects a value of the right type that fails its member assertions', () => {
      expect(messagesOf(parse(schema, 'not-an-email'))).toEqual([
        'The received value does not match any of the expected types',
      ]);
      expect(messagesOf(parse(schema, -1))).toEqual(['The received value does not match any of the expected types']);
    });

    it('rejects a value matching no member at all', () => {
      expect(hasErrors(parse(schema, true))).toBe(true);
    });

    it('reports a single error rather than one per member', () => {
      // Members are tried against a throwaway context, so a member that does not match must not
      // leave its own errors behind.
      expect(parse(schema, true, { getAllErrors: true })[0]).toHaveLength(1);
    });

    it('throws from parseOrFail', () => {
      expect(() => parseOrFail(schema, true)).toThrow('The received value does not match any of the expected types');
    });

    it('honours a setLocale override for the union message', () => {
      setLocale('unionLng', { 'c:union': 'Nijedan član ne odgovara' });

      expect(parse(schema, true, { lng: 'unionLng' })[0]![0]!.message).toBe('Nijedan član ne odgovara');
    });
  });

  describe('member ordering', () => {
    it('returns the parsed value of the member that matched', () => {
      // The second member transforms, so which member won is observable in the result.
      const schema = union([number(), string().transformBeforeValidation((val: unknown) => `${val as string}!`)]);

      expect(parseOrFail(schema, 7)).toBe(7);
      expect(parseOrFail(schema, 'hi')).toBe('hi!');
    });

    it('lets a coercing member match anything, so its position decides the outcome', () => {
      // A transform runs before the member's own validation, so a member that coerces will accept
      // every value and nothing after it is ever reached. Worth knowing when ordering members.
      const coercingFirst = union([string().transformBeforeValidation((val: unknown) => `${val as string}`), number()]);
      const coercingLast = union([number(), string().transformBeforeValidation((val: unknown) => `${val as string}`)]);

      expect(parseOrFail(coercingFirst, 7)).toBe('7');
      expect(parseOrFail(coercingLast, 7)).toBe(7);
    });

    it('takes the first matching member when members overlap', () => {
      const schema = union([string().equalTo('a'), string()]);

      expectEqualTypes<'a' | string, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, 'a')).toBe('a');
      expect(parseOrFail(schema, 'b')).toBe('b');
    });
  });

  describe('structural discrimination', () => {
    const schema = union([
      object({ kind: string().equalTo('circle'), radius: number() }),
      object({ kind: string().equalTo('square'), side: number() }),
    ]);

    it('picks the member whose shape matches', () => {
      expect(parseOrFail(schema, { kind: 'circle', radius: 2 })).toEqual({ kind: 'circle', radius: 2 });
      expect(parseOrFail(schema, { kind: 'square', side: 3 })).toEqual({ kind: 'square', side: 3 });
    });

    it('rejects a shape belonging to no member', () => {
      expect(hasErrors(parse(schema, { kind: 'circle', side: 3 }))).toBe(true);
      expect(hasErrors(parse(schema, { kind: 'triangle' }))).toBe(true);
    });
  });

  describe('chaining', () => {
    it('supports nullable and optional', () => {
      const nullableSchema = union([string(), number()]).nullable();
      const optionalSchema = union([string(), number()]).optional();

      expect(parseOrFail(nullableSchema, null)).toBeNull();
      expect(hasErrors(parse(nullableSchema, undefined))).toBe(true);
      expect(parseOrFail(optionalSchema, undefined)).toBeUndefined();
      expect(hasErrors(parse(optionalSchema, null))).toBe(true);
    });

    it('supports a default', () => {
      const schema = union([string(), number()]).default(5);

      expect(parseOrFail(schema, undefined)).toBe(5);
      expect(parseOrFail(schema, 'x')).toBe('x');
    });

    it('runs its own asserts, which see the value before any member is tried', () => {
      const seen: unknown[] = [];
      const recordSeen = (): RequiredValidation<unknown> => (received: unknown, ctx: ExceptionContext) => {
        seen.push(received);
        if (received === 'forbidden') ctx.addIssue('anything else', received, 'value is forbidden');
      };

      const schema = union([string(), number()]).custom(recordSeen());

      expect(parseOrFail(schema, 'ok')).toBe('ok');
      expect(seen).toEqual(['ok']);
      expect(parse(schema, 'forbidden')[0]![0]!.message).toBe('value is forbidden');
    });

    it('stays immutable', () => {
      const base = union([string(), number()]);
      const nullable = base.nullable();

      expect(hasErrors(parse(base, null))).toBe(true);
      expect(parseOrFail(nullable, null)).toBeNull();
    });
  });

  describe('nesting', () => {
    it('works inside an array', () => {
      const schema = array(union([string(), number()]));

      expectEqualTypes<(string | number)[], InferType<typeof schema>>(true);
      expect(parseOrFail(schema, ['a', 1])).toEqual(['a', 1]);
      expect(parse(schema, ['a', true])[0]![0]!.pathToError).toBe('[1]');
    });

    it('works as an object property', () => {
      const schema = object({ value: union([string(), number()]) });

      expectEqualTypes<{ value: string | number }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { value: 1 })).toEqual({ value: 1 });
      expect(parse(schema, { value: true })[0]![0]!.pathToError).toBe('.value');
    });

    it('works nested in another union', () => {
      const schema = union([union([string(), number()]), boolean()]);

      expectEqualTypes<string | number | boolean, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, 'a')).toBe('a');
      expect(parseOrFail(schema, true)).toBe(true);
      expect(hasErrors(parse(schema, {}))).toBe(true);
    });
  });

  describe('inferred types', () => {
    it('infers the union of its members', () => {
      const schema = union([string(), number()]);
      expectEqualTypes<string | number, InferType<typeof schema>>(true);
      expectEqualTypes<string, InferType<typeof schema>>(false);
      expect(parseOrFail(schema, 'a')).toBe('a');
      expect(parseOrFail(schema, 1)).toBe(1);
    });

    it('infers literal members', () => {
      const schema = union([string().equalTo('a'), number().equalTo(1)]);
      expectEqualTypes<'a' | 1, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, 'a')).toBe('a');
      expect(hasErrors(parse(schema, 'b'))).toBe(true);
    });

    it('infers object members', () => {
      const schema = union([object({ a: string() }), object({ b: number() })]);
      expectEqualTypes<{ a: string } | { b: number }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { b: 1 })).toEqual({ b: 1 });
    });
  });

  describe('codeGen', () => {
    it('joins members with a pipe', () => {
      expect(codeGen(union([string(), number()]))).toBe('string | number;');
    });

    it('parenthesises a union inside an array', () => {
      expect(codeGen(array(union([string(), number()])))).toBe('(string | number)[];');
    });

    it('generates literal members', () => {
      expect(codeGen(union([string().equalTo('a'), number().equalTo(1)]))).toBe(`'a' | 1;`);
    });

    it('appends null and undefined from the union itself', () => {
      expect(codeGen(union([string(), number()]).nullable())).toBe('string | number | null;');
      expect(codeGen(union([string(), number()]).optional())).toBe('string | number | undefined;');
    });

    it('generates object members', () => {
      expect(codeGen(union([object({ a: string() }), object({ b: number() })]))).toBe(
        '{\n  a: string;\n} | {\n  b: number;\n};',
      );
    });
  });
});
