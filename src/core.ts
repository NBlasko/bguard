export const ctxSymbol = Symbol('contextSymbol');

import { throwException } from './exceptions';
import type { CommonSchema } from './schemas/CommonSchema';

export function innerCheck(schema: CommonSchema, receivedValue: unknown, pathToError: string) {
  const ctx = schema[ctxSymbol];
  if (receivedValue === undefined) {
    if (!ctx.isOptional) throwException('Required', receivedValue, pathToError, 'The required value is missing');
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!ctx.isNullable) throwException('Not null', receivedValue, pathToError, 'Value should not be null');
    return receivedValue;
  }

  if (ctx.array) {
    if (!Array.isArray(receivedValue))
      throwException('Array', receivedValue, pathToError, 'Expected an array but received a different type');
    const schema = ctx.array;

    receivedValue.forEach((elem, i) => {
      innerCheck(schema, elem, `${pathToError}[${i}]`);
    });

    return receivedValue;
  }

  const typeOfVal = typeof receivedValue;

  if (ctx.object) {
    if (typeOfVal !== 'object')
      throwException('Object', receivedValue, pathToError, 'Expected an object but received a different type');
    if (Array.isArray(receivedValue))
      throwException(
        'Object',
        receivedValue,
        pathToError,
        'Expected an object but received an array. Invalid type of data',
      );
    const shapeSchema = ctx.object;
    for (const keyPerReceivedValue of Object.keys(receivedValue)) {
      if (shapeSchema[keyPerReceivedValue] === undefined)
        throwException('Not allowed', keyPerReceivedValue, pathToError, 'This key is not allowed in the object');
    }

    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          throwException(
            'Required',
            receivedObjectValuePropery,
            pathToError,
            'Missing required property in the object',
          );
      }
      innerCheck(valueOfSchema, receivedObjectValuePropery, `${pathToError}.${keyOfSchema}`);
    }

    return receivedValue;
  }

  if (ctx.type.length) {
    if (!ctx.type.includes(typeOfVal)) throwException(ctx.type, typeOfVal, pathToError, 'Invalid type of data');
  }

  ctx.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, pathToError);
  });

  return receivedValue;
}
