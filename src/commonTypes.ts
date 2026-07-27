// c: stands for common
export interface TranslationErrorMap {
  'c:optional': string;
  'c:nullable': string;
  'c:array': string;
  'c:objectType': string;
  'c:objectTypeAsArray': string;
  'c:unrecognizedProperty': string;
  'c:requiredProperty': string;
  'c:invalidType': string;
  'c:isBoolean': string;
  'c:date': string;
  'c:nan': string;
  'c:union': string;
  'c:tupleLength': string;
  [val: string]: string;
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

export interface ValidationErrorData {
  message: string;
  expected: unknown;
  received: unknown;
  /** Dotted and bracketed, for display. */
  pathToError: string;
  /** The same location as keys, for programmatic use. */
  path: readonly PropertyKey[];
  /** The translation key of this failure, stable across locales. */
  code: string;
  meta?: MetaContext;
}

export interface MetaContext {
  id?: string;
  description?: string;
}

export type BaseType = 'number' | 'string' | 'boolean' | 'undefined' | 'object' | 'function' | 'symbol' | 'bigint';

export type WithBGuardType<T, Y> = T & { validation_bguard: Y };
export type ExtractFromBGuardType<T> = T extends WithBGuardType<unknown, infer Y> ? Y : never;
export type WithNull<T> = T & { validation_null: true };
export type WithUndefined<T> = T & { validation_undefined: true };
/** Records the value a schema accepts before transformation, which is what makes coercion typable. */
export type WithInput<T, In> = T & { validation_input: In };

/** Records that a schema supplies its own value, so the input may leave it out. */
export type WithDefault<T> = T & { validation_default: true };

export type WithArray<T, Y> = T & { validation_array: Y };
export type ExtractFromArray<T> = T extends WithArray<unknown, infer X> ? X : never;
export type WithObject<T, Y> = T & { validation_object: Y };

/** Y is the tuple of member schemas, so InferType can distribute over it. */
export type WithUnion<T, Y> = T & { validation_union: Y };
export type ExtractFromUnion<T> = T extends WithUnion<unknown, infer X extends readonly unknown[]> ? X : never;

/** K and V are the key and value schemas of a record. */
export type WithRecord<T, K, V> = T & { validation_record_key: K; validation_record_value: V };

/** The shape of an object schema, and the intersection of several such shapes. */
export type ExtractShape<T> = T extends WithObject<unknown, infer S> ? S : never;
export type IntersectShapes<T extends readonly unknown[]> = T extends readonly [infer First, ...infer Rest]
  ? ExtractShape<First> & IntersectShapes<Rest>
  : unknown;

/** Y is the tuple of positional schemas, so InferType can map over it and keep the tuple shape. */
export type WithTuple<T, Y> = T & { validation_tuple: Y };

export type TransformCallback<In = unknown, Out = unknown> = (val: In) => Out;
