import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';

const timeErrorMessage = 'The received value is not a valid time';
const timeErrorKey = 's:isValidTime';

interface IsValidTimeOptions {
  precision?: number;
}

/**
 * @description Asserts that a string is a valid time in the format HH:mm:ss, with optional fractional seconds.
 * @param {IsValidTimeOptions} options Optional settings to configure the validation.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a valid time.
 * @example
 * const schema = string().custom(isValidTime());
 * parseOrFail(schema, "00:00:00"); // Valid
 * parseOrFail(schema, "23:59:59.9999999"); // Valid
 * parseOrFail(schema, "00:00:00.256Z");   // Throws an error: 'The received value is not a valid time'
 *
 * const schemaWithPrecision = string().custom(isValidTime({ precision: 3 }));
 * parseOrFail(schemaWithPrecision, "00:00:00.256"); // Valid
 * parseOrFail(schemaWithPrecision, "00:00:00");    // Throws an error: 'The received value is not a valid time'
 *
 * @translation Error Translation Key = 's:isValidTime'
 */
export const isValidTime = (options: IsValidTimeOptions = {}): RequiredValidation => {
  return (received: string, ctx: ExceptionContext) => {
    const { precision } = options;

    // Base regex for HH:mm:ss format
    let timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?$/;

    // If precision is specified, enforce exact number of digits in fractional seconds
    if (precision !== undefined) {
      timeRegex = new RegExp(`^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)(\\.\\d{${precision}})?$`);
    }

    // Check if the string is a valid time
    if (!timeRegex.test(received)) {
      guardException(received, timeErrorMessage, ctx, timeErrorKey);
    }

    // Additional check for precision if it's specified and the time does not have fractional seconds
    if (precision !== undefined && !received.includes('.')) {
      guardException(received, timeErrorMessage, ctx, timeErrorKey);
    }
  };
};

isValidTime.key = timeErrorKey;
isValidTime.message = timeErrorMessage;
setToDefaultLocale(isValidTime);
