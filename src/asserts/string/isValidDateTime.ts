import { setToDefaultLocale } from '../../translationMap';
import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';

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

/**
 * @description Asserts that a string value is a valid ISO 8601 datetime string.
 * @param {DateTimeOptions} options Options to control the validation:
 * - `offset`: If `true`, allows timezone offsets in the datetime string.
 * - `precision`: Specify the exact number of fractional second digits allowed (e.g., 3 for milliseconds).
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
export const isValidDateTime = (options: DateTimeOptions = defaultOptions): RequiredValidation => {
  return (received: string, ctx: ExceptionContext) => {
    const { offset, precision } = options;

    const dateTimeRegex = new RegExp(
      `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}` +
        (precision !== undefined ? `(\\.\\d{${precision}})` : `(\\.\\d+)?`) +
        `(${offset ? `([+-]\\d{2}:\\d{2}|[+-]\\d{2}\\d{2}|[+-]\\d{2}|Z)` : 'Z'})$`,
    );

    if (!dateTimeRegex.test(received)) {
      ctx.addIssue(received, dateTimeErrorMessage, dateTimeErrorKey);
    }
  };
};

isValidDateTime.key = dateTimeErrorKey;
isValidDateTime.message = dateTimeErrorMessage;
setToDefaultLocale(isValidDateTime);
