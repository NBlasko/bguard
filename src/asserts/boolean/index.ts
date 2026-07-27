import { WithBGuardType } from '../../commonTypes';
import { CommonSchema, type ExceptionContext, type RequiredValidation } from '../../core';
import { _setStrictType } from '../../helpers/setStrictType';

// Declared over `unknown` rather than `boolean`: it is applied from inside the class, where `this`
// is still polymorphic, so the schema's own value type cannot be resolved yet. The comparison is
// identity-based, so widening the parameter costs nothing.
const isBoolean =
  (expected: boolean): RequiredValidation<unknown> =>
  (received: unknown, ctx: ExceptionContext) => {
    if (received !== expected) ctx.addIssue(expected, received, 'c:isBoolean');
  };

/**
 * @description Creates a new schema for validating boolean values.
 * @returns {WithBGuardType<BooleanSchema, boolean>} A new instance of `BooleanSchema` for validating booleans.
 * @example
 * const schema = boolean();
 * parseOrFail(schema, true); // Validates successfully
 * parseOrFail(schema, 'true'); // Throws a validation error
 *
 * @instance Of BooleanSchema
 */
export function boolean(): WithBGuardType<BooleanSchema, boolean> {
  return new BooleanSchema({ type: ['boolean'], requiredValidations: [] }) as WithBGuardType<BooleanSchema, boolean>;
}

class BooleanSchema extends CommonSchema {
  protected _boolean = 1;

  /**
   * @method onlyTrue
   * @description Restricts the schema to exactly match the boolean value true and infers the true value as the TypeScript type.
   * @returns The schema instance restricted to the value true, with the true value inferred as the TypeScript type
   * @example
   * boolean().onlyTrue(); // Infers the type true
   *
   * @public
   */
  public onlyTrue(): WithBGuardType<this, true> {
    _setStrictType(this, true);
    return this.custom(isBoolean(true)) as WithBGuardType<this, true>;
  }

  /**
   * @method onlyFalse
   * @description Restricts the schema to exactly match the boolean value false and infers the false value as the TypeScript type.
   * @returns The schema instance restricted to the value false, with the false value inferred as the TypeScript type
   * @example
   * boolean().onlyFalse(); // Infers the type false
   *
   * @public
   */
  public onlyFalse(): WithBGuardType<this, false> {
    _setStrictType(this, false);
    return this.custom(isBoolean(false)) as WithBGuardType<this, false>;
  }
}
