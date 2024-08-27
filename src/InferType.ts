import type { ArraySchema, ExtractFromArray } from './schemas/ArraySchema';
import { BigIntSchema, ExtractFromBigInt, WithBigInt } from './schemas/BigIntSchema';
import type { BooleanSchema, ExtractFromBoolean, WithBoolean } from './schemas/BooleanSchema';
import type { CommonSchema, ExtractFromMix, WithMix, WithNull, WithUndefined } from './schemas/CommonSchema';
import { DateSchema } from './schemas/DateSchema';
import type { ExtractFromNumber, NumberSchema, WithNumber } from './schemas/NumberSchema';
import type { ObjectSchema, WithObject } from './schemas/ObjectSchema';
import type { ExtractFromString, StringSchema, WithString } from './schemas/StringSchema';

type ResolveNullish<T, Y> =
  T extends WithUndefined<WithNull<CommonSchema>>
    ? Y | null | undefined
    : T extends WithUndefined<CommonSchema>
      ? Y | undefined
      : T extends WithNull<CommonSchema>
        ? Y | null
        : Y;

// prettier-ignore
export type InferType<T> =
  //  with string
    T extends WithString<StringSchema>
    ? ResolveNullish<T, ExtractFromString<T>>

    : // string
    T extends StringSchema
    ? ResolveNullish<T, string>

    : // with number
    T extends WithNumber<NumberSchema>
    ? ResolveNullish<T, ExtractFromNumber<T>>

    : // number
    T extends NumberSchema
    ? ResolveNullish<T, number>

    : // with boolean
    T extends WithBoolean<BooleanSchema>
    ? ResolveNullish<T, ExtractFromBoolean<T>>

    : // boolean
    T extends BooleanSchema
    ? ResolveNullish<T, boolean>

    : // array
    T extends ArraySchema
    ? ResolveNullish<T, InferType<ExtractFromArray<T>>[]>

    : // object
    T extends ObjectSchema
    ? ResolveNullish<T, ExtractFromObject<T>>

    : // with mix
    T extends WithMix
    ? ResolveNullish<T, ExtractFromMix<T>>

    : // with bigint
    T extends WithBigInt<BigIntSchema>
    ? ResolveNullish<T, ExtractFromBigInt<T>>

    : // bigint
    T extends BigIntSchema
    ? ResolveNullish<T, bigint>

    : // Date
    T extends DateSchema
    ? ResolveNullish<T, Date>

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
