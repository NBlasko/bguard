import type { MetaContext } from './commonTypes';

/**
 * The Standard Schema v1 interface, as published at https://github.com/standard-schema/standard-schema.
 *
 * The types are vendored rather than taken as a dependency, which is what the spec intends: it is a
 * contract between libraries, not a runtime package. Implementing it lets bguard schemas be accepted
 * anywhere a validator is expected — tRPC, TanStack Form and Router, Hono, oRPC, React Hook Form —
 * without any of them knowing about bguard.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaProps<Input, Output>;
}

export interface StandardSchemaProps<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  /**
   * The spec allows either a result or a promise of one, chosen per call. bguard returns a promise only
   * when the schema carries async validations, so a consumer that never awaits keeps working for every
   * other schema.
   */
  readonly validate: (value: unknown) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
  /** Type-only: carries the input and output types and is never present at runtime. */
  readonly types?: StandardSchemaTypes<Input, Output> | undefined;
}

export type StandardSchemaResult<Output> = StandardSchemaSuccess<Output> | StandardSchemaFailure;

export interface StandardSchemaSuccess<Output> {
  readonly value: Output;
  readonly issues?: undefined;
}

export interface StandardSchemaFailure {
  readonly issues: ReadonlyArray<StandardSchemaIssue>;
}

export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaPathSegment> | undefined;
}

/**
 * The issue bguard's `~standard.validate` reports: a Standard Schema issue, plus what `parse` reports
 * about the failure, so a consumer can translate or branch on it.
 *
 * The spec allows extra properties on an issue. Before 0.12.0 only `message` and `path` were passed on,
 * so a form had no stable key to translate a message by. `received` is left out on purpose: it is the raw
 * input, which may be a password, and Standard Schema issues are routinely logged or returned to clients.
 * That covers only what bguard adds. A custom rule decides what goes into `expected` and into its message
 * (`{{r}}` is the received value), so a rule that compares against another field should report a
 * description such as `'the same password'`, not the other field's value.
 * `parse` still reports it.
 */
export interface BguardStandardIssue extends StandardSchemaIssue {
  readonly path: ReadonlyArray<PropertyKey>;
  /** The translation key of this failure, such as `s:minLength`. Stable across locales. */
  readonly code: string;
  /** What the rule expected, such as the `3` of `minLength(3)` — the `{{e}}` in a message. */
  readonly expected: unknown;
  /** The same location as `path`, dotted and bracketed for display. */
  readonly pathToError: string;
  /** The `id` and `description` set on the failing schema, if any. */
  readonly meta?: MetaContext;
}

/** A failure whose issues are `BguardStandardIssue`s. Assignable to the spec's `StandardSchemaFailure`. */
export interface BguardStandardFailure {
  readonly issues: ReadonlyArray<BguardStandardIssue>;
}

export type BguardStandardResult<Output> = StandardSchemaSuccess<Output> | BguardStandardFailure;

/**
 * What a bguard schema's `~standard` actually is: the spec's props, with `validate` narrowed to report
 * `BguardStandardIssue`s. Narrower, so still a valid `StandardSchemaProps` for any consumer of the spec.
 */
export interface BguardStandardProps<Input = unknown, Output = Input> extends StandardSchemaProps<Input, Output> {
  readonly validate: (value: unknown) => BguardStandardResult<Output> | Promise<BguardStandardResult<Output>>;
}

export interface StandardSchemaPathSegment {
  readonly key: PropertyKey;
}

export interface StandardSchemaTypes<Input, Output> {
  readonly input: Input;
  readonly output: Output;
}
