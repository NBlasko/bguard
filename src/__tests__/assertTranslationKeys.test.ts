import { parse, setLocale } from '../';
import { CommonSchema, RequiredValidation } from '../core';

import { array } from '../asserts/array';
import { maxArrayLength } from '../asserts/array/maxArrayLength';
import { minArrayLength } from '../asserts/array/minArrayLength';

import { bigint } from '../asserts/bigint';
import { bigintMax } from '../asserts/bigint/bigintMax';
import { bigintMaxExcluded } from '../asserts/bigint/bigintMaxExcluded';
import { bigintMin } from '../asserts/bigint/bigintMin';
import { bigintMinExcluded } from '../asserts/bigint/bigintMinExcluded';

import { date } from '../asserts/date';
import { dateMax } from '../asserts/date/dateMax';
import { dateMin } from '../asserts/date/dateMin';

import { equalTo } from '../asserts/mix/equalTo';
import { oneOfValues } from '../asserts/mix/oneOfValues';

import { number } from '../asserts/number';
import { max } from '../asserts/number/max';
import { maxExcluded } from '../asserts/number/maxExcluded';
import { min } from '../asserts/number/min';
import { minExcluded } from '../asserts/number/minExcluded';
import { negative } from '../asserts/number/negative';
import { positive } from '../asserts/number/positive';

import { object } from '../asserts/object';
import { maxKeys } from '../asserts/object/maxKeys';

import { string } from '../asserts/string';
import { atLeastOneDigit } from '../asserts/string/atLeastOneDigit';
import { atLeastOneLowerChar } from '../asserts/string/atLeastOneLowerChar';
import { atLeastOneSpecialChar } from '../asserts/string/atLeastOneSpecialChar';
import { atLeastOneUpperChar } from '../asserts/string/atLeastOneUpperChar';
import { contains } from '../asserts/string/contains';
import { email } from '../asserts/string/email';
import { endsWith } from '../asserts/string/endsWith';
import { isValidDate } from '../asserts/string/isValidDate';
import { isValidDateTime } from '../asserts/string/isValidDateTime';
import { isValidTime } from '../asserts/string/isValidTime';
import { lowerCase } from '../asserts/string/lowerCase';
import { maxLength } from '../asserts/string/maxLength';
import { minLength } from '../asserts/string/minLength';
import { regExp } from '../asserts/string/regExp';
import { startsWith } from '../asserts/string/startsWith';
import { upperCase } from '../asserts/string/upperCase';
import { uuid } from '../asserts/string/uuid';
import { uuidV1 } from '../asserts/string/uuidV1';
import { uuidV2 } from '../asserts/string/uuidV2';
import { uuidV3 } from '../asserts/string/uuidV3';
import { uuidV4 } from '../asserts/string/uuidV4';
import { uuidV5 } from '../asserts/string/uuidV5';
import { validUrl } from '../asserts/string/validUrl';

/**
 * Every built-in assert declares a translation `key` and registers a default message for it.
 * At validation time the key is what `ctx.addIssue` must be given, so that `setLocale` can
 * override the message. Passing the message text instead still produces correct-looking
 * English output while silently ignoring every translation, which is why this needs a test
 * that goes through `setLocale` rather than one that only asserts the default message.
 *
 * Each entry pairs an assert with a schema and a value that makes that assert fail.
 */
interface Case {
  name: string;
  key: string;
  assert: RequiredValidation;
  schema: (a: RequiredValidation) => CommonSchema;
  invalid: unknown;
}

const onString = (a: RequiredValidation) => string().custom(a);
const onNumber = (a: RequiredValidation) => number().custom(a);
const onBigInt = (a: RequiredValidation) => bigint().custom(a);
const onDate = (a: RequiredValidation) => date().custom(a);
const onArray = (a: RequiredValidation) => array(string()).custom(a);
const onObject = (a: RequiredValidation) => object({ a: string() }).custom(a);

