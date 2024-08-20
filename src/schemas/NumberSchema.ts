import { equalTo } from '../asserts/mix/equalTo';
import { oneOfValues } from '../asserts/mix/oneOfValues';
import { _setStrictType } from '../helpers/setStrictType';
import { CommonSchema } from './CommonSchema';

export class NumberSchema extends CommonSchema {
  _number = 1;

  /**
   * Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   *
   * @param expectedValue - The value that the schema must exactly match.
   * @returns - The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   *
   * @example - number().equalTo(42); // Infers the type 42
   */
  equalTo<Y extends number>(expectedValue: Y): WithNumber<this, Y> {
    _setStrictType(this, expectedValue);
    return this.custom(equalTo(expectedValue)) as WithNumber<this, Y>;
  }

  /**
   * Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   *
   * @param expectedValues - An array of values that the schema can match.
   * @returns - The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   *
   * @example
   * number().oneOfValues([5, 7]); // Infers the type 5 | 7
   */
  oneOfValues<Y extends number>(expectedValue: Y[]): WithNumber<this, Y> {
    _setStrictType(this, expectedValue);
    return this.custom(oneOfValues(expectedValue)) as WithNumber<this, Y>;
  }
}

export type WithNumber<T extends NumberSchema, Y = number> = T & { validation_number: Y };
export type ExtractFromNumber<T> = T extends WithNumber<NumberSchema, infer Y> ? Y : never;
