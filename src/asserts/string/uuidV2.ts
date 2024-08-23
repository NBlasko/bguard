import { guardException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../commonTypes';
import { setToDefaultLocale } from '../../translationMap';

const uuidV2ErrorMessage = 'The received value is not a valid UUID v2';
const uuidV2ErrorKey = 's:uuidV2';

const uuidV2Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-2[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID v2 format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID v2.
 * @example
 * const schema = string().custom(uuidV2());
 * parseOrFail(schema, '550e8400-e29b-21d4-a716-446655440000'); // Valid
 * parseOrFail(schema, '550e8400-e29b-31d4-d716-446655440000'); // Throws an error: 'The received value is not a valid UUID v2'
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v2'
 *
 * @translation Error Translation Key = 's:uuidV2'
 */
export const uuidV2 = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidV2Pattern.test(received)) {
    guardException('uuid v2', received, ctx, uuidV2ErrorKey);
  }
};

uuidV2.key = uuidV2ErrorKey;
uuidV2.message = uuidV2ErrorMessage;
setToDefaultLocale(uuidV2);
