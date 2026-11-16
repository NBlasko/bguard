import { setOwnProperty } from './setOwnProperty';

/**
 * A deep copy of the plain data in a value: arrays, plain objects and Dates, at any depth. Anything else
 * — a class instance, a Map, a function — is kept as it is, because copying it would lose its prototype
 * and with it what makes it that kind of value.
 *
 * Used for `default()`. A default is handed out on every parse, and a parse result is the caller's to
 * change. Validation rebuilds objects and arrays a schema declares, but not a Date, and not anything
 * under a schema that does not walk it (`oneOfTypes(['object'])`), so those came back as one shared
 * instance: changing one parse's result changed the default for every later parse. The value given to
 * `default()` is copied as well, so changing it afterwards does not change the schema.
 *
 * `structuredClone` would do most of this, but turns a class instance into a plain object.
 */
export function _cloneValue<T>(value: T, seen = new Map<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;

  // By tag and prototype shape rather than `instanceof` and `=== Object.prototype`, which are false for a
  // Date or a plain object made in another realm (an iframe, a `vm` context, a worker).
  if (Object.prototype.toString.call(value) === '[object Date]')
    return new Date(Date.prototype.getTime.call(value)) as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (let i = 0; i < value.length; i++) copy[i] = _cloneValue(value[i], seen);
    return copy as T;
  }

  // A plain object's prototype is null or some realm's Object.prototype, whose own prototype is null. A
  // class instance has its class's prototype in between.
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== null && Object.getPrototypeOf(prototype) !== null) return value;

  // The copy is made in this realm: null stays null, and any Object.prototype becomes this one.
  const copy = (prototype === null ? Object.create(null) : {}) as Record<string, unknown>;
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    setOwnProperty(copy, key, _cloneValue((value as Record<string, unknown>)[key], seen));
  }
  return copy as T;
}
