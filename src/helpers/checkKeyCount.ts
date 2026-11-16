import { BuildSchemaError } from '../exceptions';

/**
 * Refuses a key count that is not a non-negative integer, when the schema is built. `Infinity` is let
 * through where it means "no limit".
 *
 * `minKeys(NaN)` passed every object, since nothing compares as less than NaN, and emitted
 * `minProperties: NaN`, which no JSON Schema validator compiles. A negative or fractional count is as
 * meaningless.
 */
export function _checkKeyCount(name: string, expected: number, { allowInfinity = false } = {}): void {
  if (allowInfinity && expected === Infinity) return;
  if (!Number.isInteger(expected) || expected < 0) {
    throw new BuildSchemaError(`${name} expects a non-negative integer, received ${String(expected)}`);
  }
}

/**
 * The keys of an object that hold a value. A key holding `undefined` sends nothing — form libraries and
 * object spreads fill absent fields with it — and JSON cannot carry it, so `minProperties` and
 * `maxProperties` would never see it either. Shared by `minKeys` and `maxKeys` so the two cannot drift.
 */
export function _countDefinedKeys(received: Record<string, unknown>): number {
  let count = 0;
  for (const key in received) {
    if (Object.prototype.hasOwnProperty.call(received, key) && received[key] !== undefined) count++;
  }
  return count;
}
