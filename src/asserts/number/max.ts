import { throwException } from '../../exceptions';
import type { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value does not exceed a specified maximum value.
 *
 * @param {number} expected - The maximum allowable value.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value exceeds the expected maximum value.
 *
 * @example
 * const schema = number().custom(max(100));
 * parseSchema(schema, 99);  // Valid
 * parseSchema(schema, 100); // Valid
 * parseSchema(schema, 101); // Throws an error: 'The received value is greater than expected'
 */
export const max =
  (expected: number): RequiredValidation =>
  (received: number, pathToError: string) => {
    if (expected < received)
      throwException(expected, received, pathToError, 'The received value is greater than expected');
  };
