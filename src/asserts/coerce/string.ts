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
 * The text an object stands for, when it says: `new String('a')`, a URL, a Decimal or an ObjectId give
 * their value. Undefined for an object that only has the generic conversion — `'[object Object]'`,
 * `'[object Map]'` — and for arrays and binary data, which `String` joins or decodes into text nobody
 * typed. Decided by what the conversion gives rather than by comparing `toString` with
 * `Object.prototype.toString`, because that identity differs between realms (an iframe, a `vm` context,
 * a worker), and a plain object from one used to look like it had text of its own.
 */
function ownText(received: object): string | undefined {
  if (Array.isArray(received) || ArrayBuffer.isView(received)) return undefined;
  try {
    const text = String(received);
    return /^\[object [^\]]*\]$/.test(text) ? undefined : text;
  } catch {
    // An object with no prototype has no toString, and a toString can throw.
    return undefined;
  }
}

/**
 * @description Coerces the received value to a string before validating it. Finite numbers, booleans and
 * bigints are passed through `String`, and a Date becomes its ISO form (`2021-01-01T00:00:00.000Z`). An
 * object with a `toString` of its own — `new String('a')`, a URL, a Decimal, an ObjectId — becomes what
 * that returns. Binary data (a Buffer or typed array) is rejected; decode it yourself, since only you know
 * its encoding.
 *
 * Anything else — a plain object, an array, a Map, a function, a symbol, NaN or ±Infinity, an invalid
 * Date — is rejected by type. `String` turns all of them into something (`'[object Object]'`, `''` for an
 * empty array, a function's source code, `'NaN'`), and none of it is text anyone sent. `String(date)` was rejected for a different reason:
 * it gives the local time with a time-zone name, so the same instant read differently on every server.
 *
 * @returns A string schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceString(), 42); // '42'
 */
export const coerceString = () =>
  string().transformBeforeValidation<unknown>((received) => {
    if (received === null || typeof received === 'string') return received as string;
    // NaN and ±Infinity pass through for string() to reject: `'NaN'` is not text anyone sent.
    if (typeof received === 'number')
      return Number.isFinite(received) ? String(received) : (received as unknown as string);
    if (typeof received === 'boolean' || typeof received === 'bigint') return String(received);
    // `toISOString` throws on an invalid Date, which a coercion must never do; that one passes through.
    if (received instanceof Date)
      return Number.isNaN(received.getTime()) ? (received as unknown as string) : received.toISOString();
    if (typeof received === 'object' && received !== null) return ownText(received) ?? (received as unknown as string);
    // Anything else passes through for string() to reject by type — including an object with no
    // prototype, on which `String` throws.
    return received as string;
  });
