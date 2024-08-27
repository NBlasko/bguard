import { array } from '../../src/asserts/array';
import { bigint } from '../../src/asserts/bigint';
import { boolean } from '../../src/asserts/boolean';
import { date } from '../../src/asserts/date';
import { dateMax } from '../../src/asserts/date/dateMax';
import { dateMin } from '../../src/asserts/date/dateMin';
import { oneOfTypes } from '../../src/asserts/mix';
import { number } from '../../src/asserts/number';
import { max } from '../../src/asserts/number/max';
import { min } from '../../src/asserts/number/min';
import { object } from '../../src/asserts/object';
import { string } from '../../src/asserts/string';
import { email } from '../../src/asserts/string/email';

export const testSchema1 = object({
  email: string().optional().custom(email()),
  age: number().custom(min(18), max(120)),
  address: string().nullable(),
  classes: array(
    object({
      name: string(),
      mandatory: boolean(),
      rooms: array(number()),
    }).optional(),
  ),
  verified: boolean().optional(),
});

export const testSchema2 = string();
export const testSchema3 = number();
export const testSchema4 = boolean();
export const testSchema5 = oneOfTypes(['bigint', 'number']);
export const testSchema6 = string().optional();
export const testSchema7 = number().optional();
export const testSchema8 = boolean().optional();
export const testSchema9 = oneOfTypes(['bigint', 'symbol']).optional();
export const testSchema10 = string().nullable();
export const testSchema11 = number().nullable();
export const testSchema12 = boolean().nullable();
export const testSchema13 = oneOfTypes(['string', 'symbol']).nullable();
export const testSchema14 = string().nullable().optional();
export const testSchema15 = number().nullable().optional();
export const testSchema16 = boolean().nullable().optional();
export const testSchema17 = oneOfTypes(['boolean', 'symbol']).nullable().optional();
export const testSchema18 = string().nullable().optional().equalTo('5');
export const testSchema19 = string().nullable().equalTo('5');
export const testSchema20 = string().optional().equalTo('5');
export const testSchema21 = string().equalTo('5');
export const testSchema22 = number().nullable().optional().equalTo(8);
export const testSchema23 = number().nullable().equalTo(8);
export const testSchema24 = number().optional().equalTo(8);
export const testSchema25 = number().equalTo(8);
export const testSchema26 = boolean().nullable().optional().onlyFalse();
export const testSchema27 = boolean().nullable().optional().onlyTrue();
export const testSchema28 = boolean().onlyFalse();
export const testSchema29 = boolean().onlyTrue();
export const testSchema30 = array(boolean().onlyTrue());
export const testSchema31 = array(boolean().nullable()).optional();
export const testSchema32 = array(boolean().optional()).nullable();
export const testSchema33 = number().oneOfValues([5, 7]);
export const testSchema34 = number().oneOfValues([5, 7]).nullable();
export const testSchema35 = number().oneOfValues([5, 7]).optional();
export const testSchema36 = number().oneOfValues([5, 7]).nullable().optional();
export const testSchema37 = string().oneOfValues(['foo', 'bar']);
export const testSchema38 = string().oneOfValues(['foo', 'bar']).nullable();
export const testSchema39 = string().oneOfValues(['foo', 'bar']).optional();
export const testSchema40 = string().oneOfValues(['foo', 'bar']).nullable().optional();
export const testSchema41 = string().oneOfValues(['foo']);
export const testSchema42 = string().oneOfValues(['foo']).nullable();
export const testSchema43 = date();
export const testSchema44 = date().nullable();
export const testSchema45 = date().optional();
export const testSchema46 = date().nullable().optional();
export const testSchema47 = date().nullable().optional().custom(dateMin('2024-01-01'));
export const testSchema48 = date().nullable().optional().custom(dateMax('2024-01-01'));
export const testSchema49 = bigint();
export const testSchema50 = bigint().nullable().optional();
export const testSchema51 = bigint().nullable();
export const testSchema52 = bigint().optional();
export const testSchema53 = bigint().oneOfValues([5n, 9007199254740991n]);
export const testSchema54 = bigint().oneOfValues([5n, 9007199254740991n]).nullable();
export const testSchema55 = bigint().oneOfValues([5n, 9007199254740991n]).optional();
export const testSchema56 = bigint().oneOfValues([5n, 9007199254740991n]).nullable().optional();
export const testSchema57 = bigint().equalTo(9007199254740991n);
export const testSchema58 = bigint().equalTo(9007199254740991n).optional().nullable();
export const testSchema59 = bigint().equalTo(9007199254740991n).nullable();
export const testSchema60 = bigint().equalTo(9007199254740991n).optional();
