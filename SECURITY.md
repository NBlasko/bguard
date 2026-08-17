# Security Policy

## Reporting a vulnerability

**Use [private vulnerability reporting](https://github.com/NBlasko/bguard/security/advisories/new).**
That opens a private thread on this repository, visible only to you and the maintainer, and it is the
channel a report gets a response on. Please do not open a public issue for a security problem.

Email is not a reporting channel. Any address you find in the commit history or in package metadata is
the maintainer's own contact and is not monitored for security reports.

## What to include

A report is acted on fastest when it contains:

- The **version you tested**, and how you installed it. Please check the report against the [latest
  release](https://www.npmjs.com/package/bguard) before sending it — a report against an old version
  costs a round-trip to establish whether it still applies.
- A **runnable reproduction** that goes through the package's public entry points — `require('bguard')`
  or `import … from 'bguard'`. Reproductions that import an internal bundler chunk (`bguard/lib/chunk-*`)
  break on every release, because those filenames are generated, so they cannot be re-run against a fix.
- **Which API is called with what**, and which of its arguments an attacker is assumed to control.
- The observable effect, stated as an assertion — what is true after the call that was not true before.

## What happens next

- **Acknowledgement within 5 working days**, including whether the issue reproduces.
- If it reproduces, a **GitHub Security Advisory draft** is opened. You will get the link and can review
  the description, the affected version range and the severity before it is published.
- A **CVE is requested through GitHub** as CNA, from that draft.
- You are **credited** in the advisory under whatever name or affiliation you ask for. Tell me the form
  you want; the default is the name you reported under.
- The advisory is published once a fixed version is on npm, so that `npm audit` and Dependabot point at
  a release that exists.

## Severity

Severity is recorded by the maintainer in the advisory, and reachability is part of it. bguard has two
kinds of surface, and they are not equivalent:

- **Validation and parsing** — `parse`, `parseOrFail`, `parseAsync`, `parseOrFailAsync` and the schemas
  they walk. These are pointed at untrusted input by design, so anything reachable here is treated as
  reachable in practice.
- **Configuration** — `setLocale`, `setToDefaultLocale`, `clearLocales` and schema construction. These
  are called by the application with values it chose, normally once at startup. An issue that needs one
  of their arguments to be attacker-controlled is real and will be fixed, but it is scored for the
  narrower exposure.

If you disagree with a severity assessment, send a CVSS vector and the reasoning; it will be considered
before the advisory is published.

## Supported versions

Fixes go into the next release from `main`. There are no maintenance branches, so a fix for an issue
found in an older version ships as a patch on the current minor rather than as a backport.
