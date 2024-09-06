import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const atLeastOneLowerCharErrorMessage = 'The received value does not contain at least one lowercase character';
const atLeastOneLowerCharErrorKey = 's:atLeastOneLowerChar';

/**
 * @description Asserts that a string value contains at least one lowercase character.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not contain at least one lowercase character.
 * @example
 * const schema = string().custom(atLeastOneLowerChar());
 * parseOrFail(schema, 'abcDEF'); // Valid
 * parseOrFail(schema, 'ABCDEF'); // Throws an error: 'The received value does not contain at least one lowercase character'
 *
 * @translation Error Translation Key = 's:atLeastOneLowerChar'
 */
export const atLeastOneLowerChar = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  const lowerCharRegExp = /[a-z]/;
  if (!lowerCharRegExp.test(received))
    ctx.addIssue('at least one lowercase character', received, atLeastOneLowerCharErrorKey);
};

atLeastOneLowerChar.key = atLeastOneLowerCharErrorKey;
atLeastOneLowerChar.message = atLeastOneLowerCharErrorMessage;
setToDefaultLocale(atLeastOneLowerChar);
