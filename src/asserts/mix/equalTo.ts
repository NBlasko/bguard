import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const equalToErrorMessage = 'The received value is not equal to expected';
const equalToErrorKey = 'm:equalTo';

/**
 * @description Creates a custom assertion that checks if a value is equal to the expected value.
 * @notice It has already been implemented in the number, bigint and string schema. There is no need to use it as a custom assert.
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
    if (expected !== received) ctx.addIssue(expected, received, equalToErrorKey);
  };

equalTo.key = equalToErrorKey;
equalTo.message = equalToErrorMessage;
setToDefaultLocale(equalTo);
