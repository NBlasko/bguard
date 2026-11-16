import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const minKeysErrorMessage = 'The received number of keys is less than expected';
const minKeysErrorKey = 'o:minKeys';

/**
 * @description Ensures that the object has at least the specified number of keys. The counterpart of
 * `maxKeys`, and most useful on an object whose properties are all optional, or on a `record`: "send at
 * least one of these".
 * @param {number} expected - The minimum number of keys the object must have.
 * @returns {RequiredValidation} A validation function that takes a received object and an exception context.
 * @throws {ValidationError} if the number of the received keys is less than the expected value.
 * @example
 * const schema = object({
 *   email: string().optional(),
 *   phone: string().optional(),
 * }).custom(minKeys(1));
 *
 * parseOrFail(schema, { email: 'a@b.co' }); // Valid
 * parseOrFail(schema, {});                  // Throws an error: at least one key is required
 *
 * @translation Error Translation Key = 'o:minKeys'
 */
export const minKeys = (expected: number): RequiredValidation<Record<string, unknown>> =>
  _constrain({ minProperties: expected }, (receivedObject: Record<string, unknown>, ctx: ExceptionContext) => {
    const keysCount = Object.keys(receivedObject).length;
    if (keysCount < expected) {
      ctx.addIssue(expected, keysCount, minKeysErrorKey);
    }
  });

minKeys.key = minKeysErrorKey;
minKeys.message = minKeysErrorMessage;
setToDefaultLocale(minKeys);
