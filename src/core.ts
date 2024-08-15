export const ctxSymbol = Symbol('contextSymbol');

import { throwException } from './exceptions';
import type { CommonSchema, ExceptionContext } from './schemas/CommonSchema';

export function innerCheck(schema: CommonSchema, receivedValue: unknown, ctx: ExceptionContext) {
  const commonTmap = ctx.t;
  const data = schema[ctxSymbol];
  if (receivedValue === undefined) {
    if (!data.isOptional) throwException('Required', receivedValue, ctx, commonTmap['c:optional']);
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!data.isNullable) throwException('Not null', receivedValue, ctx, commonTmap['c:nullable']);
    return receivedValue;
  }

  if (data.array) {
    if (!Array.isArray(receivedValue)) return throwException('Array', receivedValue, ctx, commonTmap['c:array']);
    const schema = data.array;
    const pathToError = ctx.pathToError;
    receivedValue.forEach((elem, i) => {
      innerCheck(schema, elem, { ...ctx, pathToError: `${pathToError}[${i}]` });
    });

    return receivedValue;
  }

  const typeOfVal = typeof receivedValue;

  if (data.object) {
    if (typeOfVal !== 'object') throwException('Object', receivedValue, ctx, commonTmap['c:objectType']);
    if (Array.isArray(receivedValue)) throwException('Object', receivedValue, ctx, commonTmap['c:objectTypeAsArray']);
    const shapeSchema = data.object;
    // TODO ovo mozemo da preskocimo ako je data opcija za tim
    for (const keyPerReceivedValue of Object.keys(receivedValue)) {
      if (shapeSchema[keyPerReceivedValue] === undefined)
        throwException('Unrecognized property', keyPerReceivedValue, ctx, commonTmap['c:unrecognizedProperty']);
    }
    const pathToError = ctx.pathToError;
    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          throwException('Required', receivedObjectValuePropery, ctx, commonTmap['c:requiredProperty']);
      }

      innerCheck(valueOfSchema, receivedObjectValuePropery, { ...ctx, pathToError: `${pathToError}.${keyOfSchema}` });
    }

    return receivedValue;
  }

  if (data.type.length) {
    if (!data.type.includes(typeOfVal)) throwException(data.type, typeOfVal, ctx, commonTmap['c:invalidType']);
  }

  data.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, ctx);
  });

  return receivedValue;
}
