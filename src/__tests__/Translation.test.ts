import { parseOrFail, guardException, BuildSchemaError, setToDefaultLocale, setLocale, clearLocales } from '../';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { ExceptionContext, RequiredValidation } from '../commonTypes';

describe('Translation', () => {
  const customEqual =
    (expected: string): RequiredValidation =>
    (received: string, ctx: ExceptionContext) => {
      if (expected !== received) guardException(expected, received, ctx, 'somethingEqual');
    };

  customEqual.key = 'somethingEqual';
  customEqual.message = 'Something Equal';

  beforeEach(() => {
    clearLocales();
    setToDefaultLocale(customEqual);
  });

  it('should use test translation', () => {
    setLocale('testLanguage', { somethingEqual: 'Foo is equal' });
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello', { lng: 'testLanguage' })).toThrow('Foo is equal');
  });

  it('should use default translation when lanugageMap is translation', () => {
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello', { lng: 'testLanguage' })).toThrow('Something Equal');
  });

  it('should use default translation when language is not provided', () => {
    const testSchema = string().custom(customEqual('hello'));
    expect(() => parseOrFail(testSchema, 'not hello')).toThrow('Something Equal');
  });

  it('should fail to set same key for default translation', () => {
    customEqual.key = 'test:key';
    customEqual.message = 'My Translation';
    setToDefaultLocale(customEqual);
    expect(() => setToDefaultLocale(customEqual)).toThrow('Duplicate default message key');
    expect(() => setToDefaultLocale(customEqual)).toThrow(BuildSchemaError);
  });

  it('should use test translation with template reolvers', () => {
    setLocale('testLanguage', {
      somethingEqual: 'Expected ({{e}}). Received ({{r}}). PathToError ({{p}}). Unknown ({{v}})',
    });
    const testSchema = object({ bar: string().custom(customEqual('hello')) });
    expect(() => parseOrFail(testSchema, { bar: 'not hello' }, { lng: 'testLanguage' })).toThrow(
      'Expected (hello). Received (not hello). PathToError (.bar). Unknown ({{v}})',
    );
  });

  it('should not use setLocale on "default" namespace', () => {
    expect(() => setLocale('default', { foo: 'bar' })).toThrow('Invalid language');
    expect(() => setLocale('default', { foo: 'bar' })).toThrow(BuildSchemaError);
  });
});
