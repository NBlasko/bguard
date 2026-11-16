import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

// The same pattern JSON Schema's `format: 'email'` is checked with (ajv-formats, full mode), so a value
// bguard accepts also passes the document `toJSONSchema` generates. ASCII only: the local part is RFC 5322
// atoms separated by single dots, and the domain is hostname labels. Before 0.12.0 this was a looser shape
// that took non-ASCII text and characters such as `(` or `<`, which `format: 'email'` rejects (#23).
const emailRegExp =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const emailErrorMessage = 'The received value does not match the required email pattern';
const emailErrorKey = 's:email';

/**
 * @description Asserts that a string value matches the email pattern, the same one JSON Schema's
 * `format: 'email'` uses. ASCII only: letters, digits and ``!#$%&'*+/=?^_`{|}~-`` in the local part,
 * separated by single dots, then `@` and a domain of at least two hostname labels. Non-ASCII addresses
 * such as `ünï@test.org` are rejected; use `regExp` for a different rule.
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
