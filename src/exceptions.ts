import type { MetaContext } from './commonTypes';

export class ValidationError extends Error {
  expected: unknown;
  received: unknown;
  pathToError: string;
  message: string;
  meta?: MetaContext;
  constructor(expected: unknown, received: unknown, pathToError: string, message: string, meta?: MetaContext) {
    super();
    this.expected = expected;
    this.received = received;
    this.pathToError = pathToError;
    this.message = message;
    this.meta = meta;
  }
}

export class BuildSchemaError extends Error {}
