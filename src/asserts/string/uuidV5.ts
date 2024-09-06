import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const uuidV5ErrorMessage = 'The received value is not a valid UUID v5';
const uuidV5ErrorKey = 's:uuidV5';

const uuidV5Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID v5 format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID v5.
 * @example
 * const schema = string().custom(uuidV5());
 * parseOrFail(schema, '550e8400-e29b-51d4-a716-446655440000'); // Valid
 * parseOrFail(schema, '550e8400-e29b-41d4-a716-446655440000'); // Throws an error: 'The received value is not a valid UUID v5'
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v5'
 *
 * @translation Error Translation Key = 's:uuidV5'
 */
export const uuidV5 = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidV5Pattern.test(received)) {
    ctx.addIssue('uuid v5', received, uuidV5ErrorKey);
  }
};

uuidV5.key = uuidV5ErrorKey;
uuidV5.message = uuidV5ErrorMessage;
setToDefaultLocale(uuidV5);
