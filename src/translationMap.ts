import { BuildSchemaError } from './exceptions';
import type { TranslationErrorMap } from './commonTypes';
import type { RequiredValidation } from './core';

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
const registeredDefaults: Record<string, string> = {};

/** The messages a fresh locale starts from: the common ones plus everything asserts registered. */
function baseMessages(): Record<string, string> {
  return { ...defaultErrorMap, ...registeredDefaults };
}

let data: Record<string, Record<string, string>> = {
  default: baseMessages(),
};

export function setToDefaultLocale({
  key,
  message,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (expected: any): RequiredValidation;
  key: string;
  message: string;
}) {
  if (registeredDefaults[key] ?? defaultErrorMap[key]) throw new BuildSchemaError('Duplicate default message key');
  registeredDefaults[key] = message;

  // Keep locales that already exist in step, so registration order does not matter.
  Object.values(data).forEach((locale) => {
    locale[key] ??= message;
  });
}

export function setLocale(lng: string, custom: Partial<TranslationErrorMap>) {
  if (lng === 'default') throw new BuildSchemaError('Invalid language');
  data[lng] ??= baseMessages();
  const locale = data[lng];
  Object.entries(custom).forEach(([messageKey, messageValue]) => {
    locale[messageKey] = messageValue!;
  });
}

/**
 * Drops every locale and returns the default one to its registered messages.
 *
 * Assert registrations are deliberately kept: they describe the schemas, not a translation, and
 * clearing them would leave every built-in assert reporting its key instead of a message.
 */
export function clearLocales() {
  data = {
    default: baseMessages(),
  };
}

export function getTranslationByLocale(lng?: string): TranslationErrorMap {
  if (!lng) return data['default'] as TranslationErrorMap;
  return (data[lng] ?? data['default']) as TranslationErrorMap;
}
