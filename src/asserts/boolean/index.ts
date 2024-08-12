import { BooleanSchema } from '../../schemas/BooleanSchema';

/**
 * Creates a new schema for validating boolean values.
 *
 * @returns {BooleanSchema} A new instance of `BooleanSchema` for validating booleans.
 *
 * @example
 * const schema = boolean();
 * parseSchema(schema, true); // Validates successfully
 * parseSchema(schema, 'true'); // Throws a validation error
 */
export function boolean(): BooleanSchema {
  return new BooleanSchema({ type: ['boolean'], requiredValidations: [] });
}
