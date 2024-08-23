import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { guardException } from '../../exceptions';
import { setToDefaultLocale } from '../../translationMap';

const lowerCaseErrorMessage = 'The received value is not in lowercase';
const lowerCaseErrorKey = 's:lowerCase';

/**
 * @description Asserts that a string value is in lowercase.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not in lowercase.
 * @example
 * const schema = string().custom(lowerCase());
 * parseOrFail(schema, 'valid');   // Valid
 * parseOrFail(schema, 'Invalid'); // Throws an error: 'The received value is not in lowercase'
 *
 * @translation Error Translation Key = 's:lowerCase'
 */
export const lowerCase = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (received !== received.toLowerCase()) guardException('lower case', received, ctx, lowerCaseErrorKey);
};

lowerCase.key = lowerCaseErrorKey;
lowerCase.message = lowerCaseErrorMessage;
setToDefaultLocale(lowerCase);
