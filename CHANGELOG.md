# bguard

## 0.7.0 Immutable schemas, assert type safety, and export fixes

### Breaking

Refining a schema now returns a new schema instead of changing the one it was called on. Every
method that narrows a schema is affected: `custom`, `nullable`, `optional`, `default`,
`transformBeforeValidation`, `id`, `description`, `allowUnrecognized`, `equalTo`, `oneOfValues`,
`onlyTrue` and `onlyFalse`.

Previously they mutated and returned the same instance, so a schema could not be shared:

```ts
const name = string();
const schema = object({ a: name.optional(), b: name });
// `b` silently became optional too, and a missing `b` produced no error
```

Chained code such as `string().optional().custom(email())` behaves exactly as before. Code that
relied on refining a schema for its side effect needs updating:

```ts
const schema = string();
schema.custom(minLength(5));   // before: mutated `schema`. now: returns a new schema, discarded
const schema = string().custom(minLength(5));   // do this instead
```

Child schemas inside `array` and `object` are shared by reference rather than deep-copied, which is
safe now that refining a child cannot alter it in place.

### Fixed

 - `custom` now rejects asserts that belong to a different type. `RequiredValidation` takes the
   value it inspects (`RequiredValidation<string>`), and `custom` asks for the schema's own value
   type, so `number().custom(email())` and `string().custom(min(3))` are compile errors instead of
   validations that never match. Asserts that accept anything declare `RequiredValidation<unknown>`,
   and the parameter defaults to `any` so existing custom asserts keep compiling.
 - Ten built-in asserts ignored `setLocale` and always emitted hardcoded English, because they
   passed their message text to `addIssue` where the translation key belongs: `positive`,
   `minLength`, `maxLength`, `minArrayLength`, `maxArrayLength`, `email` and `regExp`. Three more
   had the arguments in the wrong order, reporting the received value as `expected` and the message
   text as `received`: `isValidDate`, `isValidTime` and `isValidDateTime`.
 - `codeGen` indented an object nested inside an array one level too far, and its closing brace two,
   producing misaligned output from a function whose purpose is emitting source.

### Internal

 - The test suite was not type checking at all. ts-jest reads `isolatedModules` from the tsconfig as
   "transpile only", so roughly 150 compile-time type assertions asserted nothing. Checking is on
   again, with canaries that fail if it is ever disabled.
 - `npm run prettier` now covers `jest/` and `scripts/`, not only `src/`.

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
