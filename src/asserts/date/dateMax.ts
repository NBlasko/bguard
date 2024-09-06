import { setToDefaultLocale } from '../../translationMap';
import { BuildSchemaError } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { isValidDateInner } from '../../helpers/isValidDateInner';

const dateMaxErrorMessage = 'The received value is greater than expected';
const dateMaxErrorKey = 'dt:max';
/**
 * @description Asserts that a date value is not greater than a specified maximum value.
 * @param {Date | string} expected The maximum allowable value.
 * @returns {RequiredValidation} A validation function that takes a received Date or string and an exception context.
 * @throws {ValidationError} if the received value is greater than the expected maximum value.
 * @example
 * const schema = date().custom(dateMax('2024-12-31'));
 * parseOrFail(schema, new Date('2024-12-30'));  // Valid
 * parseOrFail(schema, new Date('2024-12-31'));  // Valid
 * parseOrFail(schema, new Date('2025-01-01'));  // Throws an error: 'The received value is greater than expected'
 *
 * @translation Error Translation Key = 'dt:max'
 */
export const dateMax = (expected: Date | string): RequiredValidation => {
  const transformedExpected = typeof expected === 'string' ? new Date(expected) : expected;
  if (!isValidDateInner(transformedExpected)) throw new BuildSchemaError('Invalid date in Date assertion');
  return (received: Date, ctx: ExceptionContext) => {
    if (transformedExpected < received) ctx.addIssue(transformedExpected, received, dateMaxErrorKey);
  };
};

dateMax.key = dateMaxErrorKey;
dateMax.message = dateMaxErrorMessage;
setToDefaultLocale(dateMax);
