import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const minErrorMessage = 'The received value is less than expected';
const minErrorKey = 'n:min';

/**
 * @description - Asserts that a number value is not less than a specified minimum value.
 *
 * @param {number} expected - The minimum allowable value.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than the expected minimum value.
 *
 * @example
 * const schema = number().custom(min(10));
 * parseOrFail(schema, 11);  // Valid
 * parseOrFail(schema, 10);  // Valid
 * parseOrFail(schema, 9);   // Throws an error: 'The received value is less than expected'
 *
 * @translation - Error Translation Key = 'n:min'
 */
export const min =
  (expected: number): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected > received) guardException(expected, received, ctx, minErrorKey);
  };

min.key = minErrorKey;
min.message = minErrorMessage;
setToDefaultLocale(minErrorKey, minErrorMessage);
