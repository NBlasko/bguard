import { equalTo } from '../asserts/common/equalTo';

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
    return this.custom(equalTo(expectedValue)) as WithNumber<this, Y>;
  }
}

export type WithNumber<T extends NumberSchema, Y = number> = T & { validation_number: Y };
export type ExtractFromNumber<T> = T extends WithNumber<NumberSchema, infer Y> ? Y : never;
