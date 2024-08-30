import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';

const dateErrorMessage = 'The received value is not a valid date';
const dateErrorKey = 's:isValidDate';

/**
 * @description Asserts that a string is a valid date in the format YYYY-MM-DD.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a valid date.
 * @example
 * const schema = string().custom(isValidDate());
 * parseOrFail(schema, "2020-01-01"); // Valid
 * parseOrFail(schema, "2020-1-1");   // Throws an error: 'The received value is not a valid date'
 * parseOrFail(schema, "2020-01-32"); // Throws an error: 'The received value is not a valid date'
 *
 * @translation Error Translation Key = 's:isValidDate'
 */
export const isValidDate = (): RequiredValidation => {
  return (received: string, ctx: ExceptionContext) => {
    // Regex to match YYYY-MM-DD format
    const dateRegex = /^(19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (!dateRegex.test(received)) {
      guardException(received, dateErrorMessage, ctx, dateErrorKey);
    }
  };
};

isValidDate.key = dateErrorKey;
isValidDate.message = dateErrorMessage;
setToDefaultLocale(isValidDate);
