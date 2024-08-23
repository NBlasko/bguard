import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const uuidErrorMessage = 'The received value is not a valid UUID';
const uuidErrorKey = 's:uuid';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID.
 * @example
 * const schema = string().custom(uuid());
 * parseOrFail(schema, '123e4567-e89b-12d3-a456-426614174000'); // Valid
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID'
 *
 * @translation Error Translation Key = 's:uuid'
 */
export const uuid = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidPattern.test(received)) {
    guardException('uuid', received, ctx, uuidErrorKey);
  }
};

uuid.key = uuidErrorKey;
uuid.message = uuidErrorMessage;
setToDefaultLocale(uuid);
