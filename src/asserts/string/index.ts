import { WithBGuardType } from '../../commonTypes';
import { BuildSchemaError } from '../../exceptions';
import { ONLY_ONCE } from '../../helpers/constants';
import { CommonSchema } from '../../core';
import { _setStrictType } from '../../helpers/setStrictType';
import { equalTo } from '../mix/equalTo';
import { oneOfValues } from '../mix/oneOfValues';

/**
 * @description Creates a new schema for validating string values.
 * @returns {WithBGuardType<StringSchema, string>} A new instance of `StringSchema` for validating strings.
 * @example
 * ```typescript
 * const schema = string();
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 123); // Throws a validation error
 * ```
 * @instance Of StringSchema
 */
export function string(): WithBGuardType<StringSchema, string> {
  return new StringSchema({ type: ['string'], requiredValidations: [] }) as WithBGuardType<StringSchema, string>;
}

class StringSchema extends CommonSchema {
  protected _string = 1;
  private limit: boolean | undefined;

  /**
   * @method equalTo
   * @description Restricts the schema to exactly match the specified value and infers the literal value as the TypeScript type.
   * @param expectedValue - The value that the schema must exactly match.
   * @returns The schema instance restricted to the specified value, with the literal value inferred as the TypeScript type
   * @example
   * ```typescript
   * string().equalTo('hello'); // Infers the type 'hello'
   * ```
   */
  public equalTo<Y extends string>(expectedValue: Y): WithBGuardType<this, Y> {
    this.limitCheck();
    _setStrictType(this, `'${expectedValue}'`);

    return this.custom(equalTo(expectedValue)) as WithBGuardType<this, Y>;
  }

  /**
   * @method oneOfValues
   * @description Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   * @param expectedValues - An array of values that the schema can match.
   * @returns The schema instance restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   * @example
   * ```typescript
   * string().oneOfValues(['foo', 'bar']); // Infers the type 'foo' | 'bar'
   * ```
   */
  public oneOfValues<Y extends string>(expectedValue: Y[]): WithBGuardType<this, Y> {
    this.limitCheck();
    _setStrictType(
      this,
      expectedValue.map((el) => `'${el}'`),
    );
    return this.custom(oneOfValues(expectedValue)) as WithBGuardType<this, Y>;
  }

  private limitCheck() {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
    this.limit = true;
  }
}
