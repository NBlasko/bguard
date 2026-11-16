import { _timeOf, _unbox } from '../../helpers/intrinsics';
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
 * @description Coerces the received value to a string before validating it. Finite numbers, booleans and
 * bigints are passed through `String`, and so are their boxed forms (`new String('a')`). A Date becomes
 * its ISO form (`2021-01-01T00:00:00.000Z`), from any realm.
 *
 * Anything else is rejected by type: objects of any kind (plain objects, arrays, Maps, errors, URLs,
 * Buffers), functions, symbols, NaN, ±Infinity and invalid Dates. `String` turns all of them into
 * something — `'[object Object]'`, `''` for an empty array, a function's source code, `'NaN'` — and
 * none of it is text anyone sent. Convert such a value yourself, with `transformBeforeValidation`, when
 * you know what its text should be. `String(date)` was not used for a different reason: it gives the
 * local time with a time-zone name, so the same instant read differently on every server.
 *
 * @returns A string schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceString(), 42); // '42'
 */
export const coerceString = () =>
  string().transformBeforeValidation<unknown>((input) => {
    if (input === null || typeof input === 'string') return input as string;

    // A boxed primitive is its primitive. Both checks ask the engine, so a Date or a boxed string from
    // another realm is recognised, and an object merely claiming to be one is not; see `intrinsics`.
    const received = _unbox(input);
    if (typeof received === 'string') return received;
    // NaN and ±Infinity pass through for string() to reject: `'NaN'` is not text anyone sent.
    if (typeof received === 'number')
      return Number.isFinite(received) ? String(received) : (input as unknown as string);
    if (typeof received === 'boolean' || typeof received === 'bigint') return String(received);

    const time = _timeOf(input);
    // `toISOString` throws on an invalid Date, which a coercion must never do; that one passes through.
    if (time !== undefined && !Number.isNaN(time)) return new Date(time).toISOString();

    // Anything else passes through for string() to reject by type.
    return input as unknown as string;
  });
