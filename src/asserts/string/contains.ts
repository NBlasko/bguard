import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const containsErrorMessage = 'The received value does not contain the required substring';
const containsErrorKey = 's:contains';

/**
 * @description Asserts that a string value contains a specified substring.
 * @param {string} substring The substring that must be present in the string value.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not contain the required substring.
 * @example
 * const schema = string().custom(contains('foo'));
 * parseOrFail(schema, 'foobar'); // Valid
 * parseOrFail(schema, 'bar'); // Throws an error: 'The received value does not contain the required substring'
 *
 * @translation Error Translation Key = 's:contains'
 */
export const contains =
  (substring: string): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (!received.includes(substring)) {
      guardException(`contains '${substring}'`, received, ctx, containsErrorKey);
    }
  };

contains.key = containsErrorKey;
contains.message = containsErrorMessage;
setToDefaultLocale(contains);
