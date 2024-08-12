import type { ArraySchema, ExtractFromArray } from './schemas/ArraySchema';
import type { BooleanSchema, ExtractFromBoolean, WithBoolean } from './schemas/BooleanSchema';
import type { CommonSchema, ExtractFromMix, WithMix, WithNull, WithUndefined } from './schemas/CommonSchema';
import type { ExtractFromNumber, NumberSchema, WithNumber } from './schemas/NumberSchema';
import type { ObjectSchema, WithObject } from './schemas/ObjectSchema';
import type { ExtractFromString, StringSchema, WithString } from './schemas/StringSchema';

// prettier-ignore
export type InferType<T> =
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
    ? InferType<ExtractFromArray<T>>[] | null | undefined
    : T extends WithUndefined<ArraySchema>
    ? InferType<ExtractFromArray<T>>[] | undefined
    : T extends WithNull<ArraySchema>
    ? InferType<ExtractFromArray<T>>[] | null
    : T extends ArraySchema
    ? InferType<ExtractFromArray<T>>[]

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
        { [K in keyof X as X[K] extends WithUndefined<CommonSchema> ? never : K]: InferType<X[K]> } & {
          [K in keyof X as X[K] extends WithUndefined<CommonSchema> ? K : never]?: InferType<X[K]>;
        }
      >
    : unknown;
