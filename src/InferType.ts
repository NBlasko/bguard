import {
  ExtractFromArray,
  ExtractFromBGuardType,
  ExtractFromUnion,
  WithArray,
  WithBGuardType,
  WithNull,
  WithUndefined,
  WithObject,
  WithRecord,
  WithTuple,
  WithUnion,
} from './commonTypes';

type ResolveNullish<T, Y> =
  T extends WithUndefined<WithNull<unknown>>
    ? Y | null | undefined
    : T extends WithUndefined<unknown>
      ? Y | undefined
      : T extends WithNull<unknown>
        ? Y | null
        : Y;

// prettier-ignore
export type InferType<T> =
  //  string, number, boolean, bigint
    T extends WithBGuardType<unknown, unknown>
    ? ResolveNullish<T, ExtractFromBGuardType<T>>

    : // array
    T extends WithArray<unknown, unknown>
    ? ResolveNullish<T, InferType<ExtractFromArray<T>>[]>

    : // object
    T extends WithObject<unknown, unknown>
    ? ResolveNullish<T, ExtractFromObject<T>>

    : // union
    T extends WithUnion<unknown, readonly unknown[]>
    ? ResolveNullish<T, InferType<ExtractFromUnion<T>[number]>>

    : // record
    T extends WithRecord<unknown, unknown, unknown>
    ? ResolveNullish<T, ExtractFromRecord<T>>

    : // tuple
    T extends WithTuple<unknown, infer S extends readonly unknown[]>
    ? ResolveNullish<T, { -readonly [K in keyof S]: InferType<S[K]> }>

    : unknown;

type Merge<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type ExtractFromObject<T> =
  T extends WithObject<unknown, infer X>
    ? Merge<
        { [K in keyof X as X[K] extends WithUndefined<unknown> ? never : K]: InferType<X[K]> } & {
          [K in keyof X as X[K] extends WithUndefined<unknown> ? K : never]?: InferType<X[K]>;
        }
      >
    : unknown;

/**
 * A record whose keys are unconstrained is an index signature, so every lookup is already
 * `V | undefined`. A record with a restricted key type is `Partial`, because validation checks the
 * keys that are present without requiring the whole set — claiming `Record<'a' | 'b', V>` would say
 * both keys are always there.
 */
type ExtractFromRecord<T> =
  T extends WithRecord<unknown, infer K, infer V>
    ? string extends InferType<K>
      ? Record<string, InferType<V>>
      : Partial<Record<InferType<K> & PropertyKey, InferType<V>>>
    : unknown;
