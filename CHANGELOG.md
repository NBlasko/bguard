# bguard

## 0.9.0 Cross-field references the compiler can check, and narrowed schemas that drop rules that are not theirs

### Changed

**`pick` and `omit` no longer carry the source's OBJECT-level assertions.** Those added with
`object({…}).custom(rule)` — not the ones on each property, which are always kept.

The reason, measured rather than argued:

```ts
const contact = object({ email: string(), phone: string() }).custom((value, ctx) => {
  if (!value.email && !value.phone) ctx.addIssue('one contact method', value, 'u:need-one');
});

parse(contact, { email: '', phone: '060' });          // passes — a phone is present
parse(pick(contact, ['email']), { email: '' });       // used to report 'u:need-one'
```

The picked schema does not declare `phone`, and `{ email: '' }` satisfies everything it does declare
— yet the carried rule reported a failure about a field that is not there. `pick` and `omit` change
**which properties exist**, so a rule written about the source's shape is not necessarily a rule about
the result's.

`partial`, `required` and `extend` keep theirs, and that is the same distinction: the first two change
whether a property may be absent and the third adds, so the property set the rule was written about is
still present. Dropping it there would quietly remove a check.

A rule that only reads properties you kept is dropped along with the rest, because nothing can tell
the two apart: an object `custom` receives the whole value and reads it directly, so which properties
it touches is not knowable. Re-attach the ones that still apply —
`pick(userSchema, ['id', 'name']).custom(rule)`.

`allowUnrecognized`, `id` and `description` are unaffected and carry as before: they describe the
object itself rather than any property of it.

**How this went unnoticed:** the test named "keeps the object asserts" used `extend`, which still
keeps them, so `pick` and `omit` were never covered on this point at all. Each of the five utilities
now passes the choice explicitly, and each flag is verified load-bearing — flipping any one of them
fails a test.

### Added

**`ctx.ref` takes a property-access callback as well as a string**, and the callback is the one to
reach for:

```ts
type Signup = InferType<typeof signupSchema>;

const signupSchema = object({
  password: string(),
  confirm: string().custom((received: string, ctx: ExceptionContext) => {
    // `string`, with no cast — and `root.pasword` would not compile
    if (received !== ctx.ref((root: Signup) => root.password)) {
      ctx.addIssue('the same password', received, 'u:mismatch');
    }
  }),
});
```

Two things the string form cannot give you:

- **A typo is a compile error.** `ctx.ref('pasword')` is a perfectly good string, so it yields
  `undefined` for ever and the comparison against it quietly succeeds or quietly fails. It is the
  shape of bug that survives a review, because the line reads correctly.
- **The result carries the property's type.** `ctx.ref('age')` is `unknown` and every use needs a
  cast; `ctx.ref((root: Signup) => root.age)` is `number`.

Nested properties, array elements and `length` all work — `root.home.city`, `root.rows[0]`,
`root.rows.length` — and the recorded segments are identical to what the string form produces, so a
dependency graph built from `refReads` cannot tell which form a rule was written in.

**A key containing a dot becomes reachable**, which it was not before: `ref('user.name')` splits into
two segments and finds nothing, while the callback records the property as the single key it is. The
recorded `toPath` keeps it as one segment; `to`, being joined with dots, is ambiguous for such a key,
which is why both forms are recorded.

**The type goes on the callback's parameter, not as `ref<Signup>(…)`.** That is not a style
preference: TypeScript takes explicit type arguments all or none, so supplying the root would mean
supplying the result too, and the result is the thing worth inferring. Verified against `tsc`, along
with the more surprising half — `InferType<typeof signupSchema>` inside the schema's own definition is
**not** circular, because a type alias is hoisted and the callback's return type takes no part in
inferring the object's shape. That was expected to be the blocking problem and turned out not to
exist.

