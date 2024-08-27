import { expectEqualTypes } from '../../jest/setup';
import { InferType } from '../InferType';
import {
  testSchema1,
  testSchema2,
  testSchema3,
  testSchema4,
  testSchema5,
  testSchema6,
  testSchema7,
  testSchema8,
  testSchema9,
  testSchema10,
  testSchema11,
  testSchema12,
  testSchema13,
  testSchema14,
  testSchema15,
  testSchema16,
  testSchema17,
  testSchema18,
  testSchema19,
  testSchema20,
  testSchema21,
  testSchema22,
  testSchema23,
  testSchema24,
  testSchema25,
  testSchema26,
  testSchema27,
  testSchema28,
  testSchema29,
  testSchema30,
  testSchema31,
  testSchema32,
  testSchema33,
  testSchema34,
  testSchema35,
  testSchema36,
  testSchema37,
  testSchema38,
  testSchema39,
  testSchema40,
  testSchema41,
  testSchema42,
  testSchema43,
  testSchema44,
  testSchema45,
  testSchema46,
  testSchema47,
  testSchema48,
  testSchema49,
  testSchema50,
  testSchema51,
  testSchema52,
  testSchema53,
  testSchema54,
  testSchema55,
  testSchema56,
  testSchema57,
  testSchema58,
  testSchema59,
  testSchema60,
} from '../../jest/assets/schemas';
import {
  TestSchema1,
  TestSchema2,
  TestSchema3,
  TestSchema4,
  TestSchema5,
  TestSchema6,
  TestSchema7,
  TestSchema8,
  TestSchema9,
  TestSchema10,
  TestSchema11,
  TestSchema12,
  TestSchema13,
  TestSchema14,
  TestSchema15,
  TestSchema16,
  TestSchema17,
  TestSchema18,
  TestSchema19,
  TestSchema20,
  TestSchema21,
  TestSchema22,
  TestSchema23,
  TestSchema24,
  TestSchema25,
  TestSchema26,
  TestSchema27,
  TestSchema28,
  TestSchema29,
  TestSchema30,
  TestSchema31,
  TestSchema32,
  TestSchema34,
  TestSchema33,
  TestSchema35,
  TestSchema36,
  TestSchema37,
  TestSchema38,
  TestSchema39,
  TestSchema40,
  TestSchema41,
  TestSchema42,
  TestSchema43,
  TestSchema44,
  TestSchema45,
  TestSchema46,
  TestSchema47,
  TestSchema48,
  TestSchema49,
  TestSchema50,
  TestSchema51,
  TestSchema52,
  TestSchema53,
  TestSchema54,
  TestSchema55,
  TestSchema56,
  TestSchema57,
  TestSchema58,
  TestSchema59,
  TestSchema60,
} from '../../jest/assets/staticTypes';
import {
  TestSchema1String,
  TestSchema2String,
  TestSchema3String,
  TestSchema4String,
  TestSchema5String,
  TestSchema6String,
  TestSchema7String,
  TestSchema8String,
  TestSchema9String,
  TestSchema10String,
  TestSchema11String,
  TestSchema12String,
  TestSchema13String,
  TestSchema14String,
  TestSchema15String,
  TestSchema16String,
  TestSchema17String,
  TestSchema18String,
  TestSchema19String,
  TestSchema20String,
  TestSchema21String,
  TestSchema22String,
  TestSchema23String,
  TestSchema24String,
  TestSchema25String,
  TestSchema26String,
  TestSchema27String,
  TestSchema28String,
  TestSchema29String,
  TestSchema30String,
  TestSchema31String,
  TestSchema32String,
  TestSchema34String,
  TestSchema33String,
  TestSchema35String,
  TestSchema36String,
  TestSchema37String,
  TestSchema38String,
  TestSchema39String,
  TestSchema40String,
  TestSchema41String,
  TestSchema42String,
  TestSchema43String,
  TestSchema44String,
  TestSchema45String,
  TestSchema46String,
  TestSchema47String,
  TestSchema48String,
  TestSchema49String,
  TestSchema50String,
  TestSchema51String,
  TestSchema52String,
  TestSchema53String,
  TestSchema54String,
  TestSchema55String,
  TestSchema56String,
  TestSchema57String,
  TestSchema58String,
  TestSchema59String,
  TestSchema60String,
} from '../../jest/assets/staticTypesAsString';

import { codeGen, codeGenWithName } from '../codeGen';

