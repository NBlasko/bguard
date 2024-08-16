import { equalTo } from '../asserts/mix/equalTo';
import { CommonSchema } from './CommonSchema';

export class StringSchema extends CommonSchema {
  _string = 1;

  /**
   * Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   *
   * @param expectedValue - The value that the schema must exactly match.
   * @returns - The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   *
   * @example - string().equalTo('hello'); // Infers the type 'hello'
   */
  equalTo<Y extends string>(expectedValue: Y): WithString<this, Y> {
    return this.custom(equalTo(expectedValue)) as WithString<this, Y>;
  }
}

export type WithString<T extends StringSchema, Y = string> = T & { validation_string: Y };
export type ExtractFromString<T> = T extends WithString<StringSchema, infer Y> ? Y : never;
