import { CommonSchema } from './CommonSchema';
import { WithBGuardType } from '../commonTypes';
import { _setStrictType } from '../helpers/setStrictType';
import { ExceptionContext } from '../ExceptionContext';

const isBoolean = (expected: boolean) => (received: boolean, ctx: ExceptionContext) => {
  if (received !== expected) ctx.addIssue(expected, received, 'c:isBoolean');
};

export class BooleanSchema extends CommonSchema {
  protected _boolean = 1;

  /**
   * Restricts the schema to exactly match the boolean value true and infers the true value as the TypeScript type.
   *
   * @returns - The schema instance restricted to the value true, with the true value inferred as the TypeScript type
   *
   * @example - boolean().onlyTrue(); // Infers the type true
   */
  public onlyTrue(): WithBGuardType<this, true> {
    _setStrictType(this, true);
    return this.custom(isBoolean(true)) as WithBGuardType<this, true>;
  }

  /**
   * Restricts the schema to exactly match the boolean value false and infers the false value as the TypeScript type.
   *
   * @returns - The schema instance restricted to the value false, with the false value inferred as the TypeScript type
   *
   * @example - boolean().onlyFalse(); // Infers the type false
   */
  public onlyFalse(): WithBGuardType<this, false> {
    _setStrictType(this, false);
    return this.custom(isBoolean(false)) as WithBGuardType<this, false>;
  }
}
