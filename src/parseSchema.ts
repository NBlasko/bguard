import { InferType } from './InferType';
import { innerCheck } from './core';
import { ValidationError } from './exceptions';
import { CommonSchema } from './schemas/CommonSchema';

/**
 * Parses and validates a value against the provided schema, returning a type-safe result.
 *
 * This function will throw a `ValidationError` if the value does not conform to the schema.
 * The inferred TypeScript type of the returned value will match the structure defined by the schema.
 *
 * @template T
 * @param {T} schema - The schema to validate the received value against. This schema dictates the expected structure and type of the value.
 * @param {unknown} receivedValue - The value to be validated and parsed according to the schema.
 * @returns {InferType<T>} The validated value, with its TypeScript type inferred from the schema.
 *
 * @throws {ValidationError} If the received value does not match the schema, a `ValidationError` will be thrown.
 * @throws {Error} If an unexpected error occurs during validation, an error will be thrown with a generic message.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number(),
 * });
 *
 * const result = parseSchema(schema, { name: 'Alice', age: 30 });
 * // result will be inferred as { name: string; age: number }
 *
 * parseSchema(schema, { name: 'Alice', age: '30' });
 * // Throws ValidationError because 'age' should be a number, not a string.
 */
export function parseSchema<T extends CommonSchema>(schema: T, receivedValue: unknown): InferType<T> {
  try {
    return innerCheck(schema, receivedValue, '') as InferType<T>;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    /* istanbul ignore next */
    throw new Error('Something unexpected happened');
  }
}
