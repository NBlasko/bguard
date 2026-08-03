import { isValidDateInner } from './helpers/isValidDateInner';
import {
  BaseType,
  MetaContext,
  TransformCallback,
  TranslationErrorMap,
  ValidationErrorData,
  WithArray,
  WithBGuardType,
  WithDefault,
  WithInput,
  WithNull,
  WithObject,
  WithRecord,
  WithTuple,
  WithUndefined,
} from './commonTypes';
import { type InferInput, type InferType } from './InferType';
import { BuildSchemaError, ValidationError } from './exceptions';
import { getTranslationByLocale } from './translationMap';
import { ctxSymbol } from './helpers/constants';
import { pickPath } from './helpers/pickPath';
import type { StandardSchemaProps, StandardSchemaResult } from './standardSchema';
import type { RefRead } from './refTracking';

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
    /** The same location as `pathToError`, as keys. A string path cannot be taken apart again
     * reliably, because a key may itself contain a dot or a bracket. */
    public readonly path: readonly PropertyKey[] = [],
    /** Where async validations are collected. Absent during a synchronous parse, which is how one
     * is detected and reported rather than silently skipped. */
    public readonly pending?: PendingValidation[],
    /** Where `ref` reads are recorded, when a caller asked for them. Absent by default, so a parse
     * that does not want the dependency graph pays nothing for it. See `refTracking.ts`. */
    public readonly refReads?: RefRead[],
  ) {}

  /**
   * The same location, reporting into a different errors list.
   *
   * A union tries each member against a throwaway list so a member that does not match is not fatal.
   * An async validation reached inside the winning member is awaited long after that decision, so it
   * has to be re-pointed at the real list or its issues would be collected where nobody reads them.
   */
  withErrors(errors?: ValidationErrorData[]) {
    return new ExceptionContext(
      this.initialReceived,
      this.t,
      this.pathToError,
      errors,
      this.meta,
      this.path,
      this.pending,
      this.refReads,
    );
  }

  /**
   * Records async validations to be awaited once the walk is over.
   *
   * Throws during a synchronous parse rather than dropping them: a validation that never runs is worse
   * than a clear instruction to use parseAsync.
   */
  enqueueAsync(validations: AsyncRequiredValidation[], received: unknown) {
    if (!this.pending) throw new BuildSchemaError('Schema has an async validation. Use parseAsync or parseOrFailAsync');

    this.pending.push({ validations, received, ctx: this });
  }

  /**
   * Descends into a property or an index, deriving both forms of the location from the same key so
   * they cannot disagree.
   */
  createChild(pathSegment: PropertyKey, childMeta?: MetaContext) {
    const childPathToError =
      typeof pathSegment === 'number'
        ? `${this.pathToError}[${pathSegment}]`
        : `${this.pathToError}.${String(pathSegment)}`;

    return new ExceptionContext(
      this.initialReceived,
      this.t,
      childPathToError,
      this.errors,
      childMeta,
      [...this.path, pathSegment],
      this.pending,
      this.refReads,
    );
  }

  /**
   * Another property of the value being validated, for a rule about two fields.
   *
   * Two ways to say which one. **Prefer the callback**: it is checked by the compiler, and it hands
   * back the property's own type instead of `unknown`.
   *
   * ```ts
   * type Signup = InferType<typeof signupSchema>;
   *
   * const signupSchema = object({
   *   password: string(),
   *   confirm: string().custom((received, ctx) => {
   *     // string — no cast, and `pasword` would not compile
   *     if (received !== ctx.ref((root: Signup) => root.password)) {
   *       ctx.addIssue('the same password', received, 'u:mismatch');
   *     }
   *   }),
   * });
   * ```
   *
   * The type is written on the callback's parameter rather than as `ref<Signup>(…)`, because
   * TypeScript takes explicit type arguments all or none: supplying the root would mean supplying the
   * result too, and the result is the thing worth inferring. Annotating the parameter infers both.
   *
   * `InferType<typeof signupSchema>` inside the schema's own definition is not circular — a type
   * alias is hoisted, and the callback's return type takes no part in inferring the object's shape.
   * Verified against `tsc`, including nested properties and array elements.
   *
   * The string form stays, unchanged, for a path only known at runtime:
   *
   * ```ts
   * ctx.ref('home.city'); // unknown
   * ```
   *
   * Both forms read the value the parse STARTED with, before any `transformBeforeValidation`, so a
   * cross-property comparison means the same thing however the value is later reshaped.
   */
  public ref(path: string): unknown;
  public ref<T, V>(pick: (root: T) => V): V;
  public ref<T, V>(pathOrPick: string | ((root: T) => V)): unknown {
    const segments = typeof pathOrPick === 'string' ? pathOrPick.split('.') : pickPath(pathOrPick);

    // Recorded before the walk, not after, so a read is known even when the path runs past the end of
    // the data: `confirm` depends on `password` whether or not `password` is present yet, and an
    // absent value is exactly when a form is being filled in.
    //
    // `to` is the dotted string either way, so a consumer reading the dependency graph does not have
    // to care which form the rule was written in.
    this.refReads?.push({
      from: this.path,
      fromPath: this.pathToError,
      to: segments.join('.'),
      toPath: segments,
    });

    let ref: unknown = this.initialReceived;

    for (const el of segments) {
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
        path: this.path,
        code: messageKey,
        message,
        meta: this.meta,
      });

      return;
    }

    throw new ValidationError(expected, received, this.pathToError, message, this.meta, this.path, messageKey);
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
 * A validation that has to wait for something — a database lookup, an HTTP call.
 *
 * Registered with `customAsync` and run by `parseAsync`. Asserts only add issues, they never change the
 * value, so the value the synchronous walk produced is already final by the time these run.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AsyncRequiredValidation<T = any> = (received: T, ctx: ExceptionContext) => Promise<void>;

