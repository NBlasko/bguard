import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';

const bigintMaxExcludedErrorMessage = 'The received value is greater than or equal to expected';
const bigintMaxExcludedErrorKey = 'bi:maxExcluded';

/**
 * @description - Asserts that a bigint value is strictly less than a specified maximum value (i.e., the maximum value is excluded).
 * @param {bigint} expected - The maximum allowable value, which is excluded.
 * @returns {RequiredValidation} -  A validation function that takes a received bigint and an exception context.
 * @throws {ValidationError} if the received value is greater than or equal to the expected maximum value.
 * @example
 * const schema = bigint().custom(bigintMaxExcluded(100n));
 * parseOrFail(schema, 99n);  // Valid
 * parseOrFail(schema, 100n); // Throws an error: 'The received value is greater than or equal to expected'
 * parseOrFail(schema, 101n); // Throws an error: 'The received value is greater than or equal to expected'
 *
 * @translation Error Translation Key = 'bi:maxExcluded'
 */
export const bigintMaxExcluded =
  (expected: bigint): RequiredValidation =>
  (received: bigint, ctx: ExceptionContext) => {
    if (expected <= received) guardException(expected, received, ctx, bigintMaxExcludedErrorKey);
  };

bigintMaxExcluded.key = bigintMaxExcludedErrorKey;
bigintMaxExcluded.message = bigintMaxExcludedErrorMessage;
setToDefaultLocale(bigintMaxExcluded);
