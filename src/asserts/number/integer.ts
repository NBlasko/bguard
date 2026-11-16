import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const integerErrorMessage = 'The received value is not an integer';
const integerErrorKey = 'n:integer';

/**
 * @description Asserts that a number is an integer: it has no fractional part. `5` and `5.0` pass, `5.5`
 * does not. Integers beyond `Number.MAX_SAFE_INTEGER` pass as well, though they cannot all be told apart;
 * add `max(Number.MAX_SAFE_INTEGER)` if that matters. In JSON Schema this becomes `type: 'integer'`.
 * @returns {RequiredValidation} A validation function that takes a received number and an exception context.
 * @throws {ValidationError} if the received number has a fractional part.
 * @example
 * const schema = number().custom(integer());
 * parseOrFail(schema, 42);  // Valid
 * parseOrFail(schema, 4.2); // Throws an error: 'The received value is not an integer'
 *
 * @translation Error Translation Key = 'n:integer'
 */
export const integer = (): RequiredValidation<number> =>
  _constrain({ type: 'integer' }, (received: number, ctx: ExceptionContext) => {
    if (!Number.isInteger(received)) ctx.addIssue('integer', received, integerErrorKey);
  });

integer.key = integerErrorKey;
integer.message = integerErrorMessage;
setToDefaultLocale(integer);
