import { clearLocales } from '../errorMap';
import { string } from '../asserts/string';
import { ExceptionContext, RequiredValidation } from '../schemas/CommonSchema';
import { throwException, setLocale, setToDefaultLocale, parse } from '..';

describe('parse', () => {
  const customEqual =
    (expected: string): RequiredValidation =>
    (received: string, ctx: ExceptionContext) => {
      if (expected !== received) throwException(expected, received, ctx, 'somethingEqual');
    };

  beforeEach(() => {
    clearLocales();
    setToDefaultLocale('somethingEqual', 'Something Equal');
  });

  it('should return an array of errors with length 1', () => {
    setLocale('testLanguage', { somethingEqual: 'Foo is equal' });
    const testSchema = string().custom(customEqual('hello1'), customEqual('hello2'));
    const [errors, value] = parse(testSchema, 'not hello', { lng: 'testLanguage' });
    expect(errors?.length).toBe(1);
    const error = errors?.[0];

    expect(error?.expected).toBe('hello1');
    expect(error?.received).toBe('not hello');
    expect(error?.pathToError).toBe('');
    expect(error?.message).toBe('Foo is equal');
    expect(value).toBe(undefined);
  });

  it('should return an array of errors with length more than 1', () => {
    setLocale('testLanguage', { somethingEqual: 'Foo is equal' });
    const testSchema = string().custom(customEqual('hello1'), customEqual('hello2'));
    const [errors, value] = parse(testSchema, 'not hello', { lng: 'testLanguage', getAllErrors: true });

    expect(errors?.length).toBe(2);

    errors?.forEach((error, i) => {
      expect(error.expected).toBe('hello' + (i + 1));
      expect(error.received).toBe('not hello');
      expect(error.pathToError).toBe('');
      expect(error.message).toBe('Foo is equal');
    });

    expect(value).toBe(undefined);
  });

  it('should return a valid result', () => {
    setLocale('testLanguage', { somethingEqual: 'Foo is equal' });
    const testSchema = string().custom(customEqual('helloo'));
    const [errors, value] = parse(testSchema, 'helloo', { lng: 'testLanguage', getAllErrors: true });
    expect(errors).toBe(undefined);
    expect(value).toBe('helloo');
  });
});
