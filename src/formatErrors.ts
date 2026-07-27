import type { ValidationErrorData } from './commonTypes';

export interface FlatErrors {
  /** Messages for failures at the root, which belong to no single field. */
  formErrors: string[];
  /** Messages by the first key of their path, which is what a flat form binds to. */
  fieldErrors: Record<string, string[]>;
}

/**
 * Groups errors by their top-level field, the shape a flat form needs.
 *
 * A failure deeper in the structure is attributed to the field it sits under, so a form bound to
 * `address` still sees a message that came from `address.street`.
 *
 * @example
 * const [errors] = parse(schema, received, { getAllErrors: true });
 * if (errors) {
 *   const { formErrors, fieldErrors } = flattenErrors(errors);
 * }
 */
export function flattenErrors(errors: readonly ValidationErrorData[]): FlatErrors {
  const flat: FlatErrors = { formErrors: [], fieldErrors: {} };

  for (const error of errors) {
    const [field] = error.path;

    if (field === undefined) {
      flat.formErrors.push(error.message);
      continue;
    }

    const key = String(field);
    (flat.fieldErrors[key] ??= []).push(error.message);
  }

  return flat;
}

export interface ErrorTree {
  /** Messages belonging to this node itself. */
  errors: string[];
  /** Child nodes, keyed the way the received value is. Absent when this node has no children. */
  properties?: Record<string, ErrorTree>;
}

/**
 * Rebuilds the errors as a tree mirroring the received value, for a form whose fields are nested.
 *
 * Array and tuple indexes become their string form, since a tree is keyed by strings either way and
 * the original key is still available on the error itself.
 *
 * @example
 * const tree = treeifyErrors(errors);
 * tree.properties?.address?.properties?.street?.errors;
 */
export function treeifyErrors(errors: readonly ValidationErrorData[]): ErrorTree {
  const root: ErrorTree = { errors: [] };

  for (const error of errors) {
    let node = root;

    for (const segment of error.path) {
      node.properties ??= {};
      node.properties[String(segment)] ??= { errors: [] };
      node = node.properties[String(segment)] as ErrorTree;
    }

    node.errors.push(error.message);
  }

  return root;
}
