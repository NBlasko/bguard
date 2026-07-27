import { isValidDateInner } from './helpers/isValidDateInner';
import {
  BaseType,
  MetaContext,
  TransformCallback,
  TranslationErrorMap,
  ValidationErrorData,
  WithArray,
  WithBGuardType,
  WithNull,
  WithObject,
  WithUndefined,
} from './commonTypes';
import { type InferType } from './InferType';
import { BuildSchemaError, ValidationError } from './exceptions';
import { getTranslationByLocale } from './translationMap';
import { ctxSymbol } from './helpers/constants';

const replacePlaceholdersRegex = /{{(.*?)}}/g;

function replacePlaceholders(template: string, replacements: Record<string, unknown>): string {
  return template.replace(replacePlaceholdersRegex, (_, key) => {
    return key in replacements ? `${replacements[key] as string}` : `{{${key}}}`;
  });
}

export class ExceptionContext {
  constructor(
    public readonly initialReceived: unknown,
    public readonly t: TranslationErrorMap,
    public readonly pathToError: string,
    public readonly errors?: ValidationErrorData[],
    public readonly meta?: MetaContext,
  ) {}

  createChild(childPathToError: string, childMeta?: MetaContext) {
    return new ExceptionContext(this.initialReceived, this.t, childPathToError, this.errors, childMeta);
  }

  public ref(path: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ref: any = this.initialReceived;
    const parsedRefPath = path.split('.');
    parsedRefPath.forEach((el) => {
      ref = ref[el];
    });

    return ref;
  }

  public addIssue(expected: unknown, received: unknown, messageKey: string): never | void {
    const rawMessage = this.t[messageKey] ?? messageKey;
    const message = replacePlaceholders(rawMessage, { e: expected, r: received, p: this.pathToError });

    if (this.errors) {
      this.errors.push({
        expected,
        received,
        pathToError: this.pathToError,
        message,
      });

      return;
    }

    throw new ValidationError(expected, received, this.pathToError, message, this.meta);
  }
}

/**
 * A validation function run against an already type-checked value.
 *
 * `T` is the value the assert knows how to inspect, and it is what stops a string assert from
 * being attached to a number schema: `custom` asks for `RequiredValidation<AssertInput<this>>`,
 * and function parameters are compared contravariantly under `strictFunctionTypes`.
 *
 * An assert that genuinely accepts anything should declare `RequiredValidation<unknown>`, which
 * stays assignable to every schema. The default of `any` is deliberate, so that custom asserts
 * written against the previous signature keep compiling.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequiredValidation<T = any> = (received: T, ctx: ExceptionContext) => void;

/**
 * The runtime value a schema hands to its asserts. Nullish is stripped, because `innerCheck`
 * returns before running asserts when the value is `null` or `undefined`.
 */
export type AssertInput<T> =
  T extends WithBGuardType<unknown, infer Y>
    ? NonNullable<Y>
    : T extends WithArray<unknown, unknown>
      ? unknown[]
      : T extends WithObject<unknown, unknown>
        ? Record<string, unknown>
        : unknown;

