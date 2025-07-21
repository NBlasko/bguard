import { WithBGuardType } from '../../commonTypes';
import { BuildSchemaError } from '../../exceptions';
import { ONLY_ONCE } from '../../helpers/constants';
import { CommonSchema } from '../../core';
import { _setStrictType } from '../../helpers/setStrictType';
import { equalTo } from '../mix/equalTo';
import { oneOfValues } from '../mix/oneOfValues';

/**
 * @description - Creates a new schema for validating bigint values.
 * @returns {WithBGuardType<BigIntSchema, bigint>} A new instance of `BigIntSchema` for validating bigints.
 * @example
 * const schema = bigint();
 * parseOrFail(schema, 42n); // Validates successfully
 * parseOrFail(schema, 42); // Throws a validation error
 * parseOrFail(schema, '42'); // Throws a validation error
 *
 * @instance Of BigIntSchema
 */
export function bigint(): WithBGuardType<BigIntSchema, bigint> {
  return new BigIntSchema({ type: ['bigint'], requiredValidations: [] }) as WithBGuardType<BigIntSchema, bigint>;
}

class BigIntSchema extends CommonSchema {
  protected _bigint = 1;
  private limit: boolean | undefined;

  /**
   * @method equalTo
   * @description Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   * @param expectedValue - The value that the schema must exactly match.
   * @returns The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   * @example
   * bigint().equalTo(42n); // Infers the type 42n
   *
   * @public
   */
  public equalTo<Y extends bigint>(expectedValue: Y): WithBGuardType<this, Y> {
    this.defaultValueCheck();
    this.limitCheck();
    _setStrictType(this, `${expectedValue}n`);
    return this.custom(equalTo(expectedValue)) as WithBGuardType<this, Y>;
  }

  /**
   * @method oneOfValues
   * @description Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   * @param expectedValues - An array of values that the schema can match.
   * @returns The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   * @example
   * bigint().oneOfValues([5n, 7n]); // Infers the type 5n | 7n
   *
   * @public
   */
  public oneOfValues<Y extends bigint>(expectedValue: Y[]): WithBGuardType<this, Y> {
    this.defaultValueCheck();
    this.limitCheck();
    _setStrictType(
      this,
      expectedValue.map((el) => `${el}n`),
    );
    return this.custom(oneOfValues(expectedValue)) as WithBGuardType<this, Y>;
  }

  private limitCheck() {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
  }
}
