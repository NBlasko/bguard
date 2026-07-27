export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export function expectEqualTypes<X, Y>(areEqual: Equal<X, Y>): void {
  expect(typeof areEqual).toBe('boolean');
}

/**
 * Whether a parse result carries errors, without depending on which value marks their absence.
 *
 * `parse` returns `[null, value]` on success and `[errors, null]` on failure. Asserting on the
 * sentinel directly is a trap in both directions: `toBeDefined()` passes for `null`, and
 * `not.toBeNull()` passes for `undefined`. Testing for the array itself cannot be fooled either way.
 */
export function hasErrors(result: readonly [unknown, unknown]): boolean {
  return Array.isArray(result[0]);
}
