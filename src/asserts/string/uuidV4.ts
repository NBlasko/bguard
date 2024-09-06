import { ExceptionContext, RequiredValidation } from '../../ExceptionContext';
import { setToDefaultLocale } from '../../translationMap';

const uuidV4ErrorMessage = 'The received value is not a valid UUID v4';
const uuidV4ErrorKey = 's:uuidV4';

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @description Asserts that a string value matches the UUID v4 format.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value is not a valid UUID v4.
 * @example
 * const schema = string().custom(uuidV4());
 * parseOrFail(schema, '123e4567-e89b-42d3-a456-426614174000'); // Valid
 * parseOrFail(schema, '123e4567-e89b-12d3-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 * parseOrFail(schema, '123e4567-e89b-a2d3-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 * parseOrFail(schema, '123e4567-e89b-42d3-c456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 * parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v4'
 *
 * @translation Error Translation Key = 's:uuidV4'
 */
export const uuidV4 = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!uuidV4Pattern.test(received)) {
    ctx.addIssue('uuid v4', received, uuidV4ErrorKey);
  }
};

uuidV4.key = uuidV4ErrorKey;
uuidV4.message = uuidV4ErrorMessage;
setToDefaultLocale(uuidV4);
