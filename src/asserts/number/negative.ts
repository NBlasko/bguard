import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const negativeErrorMessage = 'The received value is not a negative number';
const negativeErrorKey = 'n:negative';

/**
 * @description - Asserts that a number value is negative (less than zero).
 *
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not negative.
 *
 * @example
 * const schema = number().custom(negative());
 * parseOrFail(schema, -10); // Valid
 * parseOrFail(schema, 0);  // Throws an error: 'The received value is not a negative number'
 * parseOrFail(schema, 5);  // Throws an error: 'The received value is not a negative number'
 *
 * @translation - Error Translation Key = 'n:negative'
 */
export const negative = (): RequiredValidation => (received: number, ctx: ExceptionContext) => {
  if (received >= 0) guardException('negative', received, ctx, negativeErrorKey);
};

negative.key = negativeErrorKey;
negative.message = negativeErrorMessage;
setToDefaultLocale(negativeErrorKey, negativeErrorMessage);
