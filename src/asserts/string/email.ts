import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

// A deliberately loose shape, but not one that takes whitespace or line breaks (`[^@]` matched both, so
// `a b@c.d` and `a\n@b.c` passed), an empty domain label (`a@b..c`) or a dot at either end of the local
// part. Anything stricter, such as RFC 5321's ASCII-only character set, would reject addresses people use.
const emailRegExp = /^(?!\.)(?!.*\.\.)[^\s@]+(?<!\.)@[^\s@.]+(?:\.[^\s@.]+)+$/;
const emailErrorMessage = 'The received value does not match the required email pattern';
const emailErrorKey = 's:email';

/**
 * @description Asserts that a string value matches the email pattern. The pattern checks for a basic email format:
 * no whitespace, exactly one `@`, a domain with at least one dot, and no empty or dot-edged parts.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not match the email pattern.
 * @example
 * const schema = string().custom(email());
 * parseOrFail(schema, 'example@example.com'); // Valid
 * parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
 *
 * @translation - Error Translation Key = 's:email'
 */
export const email = (): RequiredValidation<string> =>
  _constrain({ format: 'email' }, (received: string, ctx: ExceptionContext) => {
    if (!emailRegExp.test(received)) ctx.addIssue(emailRegExp, received, emailErrorKey);
  });

email.key = emailErrorKey;
email.message = emailErrorMessage;
setToDefaultLocale(email);
