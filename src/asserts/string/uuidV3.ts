import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const uuidV3ErrorMessage = 'The received value is not a valid UUID v3';
const uuidV3ErrorKey = 's:uuidV3';

const uuidV3Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID v3 format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID v3.
 * @example
 * const schema = string().custom(uuidV3());
 * parseOrFail(schema, '550e8400-e29b-38d1-a456-426614174000'); // Valid
 * parseOrFail(schema, '550e8400-e29b-28d1-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v3'
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v3'
 *
 * @translation Error Translation Key = 's:uuidV3'
 */
export const uuidV3 = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidV3Pattern.test(received)) {
    guardException('uuid v3', received, ctx, uuidV3ErrorKey);
  }
};

uuidV3.key = uuidV3ErrorKey;
uuidV3.message = uuidV3ErrorMessage;
setToDefaultLocale(uuidV3);
