import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const isPhoneNumberErrorMessage = 'The received value is not a phone number in international E.164 format';
const isPhoneNumberErrorKey = 's:isPhoneNumber';

// E.164: a `+`, then a country code that does not start with 0, and at most 15 digits in all.
const e164Pattern = /^\+[1-9]\d{1,14}$/;

/**
 * @description Asserts that a string is a phone number in the international E.164 format: a `+`, the
 * country code, and the subscriber number, with no spaces or punctuation and at most 15 digits
 * (`+381641234567`). This checks the format only, not that the number exists or fits its country's
 * numbering plan, which needs per-country metadata such as libphonenumber's. Strip spaces, dashes and
 * brackets before validating, for example with `transformBeforeValidation`.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not in E.164 format.
 * @example
 * const schema = string().custom(isPhoneNumber());
 * parseOrFail(schema, '+381641234567'); // Valid
 * parseOrFail(schema, '064 123 4567');  // Throws an error: no country code, and spaces
 * parseOrFail(schema, '+0641234567');   // Throws an error: a country code never starts with 0
 *
 * @translation Error Translation Key = 's:isPhoneNumber'
 */
export const isPhoneNumber = (): RequiredValidation<string> =>
  _constrain({ pattern: e164Pattern.source }, (received: string, ctx: ExceptionContext) => {
    if (!e164Pattern.test(received)) ctx.addIssue('E.164 phone number', received, isPhoneNumberErrorKey);
  });

isPhoneNumber.key = isPhoneNumberErrorKey;
isPhoneNumber.message = isPhoneNumberErrorMessage;
setToDefaultLocale(isPhoneNumber);
