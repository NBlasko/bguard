// index.test.ts
import * as beGuardIndexExports from '../index';

describe('Library exports', () => {
  it('should export all expected members', () => {
    const expectedExports = [
      'parseOrFail',
      'parse',
      'ExceptionContext',
      'ValidationError',
      'BuildSchemaError',
      'setLocale',
      'setToDefaultLocale',
      'clearLocales',
      'codeGen',
      'codeGenWithName',

      // array
      'array',
      'maxArrayLength',
      'minArrayLength',

      // bigint
      'bigint',
      'bigintMax',
      'bigintMaxExcluded',
      'bigintMin',
      'bigintMinExcluded',

      // boolean
      'boolean',

      // date
      'date',
      'dateMax',
      'dateMin',

      // mix
      'oneOfTypes',
      'union',
      'record',
      'tuple',
      'lazy',
      'intersection',
      'equalTo',
      'oneOfValues',

      // number
      'number',
      'max',
      'maxExcluded',
      'min',
      'minExcluded',
      'positive',
      'negative',

      // object
      'object',
      'maxKeys',
      'pick',
      'omit',
      'partial',
      'extend',

      // string
      'string',
      'atLeastOneDigit',
      'atLeastOneLowerChar',
      'atLeastOneSpecialChar',
      'atLeastOneUpperChar',
      'contains',
      'email',
      'endsWith',
      'isValidDate',
      'isValidDateTime',
      'isValidTime',
      'lowerCase',
      'maxLength',
      'minLength',
      'regExp',
      'startsWith',
      'upperCase',
      'uuid',
      'uuidV1',
      'uuidV2',
      'uuidV3',
      'uuidV4',
      'uuidV5',
      'validUrl',
    ];

    for (const name of expectedExports) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(beGuardIndexExports[name]).toBeDefined();
    }
  });
});
