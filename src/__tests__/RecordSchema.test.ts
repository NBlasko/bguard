import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, BuildSchemaError } from '../';
import { InferType } from '../InferType';
import { CommonSchema } from '../core';
import { array } from '../asserts/array';
import { boolean } from '../asserts/boolean';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { union } from '../asserts/union';
import { maxKeys } from '../asserts/object/maxKeys';
import { minLength } from '../asserts/string/minLength';
import { min } from '../asserts/number/min';

const pathsOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.pathToError);
const messagesOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.message);

describe('record', () => {
  describe('construction', () => {
    it('rejects a key schema that is not a schema', () => {
      expect(() => record('nope' as unknown as CommonSchema, number())).toThrow(BuildSchemaError);
      expect(() => record('nope' as unknown as CommonSchema, number())).toThrow('Invalid key schema in record method');
    });

    it('rejects a value schema that is not a schema', () => {
      expect(() => record(string(), undefined as unknown as CommonSchema)).toThrow(
        'Invalid value schema in record method',
      );
    });
  });

  describe('validation', () => {
    const schema = record(string(), number());

    it('accepts an object of matching entries', () => {
      expect(parseOrFail(schema, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('accepts an empty object', () => {
      expect(parseOrFail(schema, {})).toEqual({});
    });

    it('rejects a value that fails the value schema, at the key path', () => {
      const result = parse(schema, { a: 1, b: 'two' });

      expect(messagesOf(result)).toEqual(['Invalid type of data']);
      expect(pathsOf(result)).toEqual(['.b']);
    });

    it('reports every failing entry under getAllErrors', () => {
      const result = parse(schema, { a: 'x', b: 2, c: 'y' }, { getAllErrors: true });

      expect(pathsOf(result)).toEqual(['.a', '.c']);
    });

    it('rejects a non-object', () => {
      expect(messagesOf(parse(schema, 'nope'))).toEqual(['Expected an object but received a different type']);
    });

    it('rejects an array', () => {
      expect(messagesOf(parse(schema, [1, 2]))).toEqual([
        'Expected an object but received an array. Invalid type of data',
      ]);
    });

    it('returns a new object rather than the input', () => {
      const received = { a: 1 };

      expect(parseOrFail(schema, received)).not.toBe(received);
    });

    it('accepts keys that exist on Object.prototype', () => {
      // Unlike object(), a record has no declared shape, so an inherited name is just a key.
      expect(parseOrFail(schema, { constructor: 1, toString: 2 })).toEqual({ constructor: 1, toString: 2 });
    });
  });

  describe('key validation', () => {
    it('validates each key against the key schema', () => {
      const schema = record(string().custom(minLength(3)), number());

      expect(parseOrFail(schema, { abc: 1 })).toEqual({ abc: 1 });

      const result = parse(schema, { ab: 1 });
      expect(messagesOf(result)).toEqual(['The received value length is less than expected']);
      expect(pathsOf(result)).toEqual(['.ab']);
    });

    it('restricts keys to a literal set', () => {
      const schema = record(string().oneOfValues(['en', 'sr']), string());

      expect(parseOrFail(schema, { en: 'hello', sr: 'zdravo' })).toEqual({ en: 'hello', sr: 'zdravo' });
      expect(hasErrors(parse(schema, { de: 'hallo' }))).toBe(true);
    });

    it('does not require the whole literal key set to be present', () => {
      // Which is why the inferred type is Partial.
      const schema = record(string().oneOfValues(['en', 'sr']), string());

      expect(parseOrFail(schema, { en: 'hello' })).toEqual({ en: 'hello' });
      expect(parseOrFail(schema, {})).toEqual({});
    });

    it('reports both a bad key and a bad value for the same entry', () => {
      const schema = record(string().custom(minLength(3)), number());

      expect(messagesOf(parse(schema, { ab: 'x' }, { getAllErrors: true }))).toEqual([
        'The received value length is less than expected',
        'Invalid type of data',
      ]);
    });
  });

  describe('chaining', () => {
    it('supports nullable and optional', () => {
      const nullableSchema = record(string(), number()).nullable();
      const optionalSchema = record(string(), number()).optional();

      expect(parseOrFail(nullableSchema, null)).toBeNull();
      expect(parseOrFail(optionalSchema, undefined)).toBeUndefined();
      expect(hasErrors(parse(nullableSchema, undefined))).toBe(true);
    });

    it('supports a default, fresh for each parse', () => {
      const schema = record(string(), number()).default({ a: 1 });

      const first = parseOrFail(schema, undefined);
      first.b = 2;

      expect(parseOrFail(schema, undefined)).toEqual({ a: 1 });
    });

    it('accepts object asserts, since a record is an object at runtime', () => {
      const schema = record(string(), number()).custom(maxKeys(2));

      expect(parseOrFail(schema, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(messagesOf(parse(schema, { a: 1, b: 2, c: 3 }))).toEqual([
        'The received number of keys is greater than expected',
      ]);
    });

    it('stays immutable', () => {
      const base = record(string(), number());
      const nullable = base.nullable();

      expect(hasErrors(parse(base, null))).toBe(true);
      expect(parseOrFail(nullable, null)).toBeNull();
    });
  });

  describe('nesting', () => {
    it('holds an array value', () => {
      const schema = record(string(), array(number()));

      expectEqualTypes<Record<string, number[]>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: [1, 2] })).toEqual({ a: [1, 2] });
      expect(pathsOf(parse(schema, { a: [1, 'x'] }))).toEqual(['.a[1]']);
    });

    it('holds a union value', () => {
      const schema = record(string(), union([string(), boolean()]));

      expectEqualTypes<Record<string, string | boolean>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x', b: true })).toEqual({ a: 'x', b: true });
      expect(hasErrors(parse(schema, { a: 1 }))).toBe(true);
    });

    it('holds another record', () => {
      const schema = record(string(), record(string(), number()));

      expectEqualTypes<Record<string, Record<string, number>>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
      expect(pathsOf(parse(schema, { a: { b: 'x' } }))).toEqual(['.a.b']);
    });

    it('works as an object property', () => {
      const schema = object({ counts: record(string(), number().custom(min(0))) });

      expectEqualTypes<{ counts: Record<string, number> }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { counts: { a: 1 } })).toEqual({ counts: { a: 1 } });
      expect(pathsOf(parse(schema, { counts: { a: -1 } }))).toEqual(['.counts.a']);
    });

    it('works as a union member', () => {
      const schema = union([record(string(), number()), string()]);

      expectEqualTypes<Record<string, number> | string, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 1 })).toEqual({ a: 1 });
      expect(parseOrFail(schema, 'x')).toBe('x');
      expect(hasErrors(parse(schema, { a: 'x' }))).toBe(true);
    });
  });

  describe('inferred types', () => {
    it('infers an index signature for an unconstrained key', () => {
      const schema = record(string(), number());
      expectEqualTypes<Record<string, number>, InferType<typeof schema>>(true);
      expectEqualTypes<Record<string, string>, InferType<typeof schema>>(false);
      expect(parseOrFail(schema, { anything: 1 })).toEqual({ anything: 1 });
    });

    it('infers Partial for a restricted key', () => {
      const schema = record(string().oneOfValues(['en', 'sr']), string());
      expectEqualTypes<Partial<Record<'en' | 'sr', string>>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { en: 'hi' })).toEqual({ en: 'hi' });
    });

    it('infers a single literal key as Partial too', () => {
      const schema = record(string().equalTo('only'), number());
      expectEqualTypes<Partial<Record<'only', number>>, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { only: 1 })).toEqual({ only: 1 });
      expect(hasErrors(parse(schema, { other: 1 }))).toBe(true);
    });

    it('carries nullable and optional through', () => {
      const nullableSchema = record(string(), number()).nullable();
      const optionalSchema = record(string(), number()).optional();

      expectEqualTypes<Record<string, number> | null, InferType<typeof nullableSchema>>(true);
      expectEqualTypes<Record<string, number> | undefined, InferType<typeof optionalSchema>>(true);
      expect(parseOrFail(nullableSchema, null)).toBeNull();
      expect(parseOrFail(optionalSchema, undefined)).toBeUndefined();
    });
  });

  describe('codeGen', () => {
    it('generates Record for an unconstrained key', () => {
      expect(codeGen(record(string(), number()))).toBe('Record<string, number>;');
    });

    it('generates Partial<Record<...>> for a restricted key, matching InferType', () => {
      expect(codeGen(record(string().oneOfValues(['en', 'sr']), string()))).toBe(
        `Partial<Record<'en' | 'sr', string>>;`,
      );
    });

    it('generates a nested value type', () => {
      expect(codeGen(record(string(), array(number())))).toBe('Record<string, number[]>;');
      expect(codeGen(record(string(), union([string(), boolean()])))).toBe('Record<string, string | boolean>;');
    });

    it('appends null and undefined from the record itself', () => {
      expect(codeGen(record(string(), number()).nullable())).toBe('Record<string, number> | null;');
      expect(codeGen(record(string(), number()).optional())).toBe('Record<string, number> | undefined;');
    });

    it('generates a record as an object property', () => {
      expect(codeGen(object({ dict: record(string(), number()) }))).toBe('{\n  dict: Record<string, number>;\n};');
    });
  });
});
