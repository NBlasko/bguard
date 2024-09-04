import { WithBGuardType } from '../../commonTypes';
import { NumberSchema } from '../../schemas/NumberSchema';

/**
 * @description Creates a new schema for validating number values.
 * @returns {NumberSchema} A new instance of `NumberSchema` for validating numbers.
 * @example
 * const schema = number();
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, '42'); // Throws a validation error
 *
 * @instance Of NumberSchema
 */
export function number(): WithBGuardType<NumberSchema, number> {
  return new NumberSchema({ type: ['number'], requiredValidations: [] }) as WithBGuardType<NumberSchema, number>;
}
