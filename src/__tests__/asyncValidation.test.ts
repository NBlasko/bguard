import { hasErrors } from '../../jest/setup';
import { parse, parseOrFail, parseAsync, parseOrFailAsync, BuildSchemaError, ValidationError, setLocale } from '../';
import { AsyncRequiredValidation, CommonSchema, ExceptionContext } from '../core';
import { StandardSchemaFailure } from '../standardSchema';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { union } from '../asserts/union';
import { lazy } from '../asserts/lazy';
import { minLength } from '../asserts/string/minLength';

const pathsOf = (errors: readonly { path: readonly PropertyKey[] }[] | null) => (errors ?? []).map((e) => e.path);

const taken = new Set(['nikola', 'ana']);

/** Stands in for a lookup that has to wait: a database query, an HTTP call. */
const notTaken =
  (delayMs = 0): AsyncRequiredValidation<string> =>
  async (received: string, ctx: ExceptionContext) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (taken.has(received)) ctx.addIssue('an unused name', received, 'u:taken');
  };

/**
 * The structure is validated synchronously and the async validations are collected as they are reached,
 * then awaited together once the walk is over. Asserts only add issues, never change the value, so the
 * value the synchronous pass produced is already final when they run.
 */
describe('async validation', () => {
  describe('parseAsync', () => {
    const schema = object({ name: string().custom(minLength(2)).customAsync(notTaken()) });

    it('accepts a value that passes both kinds of validation', async () => {
      await expect(parseAsync(schema, { name: 'free' })).resolves.toEqual([null, { name: 'free' }]);
    });

    it('reports an async failure at the right path, with its code', async () => {
      const [errors] = await parseAsync(schema, { name: 'nikola' });

      expect(errors![0]!.code).toBe('u:taken');
      expect(errors![0]!.path).toEqual(['name']);
      expect(errors![0]!.pathToError).toBe('.name');
    });

    it('reports synchronous and async failures together under getAllErrors', async () => {
      const both = object({
        name: string().customAsync(notTaken()),
        age: number(),
      });

      const [errors] = await parseAsync(both, { name: 'ana', age: 'x' }, { getAllErrors: true });

      expect(errors!.map((error) => error.code).sort()).toEqual(['c:invalidType', 'u:taken']);
    });

    it('returns only the first error without getAllErrors', async () => {
      const both = object({ a: string(), b: string() });

      const [errors] = await parseAsync(both, { a: 1, b: 2 });

      expect(errors).toHaveLength(1);
    });

    it('does not run an async validation for a value the walk never reaches', async () => {
      let called = false;
      const schemaWithOptional = object({
        name: string()
          .optional()
          .customAsync(async () => {
            called = true;
          }),
      });

      await parseAsync(schemaWithOptional, {});

      // The property was absent and optional, so validation returned before the asserts.
      expect(called).toBe(false);
    });

    it('honours a setLocale override for an async issue', async () => {
      setLocale('asyncLng', { 'u:taken': 'Ime je zauzeto' });

      const [errors] = await parseAsync(schema, { name: 'ana' }, { lng: 'asyncLng' });

      expect(errors![0]!.message).toBe('Ime je zauzeto');
    });
  });

  describe('waiting', () => {
    it('awaits every validation together rather than one after another', async () => {
      const schema = object({
        a: string().customAsync(notTaken(30)),
        b: string().customAsync(notTaken(30)),
        c: string().customAsync(notTaken(30)),
      });

      const startedAt = Date.now();
      await parseAsync(schema, { a: 'x', b: 'y', c: 'z' });
      const elapsed = Date.now() - startedAt;

      // Three 30ms waits in sequence would be about 90ms.
      expect(elapsed).toBeLessThan(75);
    });

    it('runs several validations on one schema', async () => {
      const calls: string[] = [];
      const record1: AsyncRequiredValidation<string> = async () => void calls.push('first');
      const record2: AsyncRequiredValidation<string> = async () => void calls.push('second');

      await parseAsync(string().customAsync(record1, record2), 'x');

      expect(calls.sort()).toEqual(['first', 'second']);
    });
  });

  describe('nesting', () => {
    it('reaches every element of an array', async () => {
      const schema = object({ names: array(string().customAsync(notTaken())) });

      const [errors] = await parseAsync(schema, { names: ['free', 'nikola', 'ana'] }, { getAllErrors: true });

      expect(pathsOf(errors)).toEqual([
        ['names', 1],
        ['names', 2],
      ]);
    });

    it('reaches a record value', async () => {
      const schema = record(string(), string().customAsync(notTaken()));

      expect(pathsOf((await parseAsync(schema, { k: 'ana' }))[0])).toEqual([['k']]);
    });

    it('reaches a tuple position', async () => {
      const schema = tuple([string(), string().customAsync(notTaken())]);

      expect(pathsOf((await parseAsync(schema, ['x', 'ana']))[0])).toEqual([[1]]);
    });

    it('reaches the member of a union that matched', async () => {
      const schema = union([number(), string().customAsync(notTaken())]);

      await expect(parseAsync(schema, 5)).resolves.toEqual([null, 5]);
      expect(hasErrors(await parseAsync(schema, 'ana'))).toBe(true);
    });

    it('works several levels deep', async () => {
      const schema = object({ users: array(object({ name: string().customAsync(notTaken()) })) });

      expect(pathsOf((await parseAsync(schema, { users: [{ name: 'free' }, { name: 'ana' }] }))[0])).toEqual([
        ['users', 1, 'name'],
      ]);
    });
  });

  describe('parseOrFailAsync', () => {
    const schema = object({ name: string().customAsync(notTaken()) });

    it('resolves to the parsed value', async () => {
      await expect(parseOrFailAsync(schema, { name: 'free' })).resolves.toEqual({ name: 'free' });
    });

    it('rejects with a ValidationError carrying path and code', async () => {
      expect.assertions(3);
      try {
        await parseOrFailAsync(schema, { name: 'ana' });
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).code).toBe('u:taken');
        expect((e as ValidationError).path).toEqual(['name']);
      }
    });

    it('rejects on a synchronous failure too', async () => {
      await expect(parseOrFailAsync(object({ name: string() }), { name: 1 })).rejects.toThrow('Invalid type of data');
    });
  });

  describe('a synchronous parse of an async schema', () => {
    const schema = object({ name: string().customAsync(notTaken()) });

    it('reports it rather than skipping the validation', async () => {
      // Silently dropping a validation is worse than a clear instruction, so this is a BuildSchemaError.
      expect(() => parse(schema, { name: 'free' })).toThrow(BuildSchemaError);
      expect(() => parse(schema, { name: 'free' })).toThrow(
        'Schema has an async validation. Use parseAsync or parseOrFailAsync',
      );
      expect(() => parseOrFail(schema, { name: 'free' })).toThrow(BuildSchemaError);
    });

    it('still parses a schema that has none', () => {
      expect(parseOrFail(object({ name: string() }), { name: 'free' })).toEqual({ name: 'free' });
    });
  });

  describe('chaining', () => {
    it('stays immutable', async () => {
      const base = string();
      const guarded = base.customAsync(notTaken());

      // The base never gained the validation, so it still parses synchronously.
      expect(parseOrFail(base, 'ana')).toBe('ana');
      expect(hasErrors(await parseAsync(guarded, 'ana'))).toBe(true);
    });

    it('accumulates across calls', async () => {
      const calls: string[] = [];
      const schema = string()
        .customAsync(async () => void calls.push('first'))
        .customAsync(async () => void calls.push('second'));

      await parseAsync(schema, 'x');

      expect(calls.sort()).toEqual(['first', 'second']);
    });

    it('combines with nullable and optional', async () => {
      const schema = string().customAsync(notTaken()).nullable();

      await expect(parseAsync(schema, null)).resolves.toEqual([null, null]);
      expect(hasErrors(await parseAsync(schema, 'ana'))).toBe(true);
    });
  });

  describe('Standard Schema', () => {
    it('returns a promise for a schema that needs awaiting', async () => {
      const schema = object({ name: string().customAsync(notTaken()) });

      const result = schema['~standard'].validate({ name: 'ana' });

      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual({ issues: [{ message: 'u:taken', path: ['name'] }] });
    });

    it('stays synchronous for a schema that does not', () => {
      // The spec allows either, chosen per call. Returning a promise where none is needed would break
      // every consumer that does not await.
      expect(string()['~standard'].validate('x')).not.toBeInstanceOf(Promise);
    });

    it('looks through nesting to decide', () => {
      const nested = object({ users: array(object({ name: string().customAsync(notTaken()) })) });

      expect(nested['~standard'].validate({ users: [] })).toBeInstanceOf(Promise);
    });

    it('follows a lazy schema only once it has been resolved', async () => {
      // Following an unresolved lazy would force the thunk merely because someone asked for the
      // interface, and could recurse forever on a self-referential schema. Before resolution the schema
      // looks synchronous and reports the BuildSchemaError that explains the situation instead.
      //
      // The lazy property is declared first on purpose: the walk stops at the first branch that needs
      // awaiting, so putting the async one first would mean the lazy was never visited.
      interface Node {
        child?: Node;
        name: string;
      }
      const nodeSchema: CommonSchema = object({
        child: lazy<Node>('Node', () => nodeSchema).optional(),
        name: string().customAsync(notTaken()),
      });

      expect(() => parse(nodeSchema, { name: 'free' })).toThrow(BuildSchemaError);

      // One async parse resolves the lazy, after which the walk can see through it. The cycle guard is
      // what stops the self-reference from recursing forever while it does. The value has to include a
      // child, or validation returns at the optional check and the thunk is never called.
      await expect(parseAsync(nodeSchema, { name: 'free', child: { name: 'free' } })).resolves.toEqual([
        null,
        { name: 'free', child: { name: 'free' } },
      ]);

      expect(nodeSchema['~standard'].validate({ name: 'free' })).toBeInstanceOf(Promise);

      const result = await nodeSchema['~standard'].validate({ name: 'ana', child: { name: 'ana' } });
      // Order follows the walk, which is an implementation detail, so the set is what matters.
      expect((result as StandardSchemaFailure).issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['name'], ['child', 'name']]),
      );
      expect((result as StandardSchemaFailure).issues).toHaveLength(2);
    });

    it('resolves to a value for a passing async schema', async () => {
      const schema = object({ name: string().customAsync(notTaken()) });

      expect(await schema['~standard'].validate({ name: 'free' })).toEqual({ value: { name: 'free' } });
    });
  });

  describe('an async validation that throws', () => {
    it('is reported as an unexpected error rather than an unhandled rejection', async () => {
      const schema = string().customAsync(async () => {
        throw new TypeError('boom');
      });

      const [errors] = await parseAsync(schema, 'x');

      expect(errors![0]!.message).toBe('Something unexpected happened');
    });

    it('lets a BuildSchemaError through, since the schema itself is wrong', async () => {
      const schema = string().customAsync(async () => {
        throw new BuildSchemaError('bad schema');
      });

      await expect(parseAsync(schema, 'x')).rejects.toThrow('bad schema');
    });
  });
});
