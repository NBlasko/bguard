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
  readonly validate: (value: unknown) => StandardSchemaResult<Output>;
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

export interface StandardSchemaPathSegment {
  readonly key: PropertyKey;
}

export interface StandardSchemaTypes<Input, Output> {
  readonly input: Input;
  readonly output: Output;
}