/** An async validation that has been reached, waiting to be awaited once the walk is over. */
interface PendingValidation {
  validations: AsyncRequiredValidation[];
  received: unknown;
  ctx: ExceptionContext;
}

/**
 * The runtime value a schema hands to its asserts. Nullish is stripped, because `innerCheck`
 * returns before running asserts when the value is `null` or `undefined`.
 */
export type AssertInput<T> =
  T extends WithBGuardType<unknown, infer Y>
    ? NonNullable<Y>
    : T extends WithArray<unknown, unknown>
      ? unknown[]
      : T extends WithTuple<unknown, unknown>
        ? unknown[]
        : T extends WithObject<unknown, unknown>
          ? Record<string, unknown>
          : T extends WithRecord<unknown, unknown, unknown>
            ? Record<string, unknown>
            : unknown;

/**
 * Runs a schema's own assertions. The async ones are only enqueued: they are awaited after the walk,
 * so a slow check never holds up the structural validation around it.
 */
function runValidations(schemaData: ValidatorContext, receivedValue: unknown, exCtx: ExceptionContext) {
  schemaData.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, exCtx);
  });

  if (schemaData.asyncValidations?.length) exCtx.enqueueAsync(schemaData.asyncValidations, receivedValue);
}

function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext): unknown {
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
      if (!schemaData.isOptional) exCtx.addIssue('Required', receivedValue, 'c:optional');
      return receivedValue;
    }

    // Carry on with the default as the received value rather than returning it. Returning it handed
    // every parse the same array or object, so mutating one result changed what later parses gave
    // back; going through validation rebuilds containers and yields a fresh value each time.
    receivedValue = schemaData.defaultValue;
  }

  if (receivedValue === null) {
    if (!schemaData.isNullable) exCtx.addIssue('Not null', receivedValue, 'c:nullable');
    return receivedValue;
  }

  if (schemaData.date) {
    if (!isValidDateInner(receivedValue)) exCtx.addIssue('Date', receivedValue, 'c:date');
  }

  const typeOfVal = typeof receivedValue;

  if (schemaData.type.length) {
    if (!schemaData.type.includes(typeOfVal)) exCtx.addIssue(schemaData.type, typeOfVal, 'c:invalidType');
    // NaN is a number by typeof, and every comparison against it is false, so it slipped past
    // min, max, positive and negative alike.
    else if (typeOfVal === 'number' && Number.isNaN(receivedValue)) exCtx.addIssue('number', receivedValue, 'c:nan');
  }

  if (schemaData.lazy) {
    // Resolved on first use rather than at construction, which is what lets a schema refer to
    // itself. The result is cached on the context so the thunk runs once.
    schemaData.lazy.resolved ??= schemaData.lazy.getSchema();

    if (!(schemaData.lazy.resolved instanceof CommonSchema))
      throw new BuildSchemaError('Invalid schema returned from lazy method');

    return innerCheck(schemaData.lazy.resolved, receivedValue, exCtx);
  }

  if (schemaData.tuple) {
    if (!Array.isArray(receivedValue)) return exCtx.addIssue('Array', receivedValue, 'c:array');

    runValidations(schemaData, receivedValue, exCtx);

    if (receivedValue.length !== schemaData.tuple.length) {
      // Reported and then abandoned: walking the declared positions as well would add a "required"
      // error for every position the value does not reach, which says nothing further.
      exCtx.addIssue(schemaData.tuple.length, receivedValue.length, 'c:tupleLength');
      return receivedValue;
    }

    const parsedTuple: unknown[] = [];

    for (let i = 0; i < schemaData.tuple.length; i++) {
      const positionSchema = schemaData.tuple[i] as CommonSchema;
      parsedTuple.push(
        innerCheck(
          positionSchema,
          receivedValue[i],
          exCtx.createChild(i, positionSchema[ctxSymbol].meta ?? schemaData.meta),
        ),
      );
    }

    return parsedTuple;
  }

  if (schemaData.union) {
    // The union's own asserts see the value whichever member ends up matching, so they are declared
    // over `unknown` and run before any member is tried.
    runValidations(schemaData, receivedValue, exCtx);

    const attemptErrors: ValidationErrorData[] = [];
    for (const memberSchema of schemaData.union) {
      const errorsBefore = attemptErrors.length;
      // Async validations reached inside a member are collected separately and only kept if that member
      // wins. Sharing the outer list would let a rejected member's validations run and report issues.
      const attemptPending: PendingValidation[] = [];
      // Each member is tried against a context that collects instead of throwing, so a member that
      // does not match is not fatal. Only a member that produces nothing wins.
      const attemptCtx = new ExceptionContext(
        exCtx.initialReceived,
        exCtx.t,
        exCtx.pathToError,
        attemptErrors,
        schemaData.meta,
        // Carried over, so an async validation inside the winning member keeps the right location.
        exCtx.path,
        exCtx.pending && attemptPending,
        // NOT held back like the errors and the pending validations are. A read is a fact about what
        // ran, and a member that loses still read what it read — so recording it keeps the graph on
        // the safe side, where a dependency is known rather than missed. See `refTracking.ts`.
        exCtx.refReads,
      );

      const parsedMember = innerCheck(memberSchema, receivedValue, attemptCtx);
      if (attemptErrors.length === errorsBefore) {
        for (const entry of attemptPending) {
          exCtx.pending?.push({ ...entry, ctx: entry.ctx.withErrors(exCtx.errors) });
        }

        return parsedMember;
      }
    }

    exCtx.addIssue('One of the union members', receivedValue, 'c:union');
    return receivedValue;
  }

  if (schemaData.record) {
    if (typeOfVal !== 'object' || Array.isArray(receivedValue)) {
      if (Array.isArray(receivedValue)) {
        exCtx.addIssue('Object', receivedValue, 'c:objectTypeAsArray');
      } else {
        exCtx.addIssue('Object', receivedValue, 'c:objectType');
      }

      return receivedValue;
    }

    runValidations(schemaData, receivedValue, exCtx);

    const { key: keySchema, value: valueSchema } = schemaData.record;
    const parsedRecord: Record<string, unknown> = {};

    for (const [receivedKey, receivedRecordValue] of Object.entries(receivedValue as Record<string, unknown>)) {
      const childCtx = exCtx.createChild(receivedKey, schemaData.meta);

      // Keys are validated too, which is what makes a restricted key type meaningful.
      innerCheck(keySchema, receivedKey, childCtx);
      parsedRecord[receivedKey] = innerCheck(valueSchema, receivedRecordValue, childCtx);
    }

    return parsedRecord;
  }

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return exCtx.addIssue('Array', receivedValue, 'c:array');

    runValidations(schemaData, receivedValue, exCtx);

    const schema = schemaData.array;
    const parsedReceivedValue: unknown[] = [];
    // Indexed rather than forEach, which skips holes: a sparse array used to come back shorter than
    // it went in, with no error to say so. A hole now reaches innerCheck as undefined and is
    // reported unless the element schema is optional.
    for (let i = 0; i < receivedValue.length; i++) {
      const parsedElement = innerCheck(
        schema,
        receivedValue[i],
        // The element's own metadata wins; the array's is inherited when it has none.
        exCtx.createChild(i, schema[ctxSymbol].meta ?? schemaData.meta),
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
        exCtx.addIssue('Object', receivedValue, 'c:objectTypeAsArray');
      } else {
        exCtx.addIssue('Object', receivedValue, 'c:objectType');
      }

      return receivedValue;
    }

    runValidations(schemaData, receivedValue, exCtx);

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
          exCtx.addIssue('Unrecognized property', keyPerReceivedValue, 'c:unrecognizedProperty');
      }
    }

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
        // Reported at the property's own path, not the container's. Reporting it on the container
        // gave every missing property the same empty path, so neither an error list nor a Standard
        // Schema consumer could tell which field was missing — or tell two of them apart.
        exCtx
          .createChild(keyOfSchema, valueSchemaData.meta ?? schemaData.meta)
          .addIssue('Required', receivedObjectValuePropery, 'c:requiredProperty');

        // Stop here, or innerCheck reports the same missing value again as 'c:optional'.
        continue;
      }

      const parsedReceivedObjectValuePropery = innerCheck(
        valueOfSchema,
        receivedObjectValuePropery,
        exCtx.createChild(keyOfSchema, valueSchemaData.meta ?? schemaData.meta),
      );

      // Only carried over when there is something to carry. Assigning unconditionally gave an absent
      // optional property a present key holding undefined, so `Object.keys` and `in` reported a field
      // nobody sent — invisible through JSON.stringify, which drops such keys. A property the input
      // did hold is kept even when its value is undefined, and one with a default has a value by now.
      if (
        parsedReceivedObjectValuePropery !== undefined ||
        Object.prototype.hasOwnProperty.call(receivedObject, keyOfSchema)
      ) {
        parsedReceivedValue[keyOfSchema] = parsedReceivedObjectValuePropery;
      }
    }

    return parsedReceivedValue;
  }

  runValidations(schemaData, receivedValue, exCtx);

  return receivedValue;
}

