/**
 * Turns a property-access callback into the path it walked.
 *
 * `(root) => root.home.city` becomes `['home', 'city']`. The callback is handed a Proxy that
 * records every key read and returns itself, so the walk IS the answer — there is nothing to parse
 * and no separate description of the path that could disagree with it.
 *
 * This is what lets a cross-field rule be checked by the compiler. A string path cannot be:
 * `ctx.ref('pasword')` is a valid string, so it yields `undefined` for ever and the comparison
 * against it quietly succeeds or quietly fails.
 *
 * ## What the callback may do
 *
 * Read properties, and nothing else. It is not called with your data — it is called with a
 * recorder, so a comparison inside it compares a Proxy, and arithmetic on it is `NaN`. A callback
 * that reads two properties records both and produces a path that is neither.
 *
 * The target is an ordinary object rather than a function, deliberately: calling something in the
 * middle of a path — `root.rows.filter(…)` — then throws instead of silently recording `filter` as
 * a segment and returning a path that is wrong. A loud failure on misuse beats a quiet wrong answer.
 *
 * Segments come out as STRINGS, including array indices: `root.rows[0]` is `['rows', '0']`. That is
 * exactly what the string form produces for `'rows.0'`, and it is what indexing needs — a JavaScript
 * array reads `['0']` as its first element — so both forms of `ref` walk identically from here on.
 */
export function pickPath<T>(pick: (root: T) => unknown): string[] {
  const segments: string[] = [];

  const recorder: unknown = new Proxy(
    {},
    {
      get(_target, property) {
        // A symbol cannot be a path segment. `undefined` rather than the recorder, so an implicit
        // conversion — a template literal, `String(…)`, a loose comparison — fails visibly instead
        // of appending `Symbol(Symbol.toPrimitive)` to the path.
        if (typeof property === 'symbol') return undefined;

        segments.push(property);
        return recorder;
      },
    },
  );

  pick(recorder as T);

  return segments;
}
