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
  [val: string]: string;
}

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

export type TransformCallback<In = unknown, Out = unknown> = (val: In) => Out;
