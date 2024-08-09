import { ctxSymbol } from './core';
import { ValidationError, panic } from './exceptions';
import type { CommonSchema } from './schemas/CommonSchema';
import { GetType } from './validator';

function parseSchemaInner(schema: CommonSchema, receivedValue: unknown, pathToError: string) {
  const ctx = schema[ctxSymbol];
  if (receivedValue === undefined) {
    if (!ctx.isOptional) panic('Required', receivedValue, pathToError, 'The required value is missing');
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!ctx.isNullable) panic('Not null', receivedValue, pathToError, 'Value should not be null');
    return receivedValue;
  }

  if (ctx.array) {
    if (!Array.isArray(receivedValue))
      panic('Array', receivedValue, pathToError, 'Expected an array but received a different type');
    const schema = ctx.array;

    receivedValue.forEach((elem, i) => {
      parseSchemaInner(schema, elem, `${pathToError}[${i}]`);
    });

    return receivedValue;
  }

  const typeOfVal = typeof receivedValue;

  if (ctx.object) {
    if (typeOfVal !== 'object')
      panic('Object', receivedValue, pathToError, 'Expected an object but received a different type');
    if (Array.isArray(receivedValue))
      panic('Object', receivedValue, pathToError, 'Expected an object but received an array. Invalid type of data');
    const shapeSchema = ctx.object;
    for (const keyPerReceivedValue of Object.keys(receivedValue)) {
      if (shapeSchema[keyPerReceivedValue] === undefined)
        panic('Not allowed', keyPerReceivedValue, pathToError, 'This key is not allowed in the object');
    }

    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          panic('Required', receivedObjectValuePropery, pathToError, 'Missing required property in the object');
      }
      parseSchemaInner(valueOfSchema, receivedObjectValuePropery, `${pathToError}.${keyOfSchema}`);
    }

    return receivedValue;
  }

  if (ctx.type.length) {
    if (!ctx.type.includes(typeOfVal)) panic(ctx.type, typeOfVal, pathToError, 'Invalid type of data');
  }

  ctx.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, pathToError);
  });

  return receivedValue;
}

export function parseSchema<T extends CommonSchema>(schema: T, receivedValue: unknown): GetType<T> {
  try {
    return parseSchemaInner(schema, receivedValue, '') as GetType<T>;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    /* istanbul ignore next */
    throw new Error('Something unexpected happened');
  }
}
