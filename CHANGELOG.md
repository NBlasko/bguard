# bguard

## 0.13.0 New string, number and object assertions, a guide to writing your own, and stricter `coerceString`

### Added

Nine assertions, each with a translation key, a default message, and a JSON Schema mapping where one
exists. Every one that maps onto a keyword is checked against `ajv` in the test suite.

| Assertion | Import | Accepts | JSON Schema |
|---|---|---|---|
| `isAlpha()` | `bguard/string/isAlpha` | letters in any script: `Đorđe`, `Ђорђе`, `Zoë` | — (needs `\p{L}`) |
| `isAlphaNumeric()` | `bguard/string/isAlphaNumeric` | letters in any script and decimal digits | — (needs `\p{L}`) |
| `isNumeric()` | `bguard/string/isNumeric` | a plain decimal number: `-12.5`, `.5`; no exponent, spaces or separators | `pattern` |
| `isHexColor()` | `bguard/string/isHexColor` | `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` | `pattern` |
| `isPhoneNumber()` | `bguard/string/isPhoneNumber` | E.164: `+381641234567`. The format only, not whether the number exists | `pattern` |
| `isCreditCard()` | `bguard/string/isCreditCard` | 12–19 digits, optionally grouped by spaces or hyphens, not all zeros, with a valid Luhn check digit | — |
| `isJson()` | `bguard/string/isJson` | any JSON text `JSON.parse` reads, primitives included | — |
| `integer()` | `bguard/number/integer` | a number with no fractional part | `type: 'integer'` |
| `minKeys(n)` | `bguard/object/minKeys` | an object with at least `n` keys that have a value; the counterpart of `maxKeys` | `minProperties` |

`isAlpha` and `isAlphaNumeric` take combining marks after a letter, so `é` written as `e` + U+0301 is a
letter, and the zero-width non-joiner and joiner between letters that Persian and several Indic scripts
need inside words. Marks do not attach to digits. `isAlphaNumeric` takes decimal digits in any script
(`١٢٣`) but not other numerals such as `½` or `Ⅻ`. `isCreditCard` keeps the number out of its issue's
`expected` and default message. `minKeys` does not count a key whose value is `undefined`: form libraries
and object spreads fill absent fields with it, and `{ email: undefined }` sends nothing.

**A guide to writing a custom assertion** that takes part in everything the built-in ones do: a key, a
default message, translations, `setDefaultLanguage`, the `code` on each issue, and Standard Schema. It
replaces the earlier example, which was never typechecked and described `addIssue` as always throwing.

### Changed

**`coerceString` converts only primitives and Dates.** `String` turned anything into text —
`'[object Object]'` for an object, `''` for an empty array, a function's source code, `'NaN'` — and none
of it is what anyone sent. Now:

- finite numbers, booleans and bigints are converted as before, and so are their boxed forms
  (`new String('a')`);
- a Date becomes its ISO form, `2021-01-01T00:00:00.000Z`, rather than `String(date)`'s local time with
  a time-zone name, which read differently on every server. A Date from another realm (an iframe, a
  `vm` context, a worker) is recognised too;
- every other object — plain objects, arrays, Maps, errors, URLs, Buffers, class instances — and NaN,
  ±Infinity and invalid Dates are rejected by type. Convert a URL or a Decimal yourself, with
  `transformBeforeValidation`, where you know what its text should be.

**`maxKeys` refuses a count that is not a non-negative integer**, like the new `minKeys`. `maxKeys(1.5)`
or `maxKeys(-1)` used to build a schema whose JSON Schema no validator would compile; now it throws a
`BuildSchemaError`. `maxKeys(Infinity)` still works and means no limit; it emits no keyword.

**`maxKeys` no longer counts a key whose value is `undefined`**, matching `minKeys` and
`maxProperties`. `{ a: 'x', b: undefined }` now passes `maxKeys(1)`.

**`toJSONSchema` keeps every rule when two set the same keyword.** An assertion's keyword used to replace
the one already there: a second `pattern` replaced the first, and `minArrayLength(1)` on a two-element
tuple replaced its `minItems: 2`, so the document accepted values bguard rejects. The newer one now goes
into `allOf`. The one exception is `integer()` narrowing `type: 'number'`, so a nullable integer is still
`type: ['integer', 'null']`. A `default` in the output is now a copy, so editing the document does not
change the schema's default.

### Fixed

