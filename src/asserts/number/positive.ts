import { throwException } from '../../exceptions';
import type { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value is positive (greater than zero).
 *
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not positive.
 *
 * @example
 * const schema = number().custom(positive());
 * parseSchema(schema, 10);  // Valid
 * parseSchema(schema, 0);  // Throws an error: 'The received value is not a positive number'
 * parseSchema(schema, -5); // Throws an error: 'The received value is not a positive number'
 */
export const positive = (): RequiredValidation => (received: number, pathToError: string) => {
  if (received <= 0) throwException('positive', received, pathToError, 'The received value is not a positive number');
};
