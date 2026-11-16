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
// The built-in tag of a value, which is the same in every realm: `instanceof Date` is false for a Date
// made in an iframe, a `vm` context or a worker, and comparing against this realm's intrinsics fails the
// same way.
const tagOf = (value: unknown): string => Object.prototype.toString.call(value);
const boxedPrimitives = new Set(['[object String]', '[object Number]', '[object Boolean]', '[object BigInt]']);

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
    const tag = tagOf(input);

    // A boxed primitive is its primitive; `valueOf` is its own in every realm.
    const received: unknown =
      typeof input === 'object' && boxedPrimitives.has(tag) ? (input as { valueOf(): unknown }).valueOf() : input;
    if (typeof received === 'string') return received;
    // NaN and ±Infinity pass through for string() to reject: `'NaN'` is not text anyone sent.
    if (typeof received === 'number')
      return Number.isFinite(received) ? String(received) : (input as unknown as string);
    if (typeof received === 'boolean' || typeof received === 'bigint') return String(received);

    if (tag === '[object Date]') {
      const time = Date.prototype.getTime.call(input);
      // `toISOString` throws on an invalid Date, which a coercion must never do; that one passes through.
      return Number.isNaN(time) ? (input as unknown as string) : new Date(time).toISOString();
    }

    // Anything else passes through for string() to reject by type.
    return input as unknown as string;
  });
