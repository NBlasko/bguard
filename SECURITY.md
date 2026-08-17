# Security Policy

## Reporting a vulnerability

**Use [private vulnerability reporting](https://github.com/NBlasko/bguard/security/advisories/new).**
That opens a private thread on this repository, visible only to you and the maintainer, and it is the
channel a report gets a response on. Please do not open a public issue for a security problem.

Email is not a reporting channel. Any address you find in the commit history or in package metadata is
the maintainer's personal contact and is not monitored for security reports.

## What to include

A report is acted on fastest when it contains:

- The **version you tested**, and how you installed it. Please check the report against the [latest
  release](https://www.npmjs.com/package/bguard) first — a report against an old version costs a
  round-trip just to establish whether it still applies.
- A **runnable reproduction** that goes through the package's public entry points — `require('bguard')`,
  `import … from 'bguard'`, or a documented subpath such as `bguard/string`. Reproductions that import an
  internal bundler chunk (`bguard/lib/chunk-*`) cannot be re-run against a fix: those filenames are
  generated and change on every release, so the script fails at module load rather than showing whether
  the issue is gone.
- **Which API is called with what**, and which of its arguments an attacker is assumed to control. This
  is the part that determines severity, so stating it yourself avoids a round-trip.
- The observable effect **as an assertion** — what is true after the call that was not true before.

## What happens next

- **Acknowledgement within 5 working days**, including whether the issue reproduces.
- If it reproduces, a **GitHub Security Advisory draft** is opened. You get the link and can review the
  description, the affected version range and the severity before anything is published.
- A **CVE is requested through GitHub** as CNA, from that draft.
- You are **credited** in the advisory, under whatever name or affiliation you ask for. Tell me the form
  you want; the default is the name you reported under.
- The advisory is published once a fixed version is on npm, so `npm audit` and Dependabot point at a
  release that exists.

There is no bug bounty. This is an unfunded package maintained by one person; what is on offer is a
prompt fix and public credit.

## Scope

bguard has two kinds of surface, and they are not equivalent.

**Validation and parsing — treated as reachable.** `parse`, `parseOrFail`, `parseAsync`,
`parseOrFailAsync` and every schema they walk. These are pointed at untrusted input by design, so
anything reachable from the _data_ argument is assessed as reachable in practice. In particular:

- Data that makes a parse affect anything beyond its return value and reported issues.
- A value that should have been rejected being accepted, or the parsed output differing from the input in
  a way the documentation does not describe.
- Prototype pollution of any kind, including of the returned object alone.

**Configuration — assessed for narrower exposure.** `setLocale`, `setToDefaultLocale`, `clearLocales`,
and schema construction (`object`, `record`, `string`, and the rest). An application calls these with
values it chose, normally once at startup. An issue that requires one of their arguments to be
attacker-controlled is real and will be fixed, but it is scored for that narrower exposure rather than as
if it sat on the data path.

### Out of scope

These are settled positions, not brush-offs — each has a reason, and a report that shows the reason to be
wrong is welcome:

- **A regular expression you passed to `regExp()` backtracking.** That is your pattern; bguard only calls
  `.test` on it. The library's own built-in patterns (`email`, `uuid*`, `validUrl`, the date and time
  asserts) _are_ in scope.
- **`codeGen` output.** `codeGen` returns TypeScript source **as a string**, for you to write to a file.
  bguard contains no `eval` and no `new Function`, and never executes what it emits. If your pipeline
  evaluates generated code from schemas an attacker influenced, the exposure is in that pipeline.
- **Nesting depth beyond the configured limit.** Parsing recurses, so a parse stops at `maxDepth` — 512 by
  default — and reports `'c:maxDepth'` at the path where the input got too deep. Pass a lower `maxDepth`
  to bound what an untrusted payload can ask for. Reports of a **process crash**, or of unbounded CPU or
  memory *within* the limit, are in scope; hitting the limit itself is the limit working.
- **Anything requiring the application to pass attacker-controlled values as a schema definition.** A
  schema is code. If an attacker chooses your schemas, they already choose your validation.
- **Vulnerabilities in devDependencies.** bguard has **zero runtime dependencies**, and the published
  tarball is `files: ["/lib"]` — bundled output only. Nothing in `devDependencies` is installed by anyone
  who installs bguard, so an advisory against one of them does not reach users of this package. Report it
  upstream instead.

### Automated and bulk reports

Machine-generated reports are welcome, and one of them produced the fix in 0.10.0. Two requests, both
learned from that report:

- Run the reproduction against the **latest** published version before sending it, and through a public
  entry point rather than a generated chunk filename. Otherwise the first exchange is spent working out
  which version and which module the finding applies to.
- Check which field of your template holds the **reporter's** contact. A report has arrived here with the
  maintainer's own scraped email in that slot, which makes it impossible to reply to the finder.

A report that only names a function and a polluted property, with no runnable script, will get a request
for one before anything else.

## Supported versions

Fixes go into the next release from `main`, which is published automatically. There are no maintenance
branches, so a fix for an issue found in an older version ships in the **next release from the current
line**, not as a backport — an issue reported against 0.6.0 was fixed in 0.10.0, not 0.6.1. Whether that
release is a patch or a minor depends on what else it carries, not on the fix being a security one.

Only the latest release is supported. Please upgrade before reporting.

## Acknowledgements

Thanks to the people who have reported issues here:

- **Madiba Security Lab, Concordia University** — prototype pollution via `setLocale` (fixed in 0.10.0).
