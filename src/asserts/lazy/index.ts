import { WithBGuardType } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { BuildSchemaError } from '../../exceptions';

/**
 * @description Defers building a schema until it is first used, which is what allows a schema to
 * refer to itself.
 *
 * The inferred type is the one you supply, because TypeScript cannot infer a type through a
 * self-reference. Declare the type, then annotate the schema with it:
 *
 * ```typescript
 * interface Category {
 *   name: string;
 *   children: Category[];
 * }
 *
 * const categorySchema: WithObject<CommonSchema, { name: CommonSchema; children: CommonSchema }> =
 *   object({
 *     name: string(),
 *     children: array(lazy<Category>('Category', () => categorySchema)),
 *   });
 * ```
 *
 * `typeName` is what `codeGen` emits at the recursion point. Without it code generation would
 * descend into the schema again and never finish, so it is required rather than optional.
 *
 * Note that validation follows the data, so a value containing a cycle recurses until the call stack
 * is exhausted. Recursive *schemas* are supported; cyclic *values* are not.
 *
 * @template Out - The type this schema validates. Supply it explicitly.
 * @param {string} typeName - The type name codeGen emits where the recursion occurs.
 * @param {() => CommonSchema} getSchema - Returns the schema, called once on first use.
 * @returns A new schema inferring `Out`.
 *
 * @instance Of CommonSchema
 */
export function lazy<Out>(typeName: string, getSchema: () => CommonSchema): WithBGuardType<CommonSchema, Out> {
  if (!typeName) throw new BuildSchemaError('Missing type name in lazy method');
  if (typeof getSchema !== 'function') throw new BuildSchemaError('Missing schema getter in lazy method');

  return new CommonSchema({
    type: [],
    requiredValidations: [],
    lazy: { typeName, getSchema },
  }) as WithBGuardType<CommonSchema, Out>;
}
