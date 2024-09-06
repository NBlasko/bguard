import { setToDefaultLocale } from '../../translationMap';
import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';

const bigintMinExcludedErrorMessage = 'The received value is less than or equal to expected';
const bigintMinExcludedErrorKey = 'bi:minExcluded';

/**
 * @description Asserts that a bigint value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).
 * @param {bigint} expected The minimum allowable value, which is excluded.
 * @returns {RequiredValidation} A validation function that takes a received bigint and an exception context.
 * @throws {ValidationError} if the received value is less than or equal to the expected minimum value.
 * @example
 * const schema = bigint().custom(bigintMinExcluded(10n));
 * parseOrFail(schema, 11n);  // Valid
 * parseOrFail(schema, 10n); // Throws an error: 'The received value is less than or equal to expected'
 * parseOrFail(schema, 9n);  // Throws an error: 'The received value is less than or equal to expected'
 *
 * @translation Error Translation Key = 'bi:minExcluded'
 */
export const bigintMinExcluded =
  (expected: bigint): RequiredValidation =>
  (received: bigint, ctx: ExceptionContext) => {
    if (expected >= received) ctx.addIssue(expected, received, bigintMinExcludedErrorKey);
  };

bigintMinExcluded.key = bigintMinExcludedErrorKey;
bigintMinExcluded.message = bigintMinExcludedErrorMessage;
setToDefaultLocale(bigintMinExcluded);
