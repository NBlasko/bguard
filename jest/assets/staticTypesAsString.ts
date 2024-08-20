export const TestSchema1String = `{
  email?: string | undefined;
  age: number;
  address: string | null;
  classes: ({
      name: string;
      mandatory: boolean;
      rooms: number[];
    } | undefined)[];
  verified?: boolean | undefined;
};`;

export const TestSchema2String = `string;`;

export const TestSchema3String = `number;`;

export const TestSchema4String = `boolean;`;

export const TestSchema5String = `bigint | number;`;

export const TestSchema6String = `string | undefined;`;

export const TestSchema7String = `number | undefined;`;

export const TestSchema8String = `boolean | undefined;`;

export const TestSchema9String = `bigint | symbol | undefined;`;

export const TestSchema10String = `string | null;`;

export const TestSchema11String = `number | null;`;

export const TestSchema12String = `boolean | null;`;

export const TestSchema13String = `string | symbol | null;`;

export const TestSchema14String = `string | null | undefined;`;

export const TestSchema15String = `number | null | undefined;`;

export const TestSchema16String = `boolean | null | undefined;`;

export const TestSchema17String = `boolean | symbol | null | undefined;`;

export const TestSchema18String = `'5' | null | undefined;`;

export const TestSchema19String = `'5' | null;`;

export const TestSchema20String = `'5' | undefined;`;

export const TestSchema21String = `'5';`;

export const TestSchema22String = `8 | null | undefined;`;

export const TestSchema23String = `8 | null;`;

export const TestSchema24String = `8 | undefined;`;

export const TestSchema25String = `8;`;

export const TestSchema26String = `false | null | undefined;`;

export const TestSchema27String = `true | null | undefined;`;

export const TestSchema28String = `false;`;

export const TestSchema29String = `true;`;

export const TestSchema30String = `true[];`;

export const TestSchema31String = `(boolean | null)[] | undefined;`;

export const TestSchema32String = `(boolean | undefined)[] | null;`;

export const TestSchema33String = `5 | 7;`;

export const TestSchema34String = `5 | 7 | null;`;

export const TestSchema35String = `5 | 7 | undefined;`;

export const TestSchema36String = `5 | 7 | null | undefined;`;

export const TestSchema37String = `'foo' | 'bar';`;

export const TestSchema38String = `'foo' | 'bar' | null;`;

export const TestSchema39String = `'foo' | 'bar' | undefined;`;

export const TestSchema40String = `'foo' | 'bar' | null | undefined;`;

export const TestSchema41String = `'foo';`;

export const TestSchema42String = `'foo' | null;`;

