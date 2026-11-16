import { BuildSchemaError } from '../exceptions';

/**
 * Refuses a key count that is not a non-negative integer, when the schema is built.
 *
 * `minKeys(NaN)` passed every object, since nothing compares as less than NaN, and emitted
 * `minProperties: NaN`, which no JSON Schema validator compiles. A negative or fractional count is as
 * meaningless.
 */
export function _checkKeyCount(name: string, expected: number): void {
  if (!Number.isInteger(expected) || expected < 0) {
    throw new BuildSchemaError(`${name} expects a non-negative integer, received ${String(expected)}`);
  }
}
