import { CommonSchema, MapMixTypes, PrimitiveType, WithMix } from '../../schemas/CommonSchema';

/**
 * Creates a new schema for validating values that can match any one of the specified primitive types.
 *
 * @template T
 * @param {T} valueTypes - An array of primitive types that the value can match.
 * @returns {WithMix<MapMixTypes<T>>} A new schema for validating values that can match any of the specified types.
 *
 * @example
 * const schema = oneOfTypes(['string', 'number']);
 * parseSchema(schema, 'hello'); // Validates successfully
 * parseSchema(schema, 42); // Validates successfully
 * parseSchema(schema, true); // Throws a validation error
 */
export function oneOfTypes<T extends PrimitiveType[]>(valueTypes: T): WithMix<MapMixTypes<T>> {
  return new CommonSchema({ type: valueTypes, requiredValidations: [] }) as WithMix<MapMixTypes<T>>;
}
