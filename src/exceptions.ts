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

function replacePlaceholders(template: string, replacements: Record<string, unknown>): string {
  const regex = /{{(.*?)}}/g;
  return template.replace(regex, (_, key) => {
    const vvv = key in replacements ? `${replacements[key] as string}` : `{{${key}}}`;
    return vvv;
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
  throw new ValidationError(expected, received, ctx.pathToError, message);
}
