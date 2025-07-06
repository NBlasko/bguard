import { type WithArray } from '../../commonTypes';
import { BuildSchemaError } from '../../exceptions';
import { ctxSymbol } from '../../helpers/constants';
import { CommonSchema, type ValidatorContext } from '../../core';

class ArraySchema extends CommonSchema {
  protected _array = 1;
  constructor(ctx: ValidatorContext, arraySchema: CommonSchema) {
    super(ctx);
    this.validateArrayEntry(arraySchema);
    this[ctxSymbol].array = arraySchema;
  }

  private validateArrayEntry(arraySchema: CommonSchema) {
    if (!arraySchema) throw new BuildSchemaError('Missing schema in array method');
    if (!(arraySchema instanceof CommonSchema)) throw new BuildSchemaError('Invalid schema in array method');
  }
}

/**
 * @description Creates a new schema for validating arrays where each element must match the specified schema.
 * @template T
 * @param {T} arraySchema - The schema that each element of the array must match.
 * @returns {WithArray<ArraySchema, T>} A new instance of `ArraySchema` for validating arrays of elements that match the specified schema.
 * @example
 * const schema = array(string());
 * parseOrFail(schema, ['hello', 'world']); // Validates successfully
 * parseOrFail(schema, ['hello', 123]); // Throws a validation error
 *
 * @instance Of ArraySchema
 */
export function array<T extends CommonSchema>(arraySchema: T): WithArray<ArraySchema, T> {
  return new ArraySchema({ type: [], requiredValidations: [] }, arraySchema) as WithArray<ArraySchema, T>;
}
