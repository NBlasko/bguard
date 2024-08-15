import { StringSchema } from '../../schemas/StringSchema';

/**
 * Creates a new schema for validating string values.
 *
 * @returns {StringSchema} A new instance of `StringSchema` for validating strings.
 *
 * @example
 * const schema = string();
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 123); // Throws a validation error
 */
export function string(): StringSchema {
  return new StringSchema({ type: ['string'], requiredValidations: [] });
}
