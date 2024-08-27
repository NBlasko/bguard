import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const oneOfValuesErrorMessage = 'The received value is not equal to expected';
const oneOfValuesErrorKey = 'm:oneOfValues';

/**
 * @description Creates a custom assertion that checks if a value is equal to the one of expected values.
 * @notice It has already been implemented in the number, bigint and string schema. There is no need to use it as a custom assert.
 * @param {unknown} expected The value that the received value is expected to match.
 * @returns {RequiredValidation} A validation function that takes a received value and an exception context.
 * @throws {ValidationError} If the received value does not match at least one of the expected values.
 * @example
 * const schema = number().custom(oneOfValues([5, 4])); // Define a schema with a custom assertion
 * parseOrFail(schema, 5); // Valid
 * parseOrFail(schema, 4); // Valid
 * parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
 *
 * @translation Error Translation Key = 'm:oneOfValues'
 */
export const oneOfValues =
  (expected: unknown[]): RequiredValidation =>
  (received: unknown, ctx: ExceptionContext) => {
    if (!expected.includes(received)) guardException(expected, received, ctx, oneOfValuesErrorKey);
  };

oneOfValues.key = oneOfValuesErrorKey;
oneOfValues.message = oneOfValuesErrorMessage;
setToDefaultLocale(oneOfValues);
