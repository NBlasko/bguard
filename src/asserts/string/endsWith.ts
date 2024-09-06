import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const endsWithErrorMessage = 'The received value does not end with the required substring';
const endsWithErrorKey = 's:endsWith';

/**
 * @description Asserts that a string value ends with a specified substring.
 * @param {string} substring The substring that the string value must end with.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not end with the required substring.
 * @example
 * const schema = string().custom(endsWith('bar'));
 * parseOrFail(schema, 'foobar'); // Valid
 * parseOrFail(schema, 'foofoo'); // Throws an error: 'The received value does not end with the required substring'
 *
 * @translation Error Translation Key = 's:endsWith'
 */
export const endsWith =
  (substring: string): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (!received.endsWith(substring)) {
      ctx.addIssue(`ends with '${substring}'`, received, endsWithErrorKey);
    }
  };

endsWith.key = endsWithErrorKey;
endsWith.message = endsWithErrorMessage;
setToDefaultLocale(endsWith);
