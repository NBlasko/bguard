import { WithArray } from '../../commonTypes';
import { ArraySchema } from '../../schemas/ArraySchema';
import { CommonSchema } from '../../schemas/CommonSchema';

/**
 * @description Creates a new schema for validating arrays where each element must match the specified schema.
 * @template T
 * @param {T} arraySchema - The schema that each element of the array must match.
 * @returns {WithArray<ArraySchema, T>} A new instance of `ArraySchema` for validating arrays of elements that match the specified schema.
 * @example
 * const schema = array(string());
 * parseOrFail(schema, ['hello', 'world']); // Validates successfully
 * parseOrFail(schema, ['hello', 123]); // Throws a validation error
 *
 * @instance Of ArraySchema
 */
export function array<T extends CommonSchema>(arraySchema: T): WithArray<ArraySchema, T> {
  return new ArraySchema({ type: [], requiredValidations: [] }, arraySchema) as WithArray<ArraySchema, T>;
}
