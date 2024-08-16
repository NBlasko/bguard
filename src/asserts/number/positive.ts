import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const positiveErrorMessage = 'The received value is not a positive number';
const positiveErrorKey = 'n:positive';

/**
 * @description - Asserts that a number value is positive (greater than zero).
 *
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not positive.
 *
 * @example
 * const schema = number().custom(positive());
 * parseOrFail(schema, 10);  // Valid
 * parseOrFail(schema, 0);  // Throws an error: 'The received value is not a positive number'
 * parseOrFail(schema, -5); // Throws an error: 'The received value is not a positive number'
 *
 * @translation - Error Translation Key = 'n:positive'
 */
export const positive = (): RequiredValidation => (received: number, ctx: ExceptionContext) => {
  if (received <= 0) guardException('positive', received, ctx, positiveErrorMessage);
};

positive.key = positiveErrorKey;
positive.message = positiveErrorMessage;
setToDefaultLocale(positiveErrorKey, positiveErrorMessage);
