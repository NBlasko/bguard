import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen, BuildSchemaError } from '../';
import { InferType } from '../InferType';
import { CommonSchema } from '../core';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { extend } from '../asserts/object/extend';
import { omit } from '../asserts/object/omit';
import { partial } from '../asserts/object/partial';
import { pick } from '../asserts/object/pick';
import { required } from '../asserts/object/required';
import { maxKeys } from '../asserts/object/maxKeys';
import { minLength } from '../asserts/string/minLength';

/**
 * These derive one object schema from another. They are only sound because schemas are immutable: the
 * source and the properties it holds must be unaffected, which is asserted in each group rather than
 * assumed.
 */
describe('object utilities', () => {
  const userSchema = object({
    id: string(),
    name: string().custom(minLength(2)),
    secret: string(),
  });

  describe('pick', () => {
    it('keeps only the named properties', () => {
      const schema = pick(userSchema, ['id', 'name']);

      expectEqualTypes<{ id: string; name: string }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { id: '1', name: 'ab' })).toEqual({ id: '1', name: 'ab' });
    });

    it('rejects a property it dropped', () => {
      const schema = pick(userSchema, ['id']);

      expect(hasErrors(parse(schema, { id: '1', secret: 'x' }))).toBe(true);
    });

    it('keeps the assertions of the properties it kept', () => {
      const schema = pick(userSchema, ['name']);

      expect(parseOrFail(schema, { name: 'ab' })).toEqual({ name: 'ab' });
      expect(parse(schema, { name: 'a' })[0]![0]!.code).toBe('s:minLength');
    });

    it('rejects an unknown property name', () => {
      expect(() => pick(userSchema, ['nope' as 'id'])).toThrow(BuildSchemaError);
      expect(() => pick(userSchema, ['nope' as 'id'])).toThrow("Unknown property 'nope' in pick method");
    });

    it('rejects a schema that is not an object schema', () => {
      expect(() => pick(string() as unknown as typeof userSchema, ['id'])).toThrow(
        'Schema in pick method is not an object schema',
      );
    });

    it('rejects something that is not a schema at all', () => {
      expect(() => pick('nope' as unknown as typeof userSchema, ['id'])).toThrow('Invalid schema in pick method');
    });

    it('leaves the source untouched', () => {
      pick(userSchema, ['id']);

      expect(parseOrFail(userSchema, { id: '1', name: 'ab', secret: 'x' })).toEqual({
        id: '1',
        name: 'ab',
        secret: 'x',
      });
    });

    it('generates the narrowed type', () => {
      expect(codeGen(pick(userSchema, ['id']))).toBe('{\n  id: string;\n};');
    });
  });

  describe('omit', () => {
    it('drops the named properties', () => {
      const schema = omit(userSchema, ['secret']);

      expectEqualTypes<{ id: string; name: string }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { id: '1', name: 'ab' })).toEqual({ id: '1', name: 'ab' });
      expect(hasErrors(parse(schema, { id: '1', name: 'ab', secret: 'x' }))).toBe(true);
    });

    it('rejects an unknown property name', () => {
      expect(() => omit(userSchema, ['nope' as 'id'])).toThrow("Unknown property 'nope' in omit method");
    });

    it('rejects a schema that is not an object schema', () => {
      expect(() => omit(string() as unknown as typeof userSchema, ['id'])).toThrow(
        'Schema in omit method is not an object schema',
      );
    });

    it('leaves the source untouched', () => {
      omit(userSchema, ['secret']);

      expect(parseOrFail(userSchema, { id: '1', name: 'ab', secret: 'x' })).toBeTruthy();
    });

    it('generates the narrowed type', () => {
      expect(codeGen(omit(userSchema, ['secret', 'name']))).toBe('{\n  id: string;\n};');
    });
  });

  describe('partial', () => {
    it('makes every property optional', () => {
      const schema = partial(userSchema);

      expectEqualTypes<{ id?: string; name?: string; secret?: string }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, {})).toEqual({});
      expect(parseOrFail(schema, { id: '1' })).toEqual({ id: '1' });
    });

    it('still validates a property that is present', () => {
      const schema = partial(userSchema);

      expect(hasErrors(parse(schema, { id: 1 }))).toBe(true);
      expect(parse(schema, { name: 'a' })[0]![0]!.code).toBe('s:minLength');
    });

    it('rejects a schema that is not an object schema', () => {
      expect(() => partial(string() as unknown as typeof userSchema)).toThrow(
        'Schema in partial method is not an object schema',
      );
    });

    it('leaves the source and its property schemas untouched', () => {
      partial(userSchema);

      // The properties were made optional on copies, so the original still requires them.
      expect(hasErrors(parse(userSchema, {}))).toBe(true);
    });

    it('generates optional properties', () => {
      expect(codeGen(partial(object({ a: string() })))).toBe('{\n  a?: string | undefined;\n};');
    });
  });

  describe('extend', () => {
    it('adds properties', () => {
      const schema = extend(userSchema, { age: number() });

      expectEqualTypes<{ id: string; name: string; secret: string; age: number }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { id: '1', name: 'ab', secret: 'x', age: 3 })).toEqual({
        id: '1',
        name: 'ab',
        secret: 'x',
        age: 3,
      });
    });

    it('requires the added property', () => {
      const schema = extend(userSchema, { age: number() });

      expect(hasErrors(parse(schema, { id: '1', name: 'ab', secret: 'x' }))).toBe(true);
    });

    it('replaces a property that is already declared', () => {
      // Unlike intersection, which rejects a duplicate key, extend is an explicit override.
      const schema = extend(userSchema, { id: number() });

      expectEqualTypes<{ name: string; secret: string; id: number }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, { id: 1, name: 'ab', secret: 'x' })).toEqual({ id: 1, name: 'ab', secret: 'x' });
      expect(hasErrors(parse(schema, { id: '1', name: 'ab', secret: 'x' }))).toBe(true);
    });

    it('rejects a shape that is not a record of schemas', () => {
      expect(() => extend(userSchema, { age: 'nope' as unknown as CommonSchema })).toThrow(
        "Invalid schema in extend method for property 'age'",
      );
    });

    it('rejects a schema passed where a shape belongs', () => {
      expect(() => extend(userSchema, string() as unknown as Record<string, CommonSchema>)).toThrow(
        'Invalid shape in extend method',
      );
      expect(() => extend(userSchema, undefined as unknown as Record<string, CommonSchema>)).toThrow(
        'Invalid shape in extend method',
      );
    });

    it('rejects a schema that is not an object schema', () => {
      expect(() => extend(string() as unknown as typeof userSchema, { a: string() })).toThrow(
        'Schema in extend method is not an object schema',
      );
    });

    it('leaves the source untouched', () => {
      extend(userSchema, { age: number() });

      expect(parseOrFail(userSchema, { id: '1', name: 'ab', secret: 'x' })).toBeTruthy();
    });

    it('generates the merged type', () => {
      expect(codeGen(extend(object({ a: string() }), { b: number() }))).toBe('{\n  a: string;\n  b: number;\n};');
    });
  });

  describe('settings carried over from the source', () => {
    it('keeps allowUnrecognized', () => {
      const loose = object({ a: string(), b: string() }).allowUnrecognized();

      expect(parseOrFail(pick(loose, ['a']), { a: 'x', extra: 1 })).toEqual({ a: 'x' });
    });

    it('keeps the object asserts through the utilities that do not change WHICH properties exist', () => {
      // `extend` adds, `partial` and `required` change whether a property may be absent. In all three
      // the property set the rule was written about is still there, so dropping the rule would quietly
      // remove a check.
      const limited = object({ a: string(), b: string() }).custom(maxKeys(1));

      expect(parse(extend(limited, { c: string() }), { a: 'x', b: 'y', c: 'z' })[0]![0]!.code).toBe('o:maxKeys');
      expect(parse(partial(limited), { a: 'x', b: 'y' })[0]![0]!.code).toBe('o:maxKeys');
      expect(parse(required(partial(limited)), { a: 'x', b: 'y' })[0]![0]!.code).toBe('o:maxKeys');
    });

    it('DROPS the object asserts in pick and omit, which change which properties exist', () => {
      // `maxKeys(0)`, not `maxKeys(1)`: the narrowed schemas declare ONE property, and a value with
      // one key satisfies `maxKeys(1)` either way — so that spelling would pass whether the rule was
      // carried or not, and prove nothing. Verified by flipping the flag back.
      const limited = object({ a: string(), b: string() }).custom(maxKeys(0));

      expect(parseOrFail(pick(limited, ['a']), { a: 'x' })).toEqual({ a: 'x' });
      expect(parseOrFail(omit(limited, ['b']), { a: 'x' })).toEqual({ a: 'x' });
      // The source is untouched, as always.
      expect(parse(limited, { a: 'x' })[0]![0]!.code).toBe('o:maxKeys');
    });

    it('is why pick drops them: the rule fired about a property the result does not declare', () => {
      // The measured case. "One of these is required" is an ordinary whole-form rule, and carrying it
      // onto a schema without `phone` reported a failure naming a field that schema has not got.
      const contact = object({ email: string(), phone: string() }).custom((value, ctx) => {
        const v = value as { email?: string; phone?: string };
        if (!v.email && !v.phone) ctx.addIssue('one contact method', value, 'u:need-one');
      });

      // On the source, with a phone present, it passes.
      expect(hasErrors(parse(contact, { email: '', phone: '060' }))).toBe(false);
      // On the picked schema it used to report 'u:need-one' for a value that satisfies everything
      // the picked schema declares.
      expect(hasErrors(parse(pick(contact, ['email']), { email: '' }))).toBe(false);
    });

    it('a rule that only reads kept properties is dropped too, and re-attaching is the answer', () => {
      // Nothing can tell the two apart: an object `custom` receives the whole value and reads it
      // directly, so which properties it touches is not knowable. Dropping every rule is the choice,
      // and it is documented rather than silent.
      const limited = object({ a: string(), b: string() }).custom(maxKeys(0));

      expect(hasErrors(parse(pick(limited, ['a']), { a: 'x' }))).toBe(false);
      expect(parse(pick(limited, ['a']).custom(maxKeys(0)), { a: 'x' })[0]![0]!.code).toBe('o:maxKeys');
    });

    it('keeps id and description', () => {
      const identified = object({ a: string() }).id('root').description('The root');

      expect(parse(pick(identified, ['a']), { a: 1 })[0]![0]!.meta).toEqual({ id: 'root', description: 'The root' });
    });
  });

  describe('composing the utilities', () => {
    it('chains through several of them', () => {
      const schema = partial(extend(omit(userSchema, ['secret']), { age: number() }));

      expectEqualTypes<{ id?: string; name?: string; age?: number }, InferType<typeof schema>>(true);
      expect(parseOrFail(schema, {})).toEqual({});
      expect(parseOrFail(schema, { age: 3 })).toEqual({ age: 3 });
      expect(hasErrors(parse(schema, { secret: 'x' }))).toBe(true);
    });
  });
});
