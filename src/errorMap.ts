import { BuildSchemaError } from './';

// c: stands for common
export interface TranslationErrorMap {
  'c:optional': string;
  'c:nullable': string;
  'c:array': string;
  'c:objectType': string;
  'c:objectTypeAsArray': string;
  'c:unrecognizedProperty': string;
  'c:requiredProperty': string;
  'c:invalidType': string;
  [val: string]: string;
}

const defaultErrorMap: TranslationErrorMap = {
  'c:optional': 'The required value is missing',
  'c:nullable': 'Value should not be null',
  'c:array': 'Expected an array but received a different type',
  'c:objectType': 'Expected an object but received a different type',
  'c:objectTypeAsArray': 'Expected an object but received an array. Invalid type of data',
  'c:unrecognizedProperty': 'This property is not allowed in the object',
  'c:requiredProperty': 'Missing required property in the object',
  'c:invalidType': 'Invalid type of data',
};

let data: Record<string, Record<string, string>> = {
  default: { ...defaultErrorMap },
};

export function setToDefaultLocale(messageKey: string, messageValue: string) {
  const defaultLocale = data.default!;
  if (defaultLocale[messageKey]) throw new BuildSchemaError('Duplicate default message key');
  defaultLocale[messageKey] = messageValue;
}

export function setLocale(lng: string, custom: Partial<TranslationErrorMap>) {
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
