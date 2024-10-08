import { setToDefaultLocale } from '../../translationMap';
import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';

const maxErrorMessage = 'The received value is greater than expected';
const maxErrorKey = 'n:max';

/**
 * @description Asserts that a number value does not exceed a specified maximum value.
 * @param {number} expected The maximum allowable value.
 * @returns {RequiredValidation} A validation function that takes a received number and an exception context.
 * @throws {ValidationError} if the received value exceeds the expected maximum value.
 * @example
 * const schema = number().custom(max(100));
 * parseOrFail(schema, 99);  // Valid
 * parseOrFail(schema, 100); // Valid
 * parseOrFail(schema, 101); // Throws an error: 'The received value is greater than expected'
 *
 * @translation Error Translation Key = 'n:max'
 */
export const max =
  (expected: number): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected < received) ctx.addIssue(expected, received, maxErrorKey);
  };

max.key = maxErrorKey;
max.message = maxErrorMessage;
setToDefaultLocale(max);
