import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const isAlphaErrorMessage = 'The received value must contain only letters';
const isAlphaErrorKey = 's:isAlpha';

// A letter in any script, followed by letters or combining marks. The marks are what make `é` written as
// `e` + U+0301 count as a letter, and the first character has to be a letter so a string of bare marks
// does not.
const alphaPattern = /^\p{L}[\p{L}\p{M}]*$/u;

/**
 * @description Asserts that a string is made of letters only, in any script: `Đorđe`, `Ђорђе` and
 * `Zoë` pass, while digits, spaces, hyphens and punctuation do not. The empty string is rejected.
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
export const isAlpha = (): RequiredValidation<string> =>
  _constrain({ pattern: alphaPattern.source }, (received: string, ctx: ExceptionContext) => {
    if (!alphaPattern.test(received)) ctx.addIssue('letters only', received, isAlphaErrorKey);
  });

isAlpha.key = isAlphaErrorKey;
isAlpha.message = isAlphaErrorMessage;
setToDefaultLocale(isAlpha);
