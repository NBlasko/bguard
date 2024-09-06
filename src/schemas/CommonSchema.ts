import type { RequiredValidation } from '../ExceptionContext';
import { InferType } from '../InferType';
import { MetaContext, BaseType, WithNull, WithUndefined, TransformCallback } from '../commonTypes';
import { BuildSchemaError } from '../exceptions';
import { ctxSymbol } from '../helpers/core';
import { parseOrFail } from '../parseOrFail';

export type ObjectShapeSchemaType = Record<string, CommonSchema>;

export interface ValidatorContext {
  type: BaseType[];
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
  meta?: MetaContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformListBefore?: TransformCallback<any, any>[];
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
  public default(defaultValue: InferType<this>): this {
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

  /**
   * Applies a transformation to the input value before any validation occurs.
   * The transformation should return a value of the same type as the inferred type of the schema,
   * ensuring that the overall type is not altered.
   *
   * @template In - The type of the input value before transformation (defaults to `unknown`).
   * @param {TransformCallback<In, InferType<this>>} cb - The callback function that performs the transformation.
   * @returns {this} The updated schema with the applied transformation.
   *
   * @example
   * const schema = string()
   *   .nullable()
   *   .transformBeforeValidation((val) => val + '') // Ensure the value is a string
   *   .transformBeforeValidation((val: string) => (val === '' ? null : val)); // Convert empty strings to null
   *
   * // Parse 'test' will pass as 'test' is a valid string longer than 3 characters.
   * parseOrFail(schema, 'test');
   *
   * // Parsing '' will be transformed to null and will pass due to .nullable().
   * parseOrFail(schema, '');
   */
  public transformBeforeValidation<In>(cb: TransformCallback<In, InferType<this>>): this {
    const ctx = this[ctxSymbol];
    if (ctx.transformListBefore) {
      ctx.transformListBefore.push(cb);
    } else {
      ctx.transformListBefore = [cb];
    }

    return this;
  }

  /**
   * Assigns a unique identifier to the schema.
   * This ID can be used to track or map validation errors back to specific fields
   * in a form or other structures.
   *
   * @param {string} value - The unique identifier for the schema.
   * @returns {this} The updated schema with the assigned ID.
   *
   * @example
   * const schema = string().id('username');
   */
  public id(value: string): this {
    return this.meta('id', value);
  }

  /**
   * Provides a description for the schema, offering additional context or information.
   * The description can be used when displaying validation errors or for documentation purposes.
   *
   * @param {string} value - The description for the schema.
   * @returns {this} The updated schema with the added description.
   *
   * @example
   * const schema = string().description('The username of the account holder.');
   */
  public description(value: string): this {
    return this.meta('description', value);
  }

  private meta(key: string, value: string): this {
    const ctx = this[ctxSymbol];
    ctx.meta = { ...ctx.meta, [key]: value };
    return this;
  }

  protected defaultValueCheck() {
    if (this[ctxSymbol].defaultValue !== undefined) {
      throw new BuildSchemaError('Default value must be the last method called in schema');
    }
  }
}

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

export type MapMixTypes<T extends BaseType[]> = T extends (infer U)[]
  ? U extends keyof TypeMapping
    ? TypeMapping[U]
    : never
  : never;
