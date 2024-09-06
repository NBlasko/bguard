import { ValidationError } from '.';
import { MetaContext, TranslationErrorMap, ValidationErrorData } from './commonTypes';

const replacePlaceholdersRegex = /{{(.*?)}}/g;

function replacePlaceholders(template: string, replacements: Record<string, unknown>): string {
  return template.replace(replacePlaceholdersRegex, (_, key) => {
    return key in replacements ? `${replacements[key] as string}` : `{{${key}}}`;
  });
}

export class ExceptionContext {
  constructor(
    public readonly initialReceived: unknown,
    public readonly t: TranslationErrorMap,
    public readonly pathToError: string,
    public readonly errors?: ValidationErrorData[],
    public readonly meta?: MetaContext,
  ) {}

  createChild(childPathToError: string, childMeta?: MetaContext) {
    return new ExceptionContext(this.initialReceived, this.t, childPathToError, this.errors, childMeta);
  }

  public ref(path: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ref: any = this.initialReceived;
    const parsedRefPath = path.split('.');
    parsedRefPath.forEach((el) => {
      ref = ref[el];
    });

    return ref;
  }

  public addIssue(expected: unknown, received: unknown, messageKey: string): never | void {
    const rawMessage = this.t[messageKey] ?? messageKey;
    const message = replacePlaceholders(rawMessage, { e: expected, r: received, p: this.pathToError });

    if (this.errors) {
      this.errors.push({
        expected,
        received,
        pathToError: this.pathToError,
        message,
      });

      return;
    }

    throw new ValidationError(expected, received, this.pathToError, message, this.meta);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequiredValidation = (received: any, ctx: ExceptionContext) => void;
