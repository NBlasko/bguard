import { ctxSymbol } from './helpers/constants';
import { type CommonSchema, type ValidatorContext } from './core';

function generateBaseType(schemaData: ValidatorContext) {
  if (schemaData.date) return 'Date';

  if (schemaData.strictType) {
    if (Array.isArray(schemaData.strictTypeValue)) return schemaData.strictTypeValue.join(' | ');
    return schemaData.strictTypeValue;
  }
  if (!schemaData.type.length) return '';

  // `undefined` in the type list also sets isOptional, which appends `| undefined` further down,
  // so including it here as well would emit it twice.
  const named = schemaData.type.filter((type) => type !== 'undefined');
  if (!named.length) return '';

  return named.join(' | ');
}

const INDENT_DEFAULT = `  `;

function innerGenerator(schema: CommonSchema, isProperty: boolean, indent = INDENT_DEFAULT): string {
  const schemaData = schema[ctxSymbol];
  // The property prefix is kept out of `code`, which holds only the type. Mixing them meant the
  // emptiness check below could not tell a missing type from a bare `?: `.
  let code = '';

  if (schemaData.union) {
    const members = schemaData.union.map((memberSchema) => innerGenerator(memberSchema, false, indent));
    code = code + members.join(' | ');
  }

  if (schemaData.record) {
    const keyCode = innerGenerator(schemaData.record.key, false, indent);
    const valueCode = innerGenerator(schemaData.record.value, false, indent);
    // Mirrors InferType: a restricted key type is Partial, because validation checks the keys that
    // are present without requiring the whole set.
    const record = `Record<${keyCode}, ${valueCode}>`;
    code = code + (schemaData.record.key[ctxSymbol].strictType ? `Partial<${record}>` : record);
  }

  if (schemaData.array) {
    // `indent` is passed through unchanged: an array does not introduce a visual nesting level,
    // so its element type sits at the same depth as the property that holds the array. Adding a
    // level here indented the element's members one step too far and its closing brace two.
    const innerArrayCode = innerGenerator(schemaData.array, false, indent);
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

  // Joined rather than concatenated, so a schema with no named type of its own — `oneOfTypes` given
  // nothing but 'undefined' — does not come out as a leading `| undefined`, which does not parse.
  const nullish: string[] = [];
  if (schemaData.isNullable) nullish.push('null');
  if (schemaData.isOptional) nullish.push('undefined');

  const type = (code ? [code, ...nullish] : nullish).join(' | ');
  const prefix = isProperty ? (schemaData.isOptional ? '?: ' : ': ') : '';

  return prefix + type;
}

export function codeGen(schema: CommonSchema): string {
  const result = innerGenerator(schema, false) + ';';
  return result;
}

export function codeGenWithName(typeName: string, schema: CommonSchema): string {
  const result = 'type ' + typeName + ' = ' + codeGen(schema) + '\n';
  return result;
}
