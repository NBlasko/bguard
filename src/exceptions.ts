import type { MetaContext } from './commonTypes';

export class ValidationError extends Error {
  expected: unknown;
  received: unknown;
  pathToError: string;
  /** The same location as `pathToError`, as keys. */
  path: readonly PropertyKey[];
  /** The translation key of this failure, stable across locales. */
  code: string;
  message: string;
  meta?: MetaContext;
  constructor(
    expected: unknown,
    received: unknown,
    pathToError: string,
    message: string,
    meta?: MetaContext,
    path: readonly PropertyKey[] = [],
    code = '',
  ) {
    super();
    this.expected = expected;
    this.received = received;
    this.pathToError = pathToError;
    this.path = path;
    this.code = code;
    this.message = message;
    this.meta = meta;
  }
}

export class BuildSchemaError extends Error {}
