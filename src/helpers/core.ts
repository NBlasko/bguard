export const ctxSymbol = Symbol('contextSymbol');

import { ExceptionContext } from '../commonTypes';
import { guardException } from '../exceptions';
import type { CommonSchema } from '../schemas/CommonSchema';
import { isValidDate } from './isValidDate';

export function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext): unknown {
  const commonTmap = exCtx.t;
  const schemaData = schema[ctxSymbol];
  if (receivedValue === undefined) {
    if (schemaData.defaultValue !== undefined) return schemaData.defaultValue;
    if (!schemaData.isOptional) guardException('Required', receivedValue, exCtx, commonTmap['c:optional']);
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!schemaData.isNullable) guardException('Not null', receivedValue, exCtx, commonTmap['c:nullable']);
    return receivedValue;
  }

  if (schemaData.date) {
    if (!isValidDate(receivedValue)) guardException('Date', receivedValue, exCtx, commonTmap['c:date']);
  }

  const typeOfVal = typeof receivedValue;

  if (schemaData.type.length) {
    if (!schemaData.type.includes(typeOfVal))
      guardException(schemaData.type, typeOfVal, exCtx, commonTmap['c:invalidType']);
  }

  schemaData.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, exCtx);
  });

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return guardException('Array', receivedValue, exCtx, commonTmap['c:array']);
    const schema = schemaData.array;
    const pathToError = exCtx.pathToError;
    const parsedReceivedValue: unknown[] = [];
    receivedValue.forEach((elem, i) => {
      const parsedElement = innerCheck(schema, elem, { ...exCtx, pathToError: `${pathToError}[${i}]` });
      parsedReceivedValue.push(parsedElement);
    });

    return parsedReceivedValue;
  }

  if (schemaData.object) {
    if (typeOfVal !== 'object') guardException('Object', receivedValue, exCtx, commonTmap['c:objectType']);
    if (Array.isArray(receivedValue)) guardException('Object', receivedValue, exCtx, commonTmap['c:objectTypeAsArray']);
    const shapeSchema = schemaData.object;
    const parsedReceivedValue: Record<string, unknown> = {};

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

      const parsedReceivedObjectValuePropery = innerCheck(valueOfSchema, receivedObjectValuePropery, {
        ...exCtx,
        pathToError: `${pathToError}.${keyOfSchema}`,
      });

      parsedReceivedValue[keyOfSchema] = parsedReceivedObjectValuePropery;
    }

    return parsedReceivedValue;
  }

  return receivedValue;
}
