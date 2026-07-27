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
  pathToError: string;
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
export type WithArray<T, Y> = T & { validation_array: Y };
export type ExtractFromArray<T> = T extends WithArray<unknown, infer X> ? X : never;
export type WithObject<T, Y> = T & { validation_object: Y };

/** Y is the tuple of member schemas, so InferType can distribute over it. */
export type WithUnion<T, Y> = T & { validation_union: Y };
export type ExtractFromUnion<T> = T extends WithUnion<unknown, infer X extends readonly unknown[]> ? X : never;

/** K and V are the key and value schemas of a record. */
export type WithRecord<T, K, V> = T & { validation_record_key: K; validation_record_value: V };

export type TransformCallback<In = unknown, Out = unknown> = (val: In) => Out;
