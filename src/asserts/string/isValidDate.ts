import { _isCalendarDay } from '../../helpers/calendar';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';
import type { ExceptionContext, RequiredValidation } from '../../core';

const dateErrorMessage = 'The received value is not a valid date';
const dateErrorKey = 's:isValidDate';

// RFC 3339 full-date: any four-digit year. The regex bounds the month; whether the day exists in that
// month is a calendar question it cannot answer, so `_isCalendarDay` does.
const dateRegexPattern = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Whether the string is an RFC 3339 full-date naming a day that exists.
function isValidDateString(received: string): boolean {
  const match = dateRegexPattern.exec(received);
  return match !== null && _isCalendarDay(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * @description Asserts that a string is a valid date in the format YYYY-MM-DD (RFC 3339 `full-date`).
 * Any four-digit year is accepted, and the day has to exist: `2021-02-29` and `2020-04-31` are rejected.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a valid date.
 * @example
 * const schema = string().custom(isValidDate());
 * parseOrFail(schema, "2020-01-01"); // Valid
 * parseOrFail(schema, "2020-1-1");   // Throws an error: 'The received value is not a valid date'
 * parseOrFail(schema, "2020-01-32"); // Throws an error: 'The received value is not a valid date'
 * parseOrFail(schema, "2021-02-29"); // Throws an error: 2021 is not a leap year
 *
 * @translation Error Translation Key = 's:isValidDate'
 */
export const isValidDate = (): RequiredValidation<string> => {
  return _constrain({ format: 'date' }, (received: string, ctx: ExceptionContext) => {
    if (!isValidDateString(received)) {
      ctx.addIssue('valid date', received, dateErrorKey);
    }
  });
};

isValidDate.key = dateErrorKey;
isValidDate.message = dateErrorMessage;
setToDefaultLocale(isValidDate);
