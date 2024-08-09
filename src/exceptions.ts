export class ValidationError extends Error {
  expected: unknown;
  received: unknown;
  pathToError: string;
  message: string;
  constructor(expected: unknown, received: unknown, pathToError: string, message: string) {
    super();
    this.expected = expected;
    this.received = received;
    this.pathToError = pathToError;
    this.message = message;
  }
}

export class BuildSchemaError extends Error {}

export function panic(expected: unknown, received: unknown, pathToError: string, message: string): never {
  throw new ValidationError(expected, received, pathToError, message);
}
