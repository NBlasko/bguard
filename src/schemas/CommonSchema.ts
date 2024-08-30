import { PrimitiveType, RequiredValidation } from '../commonTypes';
import { BuildSchemaError } from '../exceptions';
import { ctxSymbol } from '../helpers/core';
import { parseOrFail } from '../parseOrFail';

export type ObjectShapeSchemaType = Record<string, CommonSchema>;

export interface ValidatorContext {
  type: PrimitiveType[];
  isNullable?: boolean;
  isOptional?: boolean;
  requiredValidations: RequiredValidation[];
  array?: CommonSchema;
  object?: ObjectShapeSchemaType;
  allowUnrecognizedObjectProps?: boolean;
  strictType?: boolean;
  strictTypeValue?: unknown;
  date?: boolean;
  defaultValue?: unknown;
}

export class CommonSchema {
  [ctxSymbol]: ValidatorContext;
  constructor(ctx: ValidatorContext) {
    this[ctxSymbol] = ctx;
  }

  /**
   * @param validators - One or more custom validation functions.
   * @returns {this} The schema instance with the added custom validation.
   */
  public custom(...validators: RequiredValidation[]): this {
    this.defaultValueCheck();
    this[ctxSymbol].requiredValidations.push(...validators);
    return this;
  }

  /**
   * Marks the schema as nullable, allowing the value to be `null`.
   *
   * @returns {WithNull<this>} The schema instance marked as nullable.
   */
  public nullable(): WithNull<this> {
    this.defaultValueCheck();
    this[ctxSymbol].isNullable = true;
    return this as WithNull<this>;
  }

  /**
   * Marks the schema as optional, allowing the value to be `undefined`.
   *
   * @returns {WithUndefined<this>} The schema instance marked as optional.
   */
  public optional(): WithUndefined<this> {
    this.defaultValueCheck();
    this[ctxSymbol].isOptional = true;
    return this as WithUndefined<this>;
  }

  /**
   * Marks the schema as optional, allowing the value to be `undefined`.
   *
   * @returns {this} The schema instance. This method should be used as a last one because it does the check of previous methods and
   */
  public default(defaultValue: unknown): this {
    const ctx = this[ctxSymbol];
    if (ctx.isOptional) {
      throw new BuildSchemaError(`Cannot call method 'default' after method 'optional'`);
    }

    try {
      parseOrFail(this, defaultValue);
    } catch (e) {
      throw new BuildSchemaError((e as Error).message);
    }

    this[ctxSymbol].defaultValue = defaultValue;
    return this;
  }

  protected defaultValueCheck() {
    if (this[ctxSymbol].defaultValue !== undefined) {
      throw new BuildSchemaError('Default value must be the last method called in schema');
    }
  }
}

export type WithNull<T extends CommonSchema> = T & { validation_null: true };
export type WithUndefined<T extends CommonSchema> = T & { validation_undefined: true };

type TypeMapping = {
  number: number;
  string: string;
  boolean: boolean;
  undefined: undefined;
  object: object;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function: Function;
  symbol: symbol;
  bigint: bigint;
};

export type WithMix<Y = unknown> = CommonSchema & { validation_mix: Y };
export type ExtractFromMix<T> = T extends WithMix<infer X> ? X : never;

export type MapMixTypes<T extends PrimitiveType[]> = T extends (infer U)[]
  ? U extends keyof TypeMapping
    ? TypeMapping[U]
    : never
  : never;