export type ObjectShapeSchemaType = Record<string, CommonSchema>;

export interface RecordSchemaType {
  key: CommonSchema;
  value: CommonSchema;
}

export interface LazySchemaType {
  /** The name codeGen emits at the recursion point, instead of descending forever. */
  typeName: string;
  getSchema: () => CommonSchema;
  /** Filled on first use, so the thunk runs once however many values are validated. */
  resolved?: CommonSchema;
}

export interface ValidatorContext {
  type: BaseType[];
  isNullable?: boolean;
  isOptional?: boolean;
  requiredValidations: RequiredValidation[];
  asyncValidations?: AsyncRequiredValidation[];
  array?: CommonSchema;
  object?: ObjectShapeSchemaType;
  union?: CommonSchema[];
  record?: RecordSchemaType;
  tuple?: CommonSchema[];
  lazy?: LazySchemaType;
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

  if (ctx.asyncValidations) next.asyncValidations = [...ctx.asyncValidations];
  if (ctx.object) next.object = { ...ctx.object };
  if (ctx.union) next.union = [...ctx.union];
  if (ctx.record) next.record = { ...ctx.record };
  if (ctx.tuple) next.tuple = [...ctx.tuple];
  if (ctx.lazy) next.lazy = { ...ctx.lazy };
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
   * The Standard Schema v1 interface, which lets a bguard schema be used by any library that accepts
   * a validator without either side knowing about the other.
   *
   * A getter rather than a stored property, so it costs nothing until something asks for it and is
   * not copied by `clone`. `types` is declared but deliberately never assigned: the spec defines it
   * as type-only. Input and output are reported separately, so a consumer generating a form asks for
   * what the schema takes rather than what it returns.
   */
  public get '~standard'(): StandardSchemaProps<InferInput<this>, InferType<this>> {
    return {
      version: 1,
      vendor: 'bguard',
      // An arrow function, so `this` is the schema however the property is destructured or passed on.
      validate: (value: unknown) => {
        // The spec allows either a result or a promise of one, decided per call. A schema with async
        // validations returns a promise; everything else stays synchronous, so a consumer that never
        // awaits keeps working.
        if (hasAsyncValidation(this)) return parseAsync(this, value, { getAllErrors: true }).then(toStandardResult);

        return toStandardResult(parse(this, value, { getAllErrors: true }));
      },
    };
  }

