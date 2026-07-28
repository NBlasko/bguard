import { date } from '../date/index';

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
 * @description Coerces the received value to a Date before validating it. Anything that is not already
 * a Date is passed through `new Date`.
 *
 * An unreadable value becomes an invalid Date, which `date()` rejects.
 *
 * @returns A date schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceDate(), '2024-01-01'); // Date
 */
export const coerceDate = () =>
  date().transformBeforeValidation<unknown>((received) =>
    received === null || received instanceof Date ? (received as Date) : new Date(received as string),
  );
