import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { guardException } from '../../exceptions';
import { setToDefaultLocale } from '../../translationMap';

const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;
const emailErrorMessage = 'The received value does not match the required email pattern';
const emailErrorKey = 's:email';

/**
 * @description Asserts that a string value matches the email pattern. The pattern checks for a basic email format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not match the email pattern.
 * @example
 * const schema = string().custom(email());
 * parseOrFail(schema, 'example@example.com'); // Valid
 * parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
 *
 * @translation - Error Translation Key = 's:email'
 */
export const email = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!emailRegExp.test(received)) guardException(emailRegExp, received, ctx, emailErrorMessage);
};

email.key = emailErrorKey;
email.message = emailErrorMessage;
setToDefaultLocale(email);
