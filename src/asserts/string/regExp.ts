import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { guardException } from '../../exceptions';
import { setToDefaultLocale } from '../../translationMap';

const regExpErrorMessage = 'The received value does not match the required text pattern';
const regExpErrorKey = 's:regExp';

/**
 * @description Asserts that a string value matches a specified regular expression pattern.
 * @param {RegExp} expected The regular expression pattern that the string value should match.
 * @returns {RequiredValidation} A validation function that takes a received string and a path to the error message.
 * @throws {ValidationError} if the received value does not match the expected pattern.
 * @example
 * const schema = string().custom(regExp(/^[A-Za-z0-9]+$/)); // Validates against alphanumeric pattern
 * parseOrFail(schema, 'valid123');   // Valid
 * parseOrFail(schema, 'invalid!@#'); // Throws an error: 'The received value does not match the required text pattern'
 *
 * @translation Error Translation Key = 's:regExp'
 */
export const regExp =
  (expected: RegExp): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (!expected.test(received)) guardException(expected, received, ctx, regExpErrorMessage);
  };

regExp.key = regExpErrorKey;
regExp.message = regExpErrorMessage;
setToDefaultLocale(regExp);
