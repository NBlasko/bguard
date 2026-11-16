import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';
import { _checkKeyCount, _countDefinedKeys } from '../../helpers/checkKeyCount';

const minKeysErrorMessage = 'The received number of keys is less than expected';
const minKeysErrorKey = 'o:minKeys';

/**
 * @description Ensures that the object has at least the specified number of keys. The counterpart of
 * `maxKeys`, and most useful on an object whose properties are all optional, or on a `record`: "send at
 * least one of these". A key whose value is `undefined` is not counted, since it sends nothing: form
 * libraries and object spreads often fill absent fields with `undefined`, and `{ email: undefined }`
 * would otherwise satisfy `minKeys(1)`. JSON cannot carry `undefined`, so this matches `minProperties`.
 * It counts the keys that were sent: a property whose `default()` would fill it in does not count,
 * which is also how a JSON Schema validator reads `minProperties`.
 * @param {number} expected - The minimum number of keys the object must have: a non-negative integer,
 * or a `BuildSchemaError` is thrown.
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
export const minKeys = (expected: number): RequiredValidation<Record<string, unknown>> => {
  _checkKeyCount('minKeys', expected);
  return _constrain({ minProperties: expected }, (receivedObject: Record<string, unknown>, ctx: ExceptionContext) => {
    const keysCount = _countDefinedKeys(receivedObject);
    if (keysCount < expected) {
      ctx.addIssue(expected, keysCount, minKeysErrorKey);
    }
  });
};

minKeys.key = minKeysErrorKey;
minKeys.message = minKeysErrorMessage;
setToDefaultLocale(minKeys);
