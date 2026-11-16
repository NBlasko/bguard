/**
 * What a value really is, asked of the engine rather than of the value.
 *
 * `instanceof Date` is false for a Date made in another realm (an iframe, a `vm` context, a worker), and
 * `Object.prototype.toString` can be told anything through `Symbol.toStringTag`: an object claiming
 * `'Date'` made `getTime` throw inside a coercion, and one with its own `getTime` passed `date()`. The
 * built-in methods below check the internal slot a real Date or boxed primitive carries, which no object
 * can fake and every realm shares, and they throw for anything else.
 */

/** The timestamp of a real Date from any realm (NaN for an invalid one), or undefined for anything else. */
export function _timeOf(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  try {
    return Date.prototype.getTime.call(value);
  } catch {
    return undefined;
  }
}

const unboxers: ((value: object) => unknown)[] = [
  (value) => String.prototype.valueOf.call(value),
  (value) => Number.prototype.valueOf.call(value),
  (value) => Boolean.prototype.valueOf.call(value),
  (value) => BigInt.prototype.valueOf.call(value),
];

/** The primitive inside a boxed string, number, boolean or bigint from any realm; anything else as it is. */
export function _unbox(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  for (const unbox of unboxers) {
    try {
      return unbox(value);
    } catch {
      // Not this kind of box.
    }
  }
  return value;
}

const objectSource = Function.prototype.toString.call(Object);

/**
 * Whether a value is a plain object: no prototype, or some realm's `Object.prototype`. A class instance
 * has its class's prototype in between, and an object whose prototype is merely prototype-free still
 * inherits from it, so neither counts.
 */
export function _isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype === null) return true;
  if (Object.getPrototypeOf(prototype) !== null) return false;
  const constructor: unknown = (prototype as { constructor?: unknown }).constructor;
  return typeof constructor === 'function' && Function.prototype.toString.call(constructor) === objectSource;
}
