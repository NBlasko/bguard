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
 * than the error escaping. An empty or whitespace-only string, an array or an object is not converted
 * either: `BigInt('')` and `BigInt([])` are `0n`.
 *
 * @returns A bigint schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceBigInt(), '42'); // 42n
 */
export const coerceBigInt = () =>
  bigint().transformBeforeValidation<unknown>((received) => {
    if (received === null || typeof received === 'bigint') return received as bigint;
    // `BigInt('')`, `BigInt('  ')` and `BigInt([])` are all 0n, so an empty field became a real zero. Only
    // non-blank strings, numbers, booleans and Dates are converted, as in coerceNumber; anything else
    // passes through for bigint() to reject by type.
    const convertible =
      (typeof received === 'string' && received.trim() !== '') ||
      typeof received === 'number' ||
      typeof received === 'boolean' ||
      received instanceof Date;
    if (!convertible) return received as bigint;
    try {
      return BigInt(received instanceof Date ? received.getTime() : (received as string | number | boolean));
    } catch {
      // A fraction, NaN, an invalid Date or an unreadable string: bigint() reports the type.
      return received as unknown as bigint;
    }
  });
