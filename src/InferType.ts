import {
  ExtractFromArray,
  ExtractFromBGuardType,
  ExtractFromUnion,
  WithArray,
  WithBGuardType,
  WithNull,
  WithUndefined,
  WithObject,
  WithDefault,
  WithInput,
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

/**
 * The value a schema accepts, as opposed to the value it produces.
 *
 * The two differ wherever a schema converts or supplies something: a coercing transform accepts more
 * than it yields, and a schema with a default accepts nothing at all in that position. Everywhere else
 * they coincide, which is why `InferType` remains the output type and needs no change.
 *
 * This is what `~standard.types.input` reports, so a tool generating a form from a schema asks for
 * what the schema takes rather than what it returns.
 */
// prettier-ignore
export type InferInput<T> =
    // A recorded input wins over everything below it: it is the whole point of the brand.
    T extends WithInput<unknown, infer In>
    ? ResolveInputNullish<T, In>

    : T extends WithBGuardType<unknown, unknown>
    ? ResolveInputNullish<T, ExtractFromBGuardType<T>>

    : T extends WithArray<unknown, unknown>
    ? ResolveInputNullish<T, InferInput<ExtractFromArray<T>>[]>

    : T extends WithObject<unknown, unknown>
    ? ResolveInputNullish<T, ExtractInputFromObject<T>>

    : T extends WithUnion<unknown, readonly unknown[]>
    ? ResolveInputNullish<T, InferInput<ExtractFromUnion<T>[number]>>

    : T extends WithRecord<unknown, unknown, unknown>
    ? ResolveInputNullish<T, ExtractInputFromRecord<T>>

    : T extends WithTuple<unknown, infer S extends readonly unknown[]>
    ? ResolveInputNullish<T, { -readonly [K in keyof S]: InferInput<S[K]> }>

    : unknown;

/** The output type, named for symmetry with `InferInput`. `InferType` is kept as it was. */
export type InferOutput<T> = InferType<T>;

/** A default means the position may be left out, on top of whatever nullish markers apply. */
type ResolveInputNullish<T, Y> =
  T extends WithDefault<unknown> ? ResolveNullish<T, Y> | undefined : ResolveNullish<T, Y>;

/** In the input, a property is optional when it may be omitted or when a default will fill it. */
type OptionalOnInput<T> = T extends WithUndefined<unknown> ? true : T extends WithDefault<unknown> ? true : false;

type ExtractInputFromObject<T> =
  T extends WithObject<unknown, infer X>
    ? Merge<
        { [K in keyof X as OptionalOnInput<X[K]> extends true ? never : K]: InferInput<X[K]> } & {
          [K in keyof X as OptionalOnInput<X[K]> extends true ? K : never]?: InferInput<X[K]>;
        }
      >
    : unknown;

type ExtractInputFromRecord<T> =
  T extends WithRecord<unknown, infer K, infer V>
    ? string extends InferType<K>
      ? Record<string, InferInput<V>>
      : Partial<Record<InferType<K> & PropertyKey, InferInput<V>>>
    : unknown;
