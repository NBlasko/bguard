import { boolean } from '../boolean/index';

/**
 * A coercing transform must never throw: it runs before validation, and throwing would replace a clear
 * validation error with an unexplained failure. Anything it cannot convert is passed through unchanged
 * so that validation reports the type problem itself.
 *
 * `null` is never coerced, so `nullable()` still decides whether it is allowed rather than it becoming
 * the string `'null'` or the number `0`.
 *
 * The return type is inferred rather than written out. Naming it flattened the schema to
 * `CommonSchema`, which silently dropped the methods only the concrete classes define — `equalTo`,
 * `oneOfValues`, `onlyTrue`, `onlyFalse`.
 */
/**
 * @description Coerces the received value to a boolean before validating it.
 *
 * Only the values that unambiguously mean a boolean are converted: the strings `'true'` and `'false'`
 * in any case, and the numbers `1` and `0`. Everything else is left for validation to reject.
 *
 * Deliberately narrower than passing the value through `Boolean`, which would accept every input and
 * quietly read `'false'` as `true`.
 *
 * @returns A boolean schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceBoolean(), 'false'); // false
 */
export const coerceBoolean = () =>
  boolean().transformBeforeValidation<unknown>((received) => {
    if (typeof received === 'string') {
      const lowered = received.toLowerCase();
      if (lowered === 'true') return true;
      if (lowered === 'false') return false;
    }

    if (received === 1) return true;
    if (received === 0) return false;

    return received as boolean;
  });
