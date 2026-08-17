import { parse, parseOrFail, setLocale, setToDefaultLocale, clearLocales, BuildSchemaError, toJSONSchema } from '../';

import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { number } from '../asserts/number';
import { RequiredValidation } from '../core';

/**
 * Every key here is a name that resolves on `Object.prototype`, reaching a place a plain assignment
 * writes to instead of the object in front of it.
 *
 * The assertions are deliberately about the *global* prototype and about the returned object's own
 * keys, not about a thrown error: a fix that rejects the input and a fix that stores it safely are
 * both acceptable, but an input that vanishes from the output while showing up through the prototype
 * chain is the failure, and only these two checks catch it.
 */
describe('prototype pollution', () => {
  const pollutionProbes = ['polluted', 'isAdmin', '0', 'boom'] as const;

  const expectCleanGlobals = () => {
    pollutionProbes.forEach((probe) => {
      expect(({} as Record<string, unknown>)[probe]).toBeUndefined();
      expect((Object.prototype as unknown as Record<string, unknown>)[probe]).toBeUndefined();
    });

    expect((Object as unknown as Record<string, unknown>).boom).toBeUndefined();
    expect(JSON.stringify([])).toBe('[]');
    expect(JSON.stringify({})).toBe('{}');
  };

  afterEach(() => {
    clearLocales();
    expectCleanGlobals();
  });

  describe('setLocale', () => {
    // The reported entrypoint: `data['__proto__'] ??= …` found Object.prototype, kept it, and then
    // wrote every message of the payload onto it.
    it('does not pollute Object.prototype through the locale name', () => {
      expect(() => setLocale('__proto__', { polluted: 'yes' })).toThrow(BuildSchemaError);
      expect(() => setLocale('__proto__', { polluted: 'yes' })).toThrow('Invalid language');
    });

    it.each(['constructor', 'prototype'])('rejects %s as a locale name', (lng) => {
      expect(() => setLocale(lng, { boom: 'yes' })).toThrow(BuildSchemaError);
    });

    // How the report's `Object.prototype.0` was produced: `Object.entries('sr')` is [['0','s'],…],
    // so a string in place of the map wrote character-indexed messages.
    it.each([
      ['a string', 'sr'],
      ['an array', ['sr']],
      ['null', null],
      ['a number', 1],
    ])('rejects %s in place of a translation map', (_name, custom) => {
      expect(() => setLocale('sr', custom as never)).toThrow(BuildSchemaError);
      expect(() => setLocale('sr', custom as never)).toThrow('Invalid translation map');
    });

    // A message key, unlike a locale name, is not restricted — a custom assert picks its own — so
    // this one has to be stored rather than refused. The key is computed for the same reason as in
    // the object tests below: written plainly it would be the prototype-setter and the map would
    // arrive empty, which is a test that passes without touching the code it is about.
    it('stores a __proto__ message key on the locale instead of its prototype', () => {
      const custom = { ['__proto__']: 'poruka', 'c:invalidType': 'Neispravan tip' };
      expect(Object.keys(custom)).toContain('__proto__');

      expect(() => setLocale('sr', custom as never)).not.toThrow();

      // The locale still works, and the odd key did not become its prototype.
      expect(() => parseOrFail(string(), 5, { lng: 'sr' })).toThrow('Neispravan tip');
      expect(parse(string(), 'ok', { lng: 'sr' })[1]).toBe('ok');
    });

    it('still sets a normal locale', () => {
      setLocale('sr', { 'c:invalidType': 'Neispravan tip podatka' });
      expect(() => parseOrFail(string(), 5, { lng: 'sr' })).toThrow('Neispravan tip podatka');
    });

    it('falls back to the default locale for an inherited name', () => {
      // `data['toString']` used to return a function, which resolved every message to undefined.
      expect(() => parseOrFail(string(), 5, { lng: 'toString' })).toThrow('Invalid type of data');
    });
  });

  describe('setToDefaultLocale', () => {
    /** An assert that reports `key`, built the way a real custom assert is. */
    const assertReporting = (key: string, message: string) => {
      const custom =
        (expected: string): RequiredValidation =>
        (received: string, ctx) => {
          if (expected !== received) ctx.addIssue(expected, received, key);
        };

      custom.key = key;
      custom.message = message;

      return custom;
    };

    // Not a duplicate of anything: the own-property check is what makes this pass. A plain lookup
    // found `Object.prototype.valueOf` and rejected the registration as a duplicate of a key nobody
    // had ever defined, so an assert was simply unable to use this name.
    it('accepts a key that resolves on Object.prototype', () => {
      const inherited = assertReporting('valueOf', 'Registered under an inherited name');

      expect(() => setToDefaultLocale(inherited)).not.toThrow();
      expect(() => parseOrFail(string().custom(inherited('hello')), 'x')).toThrow('Registered under an inherited name');
    });

    // Registration reaches into locales that already exist, so that a locale created before an
    // assert was imported does not report that assert's key as a raw string. A locale that already
    // has its own message for the key keeps it — a registered default must not overwrite a
    // translation the caller supplied.
    it('leaves a message an existing locale already defines alone', () => {
      const late = assertReporting('u:lateDefault', 'Registered after the locale existed');

      setLocale('sr', { 'u:lateDefault': 'Prevedena poruka' } as never);
      setToDefaultLocale(late);

      const schema = string().custom(late('hello'));
      expect(() => parseOrFail(schema, 'x', { lng: 'sr' })).toThrow('Prevedena poruka');
      expect(() => parseOrFail(schema, 'x')).toThrow('Registered after the locale existed');
    });
  });

  describe('record', () => {
    const anyRecord = record(string(), number());

    it('keeps a __proto__ key as an own property of the output', () => {
      const payload = JSON.parse('{"__proto__": 1, "a": 2}');
      const parsed = parseOrFail(anyRecord, payload);

      expect(Object.keys(parsed).sort()).toEqual(['__proto__', 'a']);
      expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
      expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    });

    it('does not let a payload replace the prototype of the parsed object', () => {
      const nestedRecord = record(string(), object({ isAdmin: string() }));
      const payload = JSON.parse('{"__proto__": {"isAdmin": "yes"}}');
      const parsed = parseOrFail(nestedRecord, payload) as Record<string, unknown>;

      // Before the fix: own keys were empty and `parsed.isAdmin` answered 'yes' off the prototype.
      expect(Object.keys(parsed)).toEqual(['__proto__']);
      expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
      expect(parsed.isAdmin).toBeUndefined();
      expect((parsed['__proto__'] as Record<string, unknown>).isAdmin).toBe('yes');
    });
  });

  describe('object', () => {
    // A COMPUTED key, deliberately: `{ __proto__: x }` in a literal is JavaScript's prototype-setter
    // syntax and never creates a property, so the shape has to be built the way a generated schema
    // or a JSON-driven one would build it.
    const protoShape = () => ({ ['__proto__']: string(), name: string() });

    it('honours a declared __proto__ property', () => {
      const schema = object(protoShape() as never);
      const payload = JSON.parse('{"__proto__": "x", "name": "n"}');
      const parsed = parseOrFail(schema, payload) as Record<string, unknown>;

      expect(Object.keys(parsed).sort()).toEqual(['__proto__', 'name']);
      expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
      expect(parsed['__proto__']).toBe('x');
    });

    it('describes a declared __proto__ property in the emitted JSON schema', () => {
      const jsonSchema = toJSONSchema(object(protoShape() as never));

      expect(Object.keys(jsonSchema.properties as object).sort()).toEqual(['__proto__', 'name']);
    });
  });
});
