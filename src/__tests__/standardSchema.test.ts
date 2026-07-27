import { expectEqualTypes } from '../../jest/setup';
import { parse, parseOrFail } from '../';
import { InferType } from '../InferType';
import { StandardSchemaV1, StandardSchemaFailure, StandardSchemaSuccess } from '../standardSchema';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { union } from '../asserts/union';
import { email } from '../asserts/string/email';

const issuesOf = <T>(result: ReturnType<StandardSchemaV1<T, T>['~standard']['validate']>) =>
  (result as StandardSchemaFailure).issues;
const valueOf = <T>(result: ReturnType<StandardSchemaV1<T, T>['~standard']['validate']>) =>
  (result as StandardSchemaSuccess<T>).value;

/**
 * Standard Schema is the contract that lets a validator be used by libraries that know nothing about
 * it — tRPC, TanStack Form and Router, Hono, React Hook Form. Conformance is mostly about the exact
 * shape of the result, so these tests assert that shape rather than just that validation happened.
 */
describe('Standard Schema', () => {
  describe('the interface itself', () => {
    it('reports version and vendor', () => {
      const props = string()['~standard'];

      expect(props.version).toBe(1);
      expect(props.vendor).toBe('bguard');
      expect(typeof props.validate).toBe('function');
    });

    it('does not expose types at runtime', () => {
      // The spec defines `types` as type-only. Emitting it would put a property on the object that
      // consumers may reasonably assume carries a value.
      expect('types' in string()['~standard']).toBe(false);
    });

    it('is available on every kind of schema', () => {
      const schemas = [
        string(),
        number(),
        array(string()),
        object({ a: string() }),
        record(string(), number()),
        union([string(), number()]),
        tuple([string(), number()]),
      ];

      for (const schema of schemas) {
        expect(schema['~standard'].version).toBe(1);
      }
    });

    it('survives refinement, which produces a new schema', () => {
      expect(string().optional().custom(email())['~standard'].vendor).toBe('bguard');
    });
  });

  describe('successful validation', () => {
    it('returns the parsed value and no issues', () => {
      const result = object({ a: string() })['~standard'].validate({ a: 'x' });

      expect(result.issues).toBeUndefined();
      expect(valueOf(result)).toEqual({ a: 'x' });
    });

    it('returns the value produced by validation, not the input', () => {
      // Transforms and defaults apply, so a consumer receives what bguard produced.
      const schema = object({ a: string().transformBeforeValidation((v: unknown) => `${v as string}!`) });

      expect(valueOf(schema['~standard'].validate({ a: 'x' }))).toEqual({ a: 'x!' });
    });

    it('discriminates on issues being absent, as the spec requires', () => {
      const result = string()['~standard'].validate('x');

      // A consumer branches on `issues`, so it must not be present at all on success.
      expect('issues' in result).toBe(false);
    });
  });

  describe('failed validation', () => {
    it('returns issues with a message', () => {
      const result = string()['~standard'].validate(1);

      expect(issuesOf(result)).toHaveLength(1);
      expect(issuesOf(result)[0]!.message).toBe('Invalid type of data');
    });

    it('reports the path as an array of keys', () => {
      // The spec wants keys, not a dotted string. bguard keeps both, derived from the same key.
      const schema = object({ user: object({ mail: string().custom(email()) }) });

      const result = schema['~standard'].validate({ user: { mail: 'nope' } });

      expect(issuesOf(result)[0]!.path).toEqual(['user', 'mail']);
    });

    it('uses numbers for array and tuple positions', () => {
      const schema = object({ tags: array(string()) });

      expect(issuesOf(schema['~standard'].validate({ tags: ['a', 1] }))[0]!.path).toEqual(['tags', 1]);
      expect(issuesOf(tuple([string(), number()])['~standard'].validate(['a', 'b']))[0]!.path).toEqual([1]);
    });

    it('reports an empty path for a failure at the root', () => {
      expect(issuesOf(string()['~standard'].validate(1))[0]!.path).toEqual([]);
    });

    it('reports every issue, not only the first', () => {
      // validate collects, because a consumer showing a form needs all of them at once.
      const schema = object({ a: string(), b: string(), c: string() });

      const issues = issuesOf(schema['~standard'].validate({ a: 1, b: 2, c: 3 }));

      expect(issues).toHaveLength(3);
      expect(issues.map((issue) => issue.path)).toEqual([['a'], ['b'], ['c']]);
    });

    it('reports paths through a record and a union', () => {
      const schema = object({ dict: record(string(), union([string(), number()])) });

      expect(issuesOf(schema['~standard'].validate({ dict: { k: true } }))[0]!.path).toEqual(['dict', 'k']);
    });
  });

  describe('type-level conformance', () => {
    it('carries the inferred type as both input and output', () => {
      // bguard's input and output types coincide, so both sides of `types` are InferType.
      const schema = object({ a: string() });
      type Props = (typeof schema)['~standard'];

      expectEqualTypes<NonNullable<Props['types']>['input'], InferType<typeof schema>>(true);
      expectEqualTypes<NonNullable<Props['types']>['output'], InferType<typeof schema>>(true);
      expectEqualTypes<NonNullable<Props['types']>['output'], string>(false);

      expect(parseOrFail(schema, { a: 'x' })).toEqual({ a: 'x' });
    });

    it('satisfies StandardSchemaV1 for the type it infers', () => {
      const schema = object({ a: string(), b: number() });
      type Inferred = InferType<typeof schema>;

      // Assignability is the whole contract: a consumer accepts `StandardSchemaV1<I, O>`.
      const conforms: StandardSchemaV1<Inferred, Inferred> = schema;

      expect(conforms['~standard'].vendor).toBe('bguard');
    });

    it('can be consumed generically, the way a router or form library would', () => {
      function validateWith<S extends StandardSchemaV1>(schema: S, value: unknown) {
        return schema['~standard'].validate(value);
      }

      expect(validateWith(string(), 'x')).toEqual({ value: 'x' });
      expect(validateWith(string(), 1).issues).toHaveLength(1);
    });
  });

  describe('relation to parse', () => {
    it('agrees with parse about the same value', () => {
      const schema = object({ a: string() });

      const [errors, value] = parse(schema, { a: 'x' }, { getAllErrors: true });
      const result = schema['~standard'].validate({ a: 'x' });

      expect(errors).toBeNull();
      expect(valueOf(result)).toEqual(value);
    });

    it('carries the same messages as parse', () => {
      const schema = object({ a: string() });

      const [errors] = parse(schema, { a: 1 }, { getAllErrors: true });
      const issues = issuesOf(schema['~standard'].validate({ a: 1 }));

      expect(issues.map((issue) => issue.message)).toEqual(errors!.map((error) => error.message));
    });
  });
});
