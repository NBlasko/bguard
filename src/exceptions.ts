import type { ExceptionContext, MetaContext } from './commonTypes';

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

function replacePlaceholders(template: string, replacements: Record<string, unknown>): string {
  const regex = /{{(.*?)}}/g;
  return template.replace(regex, (_, key) => {
    return key in replacements ? `${replacements[key] as string}` : `{{${key}}}`;
  });
}

export function guardException(
  expected: unknown,
  received: unknown,
  ctx: ExceptionContext,
  messageKey: string,
): never | void {
  const rawMessage = ctx.t[messageKey] ?? messageKey;
  const message = replacePlaceholders(rawMessage, { e: expected, r: received, p: ctx.pathToError });

  if (ctx.getAllErrors) {
    ctx.errors.push({
      expected,
      received,
      pathToError: ctx.pathToError,
      message,
    });

    return;
  }
  throw new ValidationError(expected, received, ctx.pathToError, message, ctx.meta);
}
