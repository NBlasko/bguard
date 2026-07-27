import { WithBGuardType, WithInput } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { bigint } from '../bigint/index';
import { boolean } from '../boolean/index';
import { date } from '../date/index';
import { number } from '../number/index';
import { string } from '../string/index';

/**
 * A coercing transform must never throw: it runs before validation, and throwing would replace a
 * clear validation error with an unexplained failure. Anything it cannot convert is passed through
 * unchanged so that validation reports the type problem itself.
 */
type Coerced<S, In> = WithInput<S, In>;

/**
 * Converts the received value before validating it, for input that does not arrive already typed —
 * query strings, form data, environment variables.
 *
 * Each of these accepts `unknown` and reports that in its inferred input type, while the output type
 * is unchanged. `null` is left alone, so `nullable()` still decides whether it is allowed rather than
 * being turned into the string `'null'` or the number `0`.
 *
 * @example
 * const querySchema = object({ page: coerce.number().default(1), q: coerce.string() });
 * parseOrFail(querySchema, { page: '3', q: 'shoes' }); // { page: 3, q: 'shoes' }
 */
export const coerce = {
  /** Anything that is not already a string is passed through `String`. */
  string: (): Coerced<WithBGuardType<CommonSchema, string>, unknown> =>
    string().transformBeforeValidation<unknown>((received) =>
      received === null || typeof received === 'string' ? (received as string) : String(received),
    ) as unknown as Coerced<WithBGuardType<CommonSchema, string>, unknown>,

  /**
   * Anything that is not already a number is passed through `Number`. A value `Number` cannot read
   * becomes `NaN`, which `number()` rejects, so `'abc'` fails validation rather than passing as a
   * number.
   */
  number: (): Coerced<WithBGuardType<CommonSchema, number>, unknown> =>
    number().transformBeforeValidation<unknown>((received) =>
      received === null || typeof received === 'number' ? (received as number) : Number(received),
    ) as unknown as Coerced<WithBGuardType<CommonSchema, number>, unknown>,

  /**
   * Only the values that unambiguously mean a boolean are converted: the strings `'true'` and
   * `'false'` in any case, and the numbers `1` and `0`. Everything else is left for validation to
   * reject.
   *
   * Deliberately narrower than passing the value through `Boolean`, which would accept every input
   * and quietly read `'false'` as `true`.
   */
  boolean: (): Coerced<WithBGuardType<CommonSchema, boolean>, unknown> =>
    boolean().transformBeforeValidation<unknown>((received) => {
      if (typeof received === 'string') {
        const lowered = received.toLowerCase();
        if (lowered === 'true') return true;
        if (lowered === 'false') return false;
      }

      if (received === 1) return true;
      if (received === 0) return false;

      return received as boolean;
    }) as unknown as Coerced<WithBGuardType<CommonSchema, boolean>, unknown>,

  /** `BigInt` throws on a value it cannot read, so the original is kept for validation to reject. */
  bigint: (): Coerced<WithBGuardType<CommonSchema, bigint>, unknown> =>
    bigint().transformBeforeValidation<unknown>((received) => {
      if (received === null || typeof received === 'bigint') return received as bigint;

      try {
        return BigInt(received as string | number);
      } catch {
        return received as bigint;
      }
    }) as unknown as Coerced<WithBGuardType<CommonSchema, bigint>, unknown>,

  /**
   * Anything that is not already a Date is passed through `new Date`. An unreadable value becomes an
   * invalid Date, which `date()` rejects.
   */
  date: (): Coerced<WithBGuardType<CommonSchema, Date>, unknown> =>
    date().transformBeforeValidation<unknown>((received) =>
      received === null || received instanceof Date ? (received as Date) : new Date(received as string),
    ) as unknown as Coerced<WithBGuardType<CommonSchema, Date>, unknown>,
};
