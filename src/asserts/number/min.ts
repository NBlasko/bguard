import { throwException } from '../../exceptions';
import type { RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a number value is not less than a specified minimum value.
 *
 * @param {number} expected - The minimum allowable value.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than the expected minimum value.
 *
 * @example
 * const schema = number().custom(min(10));
 * parseSchema(schema, 11);  // Valid
 * parseSchema(schema, 10);  // Valid
 * parseSchema(schema, 9);   // Throws an error: 'The received value is less than expected'
 */
export const min =
  (expected: number): RequiredValidation =>
  (received: number, pathToError: string) => {
    if (expected > received)
      throwException(expected, received, pathToError, 'The received value is less than expected');
  };
