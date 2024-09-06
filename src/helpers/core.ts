import type { CommonSchema } from '../schemas/CommonSchema';
import { ExceptionContext } from '../ExceptionContext';
import { isValidDateInner } from './isValidDateInner';

export const ctxSymbol = Symbol('contextSymbol');

export function innerCheck(schema: CommonSchema, receivedValue: unknown, exCtx: ExceptionContext): unknown {
  const commonTmap = exCtx.t;
  const schemaData = schema[ctxSymbol];

  schemaData.transformListBefore?.forEach((transformCallback) => {
    receivedValue = transformCallback(receivedValue);
  });

  if (receivedValue === undefined) {
    if (schemaData.defaultValue !== undefined) return schemaData.defaultValue;
    if (!schemaData.isOptional) exCtx.addIssue('Required', receivedValue, commonTmap['c:optional']);
    return receivedValue;
  }

  if (receivedValue === null) {
    if (!schemaData.isNullable) exCtx.addIssue('Not null', receivedValue, commonTmap['c:nullable']);
    return receivedValue;
  }

  if (schemaData.date) {
    if (!isValidDateInner(receivedValue)) exCtx.addIssue('Date', receivedValue, commonTmap['c:date']);
  }

  const typeOfVal = typeof receivedValue;

  if (schemaData.type.length) {
    if (!schemaData.type.includes(typeOfVal)) exCtx.addIssue(schemaData.type, typeOfVal, commonTmap['c:invalidType']);
  }

  if (schemaData.array) {
    if (!Array.isArray(receivedValue)) return exCtx.addIssue('Array', receivedValue, commonTmap['c:array']);

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const schema = schemaData.array;
    const pathToError = exCtx.pathToError;
    const parsedReceivedValue: unknown[] = [];
    receivedValue.forEach((elem, i) => {
      const parsedElement = innerCheck(schema, elem, exCtx.createChild(`${pathToError}[${i}]`, schemaData.meta));
      parsedReceivedValue.push(parsedElement);
    });

    return parsedReceivedValue;
  }

  if (schemaData.object) {
    if (typeOfVal !== 'object') exCtx.addIssue('Object', receivedValue, commonTmap['c:objectType']);
    if (Array.isArray(receivedValue)) exCtx.addIssue('Object', receivedValue, commonTmap['c:objectTypeAsArray']);

    schemaData.requiredValidations.forEach((requiredValidation) => {
      requiredValidation(receivedValue, exCtx);
    });

    const shapeSchema = schemaData.object;
    const parsedReceivedValue: Record<string, unknown> = {};

    if (!schemaData.allowUnrecognizedObjectProps) {
      for (const keyPerReceivedValue of Object.keys(receivedValue)) {
        if (shapeSchema[keyPerReceivedValue] === undefined)
          exCtx.addIssue('Unrecognized property', keyPerReceivedValue, commonTmap['c:unrecognizedProperty']);
      }
    }

    const pathToError = exCtx.pathToError;
    for (const [keyOfSchema, valueOfSchema] of Object.entries(shapeSchema)) {
      const receivedObjectValuePropery = (receivedValue as Record<string, unknown>)[keyOfSchema];
      if (receivedObjectValuePropery === undefined) {
        if (!valueOfSchema[ctxSymbol].isOptional)
          exCtx.addIssue('Required', receivedObjectValuePropery, commonTmap['c:requiredProperty']);
      }

      const parsedReceivedObjectValuePropery = innerCheck(
        valueOfSchema,
        receivedObjectValuePropery,
        exCtx.createChild(`${pathToError}.${keyOfSchema}`, schemaData.meta),
      );

      parsedReceivedValue[keyOfSchema] = parsedReceivedObjectValuePropery;
    }

    return parsedReceivedValue;
  }

  schemaData.requiredValidations.forEach((requiredValidation) => {
    requiredValidation(receivedValue, exCtx);
  });

  return receivedValue;
}
