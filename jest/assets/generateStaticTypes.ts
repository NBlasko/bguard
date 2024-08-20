import fs from 'fs/promises';
import path from 'path';
import { codeGen } from '../../src/codeGen';
import type { CommonSchema } from '../../src/schemas/CommonSchema';
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
  testSchema35,
  testSchema34,
  testSchema36,
  testSchema37,
  testSchema38,
  testSchema39,
  testSchema40,
  testSchema41,
  testSchema42,
} from './schemas';

class GenerateType {
  constructor(private readonly isString: boolean) {}
  async gentType(typeName: string, schema: CommonSchema) {
    if (this.isString) {
      return `export const ${typeName}String = ` + '`' + codeGen(schema) + '`;' + '\n\n';
    }

    return `export type ${typeName} = ` + codeGen(schema) + '\n\n';
  }

  async writeFiles(data: string) {
    if (this.isString) {
      return await fs.writeFile(path.join('jest/assets', 'staticTypesAsString.ts'), data);
    }
    await fs.writeFile(path.join('jest/assets', 'staticTypes.ts'), data);
  }

  async run() {
    let data = '';
    data += await this.gentType('TestSchema1', testSchema1);
    data += await this.gentType('TestSchema2', testSchema2);
    data += await this.gentType('TestSchema3', testSchema3);
    data += await this.gentType('TestSchema4', testSchema4);
    data += await this.gentType('TestSchema5', testSchema5);
    data += await this.gentType('TestSchema6', testSchema6);
    data += await this.gentType('TestSchema7', testSchema7);
    data += await this.gentType('TestSchema8', testSchema8);
    data += await this.gentType('TestSchema9', testSchema9);
    data += await this.gentType('TestSchema10', testSchema10);
    data += await this.gentType('TestSchema11', testSchema11);
    data += await this.gentType('TestSchema12', testSchema12);
    data += await this.gentType('TestSchema13', testSchema13);
    data += await this.gentType('TestSchema14', testSchema14);
    data += await this.gentType('TestSchema15', testSchema15);
    data += await this.gentType('TestSchema16', testSchema16);
    data += await this.gentType('TestSchema17', testSchema17);
    data += await this.gentType('TestSchema18', testSchema18);
    data += await this.gentType('TestSchema19', testSchema19);
    data += await this.gentType('TestSchema20', testSchema20);
    data += await this.gentType('TestSchema21', testSchema21);
    data += await this.gentType('TestSchema22', testSchema22);
    data += await this.gentType('TestSchema23', testSchema23);
    data += await this.gentType('TestSchema24', testSchema24);
    data += await this.gentType('TestSchema25', testSchema25);
    data += await this.gentType('TestSchema26', testSchema26);
    data += await this.gentType('TestSchema27', testSchema27);
    data += await this.gentType('TestSchema28', testSchema28);
    data += await this.gentType('TestSchema29', testSchema29);
    data += await this.gentType('TestSchema30', testSchema30);
    data += await this.gentType('TestSchema31', testSchema31);
    data += await this.gentType('TestSchema32', testSchema32);
    data += await this.gentType('TestSchema33', testSchema33);
    data += await this.gentType('TestSchema34', testSchema34);
    data += await this.gentType('TestSchema35', testSchema35);
    data += await this.gentType('TestSchema36', testSchema36);
    data += await this.gentType('TestSchema37', testSchema37);
    data += await this.gentType('TestSchema38', testSchema38);
    data += await this.gentType('TestSchema39', testSchema39);
    data += await this.gentType('TestSchema40', testSchema40);
    data += await this.gentType('TestSchema41', testSchema41);
    data += await this.gentType('TestSchema42', testSchema42);

    await this.writeFiles(data);
    console.log(this.isString ? 'SUCCESS - GENERATED TYPES' : 'SUCCESS - GENERATED STRINGS');
  }
}

const gtf = new GenerateType(false);
const gtt = new GenerateType(true);

void (async () => {
  await gtf.run();
  await gtt.run();
})();
