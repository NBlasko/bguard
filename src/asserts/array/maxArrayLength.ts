import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const maxArrayLengthErrorMessage = 'The received value length is greater than expected';
const maxArrayLengthErrorKey = 'a:maxArrayLength';

/**
 * @description Asserts that the length of an array is not greater than a specified maximum length.
 * @param {number} expected The maximum allowed length for the array.
 * @returns {RequiredValidation} A validation function that takes a received array and an exception context.
 * @throws {ValidationError} if the length of the received value is greater than the expected length.
 * @example
 * const schema = array(string()).custom(maxArrayLength(3));
 * parseOrFail(schema, ['adequate', 'array']);   // Valid
 * parseOrFail(schema, ['adequate', 'array', 'length']);   // Valid
 * parseOrFail(schema, ['adequate', 'array', 'length', 'test']); // Throws an error: 'The received value length is greater than expected'
 *
 * @translation Error Translation Key = 'a:maxArrayLength'
 */
export const maxArrayLength =
  (expected: number): RequiredValidation =>
  (received: unknown[], ctx: ExceptionContext) => {
    if (received.length > expected) guardException(expected, received, ctx, maxArrayLengthErrorMessage);
  };

maxArrayLength.key = maxArrayLengthErrorKey;
maxArrayLength.message = maxArrayLengthErrorMessage;
setToDefaultLocale(maxArrayLength);
