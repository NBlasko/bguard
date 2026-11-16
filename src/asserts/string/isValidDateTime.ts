import { _fractionPattern, _isCalendarDay } from '../../helpers/calendar';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';
import type { ExceptionContext, RequiredValidation } from '../../core';

// Default error messages and keys
const dateTimeErrorMessage = 'The received value is not a valid ISO 8601 datetime string';
const dateTimeErrorKey = 's:isValidDateTime';

type DateTimeOptions = {
  offset?: boolean;
  precision?: number;
};

const defaultOptions: DateTimeOptions = {
  offset: false,
  precision: undefined,
};

// Hours 00–23, minutes and seconds 00–59. Each part used to be any two digits, which accepted
// `9999-99-99T99:99:99Z`. A leap second (`23:59:60`) is rejected: RFC 3339 allows one, but a JavaScript
// Date cannot represent it.
const datePart = '(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])';
const timePart = '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d';
// `+HH:MM`, and the `+HHMM` and `+HH` forms this assertion has always taken, all range-checked.
const offsetPart = '[+-](?:[01]\\d|2[0-3])(?::?[0-5]\\d)?';

/**
 * @description Asserts that a string value is a valid ISO 8601 datetime string.
 * @param {DateTimeOptions} options Options to control the validation:
 * - `offset`: If `true`, allows timezone offsets in the datetime string.
 * - `precision`: Specify the exact number of fractional second digits allowed (e.g., 3 for milliseconds).
 *   `0` forbids a fraction. Anything but a non-negative integer throws a `BuildSchemaError`.
 *
 * Every part is range-checked and the day has to exist, so `2021-02-29T00:00:00Z` and
 * `2020-01-01T24:00:00Z` are rejected. Leap seconds are rejected too, since a Date cannot hold one.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid datetime string according to the options.
 * @example
 * const schema = string().custom(isValidDateTime());
 * parseOrFail(schema, "2024-01-01T00:00:00Z"); // Valid
 * parseOrFail(schema, "2024-01-01T00:00:00.123Z"); // Valid
 * parseOrFail(schema, "2024-01-01T00:00:00+03:00"); // Invalid (no offsets allowed)
 *
 * const schemaWithOffset = string().custom(isValidDateTime({ offset: true }));
 * parseOrFail(schemaWithOffset, "2024-01-01T00:00:00+04:00"); // Valid
 *
 * const schemaWithPrecision = string().custom(isValidDateTime({ precision: 3 }));
 * parseOrFail(schemaWithPrecision, "2024-01-01T00:00:00.123Z"); // Valid
 * parseOrFail(schemaWithPrecision, "2024-01-01T00:00:00.123456Z"); // Invalid
 *
 * @translation Error Translation Key = 's:isValidDateTime'
 */
export const isValidDateTime = (options: DateTimeOptions = defaultOptions): RequiredValidation<string> => {
  const { offset, precision } = options;
  const dateTimeRegex = new RegExp(
    `^${datePart}T${timePart}${_fractionPattern(precision)}(?:Z${offset ? `|${offsetPart}` : ''})$`,
  );

  return _constrain({ format: 'date-time' }, (received: string, ctx: ExceptionContext) => {
    const match = dateTimeRegex.exec(received);
    if (match === null || !_isCalendarDay(Number(match[1]), Number(match[2]), Number(match[3]))) {
      ctx.addIssue('valid date time', received, dateTimeErrorKey);
    }
  });
};

isValidDateTime.key = dateTimeErrorKey;
isValidDateTime.message = dateTimeErrorMessage;
setToDefaultLocale(isValidDateTime);
