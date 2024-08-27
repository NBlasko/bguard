import { setToDefaultLocale } from '../../translationMap';
import { BuildSchemaError, guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { isValidDate } from '../../helpers/isValidDate';

const dateMinErrorMessage = 'The received value is less than expected';
const dateMinErrorKey = 'dt:min';
/**
 * @description Asserts that a number value is not less than a specified minimum value.
 * @param {Date | string} expected The minimum allowable value.
 * @returns {RequiredValidation} A validation function that takes a received Date or string and an exception context.
 * @throws {ValidationError} if the received value is less than the expected minimum value.
 * @example
 * const schema = date().custom(dateMin('2023-01-01'));
 * parseOrFail(schema, new Date('2023-01-02'));  // Valid
 * parseOrFail(schema, new Date('2023-01-01'));  // Valid
 * parseOrFail(schema, new Date('2022-12-31'));  // Throws an error: 'The received value is less than expected'
 *
 * @translation Error Translation Key = 'dt:min'
 */
export const dateMin = (expected: Date | string): RequiredValidation => {
  const transformedExpected = typeof expected === 'string' ? new Date(expected) : expected;
  if (!isValidDate(transformedExpected)) throw new BuildSchemaError('Invalid date in Date assertion');
  return (received: Date, ctx: ExceptionContext) => {
    if (transformedExpected > received) guardException(transformedExpected, received, ctx, dateMinErrorKey);
  };
};

dateMin.key = dateMinErrorKey;
dateMin.message = dateMinErrorMessage;
setToDefaultLocale(dateMin);
