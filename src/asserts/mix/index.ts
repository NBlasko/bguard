import { BaseType, WithBGuardType } from '../../commonTypes';
import { CommonSchema, MapMixTypes } from '../../schemas/CommonSchema';

/**
 * @description Creates a new schema for validating values that can match any one of the specified primitive types.
 *
 * @template T
 * @param {T} valueTypes - An array of primitive types that the value can match.
 * @returns {WithBGuardType<CommonSchema, MapMixTypes<T>>} A new schema for validating values that can match any of the specified types.
 * @example
 * const schema = oneOfTypes(['string', 'number']);
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, true); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function oneOfTypes<T extends BaseType[]>(valueTypes: T): WithBGuardType<CommonSchema, MapMixTypes<T>> {
  return new CommonSchema({ type: valueTypes, requiredValidations: [] }) as WithBGuardType<
    CommonSchema,
    MapMixTypes<T>
  >;
}
