import { expectEqualTypes } from '../../jest/setup';
import { parse, parseOrFail, BuildSchemaError, codeGen } from '../';
import { InferType } from '../InferType';
import { boolean } from '../asserts/boolean';
import { object } from '../asserts/object';
import { oneOfTypes } from '../asserts/mix';
import { string } from '../asserts/string';

describe('boolean schema', () => {
  it('rejects onlyTrue and onlyFalse on the same chain', () => {
    // The string, number and bigint schemas already guarded against this. Without it, the pair
    // built a schema that rejects true and false alike, which no value satisfies.
    expect(() => boolean().onlyTrue().onlyFalse()).toThrow(BuildSchemaError);
    expect(() => boolean().onlyFalse().onlyTrue()).toThrow(BuildSchemaError);
    expect(() => boolean().onlyTrue().onlyTrue()).toThrow(BuildSchemaError);
  });

  it('still applies a single restriction', () => {
    expect(parseOrFail(boolean().onlyTrue(), true)).toBe(true);
    expect(parse(boolean().onlyTrue(), false)[0]).toBeDefined();
    expect(parseOrFail(boolean().onlyFalse(), false)).toBe(false);
  });

  it('leaves the base schema refinable, as immutability requires', () => {
    const base = boolean();

    expect(parseOrFail(base.onlyTrue(), true)).toBe(true);
    expect(parseOrFail(base.onlyFalse(), false)).toBe(false);
  });
});

describe('oneOfTypes', () => {
  it('rejects an empty type list', () => {
    // An empty list left the type check with nothing to compare against, so the schema accepted
    // every value and code-generated to an empty type annotation.
    expect(() => oneOfTypes([])).toThrow(BuildSchemaError);
  });

  it('accepts a missing value when undefined is one of the types', () => {
    // The inferred type said `string | undefined` while validation reported the value as missing.
    const schema = oneOfTypes(['string', 'undefined']);

    expectEqualTypes<string | undefined, InferType<typeof schema>>(true);
    expect(parseOrFail(schema, undefined)).toBeUndefined();
    expect(parseOrFail(schema, 'x')).toBe('x');
    expect(parse(schema, 42)[0]).toBeDefined();
  });

  it('makes an object property optional when undefined is one of its types', () => {
    const schema = object({ a: oneOfTypes(['string', 'undefined']), b: string() });

    expectEqualTypes<{ b: string; a?: string | undefined }, InferType<typeof schema>>(true);
    expect(parseOrFail(schema, { b: 'y' })).toEqual({ b: 'y' });
  });

  it('emits undefined once in the generated type', () => {
    expect(codeGen(oneOfTypes(['string', 'undefined']))).toBe('string | undefined;');
  });

  it('still rejects a missing value when undefined is not listed', () => {
    const schema = oneOfTypes(['string', 'number']);

    expect(parse(schema, undefined)[0]).toBeDefined();
    expect(parseOrFail(schema, 42)).toBe(42);
  });
});
