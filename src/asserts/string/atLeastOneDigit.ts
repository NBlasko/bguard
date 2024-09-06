import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const digitRegExp = /\d/;
const atLeastOneDigitErrorMessage = 'The received value does not contain at least one digit';
const atLeastOneDigitErrorKey = 's:atLeastOneDigit';

/**
 * @description Asserts that a string value contains at least one digit.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not contain at least one digit.
 * @example
 * const schema = string().custom(atLeastOneDigit());
 * parseOrFail(schema, 'abc123'); // Valid
 * parseOrFail(schema, 'abcdef'); // Throws an error: 'The received value does not contain at least one digit'
 *
 * @translation Error Translation Key = 's:atLeastOneDigit'
 */
export const atLeastOneDigit = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!digitRegExp.test(received)) ctx.addIssue('at least one digit', received, atLeastOneDigitErrorKey);
};

atLeastOneDigit.key = atLeastOneDigitErrorKey;
atLeastOneDigit.message = atLeastOneDigitErrorMessage;
setToDefaultLocale(atLeastOneDigit);
