import { ctxSymbol } from './helpers/core';
import type { CommonSchema, ValidatorContext } from './schemas/CommonSchema';

function generateBaseType(schemaData: ValidatorContext) {
  if (schemaData.date) return 'Date';
  
  if (schemaData.strictType) {
    if (Array.isArray(schemaData.strictTypeValue)) return schemaData.strictTypeValue.join(' | ');
    return schemaData.strictTypeValue;
  }
  if (!schemaData.type.length) return '';
  const joined = schemaData.type.join(' | ');
  return joined;
}

const INDENT_DEFAULT = `  `;

function innerGenerator(schema: CommonSchema, isProperty: boolean, indent = INDENT_DEFAULT): string {
  const schemaData = schema[ctxSymbol];
  let code = '';

  if (isProperty) {
    code = code + (schemaData.isOptional ? '?: ' : ': ');
  }

  if (schemaData.array) {
    const innerArrayCode = innerGenerator(schemaData.array, false, indent + INDENT_DEFAULT);
    code = code + (innerArrayCode.includes('|') ? `(${innerArrayCode})[]` : `${innerArrayCode}[]`);
  }

  if (schemaData.object) {
    code = code + '{\n';
    for (const [keyOfSchema, valueOfSchema] of Object.entries(schemaData.object)) {
      code = code + indent + keyOfSchema + innerGenerator(valueOfSchema, true, indent + INDENT_DEFAULT) + ';\n';
    }
    code = code + indent.slice(0, -INDENT_DEFAULT.length) + '}';
  }

  code = code + generateBaseType(schemaData);
  code = code + (schemaData.isNullable ? ' | null' : '');
  code = code + (schemaData.isOptional ? ' | undefined' : '');

  return code;
}

export function codeGen(schema: CommonSchema): string {
  const result = innerGenerator(schema, false) + ';';
  return result;
}

export function codeGenWithName(typeName: string, schema: CommonSchema): string {
  const result = 'type ' + typeName + ' = ' + codeGen(schema) + '\n';
  return result;
}
