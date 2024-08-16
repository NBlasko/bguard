import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const minExcludedErrorMessage = 'The received value is less than or equal to expected';
const minExcludedErrorKey = 'n:minExcluded';

/**
 * @description - Asserts that a number value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).
 *
 * @param {number} expected - The minimum allowable value, which is excluded.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than or equal to the expected minimum value.
 *
 * @example
 * const schema = number().custom(minExcluded(10));
 * parseOrFail(schema, 11);  // Valid
 * parseOrFail(schema, 10); // Throws an error: 'The received value is less than or equal to expected'
 * parseOrFail(schema, 9);  // Throws an error: 'The received value is less than or equal to expected'
 *
 * @translation - Error Translation Key = 'n:minExcluded'
 */
export const minExcluded =
  (expected: number): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected >= received) guardException(expected, received, ctx, minExcludedErrorKey);
  };

minExcluded.key = minExcludedErrorKey;
minExcluded.message = minExcludedErrorMessage;
setToDefaultLocale(minExcludedErrorKey, minExcludedErrorMessage);
