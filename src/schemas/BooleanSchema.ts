import { CommonSchema } from './CommonSchema';
import { guardException } from '../exceptions';
import { ExceptionContext, WithBGuardType } from '../commonTypes';
import { _setStrictType } from '../helpers/setStrictType';

const isBoolean = (expected: boolean) => (received: boolean, ctx: ExceptionContext) => {
  if (received !== expected) guardException(expected, received, ctx, 'c:isBoolean');
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

// export type WithBoolean<T extends BooleanSchema, Y = boolean> = T & { validation_boolean: Y };
// export type ExtractFromBoolean<T> = T extends WithBoolean<BooleanSchema, infer Y> ? Y : never;
