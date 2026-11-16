import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const isAlphaNumericErrorMessage = 'The received value must contain only letters and digits';
const isAlphaNumericErrorKey = 's:isAlphaNumeric';

// Letters in any script and decimal digits, with combining marks after them. `\p{Nd}` rather than `\p{N}`:
// the latter also takes fractions and Roman numerals such as `½` and `Ⅻ`.
const alphaNumericPattern = /^[\p{L}\p{Nd}][\p{L}\p{M}\p{Nd}]*$/u;

/**
 * @description Asserts that a string is made of letters and digits only. Letters may be in any script,
 * as in `isAlpha`; spaces, hyphens, underscores and punctuation are rejected, and so is the empty string.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string contains anything other than letters and digits.
 * @example
 * const schema = string().custom(isAlphaNumeric());
 * parseOrFail(schema, 'Šifra2024'); // Valid
 * parseOrFail(schema, 'user_name'); // Throws an error: 'The received value must contain only letters and digits'
 *
 * @translation Error Translation Key = 's:isAlphaNumeric'
 */
export const isAlphaNumeric = (): RequiredValidation<string> =>
  _constrain({ pattern: alphaNumericPattern.source }, (received: string, ctx: ExceptionContext) => {
    if (!alphaNumericPattern.test(received)) ctx.addIssue('letters and digits only', received, isAlphaNumericErrorKey);
  });

isAlphaNumeric.key = isAlphaNumericErrorKey;
isAlphaNumeric.message = isAlphaNumericErrorMessage;
setToDefaultLocale(isAlphaNumeric);
