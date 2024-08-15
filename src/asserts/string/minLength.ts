import { throwException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that the length of a string value is not less than a specified minimum length.
 *
 * @param {number} expected - The minimum required length for the string.
 * @returns {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the length of the received value is less than the expected length.
 *
 * @example
 * const schema = string().custom(minLength(5));
 * parseOrFail(schema, 'short');   // Throws an error: 'The received value length is less than expected'
 * parseOrFail(schema, 'adequate'); // Valid
 */
export const minLength =
  (expected: number): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (received.length < expected)
      throwException(expected, received, ctx, 'The received value length is less than expected');
  };
