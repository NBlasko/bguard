import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const isNumericErrorMessage = 'The received value is not a numeric string';
const isNumericErrorKey = 's:isNumeric';

// An optional sign, then digits with an optional fraction, or a fraction alone. No exponent, no
// whitespace, no thousands separators: `Number` reads all of those, and `Number('')` is 0.
const numericPattern = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * @description Asserts that a string is a plain decimal number: an optional `+` or `-`, ASCII digits and
 * an optional fraction after a `.`. Exponents (`1e5`), whitespace, thousands separators, `Infinity` and
 * the empty string are rejected. For digits only, use `regExp(/^\d+$/)`.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a plain decimal number.
 * @example
 * const schema = string().custom(isNumeric());
 * parseOrFail(schema, '-12.5'); // Valid
 * parseOrFail(schema, '1e5');   // Throws an error: 'The received value is not a numeric string'
 * parseOrFail(schema, '1,000'); // Throws an error: 'The received value is not a numeric string'
 *
 * @translation Error Translation Key = 's:isNumeric'
 */
export const isNumeric = (): RequiredValidation<string> =>
  _constrain({ pattern: numericPattern.source }, (received: string, ctx: ExceptionContext) => {
    if (!numericPattern.test(received)) ctx.addIssue('numeric string', received, isNumericErrorKey);
  });

isNumeric.key = isNumericErrorKey;
isNumeric.message = isNumericErrorMessage;
setToDefaultLocale(isNumeric);
