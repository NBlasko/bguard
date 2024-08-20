export type TestSchema1 = {
  email?: string | undefined;
  age: number;
  address: string | null;
  classes: ({
      name: string;
      mandatory: boolean;
      rooms: number[];
    } | undefined)[];
  verified?: boolean | undefined;
};

export type TestSchema2 = string;

export type TestSchema3 = number;

export type TestSchema4 = boolean;

export type TestSchema5 = bigint | number;

export type TestSchema6 = string | undefined;

export type TestSchema7 = number | undefined;

export type TestSchema8 = boolean | undefined;

export type TestSchema9 = bigint | symbol | undefined;

export type TestSchema10 = string | null;

export type TestSchema11 = number | null;

export type TestSchema12 = boolean | null;

export type TestSchema13 = string | symbol | null;

export type TestSchema14 = string | null | undefined;

export type TestSchema15 = number | null | undefined;

export type TestSchema16 = boolean | null | undefined;

export type TestSchema17 = boolean | symbol | null | undefined;

export type TestSchema18 = '5' | null | undefined;

export type TestSchema19 = '5' | null;

export type TestSchema20 = '5' | undefined;

export type TestSchema21 = '5';

export type TestSchema22 = 8 | null | undefined;

export type TestSchema23 = 8 | null;

export type TestSchema24 = 8 | undefined;

export type TestSchema25 = 8;

export type TestSchema26 = false | null | undefined;

export type TestSchema27 = true | null | undefined;

export type TestSchema28 = false;

export type TestSchema29 = true;

export type TestSchema30 = true[];

export type TestSchema31 = (boolean | null)[] | undefined;

export type TestSchema32 = (boolean | undefined)[] | null;

export type TestSchema33 = 5 | 7;

export type TestSchema34 = 5 | 7 | null;

export type TestSchema35 = 5 | 7 | undefined;

export type TestSchema36 = 5 | 7 | null | undefined;

export type TestSchema37 = 'foo' | 'bar';

export type TestSchema38 = 'foo' | 'bar' | null;

export type TestSchema39 = 'foo' | 'bar' | undefined;

export type TestSchema40 = 'foo' | 'bar' | null | undefined;

export type TestSchema41 = 'foo';

export type TestSchema42 = 'foo' | null;

