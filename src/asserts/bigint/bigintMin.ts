import { setToDefaultLocale } from '../../translationMap';
import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';

const bigintMinErrorMessage = 'The received value is less than expected';
const bigintMinErrorKey = 'bi:min';

/**
 * @description Asserts that a bigint value is not less than a specified minimum value.
 * @param {bigint} expected The minimum allowable value.
 * @returns {RequiredValidation} A validation function that takes a received bigint and an exception context.
 * @throws {ValidationError} if the received value is less than the expected minimum value.
 * @example
 * const schema = bigint().custom(bigintMin(10n));
 * parseOrFail(schema, 11n);  // Valid
 * parseOrFail(schema, 10n);  // Valid
 * parseOrFail(schema, 9n);   // Throws an error: 'The received value is less than expected'
 *
 * @translation Error Translation Key = 'bi:min'
 */
export const bigintMin =
  (expected: bigint): RequiredValidation =>
  (received: bigint, ctx: ExceptionContext) => {
    if (expected > received) guardException(expected, received, ctx, bigintMinErrorKey);
  };

bigintMin.key = bigintMinErrorKey;
bigintMin.message = bigintMinErrorMessage;
setToDefaultLocale(bigintMin);
