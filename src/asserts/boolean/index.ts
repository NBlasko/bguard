import { WithBGuardType } from '../../commonTypes';
import { BooleanSchema } from '../../schemas/BooleanSchema';

/**
 * @description Creates a new schema for validating boolean values.
 * @returns {WithBGuardType<BooleanSchema, boolean>} A new instance of `BooleanSchema` for validating booleans.
 * @example
 * const schema = boolean();
 * parseOrFail(schema, true); // Validates successfully
 * parseOrFail(schema, 'true'); // Throws a validation error
 *
 * @instance Of BooleanSchema
 */
export function boolean(): WithBGuardType<BooleanSchema, boolean> {
  return new BooleanSchema({ type: ['boolean'], requiredValidations: [] }) as WithBGuardType<BooleanSchema, boolean>;
}
