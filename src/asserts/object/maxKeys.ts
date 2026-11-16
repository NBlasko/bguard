import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';
import { _checkKeyCount } from '../../helpers/checkKeyCount';

const maxKeysErrorMessage = 'The received number of keys is greater than expected';
const maxKeysErrorKey = 'o:maxKeys';

/**
 * @description Ensures that the object has no more than the specified number of keys.
 * @param {number} expected - The maximum number of keys allowed in the object: a non-negative integer,
 * or `Infinity` for no limit. Anything else throws a `BuildSchemaError`. A key whose value is `undefined`
 * is not counted, as in `minKeys`.
 * @returns {RequiredValidation} A validation function that takes a received object and an exception context.
 * @throws {ValidationError} if the number of the received keys is greater than the expected value.
 * @example
 * const schema = object({
 *   name: string(),
 *   email: string(),
 * })
 *   .allowUnrecognized()
 *   .custom(maxKeys(2));
 *
 * // This will pass
 * parseOrFail(schema, { name: 'John', email: 'john@example.com' });
 *
 * // This will throw an error because there are 3 keys
 * parseOrFail(schema, { name: 'John', email: 'john@example.com', address: '123 Main St' });
 *
 * @translation Error Translation Key = 'o:maxKeys'
 */
export const maxKeys = (expected: number): RequiredValidation<Record<string, unknown>> => {
  // Infinity is allowed and means no limit, as it did before counts were checked: `maxKeys(limit ??
  // Infinity)` is a reasonable thing to write. It has no JSON Schema form, so it is left out there.
  if (expected !== Infinity) _checkKeyCount('maxKeys', expected);
  const validation = (receivedObject: Record<string, unknown>, ctx: ExceptionContext) => {
    // Keys holding undefined send nothing and are not counted, as in minKeys.
    const keysCount = Object.keys(receivedObject).filter((key) => receivedObject[key] !== undefined).length;
    if (keysCount > expected) {
      ctx.addIssue(expected, keysCount, maxKeysErrorKey);
    }
  };
  return expected === Infinity ? validation : _constrain({ maxProperties: expected }, validation);
};

maxKeys.key = maxKeysErrorKey;
maxKeys.message = maxKeysErrorMessage;
setToDefaultLocale(maxKeys);
