import { WithBGuardType } from '../../commonTypes';
import { DateSchema } from '../../schemas/DateSchema';

/**
 * @description Creates a new schema for validating date values.
 * @returns {WithBGuardType<DateSchema, Date>} A new instance of `DateSchema` for validating booleans.
 * @example
 * const schema = date();
 * parseOrFail(schema, true); // Validates successfully
 * parseOrFail(schema, 'true'); // Throws a validation error
 *
 * @instance Of DateSchema
 */
export function date(): WithBGuardType<DateSchema, Date> {
  return new DateSchema({ type: ['object'], requiredValidations: [] }) as WithBGuardType<DateSchema, Date>;
}
