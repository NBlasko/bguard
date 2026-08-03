import { parse, parseOrFail, parseAsync, parseOrFailAsync, readsAffectedBy } from '../';
import type { RefRead } from '../';
import { AsyncRequiredValidation, ExceptionContext } from '../core';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { union } from '../asserts/union';

/**
 * `ctx.ref` is how a cross-field rule is written; recording the reads is what makes the DEPENDENCY
 * visible. Without it a consumer has one safe option when anything changes, which is to re-run the
 * whole schema — the alternative being a stale message under a field whose rule reads a value that
 * just moved.
 */

/** The rule this feature exists for: `confirm` must equal `password`, and the issue lands on `confirm`. */
const matches = (other: string) => (received: string, ctx: ExceptionContext) => {
  if (received !== ctx.ref(other)) ctx.addIssue('a match', received, 'u:mismatch');
};

const signup = object({
  password: string(),
  confirm: string().custom(matches('password')),
});

describe('recording ref reads', () => {
  it('has no collector at all unless one is passed', () => {
    // The default has to stay free: a parse that does not want the graph must not build one, so
    // there is nothing to allocate and nothing to append to. Asserted from inside a validation,
    // which is the only place that can see it.
    const seen: unknown[] = [];
    const schema = object({
      password: string(),
      confirm: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.refReads);
        void ctx.ref('password');
        void received;
      }),
    });

    expect(parseOrFail(schema, { password: 'p', confirm: 'p' })).toEqual({ password: 'p', confirm: 'p' });
    expect(seen).toEqual([undefined]);
  });

  it('records the read, with both forms of both locations', () => {
    const refReads: RefRead[] = [];

    parseOrFail(signup, { password: 'p', confirm: 'p' }, { refReads });

    expect(refReads).toEqual([
      {
        from: ['confirm'],
        fromPath: '.confirm',
        to: 'password',
        toPath: ['password'],
      },
    ]);
  });

  it('records a read from the root, where both locations are empty', () => {
    const refReads: RefRead[] = [];
    const schema = object({ a: string() }).custom((_received, ctx: ExceptionContext) => {
      ctx.ref('a');
    });

    parseOrFail(schema, { a: 'v' }, { refReads });

    expect(refReads).toEqual([{ from: [], fromPath: '', to: 'a', toPath: ['a'] }]);
  });

  it('records a dotted path as the segments `ref` walked', () => {
    const refReads: RefRead[] = [];
    const schema = object({
      home: object({ city: string() }),
      work: object({ city: string().custom(matches('home.city')) }),
    });

    parseOrFail(schema, { home: { city: 'NS' }, work: { city: 'NS' } }, { refReads });

    expect(refReads).toEqual([
      { from: ['work', 'city'], fromPath: '.work.city', to: 'home.city', toPath: ['home', 'city'] },
    ]);
  });

  it('records the read even when the path runs past the end of the data', () => {
    // The dependency is a fact about the RULE, not about this value. A form being filled in has
    // absent values everywhere, and that is exactly when the graph is needed.
    //
    // `getAllErrors` is what lets `confirm`'s rule run at all here: without it the parse stops at the
    // first error, which is the missing `password`, and the rule that would have read it is never
    // reached. A read is only ever recorded from a validation that actually ran.
    const refReads: RefRead[] = [];

    const [errors] = parse(signup, { confirm: 'q' } as never, { refReads, getAllErrors: true });

    expect(refReads).toEqual([{ from: ['confirm'], fromPath: '.confirm', to: 'password', toPath: ['password'] }]);
    expect(errors).not.toBeNull();
  });

  it('records one entry per call, so a rule reading two fields shows both', () => {
    const refReads: RefRead[] = [];
    const schema = object({
      min: number(),
      max: number(),
      mid: number().custom((received: number, ctx: ExceptionContext) => {
        if (received < (ctx.ref('min') as number)) ctx.addIssue('at least min', received, 'u:low');
        if (received > (ctx.ref('max') as number)) ctx.addIssue('at most max', received, 'u:high');
      }),
    });

    parseOrFail(schema, { min: 1, max: 9, mid: 5 }, { refReads });

    expect(refReads.map((read) => read.to)).toEqual(['min', 'max']);
  });

  it('records a read from inside an array, carrying the index', () => {
    const refReads: RefRead[] = [];
    const schema = object({
      limit: number(),
      rows: array(number().custom(matches('limit') as never)),
    });

    parse(schema, { limit: 2, rows: [2, 2] }, { refReads, getAllErrors: true });

    expect(refReads.map((read) => read.from)).toEqual([
      ['rows', 0],
      ['rows', 1],
    ]);
    expect(refReads.map((read) => read.fromPath)).toEqual(['.rows[0]', '.rows[1]']);
  });

  it('keeps accumulating into an array reused across parses', () => {
    // What makes the graph usable in a form: a rule that returns early on an empty value reveals
    // its read the first time it gets far enough, and the record is never unlearned.
    const refReads: RefRead[] = [];
    const schema = object({
      password: string(),
      confirm: string().custom((received: string, ctx: ExceptionContext) => {
        if (received === '') return; // nothing typed yet — no comparison, and so no read
        if (received !== ctx.ref('password')) ctx.addIssue('a match', received, 'u:mismatch');
      }),
    });

    parse(schema, { password: '', confirm: '' }, { refReads });
    expect(refReads).toHaveLength(0);

    parse(schema, { password: 'p', confirm: 'p' }, { refReads });
    expect(refReads.map((read) => read.to)).toEqual(['password']);
  });

  it('collects through `parse` with getAllErrors, where the context carries an errors list', () => {
    const refReads: RefRead[] = [];

    parse(signup, { password: 'p', confirm: 'q' }, { refReads, getAllErrors: true });

    expect(refReads.map((read) => read.fromPath)).toEqual(['.confirm']);
  });

  it('collects a read made inside an async validation, long after the walk', async () => {
    // `enqueueAsync` holds the context and it is used after the synchronous pass has returned, so
    // the collector has to be the same array rather than something scoped to the walk.
    const refReads: RefRead[] = [];
    const laterEqual =
      (other: string): AsyncRequiredValidation<string> =>
      async (received: string, ctx: ExceptionContext) => {
        await Promise.resolve();
        if (received !== ctx.ref(other)) ctx.addIssue('a match', received, 'u:mismatch');
      };

    const schema = object({
      password: string(),
      confirm: string().customAsync(laterEqual('password')),
    });

    await parseAsync(schema, { password: 'p', confirm: 'p' }, { refReads });

    expect(refReads).toEqual([{ from: ['confirm'], fromPath: '.confirm', to: 'password', toPath: ['password'] }]);
  });

  it('collects through parseOrFailAsync, which delegates its options', async () => {
    const refReads: RefRead[] = [];

    await parseOrFailAsync(signup, { password: 'p', confirm: 'p' }, { refReads });

    expect(refReads.map((read) => read.to)).toEqual(['password']);
  });

  it('records a read from a union member that LOSES', () => {
    // Deliberate. A read is a fact about what ran, and the errors of a losing member are discarded
    // while its read is not — recording it keeps the graph on the safe side, where a dependency is
    // known rather than missed.
    const refReads: RefRead[] = [];
    const schema = object({
      other: string(),
      value: union([
        string().custom((received: string, ctx: ExceptionContext) => {
          if (received !== ctx.ref('other')) ctx.addIssue('a match', received, 'u:mismatch');
        }),
        number(),
      ]),
    });

    // The value is a number, so the string member is tried, reads `other`, and loses.
    expect(parseOrFail(schema, { other: 'x', value: 7 }, { refReads })).toEqual({ other: 'x', value: 7 });
    expect(refReads.map((read) => read.to)).toEqual(['other']);
  });
});