describe('CodeGen', () => {
  it('shoud create type with name', () => {
    expect(`type TestSchema1 = ${TestSchema1String}\n`).toBe(codeGenWithName('TestSchema1', testSchema1));
  });

  it('should have same static and dynamic type', () => {
    expectEqualTypes<TestSchema1, InferType<typeof testSchema1>>(true);
    expect(TestSchema1String).toBe(codeGen(testSchema1));
    expect(TestSchema1String).toMatchSnapshot('TestSchema1String');

    expectEqualTypes<TestSchema2, InferType<typeof testSchema2>>(true);
    expect(TestSchema2String).toBe(codeGen(testSchema2));
    expect(TestSchema2String).toMatchSnapshot('TestSchema2String');

    expectEqualTypes<TestSchema3, InferType<typeof testSchema3>>(true);
    expect(TestSchema3String).toBe(codeGen(testSchema3));
    expect(TestSchema3String).toMatchSnapshot('TestSchema3String');

    expectEqualTypes<TestSchema4, InferType<typeof testSchema4>>(true);
    expect(TestSchema4String).toBe(codeGen(testSchema4));
    expect(TestSchema4String).toMatchSnapshot('TestSchema4String');

    expectEqualTypes<TestSchema5, InferType<typeof testSchema5>>(true);
    expect(TestSchema5String).toBe(codeGen(testSchema5));
    expect(TestSchema5String).toMatchSnapshot('TestSchema5String');

    expectEqualTypes<TestSchema6, InferType<typeof testSchema6>>(true);
    expect(TestSchema6String).toBe(codeGen(testSchema6));
    expect(TestSchema6String).toMatchSnapshot('TestSchema6String');

    expectEqualTypes<TestSchema7, InferType<typeof testSchema7>>(true);
    expect(TestSchema7String).toBe(codeGen(testSchema7));
    expect(TestSchema7String).toMatchSnapshot('TestSchema7String');

    expectEqualTypes<TestSchema8, InferType<typeof testSchema8>>(true);
    expect(TestSchema8String).toBe(codeGen(testSchema8));
    expect(TestSchema8String).toMatchSnapshot('TestSchema8String');

    expectEqualTypes<TestSchema9, InferType<typeof testSchema9>>(true);
    expect(TestSchema9String).toBe(codeGen(testSchema9));
    expect(TestSchema9String).toMatchSnapshot('TestSchema9String');

    expectEqualTypes<TestSchema10, InferType<typeof testSchema10>>(true);
    expect(TestSchema10String).toBe(codeGen(testSchema10));
    expect(TestSchema10String).toMatchSnapshot('TestSchema10String');

    expectEqualTypes<TestSchema11, InferType<typeof testSchema11>>(true);
    expect(TestSchema11String).toBe(codeGen(testSchema11));
    expect(TestSchema11String).toMatchSnapshot('TestSchema11String');

    expectEqualTypes<TestSchema12, InferType<typeof testSchema12>>(true);
    expect(TestSchema12String).toBe(codeGen(testSchema12));
    expect(TestSchema12String).toMatchSnapshot('TestSchema12String');

    expectEqualTypes<TestSchema13, InferType<typeof testSchema13>>(true);
    expect(TestSchema13String).toBe(codeGen(testSchema13));
    expect(TestSchema13String).toMatchSnapshot('TestSchema13String');

    expectEqualTypes<TestSchema14, InferType<typeof testSchema14>>(true);
    expect(TestSchema14String).toBe(codeGen(testSchema14));
    expect(TestSchema14String).toMatchSnapshot('TestSchema14String');

    expectEqualTypes<TestSchema15, InferType<typeof testSchema15>>(true);
    expect(TestSchema15String).toBe(codeGen(testSchema15));
    expect(TestSchema15String).toMatchSnapshot('TestSchema15String');

    expectEqualTypes<TestSchema16, InferType<typeof testSchema16>>(true);
    expect(TestSchema16String).toBe(codeGen(testSchema16));
    expect(TestSchema16String).toMatchSnapshot('TestSchema16String');

    expectEqualTypes<TestSchema17, InferType<typeof testSchema17>>(true);
    expect(TestSchema17String).toBe(codeGen(testSchema17));

    expectEqualTypes<TestSchema18, InferType<typeof testSchema18>>(true);
    expect(TestSchema18String).toBe(codeGen(testSchema18));
    expect(TestSchema18String).toMatchSnapshot('TestSchema18String');

    expectEqualTypes<TestSchema19, InferType<typeof testSchema19>>(true);
    expect(TestSchema19String).toBe(codeGen(testSchema19));
    expect(TestSchema19String).toMatchSnapshot('TestSchema19String');

    expectEqualTypes<TestSchema20, InferType<typeof testSchema20>>(true);
    expect(TestSchema20String).toBe(codeGen(testSchema20));
    expect(TestSchema20String).toMatchSnapshot('TestSchema20String');

    expectEqualTypes<TestSchema21, InferType<typeof testSchema21>>(true);
    expect(TestSchema21String).toBe(codeGen(testSchema21));
    expect(TestSchema21String).toMatchSnapshot('TestSchema21String');

    expectEqualTypes<TestSchema22, InferType<typeof testSchema22>>(true);
    expect(TestSchema22String).toBe(codeGen(testSchema22));
    expect(TestSchema22String).toMatchSnapshot('TestSchema22String');

    expectEqualTypes<TestSchema23, InferType<typeof testSchema23>>(true);
    expect(TestSchema23String).toBe(codeGen(testSchema23));
    expect(TestSchema23String).toMatchSnapshot('TestSchema23String');

    expectEqualTypes<TestSchema24, InferType<typeof testSchema24>>(true);
    expect(TestSchema24String).toBe(codeGen(testSchema24));
    expect(TestSchema24String).toMatchSnapshot('TestSchema24String');

    expectEqualTypes<TestSchema25, InferType<typeof testSchema25>>(true);
    expect(TestSchema25String).toBe(codeGen(testSchema25));
    expect(TestSchema25String).toMatchSnapshot('TestSchema25String');

    expectEqualTypes<TestSchema26, InferType<typeof testSchema26>>(true);
    expect(TestSchema26String).toBe(codeGen(testSchema26));
    expect(TestSchema26String).toMatchSnapshot('TestSchema26String');

    expectEqualTypes<TestSchema27, InferType<typeof testSchema27>>(true);
    expect(TestSchema27String).toBe(codeGen(testSchema27));
    expect(TestSchema27String).toMatchSnapshot('TestSchema27String');

    expectEqualTypes<TestSchema28, InferType<typeof testSchema28>>(true);
    expect(TestSchema28String).toBe(codeGen(testSchema28));
    expect(TestSchema28String).toMatchSnapshot('TestSchema28String');

    expectEqualTypes<TestSchema29, InferType<typeof testSchema29>>(true);
    expect(TestSchema29String).toBe(codeGen(testSchema29));
    expect(TestSchema29String).toMatchSnapshot('TestSchema29String');

    expectEqualTypes<TestSchema30, InferType<typeof testSchema30>>(true);
    expect(TestSchema30String).toBe(codeGen(testSchema30));
    expect(TestSchema30String).toMatchSnapshot('TestSchema30String');

    expectEqualTypes<TestSchema31, InferType<typeof testSchema31>>(true);
    expect(TestSchema31String).toBe(codeGen(testSchema31));
    expect(TestSchema31String).toMatchSnapshot('TestSchema31String');

    expectEqualTypes<TestSchema32, InferType<typeof testSchema32>>(true);
    expect(TestSchema32String).toBe(codeGen(testSchema32));
    expect(TestSchema32String).toMatchSnapshot('TestSchema32String');

    expectEqualTypes<TestSchema33, InferType<typeof testSchema33>>(true);
    expect(TestSchema33String).toBe(codeGen(testSchema33));
    expect(TestSchema33String).toMatchSnapshot('TestSchema33String');

    expectEqualTypes<TestSchema34, InferType<typeof testSchema34>>(true);
    expect(TestSchema34String).toBe(codeGen(testSchema34));
    expect(TestSchema34String).toMatchSnapshot('TestSchema34String');

    expectEqualTypes<TestSchema35, InferType<typeof testSchema35>>(true);
    expect(TestSchema35String).toBe(codeGen(testSchema35));
    expect(TestSchema35String).toMatchSnapshot('TestSchema35String');

    expectEqualTypes<TestSchema36, InferType<typeof testSchema36>>(true);
    expect(TestSchema36String).toBe(codeGen(testSchema36));
    expect(TestSchema36String).toMatchSnapshot('TestSchema36String');

    expectEqualTypes<TestSchema37, InferType<typeof testSchema37>>(true);
    expect(TestSchema37String).toBe(codeGen(testSchema37));
    expect(TestSchema37String).toMatchSnapshot('TestSchema37String');

    expectEqualTypes<TestSchema38, InferType<typeof testSchema38>>(true);
    expect(TestSchema38String).toBe(codeGen(testSchema38));
    expect(TestSchema38String).toMatchSnapshot('TestSchema38String');

    expectEqualTypes<TestSchema39, InferType<typeof testSchema39>>(true);
    expect(TestSchema39String).toBe(codeGen(testSchema39));
    expect(TestSchema39String).toMatchSnapshot('TestSchema39String');

    expectEqualTypes<TestSchema40, InferType<typeof testSchema40>>(true);
    expect(TestSchema40String).toBe(codeGen(testSchema40));
    expect(TestSchema40String).toMatchSnapshot('TestSchema40String');

    expectEqualTypes<TestSchema41, InferType<typeof testSchema41>>(true);
    expect(TestSchema41String).toBe(codeGen(testSchema41));
    expect(TestSchema41String).toMatchSnapshot('TestSchema41String');

    expectEqualTypes<TestSchema42, InferType<typeof testSchema42>>(true);
    expect(TestSchema42String).toBe(codeGen(testSchema42));
    expect(TestSchema42String).toMatchSnapshot('TestSchema42String');

    expectEqualTypes<TestSchema43, InferType<typeof testSchema43>>(true);
    expect(TestSchema43String).toBe(codeGen(testSchema43));
    expect(TestSchema43String).toMatchSnapshot('TestSchema43String');

    expectEqualTypes<TestSchema44, InferType<typeof testSchema44>>(true);
    expect(TestSchema44String).toBe(codeGen(testSchema44));
    expect(TestSchema44String).toMatchSnapshot('TestSchema44String');

    expectEqualTypes<TestSchema45, InferType<typeof testSchema45>>(true);
    expect(TestSchema45String).toBe(codeGen(testSchema45));
    expect(TestSchema45String).toMatchSnapshot('TestSchema45String');

    expectEqualTypes<TestSchema46, InferType<typeof testSchema46>>(true);
    expect(TestSchema46String).toBe(codeGen(testSchema46));
    expect(TestSchema46String).toMatchSnapshot('TestSchema46String');

    expectEqualTypes<TestSchema47, InferType<typeof testSchema47>>(true);
    expect(TestSchema47String).toBe(codeGen(testSchema47));
    expect(TestSchema47String).toMatchSnapshot('TestSchema47String');

    expectEqualTypes<TestSchema48, InferType<typeof testSchema48>>(true);
    expect(TestSchema48String).toBe(codeGen(testSchema48));
    expect(TestSchema48String).toMatchSnapshot('TestSchema48String');

    expectEqualTypes<TestSchema49, InferType<typeof testSchema49>>(true);
    expect(TestSchema49String).toBe(codeGen(testSchema49));
    expect(TestSchema49String).toMatchSnapshot('TestSchema49String');

    expectEqualTypes<TestSchema50, InferType<typeof testSchema50>>(true);
    expect(TestSchema50String).toBe(codeGen(testSchema50));
    expect(TestSchema50String).toMatchSnapshot('TestSchema50String');

    expectEqualTypes<TestSchema51, InferType<typeof testSchema51>>(true);
    expect(TestSchema51String).toBe(codeGen(testSchema51));
    expect(TestSchema51String).toMatchSnapshot('TestSchema51String');

    expectEqualTypes<TestSchema52, InferType<typeof testSchema52>>(true);
    expect(TestSchema52String).toBe(codeGen(testSchema52));
    expect(TestSchema52String).toMatchSnapshot('TestSchema52String');

    expectEqualTypes<TestSchema53, InferType<typeof testSchema53>>(true);
    expect(TestSchema53String).toBe(codeGen(testSchema53));
    expect(TestSchema53String).toMatchSnapshot('TestSchema53String');

    expectEqualTypes<TestSchema54, InferType<typeof testSchema54>>(true);
    expect(TestSchema54String).toBe(codeGen(testSchema54));
    expect(TestSchema54String).toMatchSnapshot('TestSchema54String');

    expectEqualTypes<TestSchema55, InferType<typeof testSchema55>>(true);
    expect(TestSchema55String).toBe(codeGen(testSchema55));
    expect(TestSchema55String).toMatchSnapshot('TestSchema55String');

    expectEqualTypes<TestSchema56, InferType<typeof testSchema56>>(true);
    expect(TestSchema56String).toBe(codeGen(testSchema56));
    expect(TestSchema56String).toMatchSnapshot('TestSchema56String');

    expectEqualTypes<TestSchema57, InferType<typeof testSchema57>>(true);
    expect(TestSchema57String).toBe(codeGen(testSchema57));
    expect(TestSchema57String).toMatchSnapshot('TestSchema57String');

    expectEqualTypes<TestSchema58, InferType<typeof testSchema58>>(true);
    expect(TestSchema58String).toBe(codeGen(testSchema58));
    expect(TestSchema58String).toMatchSnapshot('TestSchema58String');

    expectEqualTypes<TestSchema59, InferType<typeof testSchema59>>(true);
    expect(TestSchema59String).toBe(codeGen(testSchema59));
    expect(TestSchema59String).toMatchSnapshot('TestSchema59String');

    expectEqualTypes<TestSchema60, InferType<typeof testSchema60>>(true);
    expect(TestSchema60String).toBe(codeGen(testSchema60));
    expect(TestSchema60String).toMatchSnapshot('TestSchema60String');
  });
});
