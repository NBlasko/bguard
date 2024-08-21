import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const startsWithErrorMessage = 'The received value does not start with the required substring';
const startsWithErrorKey = 's:startsWith';

/**
 * @description Asserts that a string value starts with a specified substring.
 * @param {string} substring The substring that the string value must start with.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not start with the required substring.
 * @example
 * const schema = string().custom(startsWith('foo'));
 * parseOrFail(schema, 'foobar'); // Valid
 * parseOrFail(schema, 'barfoo'); // Throws an error: 'The received value does not start with the required substring'
 *
 * @translation Error Translation Key = 's:startsWith'
 */
export const startsWith =
  (substring: string): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (!received.startsWith(substring)) {
      guardException(`starts with '${substring}'`, received, ctx, startsWithErrorKey);
    }
  };

startsWith.key = startsWithErrorKey;
startsWith.message = startsWithErrorMessage;
setToDefaultLocale(startsWith);
