import { setToDefaultLocale } from '../../errorMap';
import { throwException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const negativeErrorMessage = 'The received value is not a negative number';
const negativeErrorKey = 'n:negative';

/**
 * Asserts that a number value is negative (less than zero).
 *
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not negative.
 *
 * @example
 * const schema = number().custom(negative());
 * parseOrFail(schema, -10); // Valid
 * parseOrFail(schema, 0);  // Throws an error: 'The received value is not a negative number'
 * parseOrFail(schema, 5);  // Throws an error: 'The received value is not a negative number'
 *
 * @see - Error Translation Key = 'n:negative'
 */
export const negative = (): RequiredValidation => (received: number, ctx: ExceptionContext) => {
  if (received >= 0) throwException('negative', received, ctx, negativeErrorKey);
};

setToDefaultLocale(negativeErrorKey, negativeErrorMessage);
