# bguard

## 0.7.0 Immutable schemas, type-safe asserts, working metadata and locales

### Breaking

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
