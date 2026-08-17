import { BuildSchemaError } from './exceptions';
import { setOwnProperty } from './helpers/setOwnProperty';
import type { TranslationErrorMap } from './commonTypes';
import type { RequiredValidation } from './core';

/** Names that describe a place on the prototype chain rather than a language. */
const unsafeLocaleNames = new Set(['__proto__', 'constructor', 'prototype']);

// c: stands for common
const defaultErrorMap: TranslationErrorMap = {
  //@@start
  'c:optional': 'The required value is missing',
  'c:nullable': 'Value should not be null',
  'c:array': 'Expected an array but received a different type',
  'c:objectType': 'Expected an object but received a different type',
  'c:objectTypeAsArray': 'Expected an object but received an array. Invalid type of data',
  'c:unrecognizedProperty': 'This property is not allowed in the object',
  'c:requiredProperty': 'Missing required property in the object',
  'c:invalidType': 'Invalid type of data',
  'c:isBoolean': 'The received value is not {{e}}',
  'c:date': 'The received value is not a valid instance of Date',
  'c:nan': 'The received number is not a valid number',
  'c:union': 'The received value does not match any of the expected types',
  'c:maxDepth': 'The received value is nested deeper than the {{e}} levels allowed',
  'c:tupleLength': 'The received tuple has {{r}} entries but {{e}} were expected',
  //@@end
};

/**
 * Messages registered by asserts through `setToDefaultLocale`, kept apart from the locale data.
 *
 * Every assert registers its default message once, when its module is first imported. Those
 * registrations can never happen again, so they have to survive `clearLocales`, and they have to
 * seed every locale created by `setLocale` — otherwise a locale that translates one key reports
 * every other key as its raw name.
 */
const registeredDefaults: Record<string, string> = Object.create(null);

/**
 * The messages a fresh locale starts from: the common ones plus everything asserts registered.
 *
 * Prototype-free, for two reasons. A locale is indexed by a message key that an assert chose, so on
 * an ordinary object `addIssue('…', '…', 'constructor')` resolved `Object` off the prototype and
 * tried to run placeholder replacement on a function. And a custom message key of `__proto__` would
 * otherwise set the locale's prototype instead of storing a message.
 */
function baseMessages(): Record<string, string> {
  return Object.assign(Object.create(null) as Record<string, string>, defaultErrorMap, registeredDefaults);
}

/**
 * Locales by language, also prototype-free.
 *
 * The lookups here are the reason, not just tidiness. `data[lng] ??= baseMessages()` on an ordinary
 * object read `Object.prototype` for `lng` of `__proto__` — truthy, so no locale was created — and
 * the following writes then landed on `Object.prototype` itself, which is prototype pollution
 * reachable from a locale name. With no prototype there is nothing to inherit and nothing to hit:
 * `__proto__` is an ordinary key holding an ordinary locale.
 */
function newLocaleStore(): Record<string, Record<string, string>> {
  const store: Record<string, Record<string, string>> = Object.create(null);
  store['default'] = baseMessages();

  return store;
}

let data = newLocaleStore();

/** Own-property lookup, so an inherited name is not mistaken for a registered message. */
function ownMessage(source: Record<string, string>, key: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
}

export function setToDefaultLocale({
  key,
  message,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (expected: any): RequiredValidation;
  key: string;
  message: string;
}) {
  // `defaultErrorMap` is an ordinary object literal, so this has to be an own-property check: a
  // plain lookup of `toString` found a function on the prototype and rejected the registration as a
  // duplicate of a key nobody had defined.
  if (ownMessage(registeredDefaults, key) ?? ownMessage(defaultErrorMap, key))
    throw new BuildSchemaError('Duplicate default message key');

  setOwnProperty(registeredDefaults, key, message);

  // Keep locales that already exist in step, so registration order does not matter.
  Object.values(data).forEach((locale) => {
    if (ownMessage(locale, key) === undefined) setOwnProperty(locale, key, message);
  });
}

export function setLocale(lng: string, custom: Partial<TranslationErrorMap>) {
  if (lng === 'default') throw new BuildSchemaError('Invalid language');

  // A locale name is a key into the store and a bag of messages is written under it, so a name that
  // resolves to something other than a locale used to hand those writes to whatever it did resolve
  // to — `__proto__` gave them `Object.prototype`. The store is prototype-free now, which is what
  // actually prevents that; the names are still rejected because none of them describes a language,
  // and a caller passing one has a bug worth hearing about.
  if (unsafeLocaleNames.has(lng)) throw new BuildSchemaError('Invalid language');

  // Rejected rather than iterated: `Object.entries` of a string yields its characters under numeric
  // keys, so a mistyped call turned `'sr'` into messages named '0' and '1'.
  if (typeof custom !== 'object' || custom === null || Array.isArray(custom))
    throw new BuildSchemaError('Invalid translation map');

  data[lng] ??= baseMessages();
  const locale = data[lng];
  Object.entries(custom).forEach(([messageKey, messageValue]) => {
    setOwnProperty(locale, messageKey, messageValue!);
  });
}

/**
 * Drops every locale and returns the default one to its registered messages.
 *
 * Assert registrations are deliberately kept: they describe the schemas, not a translation, and
 * clearing them would leave every built-in assert reporting its key instead of a message.
 */
export function clearLocales() {
  data = newLocaleStore();
}

export function getTranslationByLocale(lng?: string): TranslationErrorMap {
  if (!lng) return data['default'] as TranslationErrorMap;

  // No own-property guard needed: the store has no prototype, so an unregistered name — including
  // `toString`, which used to come back as a function and leave every message unresolved — misses
  // and falls back to the default locale.
  return (data[lng] ?? data['default']) as TranslationErrorMap;
}