const cases: Case[] = [
  { name: 'maxArrayLength', key: maxArrayLength.key, assert: maxArrayLength(1), schema: onArray, invalid: ['a', 'b'] },
  { name: 'minArrayLength', key: minArrayLength.key, assert: minArrayLength(2), schema: onArray, invalid: ['a'] },

  { name: 'bigintMax', key: bigintMax.key, assert: bigintMax(5n), schema: onBigInt, invalid: 10n },
  {
    name: 'bigintMaxExcluded',
    key: bigintMaxExcluded.key,
    assert: bigintMaxExcluded(5n),
    schema: onBigInt,
    invalid: 5n,
  },
  { name: 'bigintMin', key: bigintMin.key, assert: bigintMin(5n), schema: onBigInt, invalid: 1n },
  {
    name: 'bigintMinExcluded',
    key: bigintMinExcluded.key,
    assert: bigintMinExcluded(5n),
    schema: onBigInt,
    invalid: 5n,
  },

  { name: 'dateMax', key: dateMax.key, assert: dateMax('2020-01-01'), schema: onDate, invalid: new Date('2021-01-01') },
  { name: 'dateMin', key: dateMin.key, assert: dateMin('2020-01-01'), schema: onDate, invalid: new Date('2019-01-01') },

  { name: 'equalTo', key: equalTo.key, assert: equalTo('expected'), schema: onString, invalid: 'other' },
  { name: 'oneOfValues', key: oneOfValues.key, assert: oneOfValues(['a', 'b']), schema: onString, invalid: 'c' },

  { name: 'max', key: max.key, assert: max(5), schema: onNumber, invalid: 10 },
  { name: 'maxExcluded', key: maxExcluded.key, assert: maxExcluded(5), schema: onNumber, invalid: 5 },
  { name: 'min', key: min.key, assert: min(5), schema: onNumber, invalid: 1 },
  { name: 'minExcluded', key: minExcluded.key, assert: minExcluded(5), schema: onNumber, invalid: 5 },
  { name: 'negative', key: negative.key, assert: negative(), schema: onNumber, invalid: 1 },
  { name: 'positive', key: positive.key, assert: positive(), schema: onNumber, invalid: -1 },

  { name: 'maxKeys', key: maxKeys.key, assert: maxKeys(0), schema: onObject, invalid: { a: 'x' } },

  { name: 'atLeastOneDigit', key: atLeastOneDigit.key, assert: atLeastOneDigit(), schema: onString, invalid: 'abc' },
  {
    name: 'atLeastOneLowerChar',
    key: atLeastOneLowerChar.key,
    assert: atLeastOneLowerChar(),
    schema: onString,
    invalid: 'ABC',
  },
  {
    name: 'atLeastOneSpecialChar',
    key: atLeastOneSpecialChar.key,
    assert: atLeastOneSpecialChar(),
    schema: onString,
    invalid: 'abc',
  },
  {
    name: 'atLeastOneUpperChar',
    key: atLeastOneUpperChar.key,
    assert: atLeastOneUpperChar(),
    schema: onString,
    invalid: 'abc',
  },
  { name: 'contains', key: contains.key, assert: contains('needle'), schema: onString, invalid: 'haystack' },
  { name: 'email', key: email.key, assert: email(), schema: onString, invalid: 'not-an-email' },
  { name: 'endsWith', key: endsWith.key, assert: endsWith('suffix'), schema: onString, invalid: 'nope' },
  { name: 'isValidDate', key: isValidDate.key, assert: isValidDate(), schema: onString, invalid: '2020-13-45' },
  {
    name: 'isValidDateTime',
    key: isValidDateTime.key,
    assert: isValidDateTime(),
    schema: onString,
    invalid: 'not a datetime',
  },
  { name: 'isValidTime', key: isValidTime.key, assert: isValidTime(), schema: onString, invalid: '99:99' },
  { name: 'lowerCase', key: lowerCase.key, assert: lowerCase(), schema: onString, invalid: 'NOTLOWER' },
  { name: 'maxLength', key: maxLength.key, assert: maxLength(2), schema: onString, invalid: 'toolong' },
  { name: 'minLength', key: minLength.key, assert: minLength(5), schema: onString, invalid: 'ab' },
  { name: 'regExp', key: regExp.key, assert: regExp(/^\d+$/), schema: onString, invalid: 'abc' },
  { name: 'startsWith', key: startsWith.key, assert: startsWith('prefix'), schema: onString, invalid: 'nope' },
  { name: 'upperCase', key: upperCase.key, assert: upperCase(), schema: onString, invalid: 'notupper' },
  { name: 'uuid', key: uuid.key, assert: uuid(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'uuidV1', key: uuidV1.key, assert: uuidV1(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'uuidV2', key: uuidV2.key, assert: uuidV2(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'uuidV3', key: uuidV3.key, assert: uuidV3(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'uuidV4', key: uuidV4.key, assert: uuidV4(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'uuidV5', key: uuidV5.key, assert: uuidV5(), schema: onString, invalid: 'not-a-uuid' },
  { name: 'validUrl', key: validUrl.key, assert: validUrl(), schema: onString, invalid: 'not a url' },
];

describe('built-in assert translation keys', () => {
  // Deliberately no clearLocales() here. It resets the default locale to the common `c:*`
  // messages only, discarding the assert defaults that were registered at module load, and
  // those cannot be re-registered afterwards. See clearLocales in translationMap.ts.

  it('covers every assert that declares a translation key', () => {
    // Guards against an assert being added without a matching case above.
    expect(cases).toHaveLength(40);
    expect(new Set(cases.map((c) => c.key)).size).toBe(cases.length);
    expect(cases.every((c) => typeof c.key === 'string' && c.key.length > 0)).toBe(true);
  });

  it.each(cases)('$name honours a setLocale override', ({ key, assert, schema, invalid }) => {
    const translated = `translated message for ${key}`;
    setLocale(`lng-${key}`, { [key]: translated });

    const [errors] = parse(schema(assert), invalid, { lng: `lng-${key}` });

    expect(errors).toBeDefined();
    expect(errors![0]!.message).toBe(translated);
  });

  it.each(cases)('$name reports the received value, not the message text', ({ assert, schema, invalid }) => {
    const [errors] = parse(schema(assert), invalid);

    expect(errors).toBeDefined();
    // A swapped argument order would put the message text into `received`.
    expect(errors![0]!.received).not.toBe(errors![0]!.message);
    expect(errors![0]!.message).not.toBe('');
  });
});
