import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const validUrlErrorMessage = 'The received value is not a valid URL';
const validUrlErrorKey = 's:validUrl';

const urlRegex = /^(http:\/\/|https:\/\/)([a-zA-Z0-9\-.]+)(:\d+)?(\/[^\s]*)?$/;

/**
 * @description Asserts that the string value is a valid URL with optional protocol validation.
 * @param {string} [protocol] The protocol that the URL must start with (e.g., 'http'). If not provided, any URL starting with 'http://' or 'https://' is considered valid.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not match the expected URL pattern.
 * @example
 * const schema = string().custom(validUrl()); // Validates any URL starting with 'http://' or 'https://'
 * parseOrFail(schema, 'http://example.com'); // Valid
 * parseOrFail(schema, 'https://example.com'); // Valid
 * parseOrFail(schema, 'ftp://example.com');   // Throws an error
 * parseOrFail(schema, 'http:example.com');    // Throws an error
 *
 * @translation Error Translation Key = 's:url'
 */
export const validUrl =
  (protocol?: string): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    let regex = urlRegex;
    if (protocol) {
      regex = new RegExp(`^${protocol}:\\/\\/([a-zA-Z0-9\\-\\.]+)(:[0-9]+)?(\\/[^\\s]*)?$`);
    }

    if (!regex.test(received)) {
      ctx.addIssue('Invalid URL', received, validUrlErrorKey);
    }
  };

validUrl.key = validUrlErrorKey;
validUrl.message = validUrlErrorMessage;
setToDefaultLocale(validUrl);