  /**
   * Returns a copy of this schema that carries its own context.
   *
   * Every refining method goes through this, so a schema can be shared between properties and
   * reused as a base without one use leaking into another. Construction is deliberately bypassed:
   * the subclass constructors validate their arguments and take extra parameters, and neither
   * applies when deriving from an already-valid schema.
   *
   * Public because deriving a schema is a reasonable thing to do from outside as well — the object
   * utilities need it to rebuild a property schema without touching the one they were handed.
   */
  public clone(): this {
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
   * Adds validations that have to wait for something, such as a database lookup.
   *
   * These run only under `parseAsync` or `parseOrFailAsync`; a synchronous parse reports a
   * `BuildSchemaError` rather than skipping them. They are awaited after the structural walk is
   * complete, all together, so several slow checks across a schema cost one round of waiting.
   *
   * @param validators - One or more async validation functions.
   * @returns {this} A new schema instance with the added validations.
   * @example
   * const schema = string().customAsync(async (received, ctx) => {
   *   if (await isTaken(received)) ctx.addIssue('an unused name', received, 'name is taken');
   * });
   */
  public customAsync(...validators: AsyncRequiredValidation<AssertInput<this>>[]): this {
    this.defaultValueCheck();
    const next = this.clone();
    next[ctxSymbol].asyncValidations = [...(next[ctxSymbol].asyncValidations ?? []), ...validators];
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
  public default(defaultValue: InferType<this>): WithDefault<this> {
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
    return next as WithDefault<this>;
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
  public transformBeforeValidation<In>(cb: TransformCallback<In, InferType<this>>): WithInput<this, In> {
    const next = this.clone();
    const ctx = next[ctxSymbol];
    if (ctx.transformListBefore) {
      ctx.transformListBefore.push(cb);
    } else {
      ctx.transformListBefore = [cb];
    }

    // The callback's parameter type becomes the schema's input type, which is what lets a coercing
    // schema say that it accepts more than it produces.
    return next as WithInput<this, In>;
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
      // Two positional skips to reach `refReads`: the root `path`, left to the constructor's own
      // default rather than repeating `[]` here, and `pending`, which a synchronous parse has none of.
      undefined,
      undefined,
      options?.refReads,
    );
    return innerCheck(schema, receivedValue, ctx) as InferType<T>;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    // A BuildSchemaError means the schema itself is wrong, which is a programming error rather than
    // a validation failure. Some are only discoverable during validation, such as a lazy getter
    // returning something that is not a schema, and disguising them loses the reason entirely.
    if (e instanceof BuildSchemaError) throw e;

    // Anything else came from a custom assert, which can throw whatever it likes.
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
   * An array to record every `ctx.ref` read into, which is how a cross-field dependency becomes
   * visible: a `custom` on `confirm` that reads `password` appends one entry saying so.
   *
   * Passed in rather than returned, so the four parse functions keep the signatures they have — and
   * so the SAME array can be handed to many parses. The graph then accumulates: a rule that returns
   * early on an empty value reveals its read the first time it gets far enough, and never unlearns
   * it. Absent by default, and nothing is recorded without it.
   *
   * @example
   * const refReads: RefRead[] = [];
   * parse(signupSchema, values, { refReads });
   * readsAffectedBy(refReads, 'password'); // the fields whose rules read it
   */
  refReads?: RefRead[];
}

interface ParseAllOptions extends ParseOptions {
  /**
   * If true, collects all validation errors and returns them.
   * If false or undefined, returns the first validation error it can find and stops looking,
   * which provides a small runtime optimization.
   *
   * Declared only where it is honoured. `parseOrFail` throws on the first error by definition, and it
   * used to accept this flag and ignore it.
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
  options?: ParseAllOptions,
): [ValidationErrorData[], null] | [null, InferType<T>] {
  try {
    const ctx = new ExceptionContext(
      receivedValue,
      getTranslationByLocale(options?.lng),
      '',
      options?.getAllErrors ? [] : undefined,
      schema[ctxSymbol].meta,
      // Two positional skips to reach `refReads`: the root `path`, left to the constructor's own
      // default rather than repeating `[]` here, and `pending`, which a synchronous parse has none of.
      undefined,
      undefined,
      options?.refReads,
    );

    const parsedValue = innerCheck(schema, receivedValue, ctx) as InferType<T>;

    if (ctx.errors?.length) {
      return [ctx.errors, null];
    }

    return [null, parsedValue];
  } catch (e) {
    if (e instanceof ValidationError) {
      delete e.stack;
      return [[e], null];
    }

    if (e instanceof BuildSchemaError) throw e;

    // Anything else came from a custom assert, which can throw whatever it likes.
    return [[unexpectedError()], null];
  }
}

/**
 * Awaits the collected async validations and merges whatever they report.
 *
 * They are awaited together rather than in sequence, so several slow checks across one schema cost one
 * round of waiting. Each keeps the context it was reached with, so an issue lands on the right path.
 */
/** Shapes a parse result the way Standard Schema expects it. */
function toStandardResult<T>(result: [ValidationErrorData[], null] | [null, T]): StandardSchemaResult<T> {
  const [errors, parsedValue] = result;

  if (errors) return { issues: errors.map((error) => ({ message: error.message, path: error.path })) };

  return { value: parsedValue as T };
}

/**
 * Whether anything in the schema needs awaiting, which decides whether `~standard.validate` hands back
 * a promise. Walks the whole tree, since an async validation may sit at any depth.
 *
 * A lazy schema is only followed once it has been resolved. Following it here would force the thunk
 * merely because someone asked for the interface, and could recurse forever on a self-referential
 * schema — so a schema whose async validation hides behind an unresolved lazy is validated
 * synchronously and reports the BuildSchemaError that explains it.
 */
function hasAsyncValidation(schema: CommonSchema, seen = new Set<CommonSchema>()): boolean {
  if (seen.has(schema)) return false;
  seen.add(schema);

  const schemaData = schema[ctxSymbol];
  if (schemaData.asyncValidations?.length) return true;

  const children: CommonSchema[] = [
    ...(schemaData.object ? Object.values(schemaData.object) : []),
    ...(schemaData.union ?? []),
    ...(schemaData.tuple ?? []),
    ...(schemaData.array ? [schemaData.array] : []),
    ...(schemaData.record ? [schemaData.record.key, schemaData.record.value] : []),
    ...(schemaData.lazy?.resolved ? [schemaData.lazy.resolved] : []),
  ];

  return children.some((child) => hasAsyncValidation(child, seen));
}

/** What a custom assert throwing something unrecognised is reported as, shared by both parse forms. */
function unexpectedError(): ValidationErrorData {
  return {
    message: 'Something unexpected happened',
    expected: '',
    received: '',
    pathToError: '',
    path: [],
    code: '',
    meta: undefined,
  };
}

async function settlePending(pending: PendingValidation[]) {
  await Promise.all(
    pending.flatMap(({ validations, received, ctx }) => validations.map((validation) => validation(received, ctx))),
  );
}

/**
 * The asynchronous counterpart of {@link parse}, for schemas carrying `customAsync` validations.
 *
 * The structure is validated synchronously first and the async validations run afterwards, all
 * together. That means their issues come after the synchronous ones in the returned array, and that an
 * async validation is never reached for a value the synchronous pass already rejected structurally.
 *
 * @example
 * const [errors, value] = await parseAsync(schema, received, { getAllErrors: true });
 */
export async function parseAsync<T extends CommonSchema>(
  schema: T,
  receivedValue: unknown,
  options?: ParseAllOptions,
): Promise<[ValidationErrorData[], null] | [null, InferType<T>]> {
  const errors: ValidationErrorData[] = [];
  const pending: PendingValidation[] = [];

  try {
    const ctx = new ExceptionContext(
      receivedValue,
      getTranslationByLocale(options?.lng),
      '',
      // Always collecting: a throw partway through would leave the pending validations unawaited.
      errors,
      schema[ctxSymbol].meta,
      [],
      pending,
      options?.refReads,
    );

    const parsedValue = innerCheck(schema, receivedValue, ctx) as InferType<T>;
    await settlePending(pending);

    if (errors.length) {
      if (!options?.getAllErrors) return [[errors[0] as ValidationErrorData], null];
      return [errors, null];
    }

    return [null, parsedValue];
  } catch (e) {
    if (e instanceof BuildSchemaError) throw e;

    // Anything else came from a custom assert, which can throw whatever it likes.
    return [[unexpectedError()], null];
  }
}

/**
 * The asynchronous counterpart of {@link parseOrFail}.
 *
 * Unlike the synchronous version it cannot stop at the first error, because the async validations have
 * to be awaited before anything can be reported. It throws the first error found, in the same order
 * `parseAsync` reports them.
 */
export async function parseOrFailAsync<T extends CommonSchema>(
  schema: T,
  receivedValue: unknown,
  options?: ParseOptions,
): Promise<InferType<T>> {
  const [errors, parsedValue] = await parseAsync(schema, receivedValue, options);

  if (errors) {
    const [first] = errors;
    throw new ValidationError(
      first!.expected,
      first!.received,
      first!.pathToError,
      first!.message,
      first!.meta,
      first!.path,
      first!.code,
    );
  }

  return parsedValue as InferType<T>;
}
