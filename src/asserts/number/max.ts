import { setToDefaultLocale } from '../../errorMap';
import { throwException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const maxErrorMessage = 'The received value is greater than expected';
const maxErrorKey = 'n:max';

/**
 * Asserts that a number value does not exceed a specified maximum value.
 *
 * @param {number} expected - The maximum allowable value.
 * @returns {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value exceeds the expected maximum value.
 *
 * @example
 * const schema = number().custom(max(100));
 * parseOrFail(schema, 99);  // Valid
 * parseOrFail(schema, 100); // Valid
 * parseOrFail(schema, 101); // Throws an error: 'The received value is greater than expected'
 * 
 * @see - Error Translation Key = 'n:max'
 */
export const max =
  (expected: number): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected < received) throwException(expected, received, ctx, maxErrorKey);
  };

setToDefaultLocale(maxErrorKey, maxErrorMessage);
