import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const uuidV1ErrorMessage = 'The received value is not a valid UUID v1';
const uuidV1ErrorKey = 's:uuidV1';

const uuidV1Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID v1 format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID v1.
 * @example
 * const schema = string().custom(uuidV1());
 * parseOrFail(schema, '550e8400-e29b-11d4-a716-446655440000'); // Valid
 * parseOrFail(schema, '550e8400-e29b-21d4-a716-446655440000'); // Throws an error: 'The received value is not a valid UUID v1'
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v1'
 *
 * @translation Error Translation Key = 's:uuidV1'
 */
export const uuidV1 = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidV1Pattern.test(received)) {
    ctx.addIssue('uuid v1', received, uuidV1ErrorKey);
  }
};

uuidV1.key = uuidV1ErrorKey;
uuidV1.message = uuidV1ErrorMessage;
setToDefaultLocale(uuidV1);
