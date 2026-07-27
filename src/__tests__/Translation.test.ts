import { parseOrFail, BuildSchemaError, setToDefaultLocale, setLocale, clearLocales, ExceptionContext } from '../';

import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { RequiredValidation } from '../core';

describe('Translation', () => {
  const customEqual =
    (expected: string): RequiredValidation =>
    (received: string, ctx: ExceptionContext) => {
      if (expected !== received) ctx.addIssue(expected, received, 'somethingEqual');
    };

  customEqual.key = 'somethingEqual';
  customEqual.message = 'Something Equal';

  // Registered once: setToDefaultLocale rejects a duplicate key, and registrations now survive
  // clearLocales so that built-in assert messages are not lost with the locales.
  setToDefaultLocale(customEqual);

  beforeEach(() => {
    clearLocales();
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
    // A local assert, so this does not rewrite the key of the shared one above.
    const ownKeyAssert = customEqual;
    const registerTwice = Object.assign(ownKeyAssert.bind(null), {
      key: 'test:key',
      message: 'My Translation',
    }) as unknown as typeof customEqual;

    setToDefaultLocale(registerTwice);
    expect(() => setToDefaultLocale(registerTwice)).toThrow('Duplicate default message key');
    expect(() => setToDefaultLocale(registerTwice)).toThrow(BuildSchemaError);
  });

  it('should reject a key that collides with a common message', () => {
    const collides = Object.assign(customEqual.bind(null), {
      key: 'c:optional',
      message: 'Anything',
    }) as unknown as typeof customEqual;

    expect(() => setToDefaultLocale(collides)).toThrow('Duplicate default message key');
  });

  it('should keep built-in assert messages after clearLocales', () => {
    clearLocales();

    // Assert defaults are registered once, at import time, so clearing locales must not drop them.
    expect(() => parseOrFail(string().custom(customEqual('hello')), 'not hello')).toThrow('Something Equal');
  });

  it('should fall back to the default message for keys a locale does not override', () => {
    setLocale('partial', { 'c:optional': 'Nedostaje vrednost' });

    // The overridden key is translated...
    expect(() => parseOrFail(string(), undefined, { lng: 'partial' })).toThrow('Nedostaje vrednost');
    // ...and one the locale says nothing about falls back to its message, not to its raw key.
    expect(() => parseOrFail(string().custom(customEqual('hello')), 'not hello', { lng: 'partial' })).toThrow(
      'Something Equal',
    );
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
