import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { guardException } from '../../exceptions';
import { setToDefaultLocale } from '../../translationMap';

const atLeastOneUpperCharErrorMessage = 'The received value does not contain at least one uppercase character';
const atLeastOneUpperCharErrorKey = 's:atLeastOneUpperChar';

/**
 * @description Asserts that a string value contains at least one uppercase character.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not contain at least one uppercase character.
 * @example
 * const schema = string().custom(atLeastOneUpperChar());
 * parseOrFail(schema, 'abcDEF'); // Valid
 * parseOrFail(schema, 'abcdef'); // Throws an error: 'The received value does not contain at least one uppercase character'
 *
 * @translation Error Translation Key = 's:atLeastOneUpperChar'
 */
export const atLeastOneUpperChar = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  const upperCharRegExp = /[A-Z]/;
  if (!upperCharRegExp.test(received))
    guardException('at least one uppercase character', received, ctx, atLeastOneUpperCharErrorKey);
};

atLeastOneUpperChar.key = atLeastOneUpperCharErrorKey;
atLeastOneUpperChar.message = atLeastOneUpperCharErrorMessage;
setToDefaultLocale(atLeastOneUpperChar);
