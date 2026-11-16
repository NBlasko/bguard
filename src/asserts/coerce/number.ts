import { number } from '../number/index';

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
 * @description Coerces the received value to a number before validating it. Anything that is not
 * already a number is passed through `Number`.
 *
 * A value `Number` cannot read becomes `NaN`, which `number()` rejects, so `'abc'` fails validation
 * rather than passing as a number. An empty or whitespace-only string is treated the same way, rather
 * than becoming the `0` that `Number('')` returns.
 *
 * @returns A number schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceNumber(), '42'); // 42
 */
export const coerceNumber = () =>
  number().transformBeforeValidation<unknown>((received) => {
    if (received === null || typeof received === 'number') return received as number;
    // `Number('')` and `Number('  ')` are 0, so an empty form field used to arrive as a real zero. A
    // string with nothing in it holds no number, and becomes NaN like any other unreadable string.
    if (typeof received === 'string' && received.trim() === '') return NaN;
    return Number(received);
  });
