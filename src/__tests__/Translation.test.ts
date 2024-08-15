import { parseOrFail, throwException, BuildSchemaError } from '../';
import { string } from '../asserts/string';
import { clearLocales, setLocale, setToDefaultLocale } from '../errorMap';
import { ExceptionContext, RequiredValidation } from '../schemas/CommonSchema';

describe('Translation', () => {
  const customEqual =
    (expected: string): RequiredValidation =>
    (received: string, ctx: ExceptionContext) => {
      if (expected !== received) throwException(expected, received, ctx, 'somethingEqual');
    };

  beforeEach(() => {
    clearLocales();
    setToDefaultLocale('somethingEqual', 'Something Equal');
  });

  it('should use test translation', () => {
    setLocale('testLanguage', { somethingEqual: 'Foo is equal' });
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello', 'testLanguage')).toThrow('Foo is equal');
  });

  it('should use default translation when lanugageMap is translation', () => {
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello', 'testLanguage')).toThrow('Something Equal');
  });

  it('should use default translation when language is not provided', () => {
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello')).toThrow('Something Equal');
  });

  it('should fail to set same key for default translation', () => {
    setToDefaultLocale('test:key', 'My Translation');
    expect(() => setToDefaultLocale('test:key', 'My Translation')).toThrow('Duplicate default message key');
    expect(() => setToDefaultLocale('test:key', 'My  Other Translation')).toThrow(BuildSchemaError);
  });
});
