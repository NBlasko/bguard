import { WithBGuardType } from '../../commonTypes';
import { BuildSchemaError } from '../../exceptions';
import { ONLY_ONCE } from '../../helpers/constants';
import { CommonSchema } from '../../core';
import { _setStrictType } from '../../helpers/setStrictType';
import { equalTo } from '../mix/equalTo';
import { oneOfValues } from '../mix/oneOfValues';

/**
 * @description Creates a new schema for validating number values.
 * @returns {NumberSchema} A new instance of `NumberSchema` for validating numbers.
 * @example
 * ```typescript
 * const schema = number();
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, '42'); // Throws a validation error
 * ```
 * @instance Of NumberSchema
 */
export function number(): WithBGuardType<NumberSchema, number> {
  return new NumberSchema({ type: ['number'], requiredValidations: [] }) as WithBGuardType<NumberSchema, number>;
}

class NumberSchema extends CommonSchema {
  protected _number = 1;
  private limit: boolean | undefined;

  /**
   * @method equalTo
   * @description Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   * @param expectedValue - The value that the schema must exactly match.
   * @returns The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   * @example
   * ```typescript
   * number().equalTo(42); // Infers the type 42
   * ```
   */
  public equalTo<Y extends number>(expectedValue: Y): WithBGuardType<this, Y> {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
    _setStrictType(this, expectedValue);
    return this.custom(equalTo(expectedValue)) as WithBGuardType<this, Y>;
  }

  /**
   * @method oneOfValues
   * @description Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   * @param expectedValues - An array of values that the schema can match.
   * @returns The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   * @example
   * ```typescript
   * number().oneOfValues([5, 7]); // Infers the type 5 | 7
   * ```
   */
  public oneOfValues<Y extends number>(expectedValue: Y[]): WithBGuardType<this, Y> {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
    _setStrictType(this, expectedValue);
    return this.custom(oneOfValues(expectedValue)) as WithBGuardType<this, Y>;
  }
}
