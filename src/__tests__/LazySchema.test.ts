import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, codeGenWithName, BuildSchemaError } from '../';
import { InferType } from '../InferType';
import { CommonSchema } from '../core';
import { array } from '../asserts/array';
import { lazy } from '../asserts/lazy';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { union } from '../asserts/union';

const pathsOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.pathToError);

interface Category {
  name: string;
  children: Category[];
}

/**
 * The recursive schema used across these tests. `lazy` defers building the inner schema until it is
 * first needed, which is what lets `categorySchema` refer to itself: at the point the array is
 * declared, the binding does not have a value yet.
 */
const categorySchema: CommonSchema = object({
  name: string(),
  children: array(lazy<Category>('Category', () => categorySchema)),
});

describe('lazy', () => {
  describe('construction', () => {
    it('requires a type name', () => {
      // codeGen prints the name where the recursion occurs. Without one it would descend into the
      // schema again and never finish, so the name is required rather than optional.
      expect(() => lazy<Category>('', () => categorySchema)).toThrow(BuildSchemaError);
      expect(() => lazy<Category>('', () => categorySchema)).toThrow('Missing type name in lazy method');
    });

    it('requires a getter', () => {
      expect(() => lazy<Category>('Category', undefined as unknown as () => CommonSchema)).toThrow(
        'Missing schema getter in lazy method',
      );
    });

    it('does not call the getter while the schema is being built', () => {
      let calls = 0;

      lazy<string>('Name', () => {
        calls += 1;
        return string();
      });

      expect(calls).toBe(0);
    });

    it('rejects a getter that does not return a schema, when it is first used', () => {
      const schema = lazy<string>('Name', () => 'nope' as unknown as CommonSchema);

      expect(() => parseOrFail(schema, 'x')).toThrow(BuildSchemaError);
      expect(() => parseOrFail(schema, 'x')).toThrow('Invalid schema returned from lazy method');
    });

    it('surfaces that as a BuildSchemaError from parse too, rather than a validation error', () => {
      // A broken schema is a programming error. Both entry points used to disguise anything that was
      // not a ValidationError as 'Something unexpected happened', which loses the reason.
      const schema = lazy<string>('Name', () => 'nope' as unknown as CommonSchema);

      expect(() => parse(schema, 'x')).toThrow(BuildSchemaError);
      expect(() => parse(schema, 'x', { getAllErrors: true })).toThrow('Invalid schema returned from lazy method');
    });
  });

  describe('validation', () => {
    it('validates a non-recursive schema behind the getter', () => {
      const schema = lazy<string>('Name', () => string());

      expect(parseOrFail(schema, 'x')).toBe('x');
      expect(hasErrors(parse(schema, 1))).toBe(true);
    });

    it('calls the getter once however many values are validated', () => {
      let calls = 0;
      const schema = lazy<string>('Name', () => {
        calls += 1;
        return string();
      });

      parseOrFail(schema, 'a');
      parseOrFail(schema, 'b');
      parseOrFail(schema, 'c');

      expect(calls).toBe(1);
    });

    it('validates a recursive value at depth 1', () => {
      expect(parseOrFail(categorySchema, { name: 'a', children: [] })).toEqual({ name: 'a', children: [] });
    });

    it('validates a recursive value several levels deep', () => {
      const deep = {
        name: 'a',
        children: [{ name: 'b', children: [{ name: 'c', children: [] }] }],
      };

      expect(parseOrFail(categorySchema, deep)).toEqual(deep);
    });

    it('reports the full path of a failure found through the recursion', () => {
      const bad = { name: 'a', children: [{ name: 'b', children: [{ name: 5, children: [] }] }] };

      expect(pathsOf(parse(categorySchema, bad))).toEqual(['.children[0].children[0].name']);
    });

    it('applies the recursive schema rules at every level', () => {
      const missingChildren = { name: 'a', children: [{ name: 'b' }] };

      expect(pathsOf(parse(categorySchema, missingChildren))).toEqual(['.children[0]']);
    });

    it('returns a rebuilt value, not the input', () => {
      const received = { name: 'a', children: [] };

      expect(parseOrFail(categorySchema, received)).not.toBe(received);
    });
  });

  describe('chaining', () => {
    it('supports nullable and optional', () => {
      const nullableSchema = lazy<string>('Name', () => string()).nullable();
      const optionalSchema = lazy<string>('Name', () => string()).optional();

      expect(parseOrFail(nullableSchema, null)).toBeNull();
      expect(parseOrFail(optionalSchema, undefined)).toBeUndefined();
      expect(hasErrors(parse(nullableSchema, undefined))).toBe(true);
    });

    it('supports a default', () => {
      const schema = lazy<string>('Name', () => string()).default('fallback');

      expect(parseOrFail(schema, undefined)).toBe('fallback');
      expect(parseOrFail(schema, 'given')).toBe('given');
    });

    it('stays immutable', () => {
      const base = lazy<string>('Name', () => string());
      const nullable = base.nullable();

      expect(hasErrors(parse(base, null))).toBe(true);
      expect(parseOrFail(nullable, null)).toBeNull();
    });
  });

  describe('nesting', () => {
    it('works as a record value, giving a recursive tree', () => {
      interface Node {
        children: Record<string, Node>;
      }
      const nodeSchema: CommonSchema = object({
        children: record(
          string(),
          lazy<Node>('Node', () => nodeSchema),
        ),
      });

      expect(parseOrFail(nodeSchema, { children: { a: { children: {} } } })).toEqual({
        children: { a: { children: {} } },
      });
      expect(pathsOf(parse(nodeSchema, { children: { a: { children: 1 } } }))).toEqual(['.children.a.children']);
    });

    it('works as a union member, giving a recursive expression', () => {
      type Expression = number | Expression[];
      const expressionSchema: CommonSchema = union([
        number(),
        array(lazy<Expression>('Expression', () => expressionSchema)),
      ]);

      expect(parseOrFail(expressionSchema, 1)).toBe(1);
      expect(parseOrFail(expressionSchema, [1, [2, [3]]])).toEqual([1, [2, [3]]]);
      expect(hasErrors(parse(expressionSchema, [1, ['x']]))).toBe(true);
    });

    it('lets two schemas refer to each other', () => {
      interface Parent {
        child?: Child;
      }
      interface Child {
        parent?: Parent;
      }
      const parentSchema: CommonSchema = object({
        child: lazy<Child>('Child', () => childSchema).optional(),
      });
      const childSchema: CommonSchema = object({
        parent: lazy<Parent>('Parent', () => parentSchema).optional(),
      });

      expect(parseOrFail(parentSchema, {})).toEqual({});
      expect(parseOrFail(parentSchema, { child: { parent: {} } })).toEqual({ child: { parent: {} } });
      expect(pathsOf(parse(parentSchema, { child: { parent: { child: 1 } } }))).toEqual(['.child.parent.child']);
    });
  });

  describe('inferred types', () => {
    it('infers the type supplied by the caller', () => {
      // TypeScript cannot infer a type through a self-reference, so lazy takes it as an argument.
      const schema = lazy<Category>('Category', () => categorySchema);

      expectEqualTypes<Category, InferType<typeof schema>>(true);
      expectEqualTypes<string, InferType<typeof schema>>(false);
      expect(parseOrFail(schema, { name: 'a', children: [] })).toEqual({ name: 'a', children: [] });
    });

    it('carries nullable through', () => {
      const schema = lazy<Category>('Category', () => categorySchema).nullable();

      expectEqualTypes<Category | null, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, null)).toBeNull();
    });

    it('infers as an object property', () => {
      const schema = object({ root: lazy<Category>('Category', () => categorySchema) });

      expectEqualTypes<{ root: Category }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { root: { name: 'a', children: [] } })).toEqual({
        root: { name: 'a', children: [] },
      });
    });
  });

  describe('codeGen', () => {
    it('emits the type name instead of descending', () => {
      // Descending is what makes recursion work at validation time and what would make code
      // generation loop forever.
      expect(codeGen(lazy<Category>('Category', () => categorySchema))).toBe('Category;');
    });

    it('emits a recursive type that refers to itself by name', () => {
      expect(codeGen(categorySchema)).toBe('{\n  name: string;\n  children: Category[];\n};');
    });

    it('names the recursion point in a named declaration', () => {
      expect(codeGenWithName('Category', categorySchema)).toBe(
        'type Category = {\n  name: string;\n  children: Category[];\n};\n',
      );
    });

    it('appends null and undefined from the lazy schema itself', () => {
      expect(codeGen(lazy<Category>('Category', () => categorySchema).nullable())).toBe('Category | null;');
      expect(codeGen(lazy<Category>('Category', () => categorySchema).optional())).toBe('Category | undefined;');
    });

    it('terminates for two schemas that refer to each other', () => {
      const parentSchema: CommonSchema = object({
        child: lazy<unknown>('Child', () => childSchema).optional(),
      });
      const childSchema: CommonSchema = object({
        parent: lazy<unknown>('Parent', () => parentSchema).optional(),
      });

      expect(codeGen(parentSchema)).toBe('{\n  child?: Child | undefined;\n};');
      expect(codeGen(childSchema)).toBe('{\n  parent?: Parent | undefined;\n};');
    });
  });
});
