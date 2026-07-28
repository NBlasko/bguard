import { string } from '../string/index';

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
 * @description Coerces the received value to a string before validating it. Anything that is not
 * already a string is passed through `String`.
 *
 * @returns A string schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceString(), 42); // '42'
 */
export const coerceString = () =>
  string().transformBeforeValidation<unknown>((received) =>
    received === null || typeof received === 'string' ? (received as string) : String(received),
  );
