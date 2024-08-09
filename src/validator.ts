import { ctxSymbol } from './core';
import { ArraySchema, ExtractFromArray, WithArray } from './schemas/ArraySchema';
import { BooleanSchema, ExtractFromBoolean, WithBoolean } from './schemas/BooleanSchema';
import {
  CommonSchema,
  ExtractFromMix,
  MapMixTypes,
  ObjectShapeSchemaType,
  PrimitiveType,
  ValidatorContext,
  WithMix,
  WithNull,
  WithUndefined,
} from './schemas/CommonSchema';
import { ExtractFromNumber, NumberSchema, WithNumber } from './schemas/NumberSchema';
import { ObjectSchema, WithObject } from './schemas/ObjectSchema';
import { ExtractFromString, StringSchema, WithString } from './schemas/StringSchema';

class ValidatorSchema {
  [ctxSymbol]: ValidatorContext;
  constructor(ctx: ValidatorContext) {
    this[ctxSymbol] = ctx;
  }

  oneOfTypes<T extends PrimitiveType[]>(valueTypes: T): WithMix<MapMixTypes<T>> {
    this[ctxSymbol].type = valueTypes;
    return new CommonSchema(this[ctxSymbol]) as WithMix<MapMixTypes<T>>;
  }

  string() {
    this[ctxSymbol].type = ['string'];
    return new StringSchema(this[ctxSymbol]);
  }

  number() {
    this[ctxSymbol].type = ['number'];
    return new NumberSchema(this[ctxSymbol]);
  }

  boolean() {
    this[ctxSymbol].type = ['boolean'];
    return new BooleanSchema(this[ctxSymbol]);
  }

  array<T extends CommonSchema>(arraySchema: T): WithArray<T> {
    return new ArraySchema(this[ctxSymbol], arraySchema) as WithArray<T>;
  }

  object<T extends ObjectShapeSchemaType>(shapeSchema: T): WithObject<T> {
    return new ObjectSchema(this[ctxSymbol], shapeSchema) as WithObject<T>;
  }
}

export function V() {
  return new ValidatorSchema({ type: [], requiredValidations: [] });
}

// prettier-ignore
export type GetType<T> =
  //  with string
  T extends WithUndefined<WithNull<WithString<StringSchema>>>
    ? ExtractFromString<T> | null | undefined
    : T extends WithUndefined<WithString<StringSchema>>
    ? ExtractFromString<T>  | undefined
    : T extends WithNull<WithString<StringSchema>>
    ? ExtractFromString<T>  | null
    : T extends WithString<StringSchema>
    ? ExtractFromString<T> 

    // string
    :  T extends WithUndefined<WithNull<StringSchema>>
    ? string | null | undefined
    : T extends WithUndefined<StringSchema>
    ? string | undefined
    : T extends WithNull<StringSchema>
    ? string | null
    : T extends StringSchema
    ? string

    : // with number
    T extends WithUndefined<WithNull<WithNumber<NumberSchema>>>
    ? ExtractFromNumber<T> | null | undefined
    : T extends WithUndefined<WithNumber<NumberSchema>>
    ? ExtractFromNumber<T>  | undefined
    : T extends WithNull<WithNumber<NumberSchema>>
    ? ExtractFromNumber<T>  | null
    : T extends WithNumber<NumberSchema>
    ? ExtractFromNumber<T>

    : // number
    T extends WithUndefined<WithNull<NumberSchema>>
    ? number | null | undefined
    : T extends WithUndefined<NumberSchema>
    ? number | undefined
    : T extends WithNull<NumberSchema>
    ? number | null
    : T extends NumberSchema
    ? number

    : // with boolean
    T extends WithUndefined<WithNull<WithBoolean<BooleanSchema>>>
    ? ExtractFromBoolean<T> | null | undefined
    : T extends WithUndefined<WithBoolean<BooleanSchema>>
    ? ExtractFromBoolean<T> | undefined
    : T extends WithNull<WithBoolean<BooleanSchema>>
    ? ExtractFromBoolean<T> | null
    : T extends WithBoolean<BooleanSchema>
    ? ExtractFromBoolean<T>

    : //  boolean
    T extends WithUndefined<WithNull<BooleanSchema>>
    ? boolean | null | undefined
    : T extends WithUndefined<BooleanSchema>
    ? boolean | undefined
    : T extends WithNull<BooleanSchema>
    ? boolean | null
    : T extends BooleanSchema
    ? boolean

    : // array
    T extends WithUndefined<WithNull<ArraySchema>>
    ? GetType<ExtractFromArray<T>>[] | null | undefined
    : T extends WithUndefined<ArraySchema>
    ? GetType<ExtractFromArray<T>>[] | undefined
    : T extends WithNull<ArraySchema>
    ? GetType<ExtractFromArray<T>>[] | null
    : T extends ArraySchema
    ? GetType<ExtractFromArray<T>>[]

    : // object
    T extends WithUndefined<WithNull<ObjectSchema>>
    ? ExtractFromObject<T> | null | undefined
    : T extends WithUndefined<ObjectSchema>
    ? ExtractFromObject<T> | undefined
    : T extends WithNull<ObjectSchema>
    ? ExtractFromObject<T> | null
    : T extends ObjectSchema
    ? ExtractFromObject<T>

    : // with mix
    T extends WithUndefined<WithNull<WithMix>>
    ? ExtractFromMix<T> | null | undefined
    : T extends WithUndefined<WithMix>
    ? ExtractFromMix<T> | undefined
    : T extends WithNull<WithMix>
    ? ExtractFromMix<T> | null
    : T extends WithMix
    ? ExtractFromMix<T>

    : unknown;

type Merge<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type ExtractFromObject<T extends ObjectSchema> =
  T extends WithObject<infer X>
    ? Merge<
        { [K in keyof X as X[K] extends WithUndefined<CommonSchema> ? never : K]: GetType<X[K]> } & {
          [K in keyof X as X[K] extends WithUndefined<CommonSchema> ? K : never]?: GetType<X[K]>;
        }
      >
    : unknown;
