import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;

/**
 * Asserts that a string value matches the email pattern.
 * The pattern is defined as /^[^@]+@[^@]+\.[^@]+$/, which checks for a basic email format.
 *
 * @returns {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the received value does not match the email pattern.
 *
 * @example
 * const schema = string().custom(email());
 * parseOrFail(schema, 'example@example.com'); // Valid
 * parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
 */
export const email = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!emailRegExp.test(received))
    guardException(emailRegExp, received, ctx, 'The received value does not match the required email pattern');
};
