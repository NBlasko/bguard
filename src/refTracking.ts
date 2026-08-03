/**
 * Recording what a cross-field validation read, so a consumer can work out which fields depend on
 * which.
 *
 * `ctx.ref('password')` inside a `custom` on `confirm` is how bguard writes a cross-field rule: the
 * issue lands on `confirm`, which is the field the user has to fix. What nothing could see until now
 * is the *edge* — that `confirm` depends on `password`. Without it a form has one option when
 * anything changes, which is to re-run the whole schema, because the alternative is a stale message
 * under a field whose rule reads a value that just moved.
 *
 * The reads are recorded during a parse rather than derived from the schema, because there is
 * nothing to derive from: a `custom` is an opaque function, and which paths it reads can depend on
 * the value it was given. Recording what actually ran is exact for that run and cannot go stale.
 *
 * Nothing is recorded unless a collector is passed, so a parse that does not ask for this does the
 * same work it did before.
 */

/** One `ExceptionContext.ref` call, as it happened. */
export interface RefRead {
  /**
   * Where the validation that called `ref` was running, as key segments — the same form as
   * `ValidationErrorData.path`. Empty at the root.
   */
  readonly from: readonly PropertyKey[];
  /**
   * The same location as a string, matching `ValidationErrorData.pathToError`: `''` at the root,
   * otherwise leading-dot and bracketed, as in `.address[0].city`.
   *
   * **This is not the same convention as `to`.** Compare locations by segments — `from` against
   * `toPath` — and keep the strings for messages and logs.
   */
  readonly fromPath: string;
  /** The path passed to `ref`, unchanged. */
  readonly to: string;
  /** `to` as segments, split the way `ref` itself walked it. */
  readonly toPath: readonly string[];
}

/**
 * The recorded reads that a change at `changed` invalidates.
 *
 * `changed` names a path the way `ref` does — `'password'`, `'address.city'` — because what it is
 * matched against is `to`. Each answer carries both forms of the dependent field's location, so a
 * caller keys by `from` or reads `fromPath` without converting anything.
 *
 * **A read of a parent and a read of a child both count.** Replacing `address` can change
 * `address.city`, and editing `address.city` changes what reading `address` yields — so a match is
 * either path being a prefix of the other, not equality. Being too eager here revalidates a field
 * that did not need it; being too narrow leaves a stale message on screen, which is the failure
 * this exists to prevent.
 *
 * An empty `changed` is the root: everything read from it is affected.
 *
 * @example
 * const refReads: RefRead[] = [];
 * parse(signupSchema, values, { refReads });
 *
 * // The user edited `password`. Which fields' rules have to be asked again?
 * const stale = readsAffectedBy(refReads, 'password');
 * // [{ from: ['confirm'], fromPath: '.confirm', to: 'password', toPath: ['password'] }]
 */
export function readsAffectedBy(reads: readonly RefRead[], changed: string): RefRead[] {
  if (changed === '') return [...reads];

  const changedPath = changed.split('.');

  return reads.filter((read) => isPrefix(read.toPath, changedPath) || isPrefix(changedPath, read.toPath));
}

/** Whether `shorter` names `longer` or an ancestor of it. */
function isPrefix(shorter: readonly string[], longer: readonly string[]): boolean {
  if (shorter.length > longer.length) return false;

  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false;
  }

  return true;
}