function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext): unknown {
  const commonTmap = exCtx.t;
  const schemaData = schema[ctxSymbol];

  schemaData.transformListBefore?.forEach((transformCallback) => {
    receivedValue = transformCallback(receivedValue);
  });

  if (receivedValue === undefined) {
    if (schemaData.defaultValue !== undefined) return schemaData.defaultValue;
    if (!schemaData.isOptional) exCtx.addIssue('Required', receivedValue, commonTmap['c:optional']);
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!schemaData.isNullable) exCtx.addIssue('Not null', receivedValue, commonTmap['c:nullable']);
    return receivedValue;
  }

  if (schemaData.date) {
    if (!isValidDateInner(receivedValue)) exCtx.addIssue('Date', receivedValue, commonTmap['c:date']);
  }

  const typeOfVal = typeof receivedValue;

  if (schemaData.type.length) {
    if (!schemaData.type.includes(typeOfVal)) exCtx.addIssue(schemaData.type, typeOfVal, commonTmap['c:invalidType']);
  }

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return exCtx.addIssue('Array', receivedValue, commonTmap['c:array']);

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const schema = schemaData.array;
    const pathToError = exCtx.pathToError;
    const parsedReceivedValue: unknown[] = [];
    receivedValue.forEach((elem, i) => {
      const parsedElement = innerCheck(schema, elem, exCtx.createChild(`${pathToError}[${i}]`, schemaData.meta));
      parsedReceivedValue.push(parsedElement);
    });

    return parsedReceivedValue;
  }

  if (schemaData.object) {
    if (typeOfVal !== 'object') exCtx.addIssue('Object', receivedValue, commonTmap['c:objectType']);
    if (Array.isArray(receivedValue)) exCtx.addIssue('Object', receivedValue, commonTmap['c:objectTypeAsArray']);

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const shapeSchema = schemaData.object;
    const parsedReceivedValue: Record<string, unknown> = {};

    if (!schemaData.allowUnrecognizedObjectProps) {
      for (const keyPerReceivedValue of Object.keys(receivedValue)) {
        if (shapeSchema[keyPerReceivedValue] === undefined)
          exCtx.addIssue('Unrecognized property', keyPerReceivedValue, commonTmap['c:unrecognizedProperty']);
      }
    }

    const pathToError = exCtx.pathToError;
    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          exCtx.addIssue('Required', receivedObjectValuePropery, commonTmap['c:requiredProperty']);
      }

      const parsedReceivedObjectValuePropery = innerCheck(
        valueOfSchema,
        receivedObjectValuePropery,
        exCtx.createChild(`${pathToError}.${keyOfSchema}`, schemaData.meta),
      );

      parsedReceivedValue[keyOfSchema] = parsedReceivedObjectValuePropery;
    }

    return parsedReceivedValue;
  }

  schemaData.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, exCtx);
  });

  return receivedValue;
}

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
  public custom(...validators: RequiredValidation<AssertInput<this>>[]): this {
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

interface ParseOptions {
  /**
   * Set language keyword to map error messages.
   * @default 'default'
   * @example 'sr' or 'Serbia' or any string to identify language
   */
  lng?: string;
}

/**
 * Parses and validates a value against the provided schema, returning a type-safe result.
 *
 * This function will throw a `ValidationError` if the value does not conform to the schema.
 * The inferred TypeScript type of the returned value will match the structure defined by the schema.
 *
 * @template T
 * @param {T} schema - The schema to validate the received value against. This schema dictates the expected structure and type of the value.
 * @param {unknown} receivedValue - The value to be validated and parsed according to the schema.
 * @param {ParseOptions} options - Options
 * @param {ParseOptions.lng} options.lng -  Set language keyword to map Error message
 * @returns {InferType<T>} The validated value, with its TypeScript type inferred from the schema.
 *
 * @throws {ValidationError} If the received value does not match the schema, a `ValidationError` will be thrown.
 * @throws {Error} If an unexpected error occurs during validation, an error will be thrown with a generic message.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number(),
 * });
 *
 * const result = parseOrFail(schema, { name: 'Alice', age: 30 });
 * // result will be inferred as { name: string; age: number }
 *
 * parseOrFail(schema, { name: 'Alice', age: '30' });
 * // Throws ValidationError because 'age' should be a number, not a string.
 */
export function parseOrFail<T extends CommonSchema>(
  schema: T,
  receivedValue: unknown,
  options?: ParseOptions,
): InferType<T> {
  try {
    const ctx = new ExceptionContext(
      receivedValue,
      getTranslationByLocale(options?.lng),
      '',
      undefined,
      schema[ctxSymbol].meta,
    );
    return innerCheck(schema, receivedValue, ctx) as InferType<T>;
  } catch (e) {
    /* istanbul ignore next */
    if (e instanceof ValidationError) throw e;
    /* istanbul ignore next */
    throw new Error('Something unexpected happened');
  }
}

interface ParseOptions {
  /**
   * Set language keyword to map error messages.
   * @default 'default'
   * @example 'sr' or 'Serbia' or any string to identify language
   */
  lng?: string;

  /**
   * If true, collects all validation errors and returns them.
   * If false or undefined, returns the first validation error it can find and stops looking,
   * which provides a small runtime optimization.
   * @default undefined
   */
  getAllErrors?: boolean;
}

/**
 * Parses and validates a value against the provided schema, returning a type-safe parsedValue.
 *
 * This function will throw a `ValidationError` if the value does not conform to the schema.
 * The inferred TypeScript type of the returned value will match the structure defined by the schema.
 *
 * @template T
 * @param {T} schema - The schema to validate the received value against. This schema dictates the expected structure and type of the value.
 * @param {unknown} receivedValue - The value to be validated and parsed according to the schema.
 * @param {ParseOptions} options - Options
 * @param {ParseOptions.lng} options.lng -  Set language keyword to map Error messages
 * @param {ParseOptions.lng} options.getAllErrors - If `false` or `undefined` - returns the first validation error it can find and stops looking, which provides a small runtime optimization.
 * @returns {[undefined, InferType<T>]} A tuple of [undefined, InferType<T>] if parsing is successful.
 * @returns {[ValidationErrorData[], undefined]} A tuple of [ValidationErrorData[], undefined]] if errors occur.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number(),
 * });
 *
 * const [errors, parsedValue]  = parse(schema, { name: 'Alice', age: 30 });
 * // parsedValue will be inferred as { name: string; age: number }
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: 'Alice', age: '30' });
 * // First element in array "errors" will have an error because 'age' should be a number, not a string.
 * // Array 'errors' returns only one element.
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: true, age: '30' }, { getAllErrors: true});
 * // Returns array "errors" with multiple errors because 'age' should be a number and 'name' a string.
 * // With provided options { getAllErrors: true}, we can expecte more than one error in 'errors' array.
 *
 *
 *  const [errors, parsedValue] = parse(schema, { name: true, age: '30' }, { lng: 'SR'});
 * // First element in array "errors" will have an error because 'age' should be a number, not a string.
 * // With provided options { lng: 'SR'}, errors will be translated to a language mapped with keyword 'SR'
 */
export function parse<T extends CommonSchema>(
  schema: T,
  receivedValue: unknown,
  options?: ParseOptions,
): [ValidationErrorData[], undefined] | [undefined, InferType<T>] {
  try {
    const ctx = new ExceptionContext(
      receivedValue,
      getTranslationByLocale(options?.lng),
      '',
      options?.getAllErrors ? [] : undefined,
      schema[ctxSymbol].meta,
    );

    const parsedValue = innerCheck(schema, receivedValue, ctx) as InferType<T>;

    if (ctx.errors?.length) {
      return [ctx.errors, undefined];
    }

    return [undefined, parsedValue];
  } catch (e) {
    /* istanbul ignore next */
    if (e instanceof ValidationError) {
      delete e.stack;
      return [[e], undefined];
    }
    /* istanbul ignore next */
    return [
      [
        {
          message: 'Something unexpected happened',
          expected: '',
          received: '',
          pathToError: '',
          meta: undefined,
        },
      ],
      undefined,
    ];
  }
}
