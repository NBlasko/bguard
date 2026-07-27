import { BaseType, MapMixTypes, WithBGuardType, WithUndefined } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { BuildSchemaError } from '../../exceptions';

/**
 * Listing `'undefined'` infers `| undefined`, so the schema has to accept a missing value as well,
 * and an object property holding it has to be optional. Both follow from the `WithUndefined` brand
 * plus `isOptional` on the context.
 */
type OneOfTypesSchema<T extends BaseType[]> = 'undefined' extends T[number]
  ? WithUndefined<WithBGuardType<CommonSchema, MapMixTypes<T>>>
  : WithBGuardType<CommonSchema, MapMixTypes<T>>;

/**
 * @description Creates a new schema for validating values that can match any one of the specified primitive types.
 * @template T
 * @param {T} valueTypes - An array of primitive types that the value can match.
 * @returns A new schema for validating values that can match any of the specified types.
 * @example
 * const schema = oneOfTypes(['string', 'number']);
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, true); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function oneOfTypes<T extends BaseType[]>(valueTypes: T): OneOfTypesSchema<T> {
  // An empty list left the type check with nothing to compare against, so the schema accepted any
  // value at all and code-generated to an empty type annotation.
  if (!valueTypes.length) throw new BuildSchemaError('Missing value types in oneOfTypes method');

  return new CommonSchema({
    type: valueTypes,
    requiredValidations: [],
    // Without this the inferred type said `| undefined` while validation rejected it as missing.
    isOptional: valueTypes.includes('undefined') || undefined,
  }) as OneOfTypesSchema<T>;
}
