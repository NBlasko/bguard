import { throwException } from '../../exceptions';
import { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value is strictly less than a specified maximum value (i.e., the maximum value is excluded).
 *
 * @param {number} expected - The maximum allowable value, which is excluded.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is greater than or equal to the expected maximum value.
 *
 * @example
 * const schema = number().custom(maxExcluded(100));
 * parseSchema(schema, 99);  // Valid
 * parseSchema(schema, 100); // Throws an error: 'The received value is greater than or equal to expected'
 * parseSchema(schema, 101); // Throws an error: 'The received value is greater than or equal to expected'
 */
export const maxExcluded =
  (expected: number): RequiredValidation =>
  (received: number, pathToError: string) => {
    if (expected <= received)
      throwException(expected, received, pathToError, 'The received value is greater than or equal to expected');
  };
