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

  if (value instanceof Date) return new Date(value.getTime()) as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (let i = 0; i < value.length; i++) copy[i] = _cloneValue(value[i], seen);
    return copy as T;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  const copy = Object.create(prototype) as Record<string, unknown>;
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    setOwnProperty(copy, key, _cloneValue((value as Record<string, unknown>)[key], seen));
  }
  return copy as T;
}
