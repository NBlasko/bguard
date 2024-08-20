import { equalTo } from '../asserts/mix/equalTo';
import { oneOfValues } from '../asserts/mix/oneOfValues';
import { _setStrictType } from '../helpers/setStrictType';
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
    _setStrictType(this, `'${expectedValue}'`);
    return this.custom(equalTo(expectedValue)) as WithString<this, Y>;
  }

  /**
   * Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   *
   * @param expectedValues - An array of values that the schema can match.
   * @returns - The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   *
   * @example
   * string().oneOfValues(['foo', 'bar']); // Infers the type 'foo' | 'bar'
   */
  oneOfValues<Y extends string>(expectedValue: Y[]): WithString<this, Y> {
    _setStrictType(
      this,
      expectedValue.map((el) => `'${el}'`),
    );
    return this.custom(oneOfValues(expectedValue)) as WithString<this, Y>;
  }
}

export type WithString<T extends StringSchema, Y = string> = T & { validation_string: Y };
export type ExtractFromString<T> = T extends WithString<StringSchema, infer Y> ? Y : never;