The callback may read properties and nothing else. It is not called with your data; it is called with
a recorder that notes each key and returns itself, so the walk *is* the path. Calling something
mid-path — `root.rows.filter(…)` — throws, deliberately: a loud failure on misuse beats a quietly
wrong answer, and the alternative was recording `filter` as a segment and returning a path that
cannot resolve.

The string form is unchanged and stays, for a path only known at runtime. Both read the value the
parse started with, before any `transformBeforeValidation`.

## 0.8.0 Cross-field dependencies, recorded

### Added

**`ctx.ref` reads can be recorded, which is what makes a cross-field DEPENDENCY visible.** `ref` has
always let one field's rule read another — that is how `confirm` is compared to `password`, with the
issue landing on `confirm` where the user can act on it. What nothing could see is the edge: that
`confirm` depends on `password`, and not the other way round.

Without it, a consumer rendering a form has one safe option when anything changes, which is to re-run
the whole schema. The alternative is worse — a stale message under a field whose rule reads a value
that just moved.

Pass an array and every read lands in it:

```ts
import { object, parse, readsAffectedBy } from 'bguard';
import type { RefRead } from 'bguard';

const refReads: RefRead[] = [];
parse(signupSchema, values, { refReads });

// The user edited `password`. Whose rules have to be asked again?
readsAffectedBy(refReads, 'password').map((read) => read.fromPath); // ['.confirm']
readsAffectedBy(refReads, 'confirm'); // [] — nothing reads it
```

Each entry carries both locations in both forms: `from` / `fromPath` for the rule that called `ref`,
`to` / `toPath` for what it read. `fromPath` follows `pathToError` (`'.confirm'`) while `to` is the
string you passed (`'password'`) — two different conventions on purpose, so compare by segments and
keep the strings for messages.

Available on all four parse functions. **Nothing is recorded without a collector**, so a parse that
does not ask for this does exactly the work it did before — no allocation, no bookkeeping.

Three behaviours worth knowing, each of them deliberate:

- **A read is only recorded from a validation that actually ran.** A rule that returns early on an
  empty value has read nothing yet. That is why the same array can be handed to many parses: the
  graph fills in as rules get far enough to matter, and never unlearns an edge. There is nothing to
  derive statically — a `custom` is an opaque function, and which paths it reads can depend on the
  value it was given.
- **`readsAffectedBy` relates a parent and a child in both directions.** Replacing `address` can
  change `address.city`, and editing `address.city` changes what reading `address` yields. Erring
  eager revalidates a field that did not need it; erring narrow leaves a wrong message on screen.
- **A union member that loses still records its read.** Its errors are discarded, its read is not: a
  known dependency is safer than a missed one.

Recording happens before the walk rather than after, so a read is known even when the path runs past
the end of the data — which is the normal state of a form being filled in, and exactly when the graph
is wanted.

## 0.7.1 Restore the schema methods coercion was dropping

 - **`coerce.string()`, `coerce.number()` and `coerce.boolean()` lost their type-specific methods.**
   Their return types were written out by hand as `WithBGuardType<CommonSchema, string>`, which flattened
   each schema to `CommonSchema` and so dropped `equalTo`, `oneOfValues`, `onlyTrue` and `onlyFalse` —
   everything the concrete classes define rather than the base. `coerce.string().equalTo('yes')` did not
   compile. The return types are inferred now, so a coerced schema is exactly as refinable as the plain
   one it came from, and the value is coerced before the literal is checked:
   `coerce.number().equalTo(5)` accepts `'5'`.

   `transformBeforeValidation` was never affected — `string().transformBeforeValidation(cb).equalTo('x')`
   worked throughout. Only the hand-written annotations in `coerce` were wrong.

   Fixing it meant exporting `StringSchema`, `NumberSchema`, `BooleanSchema`, `BigIntSchema`,
   `DateSchema` and `ArraySchema`. Declaration emit has to be able to name a type, and an unexported
   class with private members cannot be named — which is what drove the original annotations. The class
   names already appeared in the public declarations of `string()`, `number()` and the rest, so nothing
   new is surfaced.

   Worth knowing for next time: `tsc --noEmit` accepted the inferred version. Only `tsup`'s declaration
   build rejected it, so a type change is not verified until the package has been built.

 - **Each coercing schema is now its own module** — `bguard/coerce/number`, `bguard/coerce/string` and so
   on, exporting `coerceNumber`, `coerceString`, `coerceBoolean`, `coerceBigInt` and `coerceDate`. The
   `coerce` object references all five, so a bundler had to keep all five wherever it was used: reaching
   for `coerce.number()` alone pulled in the string, boolean, bigint and date schemas. Measured at
   2033 bytes of coercion overhead through the object against 87 through the module, with the unused
   schemas genuinely absent rather than merely unreferenced.

   The object remains, and the functions on it are the same references, so existing code keeps working.
   Its cost is documented where it is described.

 - Forced `brace-expansion` to a patched version through `overrides`. Twenty high-severity advisories
   all traced to that one package, reaching the whole Jest tree transitively. They were
   devDependencies-only — `npm audit --omit=dev` reported nothing, and the published package ships only
   `lib/` with no runtime dependencies — but the noise is worth removing. npm's own suggested fix was to
   downgrade Jest from 30 to 25.

