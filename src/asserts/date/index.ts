import { DateSchema } from '../../schemas/DateSchema';

/**
 * @description Creates a new schema for validating date values.
 * @returns {DateSchema} A new instance of `DateSchema` for validating booleans.
 * @example
 * const schema = date();
 * parseOrFail(schema, true); // Validates successfully
 * parseOrFail(schema, 'true'); // Throws a validation error
 * 
 * @instance Of DateSchema
 */
export function date(): DateSchema {
  return new DateSchema({ type: ['object'], requiredValidations: [] });
}
