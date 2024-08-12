import { throwException } from '../../exceptions';
import type { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value is negative (less than zero).
 *
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not negative.
 *
 * @example
 * const schema = number().custom(negative());
 * parseSchema(schema, -10); // Valid
 * parseSchema(schema, 0);  // Throws an error: 'The received value is not a negative number'
 * parseSchema(schema, 5);  // Throws an error: 'The received value is not a negative number'
 */
export const negative = (): RequiredValidation => (received: number, pathToError: string) => {
  if (received >= 0) throwException('negative', received, pathToError, 'The received value is not a negative number');
};
