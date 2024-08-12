import { throwException } from '../../exceptions';
import { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).
 *
 * @param {number} expected - The minimum allowable value, which is excluded.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than or equal to the expected minimum value.
 *
 * @example
 * const schema = number().custom(minExcluded(10));
 * parseSchema(schema, 11);  // Valid
 * parseSchema(schema, 10); // Throws an error: 'The received value is less than or equal to expected'
 * parseSchema(schema, 9);  // Throws an error: 'The received value is less than or equal to expected'
 */
export const minExcluded =
  (expected: number): RequiredValidation =>
  (received: number, pathToError: string) => {
    if (expected >= received)
      throwException(expected, received, pathToError, 'The received value is less than or equal to expected');
  };
