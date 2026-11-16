import { _fractionPattern } from '../../helpers/calendar';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';
import type { ExceptionContext, RequiredValidation } from '../../core';

const timeErrorMessage = 'The received value is not a valid time';
const timeErrorKey = 's:isValidTime';

interface IsValidTimeOptions {
  precision?: number;
}

/**
 * @description Asserts that a string is a valid time in the format HH:mm:ss, with optional fractional seconds.
 * @param {IsValidTimeOptions} options Optional settings to configure the validation.
 * - `precision`: the exact number of fractional second digits required. `0` forbids a fraction. Anything
 *   but a non-negative integer throws a `BuildSchemaError`.
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
export const isValidTime = (options: IsValidTimeOptions = {}): RequiredValidation<string> => {
  // HH:mm:ss with an optional fraction, or with exactly `precision` fractional digits when one is given.
  const timeRegex = new RegExp(`^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d${_fractionPattern(options.precision)}$`);

  // Emitted as a `pattern`, not `format: 'time'`. JSON Schema's `time` is RFC 3339 `full-time`, which
  // requires an offset — the one thing this assertion rejects — so the two accepted disjoint sets and the
  // generated document rejected every value bguard accepted.
  return _constrain({ pattern: timeRegex.source }, (received: string, ctx: ExceptionContext) => {
    if (!timeRegex.test(received)) {
      ctx.addIssue('valid time', received, timeErrorKey);
    }
  });
};

isValidTime.key = timeErrorKey;
isValidTime.message = timeErrorMessage;
setToDefaultLocale(isValidTime);
