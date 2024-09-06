import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const atLeastOneSpecialCharErrorMessage = 'The received value does not contain at least one special character';
const atLeastOneSpecialCharErrorKey = 's:atLeastOneSpecialChar';

/**
 * @description Asserts that a string value contains at least one special character.
 * @param {string} [allowedSpecialChars=*] The string containing allowed special characters. Defaults to '*@$!#%&()^~{}'.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not contain at least one of the allowed special characters.
 * @example
 * const schema = string().custom(atLeastOneSpecialChar()); // Default special characters
 * parseOrFail(schema, 'abc!def'); // Valid
 * parseOrFail(schema, 'abcdef');  // Throws an error: 'The received value does not contain at least one special character'
 *
 * const customSchema = string().custom(atLeastOneSpecialChar('@$')); // Custom special characters
 * parseOrFail(customSchema, 'abc@def'); // Valid
 * parseOrFail(customSchema, 'abcdef');  // Throws an error: 'The received value does not contain at least one special character'
 *
 * @translation Error Translation Key = 's:atLeastOneSpecialChar'
 */
export const atLeastOneSpecialChar = (allowedSpecialChars?: string): RequiredValidation => {
  const specialCharRegExp = new RegExp(
    `[${(allowedSpecialChars ?? '*@$!#%&()^~{}').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]`,
  );
  return (received: string, ctx: ExceptionContext) => {
    if (!specialCharRegExp.test(received)) ctx.addIssue('special character', received, atLeastOneSpecialCharErrorKey);
  };
};

atLeastOneSpecialChar.key = atLeastOneSpecialCharErrorKey;
atLeastOneSpecialChar.message = atLeastOneSpecialCharErrorMessage;
setToDefaultLocale(atLeastOneSpecialChar);