**A default could be one shared object.** `date().default(new Date(0))` handed out one instance, so
`setFullYear` on one result moved the default for every later parse; the same happened with an object
default under a schema that does not rebuild it, such as `oneOfTypes(['object'])`. And only the top level
of the value given to `default()` was copied, so changing a nested object afterwards changed the schema.
A default is now deep-copied when it is set and on every use — plain objects, arrays and Dates, from any
realm; class instances are kept as they are, prototype and all.

### Internal

- Thirty tests for `default()`: which values it replaces (and that `null` is not one of them), where it
  applies — properties, array holes, tuples, records, unions — how it meets transforms and coercion, when
  the default itself is refused, and the types it produces.
- The test that every assertion has a translation case used to compare against a hand-kept count. It
  now finds every exported function with a `key` and names the one that is missing.

- The package is built with tsup 9 (was 8). The JavaScript output is the same apart from chunk names and
  import order. Declaration files now re-export types as `export type { X }` instead of
  `export { type X }`, which TypeScript has read since 3.8 rather than 4.5.
- CI runs on Node 22 and 24; releases are built and published on Node 24. GitHub Actions are on their
  current majors (checkout v7, setup-node v7, upload-artifact v7, download-artifact v8), which run on
  Node 24 rather than the deprecated Node 20.
- The publish workflow pins its actions to commit SHAs, does not use the npm cache (setup-node's advice
  for publishing, since a poisoned cache would end up in the tarball), and does not leave the git token
  on disk after checkout.
- `@changesets/cli` and the `release:package` and `change:*` scripts are removed. They were never used:
  a release is a merge to `main` with a new version.

## 0.12.0 Translated messages through Standard Schema, issue codes for forms, and `email`/`validUrl` that agree with their JSON Schema formats

### Added

**`setDefaultLanguage(lng)` sets the language of every parse that is not given an `lng`.** That
includes validation through Standard Schema, which takes only a value and so had no way to receive one:
a form library calling `~standard.validate` got English messages whatever locales the application had
registered.

```js
setLocale('sr', { 's:minLength': 'Tekst mora imati bar {{e}} znakova' });
setDefaultLanguage('sr');

parse(string().custom(minLength(3)), 'ab'); // 'Tekst mora imati bar 3 znakova'
string().custom(minLength(3))['~standard'].validate('ab'); // the same message
```

An `lng` passed to `parse` still wins, and an unknown `lng` now falls back to the default language
rather than straight to English. The locale has to be registered with `setLocale` first: an unknown name
throws a `BuildSchemaError`, so a typo does not silently leave everything in English.
`setDefaultLanguage('default')` and `clearLocales()` restore the built-in messages. The setting is
process-wide; a server answering each request in its own language should keep passing `lng`.

**Standard Schema issues carry the `code`, `expected`, `pathToError` and `meta` of the failure.**
Before, `~standard.validate` passed on only `message` and `path`, so a consumer had no stable key to
translate or branch on. The new type is `BguardStandardIssue`, and `~standard` is typed as
`BguardStandardProps`, a narrower `StandardSchemaProps`, so the fields are readable without a cast.

`received` is left out of these issues on purpose. It is the raw input, which may be a password, and
Standard Schema issues are routinely logged or returned to clients. `parse` still reports it. This only
covers what bguard adds: a custom rule decides what goes into `expected` and its message. The README's
password-confirmation example used to report the password itself as `expected`, and now reports
`'the same password'` instead.

**An issue no longer shares objects with its schema.** `expected` was often the schema's own state — the
type list of `number()`, the array given to `oneOfValues`, the Date given to `dateMax` — and `meta` was
the schema's own object. Changing them on an issue changed the schema: pushing `'string'` onto a
`number()` issue's `expected` made that schema accept strings. This was true of `parse` before 0.12.0
too, and would have reached every Standard Schema consumer with this release. Issues now get copies.

### Changed

Each of these rejects values that used to pass.

**`email` uses the same pattern as JSON Schema's `format: 'email'`** (#23). It accepted non-ASCII
addresses and characters such as `(`, `"` or `<`, all of which the format rejects, so a value bguard
accepted could fail the document `toJSONSchema` generated. It is ASCII-only now: `ünï@test.org` and
`a@b_c.com` are rejected. Use `regExp` for a different rule.

