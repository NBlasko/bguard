import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const validUrlErrorMessage = 'The received value is not a valid URL';
const validUrlErrorKey = 's:validUrl';

// Every part follows RFC 3986, so a value accepted here also passes JSON Schema's `format: 'uri'`.
//
// A hostname is dot-separated labels of letters, digits and inner hyphens, optionally ending in a dot, or
// an IPv6 address in brackets. The port is range-checked in code.
//
// The path, query and fragment take only the characters RFC 3986 allows, and `%` only as a `%XX` escape.
// They used to take anything but whitespace, including non-ASCII text, `<`, `>`, `{`, `}`, `|`, `\`, `^`
// and `"`, which `format: 'uri'` rejects (#23).
//
// Userinfo (`http://user@host`) is rejected on purpose: `http://bank.com@evil.com` goes to evil.com.
const label = '[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?';
const hostname = `${label}(?:\\.${label})*\\.?`;

// IPv6address from RFC 3986 §3.2.2, built from its grammar rather than transcribed as one long regex.
const h16 = '[0-9a-fA-F]{1,4}';
const decOctet = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const ipv4 = `(?:${decOctet}\\.){3}${decOctet}`;
const ls32 = `(?:${h16}:${h16}|${ipv4})`;
// `[ *n( h16 ":" ) h16 ]` — at most n+1 groups before a `::`, or none.
const upTo = (n: number) => `(?:(?:${h16}:){0,${n}}${h16})?`;
const ipv6 = [
  `(?:${h16}:){6}${ls32}`,
  `::(?:${h16}:){5}${ls32}`,
  `${upTo(0)}::(?:${h16}:){4}${ls32}`,
  `${upTo(1)}::(?:${h16}:){3}${ls32}`,
  `${upTo(2)}::(?:${h16}:){2}${ls32}`,
  `${upTo(3)}::${h16}:${ls32}`,
  `${upTo(4)}::${ls32}`,
  `${upTo(5)}::${h16}`,
  `${upTo(6)}::`,
].join('|');

const host = `(?:${hostname}|\\[(?:${ipv6})\\])`;
const escaped = '%[0-9a-fA-F]{2}';
const pchar = `(?:[a-zA-Z0-9\\-._~!$&'()*+,;=:@]|${escaped})`;
const queryChar = `(?:[a-zA-Z0-9\\-._~!$&'()*+,;=:@/?]|${escaped})`;
const afterScheme = `:\\/\\/${host}(?::(\\d{1,5}))?(?:\\/${pchar}*)*(?:\\?${queryChar}*)?(?:#${queryChar}*)?$`;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @description Asserts that the string value is a valid URL with optional protocol validation.
 * The host is a hostname or a bracketed IPv6 address, and the path, query and fragment may only contain
 * characters RFC 3986 allows (non-ASCII text has to be percent-encoded). Userinfo such as
 * `http://user@host.test/` is rejected.
 * @param {string} [protocol] The protocol that the URL must start with (e.g., 'http'). If not provided, any URL starting with 'http://' or 'https://' is considered valid.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not match the expected URL pattern.
 * @example
 * const schema = string().custom(validUrl()); // Validates any URL starting with 'http://' or 'https://'
 * parseOrFail(schema, 'http://example.com'); // Valid
 * parseOrFail(schema, 'https://example.com'); // Valid
 * parseOrFail(schema, 'ftp://example.com');   // Throws an error
 * parseOrFail(schema, 'http:example.com');    // Throws an error
 * parseOrFail(schema, 'http://[::1]:8080/');  // Valid
 * parseOrFail(schema, 'http://example.com/ü'); // Throws an error: encode it as /%C3%BC
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
