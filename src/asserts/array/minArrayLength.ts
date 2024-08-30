import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const minArrayLengthErrorMessage = 'The received value length is less than expected';
const minArrayLengthErrorKey = 'a:minArrayLength';

/**
 * @description Asserts that the length of na array is not less than a specified minimum length.
 * @param {number} expected The minimum required length for the array.
 * @returns {RequiredValidation} A validation function that takes a received array and an exception context.
 * @throws {ValidationError} if the length of the received value is less than the expected length.
 * @example
 * const schema = array(string()).custom(minArrayLength(3));
 * parseOrFail(schema, ['short', 'array']);    // Throws an error: 'The received value length is less than expected'
 * parseOrFail(schema, ['adequate', 'array', 'length']); // Valid
 * parseOrFail(schema, ['adequate', 'array', 'length', 'test']); // Valid
 *
 * @translation Error Translation Key = 'a:minArrayLength'
 */
export const minArrayLength =
  (expected: number): RequiredValidation =>
  (received: unknown[], ctx: ExceptionContext) => {
    if (received.length < expected) guardException(expected, received, ctx, minArrayLengthErrorMessage);
  };

minArrayLength.key = minArrayLengthErrorKey;
minArrayLength.message = minArrayLengthErrorMessage;
setToDefaultLocale(minArrayLength);
