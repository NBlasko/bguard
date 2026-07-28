import { bigint } from '../bigint/index';

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
 * @description Coerces the received value to a bigint before validating it.
 *
 * `BigInt` throws on a value it cannot read, so the original is kept for validation to reject rather
 * than the error escaping.
 *
 * @returns A bigint schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceBigInt(), '42'); // 42n
 */
export const coerceBigInt = () =>
  bigint().transformBeforeValidation<unknown>((received) => {
    if (received === null || typeof received === 'bigint') return received as bigint;

    try {
      return BigInt(received as string | number);
    } catch {
      return received as bigint;
    }
  });
