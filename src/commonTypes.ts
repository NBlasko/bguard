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
  [val: string]: string;
}

export interface ValidationErrorData {
  message: string;
  expected: unknown;
  received: unknown;
  pathToError: string;
}

export type ExceptionContext = {
  pathToError: string;
  t: TranslationErrorMap;
} & (
  | {
      getAllErrors?: false;
    }
  | {
      getAllErrors: true;
      errors: ValidationErrorData[];
    }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequiredValidation = (received: any, ctx: ExceptionContext) => void;

export type PrimitiveType = 'number' | 'string' | 'boolean' | 'undefined' | 'object' | 'function' | 'symbol' | 'bigint';
