import { CommonSchema, ExceptionContext } from './CommonSchema';
import { throwException } from '../exceptions';

const isBoolean = (expected: boolean) => (received: boolean, ctx: ExceptionContext) => {
  // TODO ovde ce biti problem oko prevoda, da vidim kako da uvedem dinamicke vrednosti u message
  if (received !== expected) throwException(expected, received, ctx, 'The received value is not {{e}}');
};

export class BooleanSchema extends CommonSchema {
  _boolean = 1;

  /**
   * Restricts the schema to exactly match the boolean value true and infers the true value as the TypeScript type.
   *
   * @returns - The schema instance restricted to the value true, with the true value inferred as the TypeScript type
   *
   * @example - boolean().onlyTrue(); // Infers the type true
   */
  onlyTrue(): WithBoolean<this, true> {
    return this.custom(isBoolean(true)) as WithBoolean<this, true>;
  }

  /**
   * Restricts the schema to exactly match the boolean value false and infers the false value as the TypeScript type.
   *
   * @returns - The schema instance restricted to the value false, with the false value inferred as the TypeScript type
   *
   * @example - boolean().onlyFalse(); // Infers the type false
   */
  onlyFalse(): WithBoolean<this, false> {
    return this.custom(isBoolean(false)) as WithBoolean<this, false>;
  }
}

export type WithBoolean<T extends BooleanSchema, Y = boolean> = T & { validation_boolean: Y };
export type ExtractFromBoolean<T> = T extends WithBoolean<BooleanSchema, infer Y> ? Y : never;
