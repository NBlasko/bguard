import { ctxSymbol } from '../core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequiredValidation = (received: any, pathToError: string) => void;
export type ObjectShapeSchemaType = Record<string, CommonSchema>;

export interface ValidatorContext {
  type: string[];
  isNullable?: boolean;
  isOptional?: boolean;
  requiredValidations: RequiredValidation[];
  array?: CommonSchema;
  object?: ObjectShapeSchemaType;
}

export class CommonSchema {
  [ctxSymbol]: ValidatorContext;
  constructor(ctx: ValidatorContext) {
    this[ctxSymbol] = ctx;
  }

  custom(...requiredValidations: RequiredValidation[]) {
    this[ctxSymbol].requiredValidations.push(...requiredValidations);
    return this;
  }

  nullable(): WithNull<this> {
    this[ctxSymbol].isNullable = true;
    return this as WithNull<this>;
  }

  optional(): WithUndefined<this> {
    this[ctxSymbol].isOptional = true;
    return this as WithUndefined<this>;
  }
}

export type WithNull<T extends CommonSchema> = T & { validation_null: true };
export type WithUndefined<T extends CommonSchema> = T & { validation_undefined: true };

export type PrimitiveType = 'number' | 'string' | 'boolean' | 'undefined' | 'object' | 'function' | 'symbol' | 'bigint';

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
