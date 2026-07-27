import { WithRecord } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { BuildSchemaError } from '../../exceptions';

/**
 * @description Creates a new schema for an object whose keys are not known in advance.
 *
 * Every key is validated against `keySchema` and every value against `valueSchema`. Keys arrive as
 * strings, so `keySchema` must be a string schema. Validation checks the keys that are present
 * rather than requiring a fixed set, which is why a restricted key type infers as `Partial`.
 *
 * @template K
 * @template V
 * @param {K} keySchema - The schema every key must satisfy.
 * @param {V} valueSchema - The schema every value must satisfy.
 * @returns A new schema inferring `Record<key, value>`.
 * @example
 * const schema = record(string(), number());
 * parseOrFail(schema, { a: 1, b: 2 }); // Validates successfully
 * parseOrFail(schema, { a: 'one' }); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function record<K extends CommonSchema, V extends CommonSchema>(
  keySchema: K,
  valueSchema: V,
): WithRecord<CommonSchema, K, V> {
  if (!(keySchema instanceof CommonSchema)) throw new BuildSchemaError('Invalid key schema in record method');
  if (!(valueSchema instanceof CommonSchema)) throw new BuildSchemaError('Invalid value schema in record method');

  return new CommonSchema({
    type: [],
    requiredValidations: [],
    record: { key: keySchema, value: valueSchema },
  }) as WithRecord<CommonSchema, K, V>;
}
