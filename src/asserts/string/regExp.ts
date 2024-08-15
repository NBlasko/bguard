import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Asserts that a string value matches a specified regular expression pattern.
 *
 * @param {RegExp} expected - The regular expression pattern that the string value should match.
 * @returns {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the received value does not match the expected pattern.
 *
 * @example
 * const schema = string().custom(regExp(/^[A-Za-z0-9]+$/)); // Validates against alphanumeric pattern
 * parseOrFail(schema, 'valid123'); // Valid
 * parseOrFail(schema, 'invalid!@#'); // Throws an error: 'The received value does not match the required text pattern'
 */
export const regExp =
  (expected: RegExp): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (!expected.test(received))
      guardException(expected, received, ctx, 'The received value does not match the required text pattern');
  };
