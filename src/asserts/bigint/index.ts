import { WithBGuardType } from '../../commonTypes';
import { BigIntSchema } from '../../schemas/BigIntSchema';

/**
 * @description Creates a new schema for validating bigint values.
 * @returns {WithBGuardType<BigIntSchema, bigint>} A new instance of `BigIntSchema` for validating bigints.
 * @example
 * const schema = bigint();
 * parseOrFail(schema, 42n); // Validates successfully
 * parseOrFail(schema, 42); // Throws a validation error
 * parseOrFail(schema, '42'); // Throws a validation error
 *
 * @instance Of BigIntSchema
 */
export function bigint(): WithBGuardType<BigIntSchema, bigint> {
  return new BigIntSchema({ type: ['bigint'], requiredValidations: [] }) as WithBGuardType<BigIntSchema, bigint>;
}
