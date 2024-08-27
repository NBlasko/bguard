import { BuildSchemaError } from './exceptions';
import { RequiredValidation, TranslationErrorMap } from './commonTypes';

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
  'c:date': 'The received value is not a valid instance of Date'
  //@@end
};

let data: Record<string, Record<string, string>> = {
  default: { ...defaultErrorMap },
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
  const defaultLocale = data.default!;
  if (defaultLocale[key]) throw new BuildSchemaError('Duplicate default message key');
  defaultLocale[key] = message;
}

export function setLocale(lng: string, custom: Partial<TranslationErrorMap>) {
  if (lng === 'default') throw new BuildSchemaError('Invalid language');
  if (!data[lng]) data[lng] = { ...defaultErrorMap };
  const locale = data[lng]!;
  Object.entries(custom).forEach(([messageKey, messageValue]) => {
    locale[messageKey] = messageValue!;
  });
}

export function clearLocales() {
  data = {
    default: { ...defaultErrorMap },
  };
}

export function getTranslationByLocale(lng?: string): TranslationErrorMap {
  if (!lng) return data['default'] as TranslationErrorMap;
  return (data[lng] ?? data['default']) as TranslationErrorMap;
}
