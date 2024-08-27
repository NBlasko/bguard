import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';

const bigintMaxErrorMessage = 'The received value is greater than expected';
const bigintMaxErrorKey = 'bi:max';

/**
 * @description Asserts that a bigint value does not exceed a specified maximum value.
 * @param {bigint} expected The maximum allowable value.
 * @returns {RequiredValidation} A validation function that takes a received bigint and an exception context.
 * @throws {ValidationError} if the received value exceeds the expected maximum value.
 * @example
 * const schema = bigint().custom(bigintMax(100n));
 * parseOrFail(schema, 99n);  // Valid
 * parseOrFail(schema, 100n); // Valid
 * parseOrFail(schema, 101n); // Throws an error: 'The received value is greater than expected'
 *
 * @translation Error Translation Key = 'bi:max'
 */
export const bigintMax =
  (expected: bigint): RequiredValidation =>
  (received: bigint, ctx: ExceptionContext) => {
    if (expected < received) guardException(expected, received, ctx, bigintMaxErrorKey);
  };

bigintMax.key = bigintMaxErrorKey;
bigintMax.message = bigintMaxErrorMessage;
setToDefaultLocale(bigintMax);