**`validUrl` follows RFC 3986** (#23). The path, query and fragment used to take anything but
whitespace, including non-ASCII text, `<`, `>`, `{`, `}`, `|`, `\`, `^`, `"` and a malformed `%zz`.
They now take only the characters RFC 3986 allows, with `%` only as a `%XX` escape, so non-ASCII text has
to be percent-encoded. In the other direction, **IPv6 hosts are accepted** (`http://[::1]:8080/`).
Userinfo (`http://user@host/`) is still rejected, deliberately: `http://bank.com@evil.com` goes to
evil.com.

**`number()` rejects `Infinity` and `-Infinity`**, with the new code `c:infinity` ('The received number
is not finite'). JSON cannot carry either, and a value that passed `number()` is expected to be usable
in arithmetic. This applies wherever a type list names `number`, including `oneOfTypes` and
`coerceNumber('Infinity')`.

**`coerceNumber` and `coerceBigInt` convert only what holds a number.** `Number('')` is `0`, so an
empty form field used to arrive as a real zero; `Number([])` and `Number([''])` are `0` and `Number([5])`
is `5`, and `BigInt` reads `''` and `[]` as `0n`. An empty or whitespace-only string, an array or an
object is now rejected (`c:nan` for a blank string to `coerceNumber`, `c:invalidType` otherwise). Strings,
booleans, numbers, bigints and Dates are still converted.

**`coerceDate` rejects a day that does not exist.** `new Date('2021-02-30')` is March 2nd, and that is
what `coerceDate` returned. A numeric date now has to name a real day, whether year-first
(`2021-02-30`, `2021/02/30`, `2021.02.30`, `+002021-02-30`) or month-first (`02/30/2021`, `02-30-2021`),
with or without a time after it. A date with a month name (`Feb 30 2021`) is still read exactly as
`new Date` reads it.

**`coerceDate` converts only strings and numbers.** `new Date(true)` is 1 ms after the epoch,
`new Date([5])` is May 2001 and `new Date(['2021-01-01'])` is that day; booleans, arrays and objects are
now rejected.

**Message placeholders are filled in linear time, and only from `{{e}}`, `{{r}}` and `{{p}}`.** The
placeholder pattern `{{(.*?)}}` searched the rest of the message from every `{{`, which is quadratic: two
seconds for a 120,000-character message of repeated `{{a` (flagged by CodeQL). Placeholders are now
matched without crossing a brace. And a placeholder was looked up with `in`, so `{{constructor}}` in a
message was replaced with the source of the `Object` function; unknown names are now left as they are.
`{{{e}}}` now gives the value in braces, where it used to be left untouched.

**No coercion throws.** `coerceNumber(Symbol())`, `coerceDate(1n)`, `coerceDate(Symbol())` and
`coerceString(Object.create(null))` threw inside the conversion, and the parse reported 'Something
unexpected happened' instead of a validation error. They are now rejected by type.

### Internal

- The `ajv` cross-check is part of the test suite now (`jsonSchemaAgreement.test.ts`), with `ajv` and
  `ajv-formats` as devDependencies. Every assertion that maps onto a JSON Schema keyword is run against
  thousands of mostly invalid inputs from a seeded generator, and no value bguard accepts may fail the
  generated document. Run against the 0.10.0 validators, it fails ten of its nineteen tests.
- The publish workflow is split into two jobs. `build` runs `npm ci`, the build and the tests, and hands
  over a tarball. `publish` is the only job that can publish, installs nothing from the project, and uses
  an exact npm version. A compromised devDependency can no longer request the token and publish a
  version of its choosing. It can still tamper with the build output before it is packed, which this
  does not prevent.
- A merge to `main` that does not bump the version no longer fails the publish workflow. The build job
  checks whether the version is already on npm, and the publish job is skipped if it is.
- `npm audit fix` (without `--force`) cleared the critical and high findings, all in devDependencies.
  What remains is moderate and low, in jest's and typescript-eslint's dependencies, where npm's suggested
  fix is a downgrade to years-old majors. None of it is installed with bguard, which has no runtime
  dependencies.
- README notes about `toJSONSchema` that 0.11.0 added straight to `README.md` were moved into its source,
  `scripts/readmeStart.md`; regenerating the README would otherwise have reverted them.

## 0.11.0 Date and time assertions that check the calendar and the clock, and string formats that mean what their JSON Schema says

Some values that used to pass are now rejected. Every one of them was invalid by the assertion's own
documentation, but a schema that relied on the old behaviour will see new errors, which is why this is a
minor release rather than a patch.

### Fixed

**`isValidDate` accepted days that do not exist, and rejected years that do.** Reported by
`trackoor` (UCSB PLSE) in #21.

```js
const schema = string().custom(isValidDate());
parse(schema, '2021-02-29'); // accepted — 2021 is not a leap year
parse(schema, '2020-04-31'); // accepted — April has 30 days
parse(schema, '1800-01-01'); // rejected — the year was limited to 1900–2099
```

The day was checked against 01–31 whatever the month. It is now checked against the month and year,
with leap years following the Gregorian rules: 2000 is a leap year, 1900 is not. Any four-digit year is
accepted, as RFC 3339 allows.

**`isValidDateTime` only checked how many digits each part had.** `9999-99-99T99:99:99Z` passed, and so
did `+25:60` as an offset. Hours are now 00–23, minutes and seconds 00–59, the offset hours and minutes
the same, and the day has to exist. The `+HHMM` and `+HH` offset forms are still accepted. Leap seconds
(`23:59:60`) are rejected, since a JavaScript `Date` cannot hold one.

**`precision: 0` accepted a bare dot.** `isValidTime({ precision: 0 })` took `12:00:00.` and
`isValidDateTime({ precision: 0 })` took `2020-01-01T00:00:00.Z`. A precision of 0 now means no fraction.
A precision that is not a non-negative integer throws a `BuildSchemaError` when the schema is built; `-1`
or `1.5` used to end up as literal text inside the regex.

**`isValidTime` reported one problem twice.** With a `precision` set, a malformed value added two issues
under `getAllErrors`.

**`regExp` with a `g` or `y` flag gave alternating answers.** `RegExp.prototype.test` resumes from
`lastIndex` on such a regex, so the same value passed, then failed, then passed:

```js
const schema = string().custom(regExp(/a/g));
[1, 2, 3, 4].map(() => parse(schema, 'a')[0] === null); // [true, false, true, false]
```

Every value is now tested from the start. The assertion tests its own copy of the regex, so the caller's
`lastIndex` is left alone.

**`email` accepted whitespace and line breaks.** `a b@c.d` and `a\n@b.c` passed, as did `a@b..c` and a
local part starting or ending with a dot. All of these are now rejected. The pattern is otherwise as
loose as before, and non-ASCII addresses are still accepted.

**`validUrl` accepted hosts that are not hostnames, and treated the protocol as a regex.**

- `http://...`, `http://-` and `http://a-.com` passed. A host is now dot-separated labels of letters,
  digits and inner hyphens.
- A port above 65535 passed. It is now range-checked.
- `validUrl('a.b')` also accepted `axb://host`, because the protocol was spliced into a regex without
  escaping. It is now matched literally.
- `http://a.com?x=1` and `https://a.com#top` were rejected because the rest of the URL had to start with
  `/`. It may now start with `?` or `#` too.

### `toJSONSchema`

**`isValidTime` is emitted as a `pattern` instead of `format: 'time'`.** JSON Schema's `time` is RFC
3339 `full-time`, which requires an offset, and an offset is exactly what `isValidTime` rejects. The
generated document therefore rejected every value bguard accepted.

**A `regExp` whose flags change the match is left out.** A JSON Schema `pattern` cannot carry flags, so
`/abc/i` became `pattern: "abc"` and rejected `ABC`, which bguard accepts. Regexes with only `g`, `d` or
`u` are still emitted.

The README's claim that the output was verified against `ajv` was based on a check that only used valid
values. It now says what was actually checked: `isValidDate` agrees with `format: 'date'` on more than a
million year/month/day combinations, and none of 300,000 random date-times passes bguard while failing
`format: 'date-time'`. It also says where the two still differ. `email` and `validUrl` remain looser
than `format: 'email'` and `format: 'uri'`, and that is tracked separately.

## 0.10.0 Security: prototype pollution through a locale name and through a payload key, and a bound on how deep a parse will go

### Fixed

**`setLocale` could write onto `Object.prototype`.** Reported by Madiba Security Lab, Concordia
University, against 0.6.0; present in every release from 0.1.0 through 0.9.0.

```js
setLocale('__proto__', { isAdmin: true });
({}).isAdmin; // true — every object in the process now reports it
```

The locale store was an ordinary object, so `data[lng] ??= baseMessages()` for a `lng` of `__proto__`
read `Object.prototype`, found it truthy, and created no locale. The writes that followed went to
whatever the read returned, which was the global prototype itself. `'constructor'` reached the `Object`
function the same way, and a string passed where the message map belongs was iterated by
`Object.entries` into character-indexed keys — the reported `Object.prototype.0`.

Three things changed, and the first is the one that matters:

- The locale store and every locale in it have **no prototype**, so there is nothing to inherit and
  nothing to reach. A message key of `__proto__` is now stored as an ordinary message.
- `__proto__`, `constructor` and `prototype` are **rejected as locale names** with a `BuildSchemaError`,
  alongside the existing rejection of `'default'`. None of them names a language.
- A `custom` argument that is not a plain object is **rejected** rather than iterated.

Reading an unknown locale also behaves now: `{ lng: 'toString' }` used to resolve a function off the
prototype and leave every message unresolved, and falls back to the default locale instead.

**A `__proto__` key in parsed data could replace the prototype of the object handed back.** Not part of
the report, found while fixing the above, and the more likely of the two to be reached by untrusted
input:

```js
const parsed = parseOrFail(record(string(), object({ isAdmin: string() })), JSON.parse('{"__proto__":{"isAdmin":"yes"}}'));

Object.keys(parsed); // [] — the key is nowhere
parsed.isAdmin; // 'yes' — answered from a prototype the payload supplied
```

`Object.prototype` was never touched, so this was confined to the returned object — but a caller
reading `parsed.isAdmin` cannot tell the difference. With a primitive value the key was silently
dropped from the output instead, which is data loss with no error to say so.

The key is now stored as an own property, which is what the input said: a property literally named
`__proto__`. `record` was the reachable case; declared shapes and `toJSONSchema` use the same
assignment and are covered too.

**Deeply nested input reported a limit instead of exhausting the stack.** Validation recurses, so the
depth of the input decided how much JavaScript stack a parse used. Past roughly 900 levels the stack gave
out, and the `RangeError` was caught by the parse functions' catch-all and reported as
`Error: Something unexpected happened` — naming neither the cause nor the location.

There is now a depth limit of **512**, reported like any other finding:

```js
const [errors] = parse(commentTree, hostilePayload, { maxDepth: 20 });
// { code: 'c:maxDepth', expected: 20, received: 21, pathToError: '.next.next…' }
```

A new `'c:maxDepth'` translation key carries the message, so it is overridable through `setLocale` like
every other one, and the issue lands at the path where the input got too deep rather than at the root.
The limit is per-parse through the `maxDepth` option — lower it to bound what an untrusted payload can
ask for, raise it if your own data genuinely nests further. It must be a positive integer; anything else
is a `BuildSchemaError`.

Depth is `path.length`, which is what makes it mean the same thing for a property, an array index and a
record key, and what keeps a lazy schema resolving or a union trying a member from spending depth — those
recurse without consuming input. A property the schema declares but the payload does not contain is not
counted either.

**This is the one behaviour change to look at before upgrading.** Input nested deeper than 512 that
previously parsed will now be rejected with `'c:maxDepth'`. Real payloads nest in the tens, so this is
unlikely to be you; if it is, pass a higher `maxDepth`.

**Impact.** Reaching the `setLocale` issue requires calling it with an attacker-controlled locale name,
which is a configuration call rather than a data path, so exposure in practice is narrow. The `record`
issue is reachable from parsed input, which is exactly what the library is pointed at. Both are fixed;
no API used as documented changes behaviour.

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

**`ctx.sibling` — a property beside this one, without naming the way back to it.** `ref` is absolute,
which is fine at the top of an object and awkward inside an array: a rule on `contacts[i].value` that
wanted its own row's `kind` had to rebuild the path from the index —
`ctx.ref('contacts.' + ctx.path[1] + '.kind')` — reading an internal, interpolating it, and checked by
nothing.

```ts
value: string().custom((received: string, ctx: ExceptionContext) => {
  // this row's `kind`, whatever index the row is at
  if (ctx.sibling((row: Contact) => row.kind) === 'email' && !received.includes('@')) {
    ctx.addIssue('an email address', received, 'u:not-email');
  }
}),
```

Both forms of `ref` are available and mean the same things: the callback is type-checked and returns
the property's own type, the string splits on dots so `ctx.sibling('address.city')` reaches a
sibling's child.

A sibling read records the **absolute** path it resolved to, so `refReads` from `contacts[0].value`
reading `kind` says `contacts.0.kind` — identical to what the rebuilt `ref` records, which a test
asserts entry for entry. A consumer building a dependency graph cannot tell the two apart.

An array item's parent is the array, so a sibling there is another index — consistent rather than
special-cased. A rule on the root object throws a `BuildSchemaError`, because the root has no parent:
a mistake in the rule rather than a condition of the data, and `undefined` would give a comparison
that quietly passes or quietly fails.

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
