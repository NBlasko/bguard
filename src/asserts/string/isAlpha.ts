import type { ExceptionContext, RequiredValidation } from '../../core';
import { setToDefaultLocale } from '../../translationMap';

const isAlphaErrorMessage = 'The received value must contain only letters';
const isAlphaErrorKey = 's:isAlpha';

// Letters in any script, each followed by any combining marks: the marks are what make `é` written as
// `e` + U+0301 count as a letter. A zero-width non-joiner or joiner (U+200C, U+200D) may sit between
// letters, where Persian and several Indic scripts need it inside ordinary words (`می‌خواهم`). The
// string starts with a letter, so bare marks or a leading joiner do not pass. Every alternative starts
// with a different kind of character, so the match cannot backtrack.
const alphaPattern = /^\p{L}\p{M}*(?:\p{L}\p{M}*|[\u200C\u200D](?=\p{L}))*$/u;

/**
 * @description Asserts that a string is made of letters only, in any script: `Đorđe`, `Ђорђе` and
 * `Zoë` pass, while digits, spaces, hyphens and punctuation do not. Combining accents after a letter and
 * the zero-width joiners some scripts use between letters are allowed. The empty string is rejected.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string contains anything other than letters.
 * @example
 * const schema = string().custom(isAlpha());
 * parseOrFail(schema, 'Đorđe');    // Valid
 * parseOrFail(schema, 'Ana Marija'); // Throws an error: 'The received value must contain only letters'
 * parseOrFail(schema, 'R2D2');     // Throws an error: 'The received value must contain only letters'
 *
 * @translation Error Translation Key = 's:isAlpha'
 */
export const isAlpha =
  (): RequiredValidation<string> =>
  // No JSON Schema `pattern`: this one needs Unicode property escapes (`\p{L}`), which only validators
  // that compile patterns in Unicode mode understand. Python's `jsonschema`, for one, fails to compile
  // the whole document. Leaving it out lets the document accept more instead of not working at all.
  (received: string, ctx: ExceptionContext) => {
    if (!alphaPattern.test(received)) ctx.addIssue('letters only', received, isAlphaErrorKey);
  };

isAlpha.key = isAlphaErrorKey;
isAlpha.message = isAlphaErrorMessage;
setToDefaultLocale(isAlpha);
