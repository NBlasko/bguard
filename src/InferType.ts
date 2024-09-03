import {
  ExtractFromArray,
  ExtractFromBGuardType,
  WithArray,
  WithBGuardType,
  WithNull,
  WithUndefined,
  WithObject,
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
