import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const equalToErrorMessage = 'The received value is not equal to expected';
const equalToErrorKey = 'm:equalTo';

/**
 * @description Creates a custom assertion that checks if a value is equal to the expected value.
 * @param {unknown} expected The value that the received value is expected to match.
 * @returns {RequiredValidation} A validation function that takes a received value and an exception context.
 * @throws {ValidationError} If the received value does not match the expected value.
 * @example
 * const schema = number().custom(equalTo(5)); // Define a schema with a custom assertion
 * parseOrFail(schema, 5); // Valid
 * parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
 *
 * @translation Error Translation Key = 'm:equalTo'
 */
export const equalTo =
  (expected: unknown): RequiredValidation =>
  (received: unknown, ctx: ExceptionContext) => {
    if (expected !== received) guardException(expected, received, ctx, equalToErrorKey);
  };

equalTo.key = equalToErrorKey;
equalTo.message = equalToErrorMessage;
setToDefaultLocale(equalTo);
