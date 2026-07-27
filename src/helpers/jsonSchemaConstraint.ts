import type { JSONSchema } from '../toJSONSchema';

/**
 * Records the JSON Schema keywords an assertion stands for, on the validation itself.
 *
 * The generator only ever sees the closure a factory returned, not the factory or the arguments it was
 * given, so an assertion that wants to appear in the output has to carry its own translation. Those
 * with no JSON Schema equivalent simply do not call this, and are absent from the output rather than
 * approximated.
 */
export function _constrain<T extends (...args: never[]) => void>(constraint: JSONSchema, validation: T): T {
  (validation as T & { jsonSchema?: JSONSchema }).jsonSchema = constraint;
  return validation;
}