describe('readsAffectedBy', () => {
  const reads: RefRead[] = [
    { from: ['confirm'], fromPath: '.confirm', to: 'password', toPath: ['password'] },
    { from: ['work', 'city'], fromPath: '.work.city', to: 'home.city', toPath: ['home', 'city'] },
    { from: ['label'], fromPath: '.label', to: 'home', toPath: ['home'] },
  ];

  it('finds the read of exactly that path', () => {
    expect(readsAffectedBy(reads, 'password')).toEqual([reads[0]]);
  });

  it('finds nothing for a path nobody reads', () => {
    expect(readsAffectedBy(reads, 'email')).toEqual([]);
  });

  it('counts a read of a CHILD when the parent changes', () => {
    // Replacing `home` can change `home.city`, so the rule that reads the child is stale too.
    expect(readsAffectedBy(reads, 'home')).toEqual([reads[1], reads[2]]);
  });

  it('counts a read of a PARENT when a child changes', () => {
    // Editing `home.city` changes what reading `home` yields.
    expect(readsAffectedBy(reads, 'home.city')).toEqual([reads[1], reads[2]]);
  });

  it('does not count a sibling that merely shares a prefix segment', () => {
    expect(readsAffectedBy(reads, 'home.street')).toEqual([reads[2]]);
  });

  it('treats the empty path as the root, which affects everything', () => {
    expect(readsAffectedBy(reads, '')).toEqual(reads);
  });

  it('returns a copy for the root, so the caller cannot disturb the record', () => {
    const answer = readsAffectedBy(reads, '');

    expect(answer).not.toBe(reads);
    answer.pop();
    expect(reads).toHaveLength(3);
  });

  it('answers over an empty record', () => {
    expect(readsAffectedBy([], 'password')).toEqual([]);
  });

  it('reads back as a dependency graph, which is the point', () => {
    const refReads: RefRead[] = [];
    parseOrFail(signup, { password: 'p', confirm: 'p' }, { refReads });

    // "The user edited `password` — whose rules have to be asked again?"
    expect(readsAffectedBy(refReads, 'password').map((read) => read.fromPath)).toEqual(['.confirm']);
    // And the other direction is silent, which is what saves the work.
    expect(readsAffectedBy(refReads, 'confirm')).toEqual([]);
  });
});
