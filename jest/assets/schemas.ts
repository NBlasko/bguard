import { array } from '../../src/asserts/array';
import { boolean } from '../../src/asserts/boolean';
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