## 0.7.0 Immutable schemas, type-safe asserts, working metadata and locales

### Added

**Standard Schema v1.** Every schema now implements the
[Standard Schema](https://github.com/standard-schema/standard-schema) interface, so it can be handed
to any library that accepts a validator — tRPC, TanStack Form and Router, Hono, oRPC, React Hook Form
— without either side knowing about the other:

```ts
const schema = object({ name: string(), age: number() });

schema['~standard'].validate({ name: 'a', age: 3 });
// { value: { name: 'a', age: 3 } }
schema['~standard'].validate({ name: 'a', age: 'x' });
// { issues: [{ message: 'Invalid type of data', path: ['age'] }] }
```

`validate` collects every issue rather than stopping at the first, since a consumer rendering a form
needs them all at once. The spec's types are vendored rather than taken as a dependency, which is what
it intends; conformance is verified by typechecking against the published
`@standard-schema/spec@1.1.0`.

**Errors carry `path` and `code`.** `path` is the location as keys — `['users', 1, 'mail']` — beside
the existing `pathToError` string. Both are derived from the same key, because a string path cannot be
taken apart again reliably when a key may itself contain a dot. `code` is the failure's translation
key, for example `'s:minLength'`, which unlike `message` does not change with the locale, so it is
what to branch on. Both appear on `ValidationError` too.

**JSON Schema output.** `toJSONSchema` renders a schema as a JSON Schema document, for OpenAPI, form
generators and LLM tool definitions.

Types, object properties and which are required, arrays, tuples, records, unions, literals and enums,
nullability, defaults, `description()` and recursive schemas via `$defs`/`$ref` are all represented.
Assertions that map onto a keyword are too — string lengths, patterns and formats, numeric bounds, array
lengths, `maxKeys` — which needed each of those assertions to start carrying the keywords it stands for,
since the generator only ever sees the closure a factory returned, not its arguments.

Assertions with no counterpart are left out rather than approximated: `contains('x')` has no keyword, so
a document may accept a value bguard would reject. `bigint` raises a `BuildSchemaError` instead of being
emitted as `integer`, which would be a lie. A `date()` becomes `{ type: 'string', format: 'date-time' }`.

The generated documents are cross-checked against `ajv` over 70 values across 19 schemas, so a real
validator agrees with bguard about which values pass. That is the check that makes the feature worth
anything.

**Async validation.** `customAsync` registers a check that has to wait — a uniqueness lookup, an HTTP
call — and `parseAsync` / `parseOrFailAsync` mirror the synchronous entry points.

The structure is validated synchronously and the async validations are collected as they are reached,
then awaited all together, so several slow checks across one schema cost one round of waiting rather
than one each. That is possible because asserts only add issues and never change the value, so what the
synchronous pass produced is already final. Their issues therefore come after the synchronous ones,
which is why `parseOrFailAsync` cannot stop at the first error the way `parseOrFail` does.

A synchronous `parse` of a schema carrying an async validation throws a `BuildSchemaError` naming the
async entry points rather than skipping it. `~standard.validate` returns a promise for a schema that
needs awaiting and stays synchronous otherwise — the spec allows either, chosen per call, so a consumer
that never awaits keeps working for every other schema.

**Coercion, and separate input and output types.** `InferType` has always been the type a schema
*produces*. `InferInput` is the type it *accepts*, and the two now differ wherever a schema converts or
supplies something:

```ts
const schema = object({ page: coerce.number().default(1), q: string() });

type Output = InferType<typeof schema>;  // { page: number; q: string }
type Input = InferInput<typeof schema>;  // { q: string; page?: unknown }
```

`coerce.string()`, `coerce.number()`, `coerce.boolean()`, `coerce.bigint()` and `coerce.date()` convert
before validating, for input that does not arrive typed — query strings, form data, environment
variables. Anything a helper cannot convert is passed through so validation reports the type problem
itself, and `null` is never coerced so `nullable()` still decides whether it is allowed. Available from
the root and as `bguard/coerce`.

`coerce.boolean()` only converts what unambiguously means a boolean — `'true'`/`'false'` in any case,
and `1`/`0` — and rejects the rest. Deliberately narrower than passing the value through `Boolean`,
which accepts everything and reads `'false'` as `true`.

`transformBeforeValidation` now records its callback's parameter type as the schema's input type, and
`default()` records that its position may be left out. `InferOutput` is available as a name for
symmetry with `InferInput` and is the same type as `InferType`. Both sides are reported through
Standard Schema's `types`, so a consumer generating a form asks for what the schema takes.

**Formatting errors: `flattenErrors` and `treeifyErrors`.** Pure functions over the errors array,
which is what the array-valued `path` made possible. `flattenErrors` gives
`{ formErrors, fieldErrors }`, attributing a nested failure to its top-level field so a form bound to
`address` still hears about `address.street`; `treeifyErrors` keeps the full structure.

**Deriving object schemas: `pick`, `omit`, `partial`, `required` and `extend`.** Available as
`bguard/object/pick` and so on. Each returns a new schema and leaves the source and its property
schemas alone, which is only sound because schemas became immutable in this release:

```ts
const userSchema = object({ id: string(), name: string(), secret: string() });

pick(userSchema, ['id', 'name']);      // { id: string; name: string }
omit(userSchema, ['secret']);          // { id: string; name: string }
partial(userSchema);                   // { id?: string; name?: string; secret?: string }
required(partial(userSchema));         // back to all required
extend(userSchema, { age: number() }); // adds age
```

`extend` replaces a property already declared — the difference from `intersection`, which rejects a
duplicate key because it has no basis for choosing. All five carry over the source's
`allowUnrecognized`, object assertions, `id` and `description`. `clone()` is public now, since
deriving a schema is a reasonable thing to do from outside as well.

**`union([...schemas])`** accepts a value matching any one of several schemas. Members are tried in
order and the first that validates cleanly wins, so its parsed value is the result. Unlike
`oneOfTypes`, which only compares `typeof`, each member is a full schema, so members carry their own
assertions and structure — which makes discriminating by shape possible:

```ts
const shape = union([
  object({ kind: string().equalTo('circle'), radius: number() }),
  object({ kind: string().equalTo('square'), side: number() }),
]);
// InferType: { kind: 'circle'; radius: number } | { kind: 'square'; side: number }
// codeGen:   { kind: 'circle'; radius: number; } | { kind: 'square'; side: number; }
```

Note that a member with a coercing `transformBeforeValidation` matches every value, so nothing after
it is reached. Order members from most to least specific.

**`record(keySchema, valueSchema)`** validates an object whose keys are not known in advance. Every
key is checked against `keySchema` and every value against `valueSchema`:

```ts
const counts = record(string(), number());              // Record<string, number>
const labels = record(string().oneOfValues(['en', 'sr']), string());
// Partial<Record<'en' | 'sr', string>>
```

A restricted key type infers as `Partial`, because validation checks the keys that are present rather
than requiring the whole set — claiming `Record<'en' | 'sr', string>` would say both are always
there. `codeGen` emits the same shape.

**`tuple([...schemas])`** validates a fixed-length array where each position has its own schema.
Unlike `array`, the inferred type keeps the positions distinct: `tuple([string(), number()])` infers
`[string, number]`, not `(string | number)[]`. Note that `optional()` on a position describes the
value there, not whether the position exists — the length must still match.

**`intersection([...objectSchemas])`** combines object schemas into one requiring all of them. The
shapes are merged when the schema is built, so the result is an ordinary object schema and a key
declared by any member is recognised. Validating against each member separately would have the first
reject the second's keys as unrecognised.

Members must be object schemas, and a key may not be declared twice: two members declaring the same
key would mean `A & B` for that property in the type while only one schema could run during
validation, so it throws rather than resolving it one way silently. Member-level `nullable` and
`optional` are rejected for the same reason.

**`lazy(typeName, getSchema)`** defers building a schema until first use, which is what allows a
schema to refer to itself:

```ts
interface Category {
  name: string;
  children: Category[];
}

const categorySchema: CommonSchema = object({
  name: string(),
  children: array(lazy<Category>('Category', () => categorySchema)),
});
// codeGen: { name: string; children: Category[]; }
```

The inferred type is supplied by the caller, because TypeScript cannot infer through a
self-reference. `typeName` is what `codeGen` emits at the recursion point; without it code generation
would descend again and never finish, so it is required. Recursive schemas are supported; cyclic
values are not, since validation follows the data.

All five are exported from the root and as their own subpaths — `bguard/union`, `bguard/record`,
`bguard/tuple`, `bguard/intersection`, `bguard/lazy` — and all work everywhere a schema does: nested
in each other, in arrays, as object properties, and with `nullable`, `optional`, `default` and
`custom`.

### Breaking

**`parse` marks an absent slot with `null`.** It returns `[null, value]` on success and
`[errors, null]` on failure; previously both used `undefined`. Branch on the first element:
a schema may legitimately parse to `null`, so the second element cannot tell you whether validation
passed.

**Refining a schema returns a new schema** instead of changing the one it was called on. This
affects `custom`, `nullable`, `optional`, `default`, `transformBeforeValidation`, `id`,
`description`, `allowUnrecognized`, `equalTo`, `oneOfValues`, `onlyTrue` and `onlyFalse`.

Previously they mutated and returned the same instance, so a schema could not be shared:

```ts
const name = string();
const schema = object({ a: name.optional(), b: name });
// `b` silently became optional too, and a missing `b` produced no error
```

Chained code such as `string().optional().custom(email())` is unaffected. Code that refined a schema
for its side effect and ignored the result needs updating:

```ts
const schema = string();
schema.custom(minLength(5));              // returns a new schema, which is discarded
const schema = string().custom(minLength(5));   // do this instead
```

Child schemas inside `array` and `object` are shared by reference rather than deep-copied, which is
safe now that refining a child cannot alter it in place.

**`custom` rejects asserts belonging to a different type.** `RequiredValidation` now takes the value
it inspects, and `custom` asks for the schema's own value type, so `number().custom(email())` and
`string().custom(min(3))` are compile errors instead of validations that can never match. Asserts
that genuinely accept anything declare `RequiredValidation<unknown>` and remain usable everywhere;
the parameter defaults to `any`, so custom asserts written against the old signature keep compiling.

**`NaN` is rejected by `number()`.** `typeof NaN` is `'number'` and every comparison against it is
false, so it previously satisfied `number()` and passed straight through `min`, `max`, `positive` and
`negative`. `Infinity` is unchanged: it compares correctly. New `'c:nan'` message key.

**Other behaviour that changed because it was wrong:**

 - `transformBeforeValidation` no longer runs on a missing value. An optional string with a
   `val + ''` transform used to parse `undefined` into the string `'undefined'`. `null` is still
   transformed, since it was supplied and `undefined` was not.
 - Inherited object keys are rejected. `constructor`, `toString`, `valueOf`, `hasOwnProperty` and an
   own `__proto__` from `JSON.parse` were accepted as declared properties and then dropped from the
   output without a word.
 - Sparse arrays keep their length. `[1, , 3]` parsed to a two-element array with no error.
 - `boolean().onlyTrue().onlyFalse()` throws `BuildSchemaError`, matching the other schemas. It used
   to build a schema that rejects `true` and `false` alike.
 - `oneOfTypes([])` throws `BuildSchemaError`. It used to accept every value.
 - `oneOfTypes(['string', 'undefined'])` accepts a missing value, and makes an object property
   holding it optional, matching the type it has always inferred.

### Fixed

 - **Locales no longer surface internal keys.** `setLocale` seeded a new locale from the ten common
   messages only, so a locale translating one key reported every other as its raw name — a user saw
   `n:min` in the UI. `clearLocales` reset the default locale the same way, permanently discarding
   every assert's registered message for the rest of the process.
 - **`id()` and `description()` work.** The object and array branches passed the *container's*
   metadata to every child, so a property's own id was never reported. A child's own metadata now
   wins, and the container's is inherited only when the child declares none.
 - **Metadata is reported under `getAllErrors`.** `addIssue` attached it when throwing but omitted it
   when collecting, so it was always missing in the mode forms actually use.
 - **`default()` works on an object property.** The missing-property check ran before the default
   could be substituted, and `default()` refuses to combine with `optional()`, so a default was
   unusable anywhere except at the root of a schema.
 - **`default()` hands out a fresh value per parse.** It returned the stored value directly, so every
   parse of the same schema shared one array or object and mutating a result changed later ones.
 - **Ten asserts ignored `setLocale`** and always emitted hardcoded English, because they passed
   their message text to `addIssue` where the key belongs: `positive`, `minLength`, `maxLength`,
   `minArrayLength`, `maxArrayLength`, `email` and `regExp`. Three more had the arguments in the
   wrong order, reporting the received value as `expected` and the message text as `received`:
   `isValidDate`, `isValidTime` and `isValidDateTime`.
 - **`getAllErrors` no longer duplicates or invents errors.** A missing property was reported twice,
   and validating a non-object produced seven errors — the type error, one invented unrecognized
   property per string index, and a missing-property pair.
 - **`ctx.ref()` on an unreachable path yields `undefined`** instead of throwing a `TypeError` that
   surfaced as `'Something unexpected happened'` with no path and no hint of the cause.
 - **`codeGen` emits valid TypeScript.** String literals containing a quote, backslash, tab or
   newline were interpolated unescaped, so `string().equalTo("it's")` produced source that does not
   parse. An object nested inside an array was also indented one level too far, and its closing brace
   two. Verified by parsing the output back with the TypeScript compiler.
 - Fixed two README examples that did not compile: one used `number()` without importing it, the
   other read `error.message` from an `unknown` catch binding.

### Internal

 - **The test suite was not type checking at all.** ts-jest reads `isolatedModules` from the tsconfig
   it loads as "transpile only", and the root tsconfig sets it, so a plain `const y: string = 42`
   passed. That made roughly 150 compile-time type assertions — the library's main selling point —
   assert nothing. Checking is on again, it surfaced no errors, and two canaries now fail if it is
   ever disabled.
 - Test coverage grew from 142 to 301 tests. Each fix above was verified to be caught by reverting
   it and watching the new tests fail.
 - Dependencies updated, taking eslint 10, `@eslint/js` 10, globals 17 and `@types/node` 26.
   TypeScript stays on 5.9.3: 7 is `latest` on npm, but `@typescript-eslint` caps at `<6.1.0`, which
   would leave the project unlintable.
 - The ESLint config no longer needs `FlatCompat`, dropping `@eslint/eslintrc`, `@eslint/js` and
   `eslint-plugin-jest` (registered with no rule from it ever configured). Verified by diffing
   `eslint --print-config`: 27 active rules before and after, none lost or changed.
 - `npm run prettier` covers `jest/` and `scripts/`, not only `src/`, and the static type assets are
   formatted by their generator so no separate pass is needed.
 - `parseOrFail` no longer accepts `getAllErrors`. Two `ParseOptions` interfaces had been declared,
   which TypeScript merged, so the flag typechecked on a function that throws at the first error by
   definition and ignored it entirely.
 - `npm run check:docs` typechecks the README's self-contained examples, and runs as part of
   `check:package` in CI. Three examples did not compile at three separate points in this release, none
   of it visible from reading the Markdown.
 - Removed the empty `src/asserts/function` and `src/asserts/symbol` directories, left behind once
   their export entries were dropped. Git does not track empty directories, so they only ever confused
   a local checkout.

## 0.6.1 Fix broken subpath exports and ESM type resolution
 - Fixed the catch-all `"./*"` export, which pointed at the package root instead of `lib/`. Subpaths such as `bguard/core`, `bguard/InferType`, `bguard/translationMap` and `bguard/exceptions` previously failed to resolve in both CJS and ESM.
 - `bguard/string`, `bguard/number`, `bguard/object`, `bguard/array`, `bguard/boolean`, `bguard/date`, `bguard/bigint` and `bguard/mix` now resolve directly, as the README has always documented. The trailing `/index` is no longer required, and the old `bguard/string/index` form keeps working.
 - Fixed the docs, which referenced `bguard/ExceptionContext`. That module was merged into `core` in 0.6.0, so `ExceptionContext` and `RequiredValidation` now come from `bguard/core`.
 - Fixed `bguard/codeGen`, which was mapped as a directory (`./codeGen/*`) although the build emits a single `lib/codeGen.js` file.
 - ESM consumers now resolve `.d.mts` declarations instead of the CJS `.d.ts` ones, fixing the "Masquerading as CJS" type mismatch reported by `@arethetypeswrong/cli`.
 - Removed the `./function/*` and `./symbol/*` export entries. Those assert directories are empty, so the subpaths could never resolve.
 - Added `"sideEffects": false` so bundlers can tree-shake the package.
 - Added `npm run check:package`, wired into CI, which validates every export target against the real build output.

## 0.6.0 Documentation cleanup and export fixes
 - Improved docs
 - Fixed missing exports in index.ts
 - Updated dev dependencies

## 0.5.0 Removing guardException and adding Ref
 - For custom assertions, we use ctx.addIssue instead of guardException
 - To access other properties in the received object we implemented ctx.ref(value: path)

## 0.4.1 Readme Table of contents update

## 0.4.0 New Features and Improvements
 - Added new tests to ensure the reliability and accuracy of the new methods and enhancements.
 - This release focuses on improving flexibility in data transformation, better metadata management with id and description, and stronger TypeScript support.

## 0.3.0

### Added default Chain Method and Validation Data Parsing

- Added default Method: Allows setting a default value if the value is undefined.
- Enhanced Validation Data Parsing: Ensures that returned objects and arrays do not hold references after parsing, improving data immutability.

## 0.2.0

### Remove default import for asserts and add BigIntSchema

- Remove default import for asserts. Now, we can use them from 'bguard/{assertFolder}'.
- Add BigIntSchema
- Update docs and add more assertions

## 0.1.1

### Update docs and add more assertions

- Update docs and add more assertions

## 0.1.0

### Rename parseSchema and add translation feature

- Rename parseSchema into parseOrFail
- Added parse feature
- Added error message translation feature

## 0.0.9

### Bundle fix

- Adding custom assertions to the bundle and enhancing the README file.

## 0.0.1

### Initial

- Set initial library.
