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
 * const schema = string();
 * parseOrFail(schema, 'hello'); // Validates successfully
 * parseOrFail(schema, 123); // Throws a validation error
 *
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
   * @returns A new schema restricted to the specified value, with the literal value inferred as the TypeScript type
   * @example
   * string().equalTo('hello'); // Infers the type 'hello'
   *
   * @public
   */
  public equalTo<Y extends string>(expectedValue: Y): WithBGuardType<this, Y> {
    this.limitGuard();
    // custom() returns the copy, so the strict type and the once-only flag are set on it. Setting
    // them on `this` first would refine the schema this one was derived from.
    const next = this.custom(equalTo(expectedValue));
    next.limit = true;
    _setStrictType(next, `'${expectedValue}'`);
    return next as WithBGuardType<this, Y>;
  }

  /**
   * @method oneOfValues
   * @description Restricts the schema to match one of the specified values and infers the union of those values as the TypeScript type.
   * @param expectedValues - An array of values that the schema can match.
   * @returns A new schema restricted to one of the specified values, with the union of those values inferred as the TypeScript type.
   * @example
   * string().oneOfValues(['foo', 'bar']); // Infers the type 'foo' | 'bar'
   *
   * @public
   */
  public oneOfValues<Y extends string>(expectedValue: Y[]): WithBGuardType<this, Y> {
    this.limitGuard();
    const next = this.custom(oneOfValues(expectedValue));
    next.limit = true;
    _setStrictType(
      next,
      expectedValue.map((el) => `'${el}'`),
    );
    return next as WithBGuardType<this, Y>;
  }

  /**
   * Reads the once-only flag without setting it. The flag belongs on the schema that `custom`
   * returns, not on the one it was derived from.
   */
  private limitGuard() {
    if (this.limit) throw new BuildSchemaError(ONLY_ONCE);
  }
}
