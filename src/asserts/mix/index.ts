import { PrimitiveType } from '../../commonTypes';
import { CommonSchema, MapMixTypes, WithMix } from '../../schemas/CommonSchema';

/**
 * @description Creates a new schema for validating values that can match any one of the specified primitive types.
 *
 * @template T
 * @param {T} valueTypes - An array of primitive types that the value can match.
 * @returns {WithMix<MapMixTypes<T>>} A new schema for validating values that can match any of the specified types.
 * @example
 * const schema = oneOfTypes(['string', 'number']);
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, true); // Throws a validation error
 * 
 * @instance Of CommonSchema
 */
export function oneOfTypes<T extends PrimitiveType[]>(valueTypes: T): WithMix<MapMixTypes<T>> {
  return new CommonSchema({ type: valueTypes, requiredValidations: [] }) as WithMix<MapMixTypes<T>>;
}
