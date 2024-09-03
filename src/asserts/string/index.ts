import { WithBGuardType } from '../../commonTypes';
import { StringSchema } from '../../schemas/StringSchema';

/**
 * @description Creates a new schema for validating string values.
 * @returns {WithBGuardType<StringSchema, string>} A new instance of `StringSchema` for validating strings.
 * @example
 * const schema = string();
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 123); // Throws a validation error
 *
 * @instance Of StringSchema
 */
export function string(): WithBGuardType<StringSchema, string> {
  return new StringSchema({ type: ['string'], requiredValidations: [] }) as WithBGuardType<StringSchema, string>;
}
