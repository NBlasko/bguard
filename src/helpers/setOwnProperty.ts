/**
 * Writes a key that came from data, without letting `__proto__` change the object's prototype.
 *
 * `target[key] = value` looks like a plain write, but `__proto__` is an accessor inherited from
 * `Object.prototype`, so that one key sets the prototype instead of storing anything. On an object
 * built from input — a `record`'s output — the effect is that `{"__proto__": {"isAdmin": true}}`
 * comes back as an object that *reports* `isAdmin`, and `Object.keys` never mentions where it came
 * from. A validator handing that to a caller who then reads `parsed.isAdmin` is the whole problem.
 *
 * `defineProperty` stores an own data property instead, which is what the input actually said: a
 * key literally named `__proto__`, with the value next to it. The prototype is left alone.
 *
 * Only `__proto__` needs this — every other inherited name (`constructor`, `toString`) is a plain
 * value on the prototype and is shadowed by an ordinary assignment. So the check is a single string
 * comparison, and the common key keeps the fast path.
 */
export function setOwnProperty<T>(target: Record<string, T>, key: string, value: T): void {
  if (key === '__proto__') {
    Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
    return;
  }

  target[key] = value;
}
