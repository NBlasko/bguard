import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, BuildSchemaError, setLocale } from '../';
import { InferType } from '../InferType';
import { CommonSchema } from '../core';
import { array } from '../asserts/array';
import { boolean } from '../asserts/boolean';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { union } from '../asserts/union';
import { maxArrayLength } from '../asserts/array/maxArrayLength';
import { minLength } from '../asserts/string/minLength';

const pathsOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.pathToError);
const messagesOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.message);

describe('tuple', () => {
  describe('construction', () => {
    it('rejects an empty position list', () => {
      expect(() => tuple([] as unknown as [CommonSchema])).toThrow(BuildSchemaError);
      expect(() => tuple([] as unknown as [CommonSchema])).toThrow('Missing schemas in tuple method');
    });

    it('rejects a value that is not an array of schemas', () => {
      expect(() => tuple(string() as unknown as [CommonSchema])).toThrow('Missing schemas in tuple method');
    });

    it('names the offending index when a position is not a schema', () => {
      expect(() => tuple([string(), 'nope'] as unknown as [CommonSchema])).toThrow(
        "Invalid schema in tuple method at index '1'",
      );
    });

    it('does not alias the array it was given', () => {
      const positions: [CommonSchema, CommonSchema] = [string(), number()];
      const schema = tuple(positions);

      positions.push(boolean());

      // A third position must not appear, so a two-entry value still validates.
      expect(parseOrFail(schema, ['a', 1])).toEqual(['a', 1]);
    });
  });

  describe('validation', () => {
    const schema = tuple([string(), number()]);

    it('accepts a value of the right shape', () => {
      expect(parseOrFail(schema, ['a', 1])).toEqual(['a', 1]);
    });

    it('validates each position against its own schema', () => {
      // Unlike array(), where one schema applies to every element.
      const result = parse(schema, [1, 'a'], { getAllErrors: true });

      expect(pathsOf(result)).toEqual(['[0]', '[1]']);
      expect(messagesOf(result)).toEqual(['Invalid type of data', 'Invalid type of data']);
    });

    it('reports the position that failed', () => {
      expect(pathsOf(parse(schema, ['a', 'b']))).toEqual(['[1]']);
    });

    it('rejects a value that is too short', () => {
      expect(messagesOf(parse(schema, ['a']))).toEqual(['The received tuple has 1 entries but 2 were expected']);
    });

    it('rejects a value that is too long', () => {
      expect(messagesOf(parse(schema, ['a', 1, true]))).toEqual([
        'The received tuple has 3 entries but 2 were expected',
      ]);
    });

    it('reports only the length when it is wrong', () => {
      // Walking the declared positions as well would add a "required" error for every position the
      // value does not reach, which says nothing further.
      expect(parse(schema, [], { getAllErrors: true })[0]).toHaveLength(1);
    });

    it('rejects a non-array', () => {
      expect(messagesOf(parse(schema, 'nope'))).toEqual(['Expected an array but received a different type']);
      expect(hasErrors(parse(schema, { 0: 'a', 1: 1 }))).toBe(true);
    });

    it('returns a new array rather than the input', () => {
      const received: [string, number] = ['a', 1];

      expect(parseOrFail(schema, received)).not.toBe(received);
    });

    it('honours a setLocale override for the length message', () => {
      setLocale('tupleLng', { 'c:tupleLength': 'Ocekivano {{e}}, dobijeno {{r}}' });

      expect(parse(schema, ['a'], { lng: 'tupleLng' })[0]![0]!.message).toBe('Ocekivano 2, dobijeno 1');
    });
  });

  describe('positions with their own rules', () => {
    it('applies assertions per position', () => {
      const schema = tuple([string().custom(minLength(3)), number()]);

      expect(parseOrFail(schema, ['abc', 1])).toEqual(['abc', 1]);
      expect(pathsOf(parse(schema, ['ab', 1]))).toEqual(['[0]']);
    });

    it('allows an optional trailing position, which still counts towards the length', () => {
      const schema = tuple([string(), boolean().optional()]);

      expectEqualTypes<[string, boolean | undefined], InferType<typeof schema>>(true);
      expect(parseOrFail(schema, ['a', undefined])).toEqual(['a', undefined]);
      // Optional describes the value at that position, not whether the position exists.
      expect(hasErrors(parse(schema, ['a']))).toBe(true);
    });
  });

  describe('chaining', () => {
    it('supports nullable and optional', () => {
      const nullableSchema = tuple([string()]).nullable();
      const optionalSchema = tuple([string()]).optional();

      expect(parseOrFail(nullableSchema, null)).toBeNull();
      expect(parseOrFail(optionalSchema, undefined)).toBeUndefined();
      expect(hasErrors(parse(nullableSchema, undefined))).toBe(true);
    });

    it('supports a default, fresh for each parse', () => {
      const schema = tuple([string()]).default(['a']);

      const first = parseOrFail(schema, undefined);
      first.push('b' as never);

      expect(parseOrFail(schema, undefined)).toEqual(['a']);
    });

    it('accepts array asserts, since a tuple is an array at runtime', () => {
      const schema = tuple([string(), number()]).custom(maxArrayLength(2));

      expect(parseOrFail(schema, ['a', 1])).toEqual(['a', 1]);
    });

    it('stays immutable', () => {
      const base = tuple([string()]);
      const nullable = base.nullable();

      expect(hasErrors(parse(base, null))).toBe(true);
      expect(parseOrFail(nullable, null)).toBeNull();
    });
  });

  describe('nesting', () => {
    it('nests in another tuple', () => {
      const schema = tuple([string(), tuple([number(), number()])]);

      expectEqualTypes<[string, [number, number]], InferType<typeof schema>>(true);
      expect(parseOrFail(schema, ['a', [1, 2]])).toEqual(['a', [1, 2]]);
      expect(pathsOf(parse(schema, ['a', [1, 'x']]))).toEqual(['[1][1]']);
    });

    it('works inside an array', () => {
      const schema = array(tuple([string(), number()]));

      expectEqualTypes<[string, number][], InferType<typeof schema>>(true);
      expect(parseOrFail(schema, [['a', 1]])).toEqual([['a', 1]]);
      expect(pathsOf(parse(schema, [['a', 'x']]))).toEqual(['[0][1]']);
    });

    it('works as an object property', () => {
      const schema = object({ pair: tuple([string(), number()]) });

      expectEqualTypes<{ pair: [string, number] }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { pair: ['a', 1] })).toEqual({ pair: ['a', 1] });
      expect(pathsOf(parse(schema, { pair: ['a', 'x'] }))).toEqual(['.pair[1]']);
    });

    it('holds a union and an object', () => {
      const schema = tuple([union([string(), number()]), object({ a: string() })]);

      expectEqualTypes<[string | number, { a: string }], InferType<typeof schema>>(true);
      expect(parseOrFail(schema, [1, { a: 'x' }])).toEqual([1, { a: 'x' }]);
    });
  });

  describe('inferred types', () => {
    it('infers a tuple, not an array of the union', () => {
      const schema = tuple([string(), number()]);

      expectEqualTypes<[string, number], InferType<typeof schema>>(true);
      expectEqualTypes<(string | number)[], InferType<typeof schema>>(false);
      expect(parseOrFail(schema, ['a', 1])).toEqual(['a', 1]);
    });

    it('carries nullable through', () => {
      const schema = tuple([string(), number()]).nullable();

      expectEqualTypes<[string, number] | null, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, null)).toBeNull();
    });
  });

  describe('codeGen', () => {
    it('generates a tuple type', () => {
      expect(codeGen(tuple([string(), number()]))).toBe('[string, number];');
    });

    it('generates a nested tuple', () => {
      expect(codeGen(tuple([string(), tuple([number(), number()])]))).toBe('[string, [number, number]];');
    });

    it('generates a tuple inside an array', () => {
      expect(codeGen(array(tuple([string(), number()])))).toBe('[string, number][];');
    });

    it('generates literal positions', () => {
      expect(codeGen(tuple([string().equalTo('a'), number().equalTo(1)]))).toBe(`['a', 1];`);
    });

    it('appends null and undefined from the tuple itself', () => {
      expect(codeGen(tuple([string()]).nullable())).toBe('[string] | null;');
      expect(codeGen(tuple([string()]).optional())).toBe('[string] | undefined;');
    });

    it('generates a tuple as an object property', () => {
      expect(codeGen(object({ pair: tuple([string(), number()]) }))).toBe('{\n  pair: [string, number];\n};');
    });
  });
});
