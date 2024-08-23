import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const maxLengthErrorMessage = 'The received value length is greater than expected';
const maxLengthErrorKey = 's:maxLength';

/**
 * @description Asserts that the length of a string value is not greater than a specified maximum length.
 * @param {number} expected The maximum allowed length for the string.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the length of the received value is greater than the expected length.
 * @example
 * const schema = string().custom(maxLength(10));
 * parseOrFail(schema, 'short');   // Valid
 * parseOrFail(schema, 'this is a very long string'); // Throws an error: 'The received value length is greater than expected'
 *
 * @translation Error Translation Key = 's:maxLength'
 */
export const maxLength =
  (expected: number): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (received.length > expected) guardException(expected, received, ctx, maxLengthErrorMessage);
  };

maxLength.key = maxLengthErrorKey;
maxLength.message = maxLengthErrorMessage;
setToDefaultLocale(maxLength);
