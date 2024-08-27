import { equalTo } from '../asserts/mix/equalTo';
import { oneOfValues } from '../asserts/mix/oneOfValues';
import { BuildSchemaError } from '../exceptions';
import { ONLY_ONCE } from '../helpers/constants';
import { _setStrictType } from '../helpers/setStrictType';
import { CommonSchema } from './CommonSchema';

export class BigIntSchema extends CommonSchema {
  _bigint = 1;
  private limit: boolean | undefined;

  /**
   * Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   *
   * @param expectedValue - The value that the schema must exactly match.
   * @returns - The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   *
   * @example - bigint().equalTo(42n); // Infers the type 42n
   */
  equalTo<Y extends bigint>(expectedValue: Y): WithBigInt<this, Y> {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
    _setStrictType(this, `${expectedValue}n`);
    return this.custom(equalTo(expectedValue)) as WithBigInt<this, Y>;
  }

  /**
   * Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   *
   * @param expectedValues - An array of values that the schema can match.
   * @returns - The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   *
   * @example
   * bigint().oneOfValues([5n, 7n]); // Infers the type 5n | 7n
   */
  oneOfValues<Y extends bigint>(expectedValue: Y[]): WithBigInt<this, Y> {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
    _setStrictType(
      this,
      expectedValue.map((el) => `${el}n`),
    );
    return this.custom(oneOfValues(expectedValue)) as WithBigInt<this, Y>;
  }
}

export type WithBigInt<T extends BigIntSchema, Y = bigint> = T & { validation_bigint: Y };
export type ExtractFromBigInt<T> = T extends WithBigInt<BigIntSchema, infer Y> ? Y : never;
