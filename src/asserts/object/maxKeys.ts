import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const maxKeysErrorMessage = 'The received number of keys is greater than expected';
const maxKeysErrorKey = 'o:maxKeys';

/**
 * @description Ensures that the object has no more than the specified number of keys.
 * @param {number} expected - The maximum number of keys allowed in the object.
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
export const maxKeys =
  (expected: number): RequiredValidation =>
  (receivedObject: Record<string, unknown>, ctx: ExceptionContext) => {
    const keysCount = Object.keys(receivedObject).length;
    if (keysCount > expected) {
      guardException(expected, keysCount, ctx, maxKeysErrorKey);
    }
  };

maxKeys.key = maxKeysErrorKey;
maxKeys.message = maxKeysErrorMessage;
setToDefaultLocale(maxKeys);
