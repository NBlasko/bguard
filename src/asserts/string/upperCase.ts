import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const upperCaseErrorMessage = 'The received value is not in uppercase';
const upperCaseErrorKey = 's:upperCase';

/**
 * @description Asserts that a string value is entirely in uppercase.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not in uppercase.
 * @example
 * const schema = string().custom(upperCase());
 * parseOrFail(schema, 'VALID');    // Valid
 * parseOrFail(schema, 'INVALID');  // Throws an error: 'The received value is not in uppercase'
 * parseOrFail(schema, 'Valid');    // Throws an error: 'The received value is not in uppercase'
 *
 * @translation Error Translation Key = 's:upperCase'
 */
export const upperCase = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (received !== received.toUpperCase()) {
    ctx.addIssue('upper case', received, upperCaseErrorKey);
  }
};

upperCase.key = upperCaseErrorKey;
upperCase.message = upperCaseErrorMessage;
setToDefaultLocale(upperCase);
