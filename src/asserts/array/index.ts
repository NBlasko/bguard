import { ArraySchema, WithArray } from '../../schemas/ArraySchema';
import { CommonSchema } from '../../schemas/CommonSchema';

/**
 * Creates a new schema for validating arrays where each element must match the specified schema.
 *
 * @template T
 * @param {T} arraySchema - The schema that each element of the array must match.
 * @returns {WithArray<T>} A new instance of `ArraySchema` for validating arrays of elements that match the specified schema.
 *
 * @example
 * const schema = array(string());
 * parseSchema(schema, ['hello', 'world']); // Validates successfully
 * parseSchema(schema, ['hello', 123]); // Throws a validation error
 */
export function array<T extends CommonSchema>(arraySchema: T): WithArray<T> {
  return new ArraySchema({ type: [], requiredValidations: [] }, arraySchema) as WithArray<T>;
}
