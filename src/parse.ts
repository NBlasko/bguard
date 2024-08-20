import { InferType } from './InferType';
import { innerCheck } from './core';
import { getTranslationByLocale } from './translationMap';
import { ValidationError } from './exceptions';
import { CommonSchema } from './schemas/CommonSchema';
import { ExceptionContext, ValidationErrorData } from './commonTypes';

interface ParseOptions {
  /**
   * Set language keyword to map error messages.
   * @default 'default'
   * @example 'sr' or 'Serbia' or any string to identify language
   */
  lng?: string;

  /**
   * If true, collects all validation errors and returns them.
   * If false or undefined, returns the first validation error it can find and stops looking,
   * which provides a small runtime optimization.
   * @default undefined
   */
  getAllErrors?: boolean;
}

/**
 * Parses and validates a value against the provided schema, returning a type-safe parsedValue.
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
 * @returns {[undefined, InferType<T>]} A tuple of [undefined, InferType<T>] if parsing is successful.
 * @returns {[ValidationErrorData[], undefined]} A tuple of [ValidationErrorData[], undefined]] if errors occur.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number(),
 * });
 *
 * const [errors, parsedValue]  = parse(schema, { name: 'Alice', age: 30 });
 * // parsedValue will be inferred as { name: string; age: number }
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: 'Alice', age: '30' });
 * // First element in array "errors" will have an error because 'age' should be a number, not a string.
 * // Array 'errors' returns only one element.
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: true, age: '30' }, { getAllErrors: true});
 * // Returns array "errors" with multiple errors because 'age' should be a number and 'name' a string.
 * // With provided options { getAllErrors: true}, we can expecte more than one error in 'errors' array.
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: true, age: '30' }, { lng: 'SR'});
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

    const parsedValue = innerCheck(schema, receivedValue, ctx) as InferType<T>;

    if (ctx.getAllErrors && ctx.errors.length) {
      return [ctx.errors, undefined];
    }

    return [undefined, parsedValue];
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
