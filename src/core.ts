export const ctxSymbol = Symbol('contextSymbol');

import { ExceptionContext } from './commonTypes';
import { guardException } from './exceptions';
import type { CommonSchema } from './schemas/CommonSchema';

export function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext) {
  const commonTmap = exCtx.t;
  const schemaData = schema[ctxSymbol];
  if (receivedValue === undefined) {
    if (!schemaData.isOptional) guardException('Required', receivedValue, exCtx, commonTmap['c:optional']);
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!schemaData.isNullable) guardException('Not null', receivedValue, exCtx, commonTmap['c:nullable']);
    return receivedValue;
  }

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return guardException('Array', receivedValue, exCtx, commonTmap['c:array']);
    const schema = schemaData.array;
    const pathToError = exCtx.pathToError;
    receivedValue.forEach((elem, i) => {
      innerCheck(schema, elem, { ...exCtx, pathToError: `${pathToError}[${i}]` });
    });

    return receivedValue;
  }

  const typeOfVal = typeof receivedValue;

  if (schemaData.object) {
    if (typeOfVal !== 'object') guardException('Object', receivedValue, exCtx, commonTmap['c:objectType']);
    if (Array.isArray(receivedValue)) guardException('Object', receivedValue, exCtx, commonTmap['c:objectTypeAsArray']);
    const shapeSchema = schemaData.object;

    if (!schemaData.allowUnrecognizedObjectProps) {
      for (const keyPerReceivedValue of Object.keys(receivedValue)) {
        if (shapeSchema[keyPerReceivedValue] === undefined)
          guardException('Unrecognized property', keyPerReceivedValue, exCtx, commonTmap['c:unrecognizedProperty']);
      }
    }

    const pathToError = exCtx.pathToError;
    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          guardException('Required', receivedObjectValuePropery, exCtx, commonTmap['c:requiredProperty']);
      }

      innerCheck(valueOfSchema, receivedObjectValuePropery, { ...exCtx, pathToError: `${pathToError}.${keyOfSchema}` });
    }

    return receivedValue;
  }

  if (schemaData.type.length) {
    if (!schemaData.type.includes(typeOfVal))
      guardException(schemaData.type, typeOfVal, exCtx, commonTmap['c:invalidType']);
  }

  schemaData.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, exCtx);
  });

  return receivedValue;
}
