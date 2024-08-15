import { InferType } from './InferType';
import { innerCheck } from './core';
import { getTranslationByLocale } from './errorMap';
import { ValidationError } from './exceptions';
import { CommonSchema, ExceptionContext, ValidationErrorData } from './schemas/CommonSchema';

interface ParseOptions {
  /**
   * Set language keyword to map Error messages
   * @default 'default'
   * @example 'sr' or 'Serbia' or any string to identify langugage
   */
  lng?: string;
  /**
   * If false or undefined -returns the first validation error it can find and stops looking, which provides a small runtime optimization.
   * @default undefined
   */
  getAllErrors?: boolean;
}

/**
 * Parses and validates a value against the provided schema, returning a type-safe result.
 *
 * This function will throw a `ValidationError` if the value does not conform to the schema.
 * The inferred TypeScript type of the returned value will match the structure defined by the schema.
 *
 * @template T
 * @param {T} schema - The schema to validate the received value against. This schema dictates the expected structure and type of the value.
 * @param {unknown} receivedValue - The value to be validated and parsed according to the schema.
 * @param {ParseOptions} options - Options
 * @param {ParseOptions.lng} options.lng -  Set language keyword to map Error messages
 * @param {ParseOptions.lng} options.getAllErrors - If `false` or `undefined` - returns the first validation error it can find and stops looking, which provides a small runtime optimization.
 * @returns {[undefined, InferType<T>]} The validated value, with its TypeScript type inferred from the schema.
 *
 * @returns {[ValidationErrorData[], undefined]} If the received value does not match the schema, a `ValidationError` will be thrown.
 * @returns {[ValidationErrorData[], undefined]} If an unexpected error occurs during validation, an error will be returned in
 * the first element of ValidationErrorData[] with a generic message.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number(),
 * });
 *
 * const [errors, result]  = parse(schema, { name: 'Alice', age: 30 });
 * // Result will be inferred as { name: string; age: number }
 *
 *
 *  const [errors, result] = parse(schema, { name: 'Alice', age: '30' });
 * // First element in array "errors" will have an error because 'age' should be a number, not a string.
 * // Array 'errors' returns only one element.
 *
 *
 *  const [errors, result] = parse(schema, { name: true, age: '30' }, { getAllErrors: true});
 * // Returns array "errors" with multiple errors because 'age' should be a number and 'name' a string.
 * // With provided options { getAllErrors: true}, we can expecte more than one error in 'errors' array.
 *
 *
 *  const [errors, result] = parse(schema, { name: true, age: '30' }, { lng: 'SR'});
 * // First element in array "errors" will have an error because 'age' should be a number, not a string.
 * // With provided options { lng: 'SR'}, errors will be translated to a language mapped with keyword 'SR'
 */
export function parse<T extends CommonSchema>(
  schema: T,
  receivedValue: unknown,
  options?: ParseOptions,
): [ValidationErrorData[], undefined] | [undefined, InferType<T>] {
  try {
    const ctx: ExceptionContext = {
      t: getTranslationByLocale(options?.lng),
      pathToError: '',
      getAllErrors: options?.getAllErrors,
      errors: [],
    };

    const result = innerCheck(schema, receivedValue, ctx) as InferType<T>;

    if (ctx.getAllErrors && ctx.errors.length) {
      return [ctx.errors, undefined];
    }

    return [undefined, result];
  } catch (e) {
    if (e instanceof ValidationError) {
      delete e.stack;
      return [[e], undefined];
    }
    /* istanbul ignore next */
    return [
      [
        {
          message: 'Something unexpected happened',
          expected: '',
          received: '',
          pathToError: '',
        },
      ],
      undefined,
    ];
  }
}
