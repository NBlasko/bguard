import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that the length of a string value is not greater than a specified maximum length.
 *
 * @param {number} expected - The maximum allowed length for the string.
 * @returns {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the length of the received value is greater than the expected length.
 *
 * @example
 * const schema = string().custom(maxLength(10));
 * parseOrFail(schema, 'short');   // Valid
 * parseOrFail(schema, 'this is a very long string'); // Throws an error: 'The received value length is greater than expected'
 */
export const maxLength =
  (expected: number): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (received.length > expected)
      guardException(expected, received, ctx, 'The received value length is greater than expected');
  };
