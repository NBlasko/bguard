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
  WithRecord,
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
    let ref: unknown = this.initialReceived;

    for (const el of path.split('.')) {
      // A path that runs past the end of the data yields undefined. Indexing straight into it threw
      // a TypeError, which parseOrFail turned into a bare 'Something unexpected happened' with no
      // indication of which assert or which path was at fault.
      if (ref === null || ref === undefined) return undefined;
      ref = (ref as Record<string, unknown>)[el];
    }

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
        meta: this.meta,
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
        : T extends WithRecord<unknown, unknown, unknown>
          ? Record<string, unknown>
          : unknown;

function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext): unknown {
  const commonTmap = exCtx.t;
  const schemaData = schema[ctxSymbol];

  // Nothing to transform when the value is absent. Running the list anyway turned `undefined` into
  // whatever the callback made of it, so an optional string with a `val + ''` transform parsed to
  // the string 'undefined'.
  if (receivedValue !== undefined) {
    schemaData.transformListBefore?.forEach((transformCallback) => {
      receivedValue = transformCallback(receivedValue);
    });
  }

  if (receivedValue === undefined) {
    if (schemaData.defaultValue === undefined) {
      if (!schemaData.isOptional) exCtx.addIssue('Required', receivedValue, commonTmap['c:optional']);
      return receivedValue;
    }

    // Carry on with the default as the received value rather than returning it. Returning it handed
    // every parse the same array or object, so mutating one result changed what later parses gave
    // back; going through validation rebuilds containers and yields a fresh value each time.
    receivedValue = schemaData.defaultValue;
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
    // NaN is a number by typeof, and every comparison against it is false, so it slipped past
    // min, max, positive and negative alike.
    else if (typeOfVal === 'number' && Number.isNaN(receivedValue))
      exCtx.addIssue('number', receivedValue, commonTmap['c:nan']);
  }

  if (schemaData.union) {
    // The union's own asserts see the value whichever member ends up matching, so they are declared
    // over `unknown` and run before any member is tried.
    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const attemptErrors: ValidationErrorData[] = [];
    for (const memberSchema of schemaData.union) {
      const errorsBefore = attemptErrors.length;
      // Each member is tried against a context that collects instead of throwing, so a member that
      // does not match is not fatal. Only a member that produces nothing wins.
      const attemptCtx = new ExceptionContext(
        exCtx.initialReceived,
        exCtx.t,
        exCtx.pathToError,
        attemptErrors,
        schemaData.meta,
      );

      const parsedMember = innerCheck(memberSchema, receivedValue, attemptCtx);
      if (attemptErrors.length === errorsBefore) return parsedMember;
    }

    exCtx.addIssue('One of the union members', receivedValue, commonTmap['c:union']);
    return receivedValue;
  }

  if (schemaData.record) {
    if (typeOfVal !== 'object' || Array.isArray(receivedValue)) {
      if (Array.isArray(receivedValue)) {
        exCtx.addIssue('Object', receivedValue, commonTmap['c:objectTypeAsArray']);
      } else {
        exCtx.addIssue('Object', receivedValue, commonTmap['c:objectType']);
      }

      return receivedValue;
    }

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const { key: keySchema, value: valueSchema } = schemaData.record;
    const recordPath = exCtx.pathToError;
    const parsedRecord: Record<string, unknown> = {};

    for (const [receivedKey, receivedRecordValue] of Object.entries(receivedValue as Record<string, unknown>)) {
      const childCtx = exCtx.createChild(`${recordPath}.${receivedKey}`, schemaData.meta);

      // Keys are validated too, which is what makes a restricted key type meaningful.
      innerCheck(keySchema, receivedKey, childCtx);
      parsedRecord[receivedKey] = innerCheck(valueSchema, receivedRecordValue, childCtx);
    }

    return parsedRecord;
  }

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return exCtx.addIssue('Array', receivedValue, commonTmap['c:array']);

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const schema = schemaData.array;
    const pathToError = exCtx.pathToError;
    const parsedReceivedValue: unknown[] = [];
    // Indexed rather than forEach, which skips holes: a sparse array used to come back shorter than
    // it went in, with no error to say so. A hole now reaches innerCheck as undefined and is
    // reported unless the element schema is optional.
    for (let i = 0; i < receivedValue.length; i++) {
      const parsedElement = innerCheck(
        schema,
        receivedValue[i],
        // The element's own metadata wins; the array's is inherited when it has none.
        exCtx.createChild(`${pathToError}[${i}]`, schema[ctxSymbol].meta ?? schemaData.meta),
      );
      parsedReceivedValue.push(parsedElement);
    }

    return parsedReceivedValue;
  }

  if (schemaData.object) {
    if (typeOfVal !== 'object' || Array.isArray(receivedValue)) {
      // Reported and then abandoned. When errors are collected rather than thrown, walking the
      // shape of a non-object went on to invent one "unrecognized property" per string index and
      // one "missing property" per declared key, so a single wrong type produced seven errors.
      if (Array.isArray(receivedValue)) {
        exCtx.addIssue('Object', receivedValue, commonTmap['c:objectTypeAsArray']);
      } else {
        exCtx.addIssue('Object', receivedValue, commonTmap['c:objectType']);
      }

      return receivedValue;
    }

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const shapeSchema = schemaData.object;
    const parsedReceivedValue: Record<string, unknown> = {};
    // Null was handled above and the type guard just ruled out arrays and non-objects.
    const receivedObject = receivedValue as Record<string, unknown>;

    if (!schemaData.allowUnrecognizedObjectProps) {
      for (const keyPerReceivedValue of Object.keys(receivedObject)) {
        // An own-property check, not an undefined check: `constructor`, `toString` and `__proto__`
        // all resolve on Object.prototype, so a plain lookup accepted them as declared properties
        // and then dropped them from the output. Spelled out rather than via Object.hasOwn, which
        // would add a runtime floor the package does not otherwise require.
        if (!Object.prototype.hasOwnProperty.call(shapeSchema, keyPerReceivedValue))
          exCtx.addIssue('Unrecognized property', keyPerReceivedValue, commonTmap['c:unrecognizedProperty']);
      }
    }

    const pathToError = exCtx.pathToError;
    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const valueSchemaData = valueOfSchema[ctxSymbol];
      const receivedObjectValuePropery = receivedObject[keyOfSchema];
      if (
        receivedObjectValuePropery === undefined &&
        !valueSchemaData.isOptional &&
        // A property with a default is not missing: innerCheck substitutes the value below. The
        // check used to run first and reject it, so default() could never apply to a property.
        valueSchemaData.defaultValue === undefined
      ) {
        exCtx.addIssue('Required', receivedObjectValuePropery, commonTmap['c:requiredProperty']);
        // Stop here, or innerCheck reports the same missing value again as 'c:optional'.
        continue;
      }

      const parsedReceivedObjectValuePropery = innerCheck(
        valueOfSchema,
        receivedObjectValuePropery,
        exCtx.createChild(`${pathToError}.${keyOfSchema}`, valueSchemaData.meta ?? schemaData.meta),
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

export interface RecordSchemaType {
  key: CommonSchema;
  value: CommonSchema;
}

export interface ValidatorContext {
  type: BaseType[];
  isNullable?: boolean;
  isOptional?: boolean;
  requiredValidations: RequiredValidation[];
  array?: CommonSchema;
  object?: ObjectShapeSchemaType;
  union?: CommonSchema[];
  record?: RecordSchemaType;
  allowUnrecognizedObjectProps?: boolean;
  strictType?: boolean;
  strictTypeValue?: unknown;
  date?: boolean;
  defaultValue?: unknown;
  meta?: MetaContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformListBefore?: TransformCallback<any, any>[];
}

/**
 * Copies a context so a derived schema can be changed without touching the one it came from.
 *
 * Child schemas in `array` and `object` are shared by reference rather than copied. That is safe
 * because schemas are immutable: refining a child produces a new instance instead of altering the
 * shared one. Only the containers themselves are re-allocated, so adding a key to a derived
 * object schema cannot be seen by the original.
 */
function cloneValidatorContext(ctx: ValidatorContext): ValidatorContext {
  const next: ValidatorContext = {
    ...ctx,
    type: [...ctx.type],
    requiredValidations: [...ctx.requiredValidations],
  };

  if (ctx.object) next.object = { ...ctx.object };
  if (ctx.union) next.union = [...ctx.union];
  if (ctx.record) next.record = { ...ctx.record };
  if (ctx.transformListBefore) next.transformListBefore = [...ctx.transformListBefore];
  if (ctx.meta) next.meta = { ...ctx.meta };

  return next;
}

export class CommonSchema {
  [ctxSymbol]: ValidatorContext;
  constructor(ctx: ValidatorContext) {
    this[ctxSymbol] = ctx;
  }

  /**
   * Returns a copy of this schema that carries its own context.
   *
   * Every refining method goes through this, so a schema can be shared between properties and
   * reused as a base without one use leaking into another. Construction is deliberately bypassed:
   * the subclass constructors validate their arguments and take extra parameters, and neither
   * applies when deriving from an already-valid schema.
   */
  protected clone(): this {
    const next = Object.assign(Object.create(Object.getPrototypeOf(this) as object), this) as this;
    next[ctxSymbol] = cloneValidatorContext(this[ctxSymbol]);
    return next;
  }

  /**
   * @param validators - One or more custom validation functions.
   * @returns {this} A new schema instance with the added custom validation.
   */
  public custom(...validators: RequiredValidation<AssertInput<this>>[]): this {
    this.defaultValueCheck();
    const next = this.clone();
    next[ctxSymbol].requiredValidations.push(...validators);
    return next;
  }

  /**
   * Marks the schema as nullable, allowing the value to be `null`.
   *
   * @returns {WithNull<this>} A new schema instance marked as nullable.
   */
  public nullable(): WithNull<this> {
    this.defaultValueCheck();
    const next = this.clone();
    next[ctxSymbol].isNullable = true;
    return next as WithNull<this>;
  }

  /**
   * Marks the schema as optional, allowing the value to be `undefined`.
   *
   * @returns {WithUndefined<this>} A new schema instance marked as optional.
   */
  public optional(): WithUndefined<this> {
    this.defaultValueCheck();
    const next = this.clone();
    next[ctxSymbol].isOptional = true;
    return next as WithUndefined<this>;
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

    const next = this.clone();
    next[ctxSymbol].defaultValue = defaultValue;
    return next;
  }

  /**
   * Applies a transformation to the input value before any validation occurs.
   * The transformation should return a value of the same type as the inferred type of the schema,
   * ensuring that the overall type is not altered.
   *
   * @template In - The type of the input value before transformation (defaults to `unknown`).
   * @param {TransformCallback<In, InferType<this>>} cb - The callback function that performs the transformation.
   * @returns {this} A new schema with the applied transformation.
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
    const next = this.clone();
    const ctx = next[ctxSymbol];
    if (ctx.transformListBefore) {
      ctx.transformListBefore.push(cb);
    } else {
      ctx.transformListBefore = [cb];
    }

    return next;
  }

  /**
   * Assigns a unique identifier to the schema.
   * This ID can be used to track or map validation errors back to specific fields
   * in a form or other structures.
   *
   * @param {string} value - The unique identifier for the schema.
   * @returns {this} A new schema with the assigned ID.
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
   * @returns {this} A new schema with the added description.
   *
   * @example
   * const schema = string().description('The username of the account holder.');
   */
  public description(value: string): this {
    return this.meta('description', value);
  }

  private meta(key: string, value: string): this {
    const next = this.clone();
    const ctx = next[ctxSymbol];
    ctx.meta = { ...ctx.meta, [key]: value };
    return next;
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
): [ValidationErrorData[], null] | [null, InferType<T>] {
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
      return [ctx.errors, null];
    }

    return [null, parsedValue];
  } catch (e) {
    /* istanbul ignore next */
    if (e instanceof ValidationError) {
      delete e.stack;
      return [[e], null];
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
      null,
    ];
  }
}
