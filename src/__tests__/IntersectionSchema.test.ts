import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, BuildSchemaError } from '../';
import { InferType } from '../InferType';
import { boolean } from '../asserts/boolean';
import { intersection } from '../asserts/intersection';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { maxKeys } from '../asserts/object/maxKeys';
import { minLength } from '../asserts/string/minLength';

const pathsOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.pathToError);
const messagesOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.message);

describe('intersection', () => {
  const withId = object({ id: string() });
  const withName = object({ name: string() });

  describe('construction', () => {
    it('rejects an empty member list', () => {
      expect(() => intersection([] as unknown as [typeof withId])).toThrow(BuildSchemaError);
      expect(() => intersection([] as unknown as [typeof withId])).toThrow('Missing schemas in intersection method');
    });

    it('rejects a value that is not an array of schemas', () => {
      expect(() => intersection(withId as unknown as [typeof withId])).toThrow(
        'Missing schemas in intersection method',
      );
    });

    it('names the offending index when a member is not a schema', () => {
      expect(() => intersection([withId, 'nope'] as unknown as [typeof withId])).toThrow(
        "Invalid schema in intersection method at index '1'",
      );
    });

    it('rejects a member that is not an object schema', () => {
      // An intersection of non-object types is either impossible, like string & number, or already
      // expressible by chaining asserts.
      expect(() => intersection([withId, string() as unknown as typeof withId])).toThrow(
        "Schema in intersection method at index '1' is not an object schema",
      );
    });

    it('rejects a nullable or optional member', () => {
      // ({ a } | null) & { b } is not something the merged shape can express.
      expect(() => intersection([withId, withName.nullable() as unknown as typeof withName])).toThrow(
        "Schema in intersection method at index '1' cannot be nullable or optional",
      );
      expect(() => intersection([withId, withName.optional() as unknown as typeof withName])).toThrow(
        "Schema in intersection method at index '1' cannot be nullable or optional",
      );
    });

    it('rejects a key declared by more than one member', () => {
      // The type would be A & B for that property while only one schema could run, so resolving it
      // one way silently would make the type and the validation disagree.
      expect(() => intersection([withId, object({ id: number() })])).toThrow(
        "Duplicate property 'id' in intersection method",
      );
    });
  });

  describe('validation', () => {
    const schema = intersection([withId, withName]);

    it('accepts a value satisfying every member', () => {
      expect(parseOrFail(schema, { id: '1', name: 'a' })).toEqual({ id: '1', name: 'a' });
    });

    it('recognises keys contributed by any member', () => {
      // Validating against each member separately would have the first reject `name` as
      // unrecognised, which is why the shapes are merged instead.
      expect(hasErrors(parse(schema, { id: '1', name: 'a' }))).toBe(false);
    });

    it('requires the keys of every member', () => {
      expect(messagesOf(parse(schema, { id: '1' }))).toEqual(['Missing required property in the object']);
      expect(messagesOf(parse(schema, { name: 'a' }))).toEqual(['Missing required property in the object']);
    });

    it('still rejects a key no member declares', () => {
      expect(messagesOf(parse(schema, { id: '1', name: 'a', extra: 1 }))).toEqual([
        'This property is not allowed in the object',
      ]);
    });

    it('reports the failing property path', () => {
      expect(pathsOf(parse(schema, { id: 1, name: 'a' }))).toEqual(['.id']);
    });

    it('keeps each member assertions on its own property', () => {
      const schema3 = intersection([object({ short: string() }), object({ long: string().custom(minLength(5)) })]);

      expect(parseOrFail(schema3, { short: 'a', long: 'abcde' })).toEqual({ short: 'a', long: 'abcde' });
      expect(pathsOf(parse(schema3, { short: 'a', long: 'ab' }))).toEqual(['.long']);
    });

    it('rejects a non-object', () => {
      expect(messagesOf(parse(schema, 'nope'))).toEqual(['Expected an object but received a different type']);
    });
  });

  describe('merging member settings', () => {
    it('carries over the asserts of every member', () => {
      const schema = intersection([object({ a: string() }).custom(maxKeys(3)), object({ b: string() })]);

      expect(parseOrFail(schema, { a: 'x', b: 'y' })).toEqual({ a: 'x', b: 'y' });
      expect(
        messagesOf(
          parse(intersection([object({ a: string() }).custom(maxKeys(1)), object({ b: string() })]), {
            a: 'x',
            b: 'y',
          }),
        ),
      ).toEqual(['The received number of keys is greater than expected']);
    });

    it('allows unrecognised keys when any member does', () => {
      const schema = intersection([object({ a: string() }).allowUnrecognized(), object({ b: string() })]);

      expect(parseOrFail(schema, { a: 'x', b: 'y', extra: 1 })).toEqual({ a: 'x', b: 'y' });
    });

    it('keeps rejecting unrecognised keys when no member allows them', () => {
      const schema = intersection([object({ a: string() }), object({ b: string() })]);

      expect(hasErrors(parse(schema, { a: 'x', b: 'y', extra: 1 }))).toBe(true);
    });

    it('does not modify the members it was given', () => {
      const schema = intersection([withId, withName]);

      expect(parseOrFail(schema, { id: '1', name: 'a' })).toEqual({ id: '1', name: 'a' });
      // withId on its own must still reject a key it never declared.
      expect(hasErrors(parse(withId, { id: '1', name: 'a' }))).toBe(true);
    });
  });

  describe('chaining', () => {
    it('supports nullable, optional and a default on the result', () => {
      const schema = intersection([withId, withName]);

      expect(parseOrFail(schema.nullable(), null)).toBeNull();
      expect(parseOrFail(schema.optional(), undefined)).toBeUndefined();
      expect(parseOrFail(schema.default({ id: '1', name: 'a' }), undefined)).toEqual({ id: '1', name: 'a' });
    });

    it('supports allowUnrecognized on the result', () => {
      const schema = intersection([withId, withName]).allowUnrecognized();

      expect(parseOrFail(schema, { id: '1', name: 'a', extra: 1 })).toEqual({ id: '1', name: 'a' });
    });
  });

  describe('nesting', () => {
    it('combines three members', () => {
      const schema = intersection([object({ a: string() }), object({ b: number() }), object({ c: boolean() })]);

      expectEqualTypes<{ a: string; b: number; c: boolean }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x', b: 1, c: true })).toEqual({ a: 'x', b: 1, c: true });
    });

    it('nests in another intersection', () => {
      const inner = intersection([object({ a: string() }), object({ b: number() })]);
      const schema = intersection([inner, object({ c: boolean() })]);

      expectEqualTypes<{ a: string; b: number; c: boolean }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x', b: 1, c: true })).toEqual({ a: 'x', b: 1, c: true });
    });

    it('works as an object property', () => {
      const schema = object({ user: intersection([withId, withName]) });

      expectEqualTypes<{ user: { id: string; name: string } }, InferType<typeof schema>>(true);
      expect(pathsOf(parse(schema, { user: { id: 1, name: 'a' } }))).toEqual(['.user.id']);
    });

    it('holds a nested object as a property', () => {
      const schema = intersection([object({ meta: object({ v: number() }) }), object({ id: string() })]);

      expectEqualTypes<{ meta: { v: number }; id: string }, InferType<typeof schema>>(true);
      expect(pathsOf(parse(schema, { meta: { v: 'x' }, id: '1' }))).toEqual(['.meta.v']);
    });
  });

  describe('inferred types', () => {
    it('infers the merged object type', () => {
      const schema = intersection([withId, withName]);

      expectEqualTypes<{ id: string; name: string }, InferType<typeof schema>>(true);
      expectEqualTypes<{ id: string }, InferType<typeof schema>>(false);
      expect(parseOrFail(schema, { id: '1', name: 'a' })).toEqual({ id: '1', name: 'a' });
    });

    it('keeps an optional property optional', () => {
      const schema = intersection([object({ a: string() }), object({ b: number().optional() })]);

      expectEqualTypes<{ a: string; b?: number | undefined }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { a: 'x' })).toEqual({ a: 'x' });
    });

    it('carries nullable through', () => {
      const schema = intersection([withId, withName]).nullable();

      expectEqualTypes<{ id: string; name: string } | null, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, null)).toBeNull();
    });
  });

  describe('codeGen', () => {
    it('generates the merged object rather than an A & B expression', () => {
      // The shapes are merged when the schema is built, so there is nothing left to intersect.
      expect(codeGen(intersection([withId, withName]))).toBe('{\n  id: string;\n  name: string;\n};');
    });

    it('generates three merged members', () => {
      const schema = intersection([object({ a: string() }), object({ b: number() }), object({ c: boolean() })]);

      expect(codeGen(schema)).toBe('{\n  a: string;\n  b: number;\n  c: boolean;\n};');
    });

    it('appends null from the intersection itself', () => {
      expect(codeGen(intersection([withId, withName]).nullable())).toBe('{\n  id: string;\n  name: string;\n} | null;');
    });
  });
});
