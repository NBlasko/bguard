import { ExceptionContext } from './schemas/CommonSchema';

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

export function throwException(
  expected: unknown,
  received: unknown,
  ctx: ExceptionContext,
  messageKey: string,
): never | void {
  const message = ctx.t[messageKey] ?? messageKey;
  if (ctx.getAllErrors) {
    ctx.errors.push({
      expected,
      received,
      pathToError: ctx.pathToError,
      message,
    });

    return;
  }
  throw new ValidationError(expected, received, ctx.pathToError, message);
}
