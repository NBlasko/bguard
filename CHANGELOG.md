# bguard

## 0.6.1 Fix broken subpath exports and ESM type resolution
 - Fixed the catch-all `"./*"` export, which pointed at the package root instead of `lib/`. Subpaths such as `bguard/core`, `bguard/InferType`, `bguard/translationMap` and `bguard/exceptions` previously failed to resolve in both CJS and ESM.
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
