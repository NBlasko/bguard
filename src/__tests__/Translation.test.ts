import {
  parse,
  parseOrFail,
  BuildSchemaError,
  setToDefaultLocale,
  setLocale,
  clearLocales,
  setDefaultLanguage,
  ExceptionContext,
} from '../';
import { minLength } from '../asserts/string/minLength';

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

  describe('setDefaultLanguage', () => {
    const schema = string().custom(minLength(3));
    const message = (options?: { lng?: string }) => parse(schema, 'ab', options)[0]![0]!.message;

    beforeEach(() => {
      setLocale('sr', { 's:minLength': 'Tekst mora imati bar {{e}} znakova' });
      setLocale('de', { 's:minLength': 'Mindestens {{e}} Zeichen' });
    });

    it('translates a parse that is given no lng', () => {
      setDefaultLanguage('sr');
      expect(message()).toBe('Tekst mora imati bar 3 znakova');
    });

    it('yields to an lng passed to parse', () => {
      setDefaultLanguage('sr');
      expect(message({ lng: 'de' })).toBe('Mindestens 3 Zeichen');
    });

    it('is what an unknown lng falls back to', () => {
      setDefaultLanguage('sr');
      expect(message({ lng: 'fr' })).toBe('Tekst mora imati bar 3 znakova');
    });

    it("goes back to the built-in messages with 'default'", () => {
      setDefaultLanguage('sr');
      setDefaultLanguage('default');
      expect(message()).toBe('The received value length is less than expected');
    });

    it('falls back to the built-in message for a key the locale does not translate', () => {
      setDefaultLanguage('sr');
      expect(parse(string(), 1)[0]![0]!.message).toBe('Invalid type of data');
    });

    it.each([['fr'], ['__proto__'], ['toString'], ['']])('refuses %p, which is not a registered locale', (lng) => {
      expect(() => setDefaultLanguage(lng)).toThrow(BuildSchemaError);
      expect(() => setDefaultLanguage(lng)).toThrow('register it with setLocale first');
    });

    it('is reset by clearLocales, which removes the locale it named', () => {
      setDefaultLanguage('sr');
      clearLocales();
      expect(message()).toBe('The received value length is less than expected');
    });
  });
});
