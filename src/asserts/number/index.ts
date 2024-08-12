import { NumberSchema } from '../../schemas/NumberSchema';

/**
 * Creates a new schema for validating number values.
 *
 * @returns {NumberSchema} A new instance of `NumberSchema` for validating numbers.
 *
 * @example
 * const schema = number();
 * parseSchema(schema, 42); // Validates successfully
 * parseSchema(schema, '42'); // Throws a validation error
 */
export function number(): NumberSchema {
  return new NumberSchema({ type: ['number'], requiredValidations: [] });
}
