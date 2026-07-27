import { hasErrors } from '../../jest/setup';
import { parse, parseOrFail, BuildSchemaError } from '../';
import { array } from '../asserts/array';
import { boolean } from '../asserts/boolean';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { minLength } from '../asserts/string/minLength';
import { min } from '../asserts/number/min';

/**
 * Refining a schema returns a new schema. Without that, a schema could not be shared between
 * properties or reused as a base, because refining one use would rewrite every other use of the
 * same instance:
 *
 *   const name = string();
 *   object({ a: name.optional(), b: name });  // b silently became optional too
 *
 * Each test here pins one refining method: the original must be unchanged, and the derived schema
 * must carry the refinement.
 */
describe('schema immutability', () => {
  it('optional() does not leak onto a shared instance', () => {
    const name = string();
    const schema = object({ a: name.optional(), b: name });

    const [errors] = parse(schema, { a: 'x' });

    // `b` is required, so omitting it must fail. Before schemas were immutable, `.optional()` on
    // the shared instance made `b` optional as well and this parsed cleanly.
    expect(Array.isArray(errors)).toBe(true);
    expect(errors).toHaveLength(1);
    expect(errors![0]!.message).toBe('Missing required property in the object');

    // `a` really is optional, so the same schema accepts it being absent.
    expect(parseOrFail(schema, { b: 'y' })).toEqual({ b: 'y' });
  });

  it('custom() does not leak', () => {
    const base = string();
    const restricted = base.custom(minLength(5));

    expect(parseOrFail(base, 'ab')).toBe('ab');
    expect(hasErrors(parse(restricted, 'ab'))).toBe(true);
    expect(parseOrFail(restricted, 'abcdef')).toBe('abcdef');
  });

  it('nullable() does not leak', () => {
    const base = number();
    const nullable = base.nullable();

    expect(hasErrors(parse(base, null))).toBe(true);
    expect(parseOrFail(nullable, null)).toBeNull();
  });

  it('default() does not leak', () => {
    const base = number();
    const withDefault = base.default(7);

    expect(hasErrors(parse(base, undefined))).toBe(true);
    expect(parseOrFail(withDefault, undefined)).toBe(7);
  });

  it('returns a new instance from every refining method', () => {
    // The contract stated directly. `id`/`description` currently have no other observable effect,
    // because error metadata is dropped on the multi-error path, so identity is what pins them.
    const str = string();
    expect(str.optional()).not.toBe(str);
    expect(str.nullable()).not.toBe(str);
    expect(str.custom(minLength(1))).not.toBe(str);
    expect(str.transformBeforeValidation((v: unknown) => `${v}`)).not.toBe(str);
    expect(str.id('x')).not.toBe(str);
    expect(str.description('y')).not.toBe(str);
    expect(str.equalTo('z')).not.toBe(str);
    expect(str.oneOfValues(['z'])).not.toBe(str);

    const num = number();
    expect(num.default(1)).not.toBe(num);

    const obj = object({ a: string() });
    expect(obj.allowUnrecognized()).not.toBe(obj);

    const bool = boolean();
    expect(bool.onlyTrue()).not.toBe(bool);
    expect(bool.onlyFalse()).not.toBe(bool);
  });

  it('transformBeforeValidation() does not leak', () => {
    const base = string();
    const transformed = base.transformBeforeValidation((val: unknown) => `${val}`);

    expect(hasErrors(parse(base, 42))).toBe(true);
    expect(parseOrFail(transformed, 42)).toBe('42');
  });

  it('allowUnrecognized() does not leak', () => {
    const base = object({ a: string() });
    const loose = base.allowUnrecognized();

    expect(hasErrors(parse(base, { a: 'x', extra: 1 }))).toBe(true);
    expect(parseOrFail(loose, { a: 'x', extra: 1 })).toEqual({ a: 'x' });
  });

  it('equalTo() does not leak and stays once-only per chain', () => {
    const base = string();
    const literal = base.equalTo('yes');

    expect(parseOrFail(base, 'anything')).toBe('anything');
    expect(hasErrors(parse(literal, 'no'))).toBe(true);
    expect(parseOrFail(literal, 'yes')).toBe('yes');

    // The flag lives on the derived schema, so the chain is still restricted to one call...
    expect(() => literal.equalTo('other')).toThrow(BuildSchemaError);
    // ...while the schema it came from can still be refined independently.
    expect(parseOrFail(base.equalTo('other'), 'other')).toBe('other');
  });

  it('oneOfValues() does not leak', () => {
    const base = number();
    const restricted = base.oneOfValues([1, 2]);

    expect(parseOrFail(base, 99)).toBe(99);
    expect(hasErrors(parse(restricted, 99))).toBe(true);
    expect(parseOrFail(restricted, 2)).toBe(2);
  });

  it('onlyTrue() does not leak', () => {
    const base = boolean();
    const onlyTrue = base.onlyTrue();

    expect(parseOrFail(base, false)).toBe(false);
    expect(hasErrors(parse(onlyTrue, false))).toBe(true);
    expect(parseOrFail(onlyTrue, true)).toBe(true);
  });

  it('supports one base schema reused across fields with different refinements', () => {
    const reusable = string();
    const schema = object({
      short: reusable,
      long: reusable.custom(minLength(10)),
      maybe: reusable.optional(),
    });

    const [errors] = parse(schema, { short: 'a', long: 'a' });

    expect(errors).toHaveLength(1);
    expect(errors![0]!.pathToError).toBe('.long');
    expect(parseOrFail(schema, { short: 'a', long: 'abcdefghij' })).toEqual({
      short: 'a',
      long: 'abcdefghij',
    });
  });

  it('keeps nested child schemas isolated between derived containers', () => {
    const element = number();
    const base = array(element);
    const restricted = array(element.custom(min(10)));

    expect(parseOrFail(base, [1, 2])).toEqual([1, 2]);
    expect(hasErrors(parse(restricted, [1, 2]))).toBe(true);
    expect(parseOrFail(restricted, [10, 20])).toEqual([10, 20]);
  });

  it('keeps refinements independent across a long chain', () => {
    // Each link is a separate schema, so branching off the middle of a chain must not be affected
    // by refinements added further along it.
    const base = string();
    const withMin = base.custom(minLength(3));
    const withMinOptional = withMin.optional();
    const withMinNullable = withMin.nullable();

    expect(parseOrFail(base, '')).toBe('');
    expect(hasErrors(parse(withMin, 'ab'))).toBe(true);

    expect(hasErrors(parse(withMin, undefined))).toBe(true);
    expect(parseOrFail(withMinOptional, undefined)).toBeUndefined();

    expect(hasErrors(parse(withMin, null))).toBe(true);
    expect(parseOrFail(withMinNullable, null)).toBeNull();

    // The two branches did not pick up each other's refinement.
    expect(hasErrors(parse(withMinOptional, null))).toBe(true);
    expect(hasErrors(parse(withMinNullable, undefined))).toBe(true);
  });
});
