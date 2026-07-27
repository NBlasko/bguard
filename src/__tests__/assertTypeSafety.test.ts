import { expectEqualTypes } from '../../jest/setup';
import { parseOrFail } from '../';
import { InferType } from '../InferType';
import { ExceptionContext, RequiredValidation } from '../core';

import { array } from '../asserts/array';
import { maxArrayLength } from '../asserts/array/maxArrayLength';
import { bigint } from '../asserts/bigint';
import { bigintMin } from '../asserts/bigint/bigintMin';
import { boolean } from '../asserts/boolean';
import { date } from '../asserts/date';
import { dateMin } from '../asserts/date/dateMin';
import { equalTo } from '../asserts/mix/equalTo';
import { number } from '../asserts/number';
import { min } from '../asserts/number/min';
import { positive } from '../asserts/number/positive';
import { object } from '../asserts/object';
import { maxKeys } from '../asserts/object/maxKeys';
import { string } from '../asserts/string';
import { email } from '../asserts/string/email';
import { maxLength } from '../asserts/string/maxLength';

/**
 * The suite's ~150 `expectEqualTypes` assertions are compile-time only: the runtime body of the
 * helper asserts nothing. They are therefore worth exactly as much as the test runner's type
 * checking, which ts-jest turns off whenever it sees `isolatedModules` in the tsconfig it reads.
 *
 * These two canaries fail loudly if that ever happens again, instead of letting every type
 * assertion in the suite quietly become a no-op while the run stays green.
 */
describe('type-level assertions are enforced by the compiler', () => {
  it('rejects a wrong expectEqualTypes claim', () => {
    const schema = string();
    expectEqualTypes<InferType<typeof schema>, string>(true);
    // @ts-expect-error canary: InferType is string, so Equal<string, number> is false here
    expectEqualTypes<InferType<typeof schema>, number>(true);

    expect(true).toBe(true);
  });

  it('rejects an obvious type error', () => {
    // @ts-expect-error canary: a number is not assignable to string
    const wrong: string = 42;

    expect(wrong).toBe(42);
  });
});

/**
 * `custom` accepts `RequiredValidation<AssertInput<this>>`, so attaching an assert to a schema of
 * the wrong type is a compile error rather than a validation that silently never matches.
 *
 * The negative cases below are enforced by `@ts-expect-error`: if one of them ever starts
 * compiling, TypeScript reports an unused directive (TS2578) and this suite fails. That makes the
 * file a real type-level regression test, not documentation.
 */
describe('assert/schema type compatibility', () => {
  it('rejects asserts that belong to a different type', () => {
    // @ts-expect-error a string assert cannot be attached to a number schema
    number().custom(email());
    // @ts-expect-error a string assert cannot be attached to a number schema
    number().custom(maxLength(5));
    // @ts-expect-error a number assert cannot be attached to a string schema
    string().custom(min(3));
    // @ts-expect-error a number assert cannot be attached to a string schema
    string().custom(positive());
    // @ts-expect-error a date assert cannot be attached to a string schema
    string().custom(dateMin('2020-01-01'));
    // @ts-expect-error an array assert cannot be attached to a string schema
    string().custom(maxArrayLength(2));
    // @ts-expect-error an object assert cannot be attached to a string schema
    string().custom(maxKeys(2));
    // @ts-expect-error a bigint assert cannot be attached to a number schema
    number().custom(bigintMin(5n));
    // @ts-expect-error a string assert cannot be attached to a boolean schema
    boolean().custom(email());
    // @ts-expect-error a string assert cannot be attached to an array schema
    array(string()).custom(email());

    expect(true).toBe(true);
  });

  it('accepts asserts that match the schema type', () => {
    expect(parseOrFail(string().custom(email(), maxLength(20)), 'a@b.com')).toBe('a@b.com');
    expect(parseOrFail(number().custom(min(3), positive()), 5)).toBe(5);
    expect(parseOrFail(bigint().custom(bigintMin(1n)), 5n)).toBe(5n);
    expect(parseOrFail(array(string()).custom(maxArrayLength(2)), ['a'])).toEqual(['a']);
    expect(parseOrFail(object({ a: string() }).custom(maxKeys(2)), { a: 'x' })).toEqual({ a: 'x' });

    const d = new Date('2021-01-01');
    expect(parseOrFail(date().custom(dateMin('2020-01-01')), d)).toBe(d);
  });

  it('accepts type-agnostic asserts on every schema', () => {
    // equalTo and oneOfValues are declared over `unknown`, which stays assignable everywhere.
    expect(parseOrFail(string().custom(equalTo('x')), 'x')).toBe('x');
    expect(parseOrFail(number().custom(equalTo(1)), 1)).toBe(1);
    expect(parseOrFail(boolean().custom(equalTo(true)), true)).toBe(true);
  });

  it('still accepts custom asserts written against the bare RequiredValidation type', () => {
    // Backwards compatibility: `RequiredValidation` defaults to `any`, so asserts written before
    // the parameter existed keep working on any schema.
    const startsWithA = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
      if (!received.startsWith('a')) ctx.addIssue('a', received, 'must start with a');
    };

    expect(parseOrFail(string().custom(startsWithA()), 'abc')).toBe('abc');
  });
});
