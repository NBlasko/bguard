import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const validUrlErrorMessage = 'The received value is not a valid URL';
const validUrlErrorKey = 's:validUrl';

// A hostname is dot-separated labels of letters, digits and inner hyphens, optionally ending in a dot.
// It used to be any run of `[a-zA-Z0-9.-]`, which took `http://...` and `http://-`. The port is range
// checked in code, and the rest may start at `/`, `?` or `#` — `http://a.com?x=1` used to be rejected.
const label = '[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?';
const afterScheme = `:\\/\\/${label}(?:\\.${label})*\\.?(?::(\\d{1,5}))?(?:[/?#]\\S*)?$`;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 * @translation Error Translation Key = 's:validUrl'
 */
export const validUrl = (protocol?: string): RequiredValidation<string> => {
  // The protocol is escaped: it used to be spliced in raw, so `validUrl('a.b')` also accepted `axb://`.
  const regex = new RegExp(`^${protocol ? escapeRegExp(protocol) : 'https?'}${afterScheme}`);

  return _constrain({ format: 'uri' }, (received: string, ctx: ExceptionContext) => {
    const match = regex.exec(received);
    if (match === null || (match[1] !== undefined && Number(match[1]) > 65535)) {
      ctx.addIssue('Invalid URL', received, validUrlErrorKey);
    }
  });
};

validUrl.key = validUrlErrorKey;
validUrl.message = validUrlErrorMessage;
setToDefaultLocale(validUrl);
