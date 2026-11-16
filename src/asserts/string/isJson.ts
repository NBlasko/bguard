import type { ExceptionContext, RequiredValidation } from '../../core';
import { setToDefaultLocale } from '../../translationMap';

const isJsonErrorMessage = 'The received value is not valid JSON';
const isJsonErrorKey = 's:isJson';

/**
 * @description Asserts that a string is valid JSON text, as `JSON.parse` reads it. Any JSON value counts,
 * including `'42'`, `'"text"'`, `'true'` and `'null'`, not only objects and arrays. The value is returned
 * as the string it was; parse it yourself, or in a `transformBeforeValidation`, if you need the data.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not valid JSON.
 * @example
 * const schema = string().custom(isJson());
 * parseOrFail(schema, '{"a":[1,2]}'); // Valid
 * parseOrFail(schema, "{'a':1}");     // Throws an error: 'The received value is not valid JSON'
 *
 * @translation Error Translation Key = 's:isJson'
 */
export const isJson = (): RequiredValidation<string> => (received: string, ctx: ExceptionContext) => {
  // No JSON Schema mapping: `contentMediaType` is only an annotation in 2020-12, and asserting it would
  // be up to each validator.
  try {
    JSON.parse(received);
  } catch {
    ctx.addIssue('valid JSON', received, isJsonErrorKey);
  }
};

isJson.key = isJsonErrorKey;
isJson.message = isJsonErrorMessage;
setToDefaultLocale(isJson);
