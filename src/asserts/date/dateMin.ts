import { setToDefaultLocale } from '../../translationMap';
import { BuildSchemaError } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../core';
import { isValidDateInner } from '../../helpers/isValidDateInner';
import { _timeOf } from '../../helpers/intrinsics';

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
export const dateMin = (expected: Date | string): RequiredValidation<Date> => {
  const transformedExpected = typeof expected === 'string' ? new Date(expected) : expected;
  if (!isValidDateInner(transformedExpected)) throw new BuildSchemaError('Invalid date in Date assertion');
  // Compared as timestamps read from the engine, not with `>`, which calls each Date's own `valueOf`: a
  // real Date given a fake `valueOf` passed `date()` and then faked the bound. The bound is read once,
  // here, so changing the Date passed in afterwards does not move it.
  const expectedTime = _timeOf(transformedExpected)!;
  return (received: Date, ctx: ExceptionContext) => {
    const receivedTime = _timeOf(received);
    // Not a Date at all: date() has already reported that.
    if (receivedTime === undefined) return;
    if (expectedTime > receivedTime) ctx.addIssue(new Date(expectedTime), received, dateMinErrorKey);
  };
};

dateMin.key = dateMinErrorKey;
dateMin.message = dateMinErrorMessage;
setToDefaultLocale(dateMin);
