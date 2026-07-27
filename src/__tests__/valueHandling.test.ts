import { hasErrors } from '../../jest/setup';
import { parse, parseOrFail, codeGen } from '../';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { max } from '../asserts/number/max';
import { min } from '../asserts/number/min';
import { negative } from '../asserts/number/negative';
import { positive } from '../asserts/number/positive';
import { ExceptionContext } from '../core';

const firstMessage = (result: ReturnType<typeof parse>) => result[0]?.[0]?.message;

describe('transforms', () => {
  it('does not run on a missing value', () => {
    // The transform list ran before the undefined check, so an optional string with a `val + ''`
    // transform parsed to the four-character string 'undefined'.
    const schema = string()
      .optional()
      .transformBeforeValidation((val: unknown) => `${val}`);

    expect(parseOrFail(schema, undefined)).toBeUndefined();
  });

  it('still runs on a value that is present', () => {
    const schema = string().transformBeforeValidation((val: unknown) => `${val}`);

    expect(parseOrFail(schema, 42)).toBe('42');
  });

  it('still runs on null', () => {
    // null is a value that was supplied, unlike undefined, so it is transformed.
    const schema = string()
      .nullable()
      .transformBeforeValidation((val: unknown) => (val === null ? 'was null' : (val as string)));

    expect(parseOrFail(schema, null)).toBe('was null');
  });
});

describe('default values', () => {
  it('does not hand out a shared array', () => {
    const schema = array(number()).default([1]);

    const first = parseOrFail(schema, undefined);
    first.push(99);

    expect(parseOrFail(schema, undefined)).toEqual([1]);
    expect(parseOrFail(schema, undefined)).not.toBe(first);
  });

  it('does not hand out a shared object', () => {
    const schema = object({ list: array(number()) }).default({ list: [1] });

    const first = parseOrFail(schema, undefined);
    first.list.push(99);

    expect(parseOrFail(schema, undefined)).toEqual({ list: [1] });
  });

  it('still returns primitive defaults', () => {
    expect(parseOrFail(number().default(8), undefined)).toBe(8);
    expect(parseOrFail(string().default('x'), undefined)).toBe('x');
  });
});

describe('arrays', () => {
  it('does not silently drop holes in a sparse array', () => {
    // forEach skips holes, so the parsed array used to come back shorter than the input with no
    // error to explain it.
    const sparse = [1, , 3] as unknown as number[];

    expect(firstMessage(parse(array(number()), sparse))).toBe('The required value is missing');
  });

  it('keeps the length when the element schema allows undefined', () => {
    const sparse = [1, , 3] as unknown as (number | undefined)[];

    expect(parseOrFail(array(number().optional()), sparse)).toHaveLength(3);
  });

  it('still parses a dense array unchanged', () => {
    expect(parseOrFail(array(number()), [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('NaN', () => {
  it('is rejected by number()', () => {
    expect(firstMessage(parse(number(), NaN))).toBe('The received number is not a valid number');
  });

  it.each([
    ['min', min(5)],
    ['max', max(5)],
    ['positive', positive()],
    ['negative', negative()],
  ])('is rejected before the %s assert can silently accept it', (_name, assert) => {
    // Every comparison against NaN is false, so each of these asserts passed it through.
    expect(hasErrors(parse(number().custom(assert), NaN))).toBe(true);
  });

  it('leaves Infinity alone, which compares correctly', () => {
    expect(parseOrFail(number().custom(min(5)), Infinity)).toBe(Infinity);
    expect(hasErrors(parse(number().custom(max(5)), Infinity))).toBe(true);
    expect(parseOrFail(number().custom(negative()), -Infinity)).toBe(-Infinity);
  });

  it('still accepts ordinary numbers', () => {
    expect(parseOrFail(number().custom(min(5)), 7)).toBe(7);
  });
});

describe('ctx.ref', () => {
  it('yields undefined for a path that does not exist, instead of crashing', () => {
    // Indexing straight into the value threw a TypeError, which parseOrFail reported as
    // 'Something unexpected happened' with no path and no indication of the cause.
    const schema = object({
      a: string().custom((received: string, ctx: ExceptionContext) => {
        if (received !== ctx.ref('no.such.path')) ctx.addIssue('a match', received, 'values differ');
      }),
    });

    const [errors] = parse(schema, { a: 'v' });

    expect(errors![0]!.message).not.toBe('Something unexpected happened');
    expect(errors![0]!.pathToError).toBe('.a');
  });

  it('still resolves a path that does exist', () => {
    const schema = object({
      password: string(),
      confirm: string().custom((received: string, ctx: ExceptionContext) => {
        if (received !== ctx.ref('password')) ctx.addIssue('a match', received, 'passwords differ');
      }),
    });

    expect(parseOrFail(schema, { password: 'p', confirm: 'p' })).toEqual({ password: 'p', confirm: 'p' });
    expect(hasErrors(parse(schema, { password: 'p', confirm: 'q' }))).toBe(true);
  });
});

describe('codeGen string literals', () => {
  it.each([
    ["it's", `'it\\'s';`],
    ['back\\slash', `'back\\\\slash';`],
    ['new\nline', `'new\\nline';`],
    ['tab\there', `'tab\\there';`],
  ])('escapes %j', (value, expected) => {
    // codeGen output is meant to be written to a source file, so an unescaped quote produced
    // TypeScript that does not parse.
    expect(codeGen(string().equalTo(value))).toBe(expected);
  });

  it('escapes a carriage return and the Unicode line separators', () => {
    expect(codeGen(string().equalTo('a\rb'))).toBe(`'a\\rb';`);
    expect(codeGen(string().equalTo('a\u2028b'))).toBe(`'a\\u2028b';`);
    expect(codeGen(string().equalTo('a\u2029b'))).toBe(`'a\\u2029b';`);
  });

  it('escapes every member of a union', () => {
    expect(codeGen(string().oneOfValues(["a'b", 'c']))).toBe(`'a\\'b' | 'c';`);
  });

  it('leaves an ordinary literal untouched', () => {
    expect(codeGen(string().equalTo('plain'))).toBe(`'plain';`);
  });
});

describe('an assert that throws something unexpected', () => {
  // Reachable: a custom assert is arbitrary user code. These paths used to be marked
  // `istanbul ignore`, which kept them out of the coverage figure rather than out of reach.
  const throwing = () =>
    object({
      a: string().custom(() => {
        throw new TypeError('boom');
      }),
    });

  it('surfaces a generic error from parseOrFail', () => {
    expect(() => parseOrFail(throwing(), { a: 'x' })).toThrow('Something unexpected happened');
  });

  it('reports it as a single error from parse', () => {
    const [errors, value] = parse(throwing(), { a: 'x' });

    expect(errors).toEqual([
      { message: 'Something unexpected happened', expected: '', received: '', pathToError: '', meta: undefined },
    ]);
    expect(value).toBeNull();
  });
});
