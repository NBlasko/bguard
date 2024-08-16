import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const maxExcludedErrorMessage = 'The received value is greater than or equal to expected';
const maxExcludedErrorKey = 'n:maxExcluded';

/**
 * @description - Asserts that a number value is strictly less than a specified maximum value (i.e., the maximum value is excluded).
 *
 * @param {number} expected - The maximum allowable value, which is excluded.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is greater than or equal to the expected maximum value.
 *
 * @example
 * const schema = number().custom(maxExcluded(100));
 * parseOrFail(schema, 99);  // Valid
 * parseOrFail(schema, 100); // Throws an error: 'The received value is greater than or equal to expected'
 * parseOrFail(schema, 101); // Throws an error: 'The received value is greater than or equal to expected'
 *
 * @translation - Error Translation Key = 'n:maxExcluded'
 */
export const maxExcluded =
  (expected: number): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected <= received) guardException(expected, received, ctx, maxExcludedErrorKey);
  };

maxExcluded.key = maxExcludedErrorKey;
maxExcluded.message = maxExcludedErrorMessage;
setToDefaultLocale(maxExcludedErrorKey, maxExcludedErrorMessage);
