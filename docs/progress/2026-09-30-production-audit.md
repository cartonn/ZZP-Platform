# Production dependency audit repair

Claim before implementation: Security run 36670062094 on PR #1535 fails the
required production audit with two high package entries. The unchanged main lock
contains Nodemailer 9.1.1 and brace-expansion 5.0.9 under glob. The same audit
fails locally; this is dependency evidence, not a demonstrated live exploit.

Scope: narrowly update these dependencies to patched versions, inspect lockfile
changes, and verify existing mail driver compatibility using synthetic offline
inputs. Keep SMTP/Resend activation, credentials, mocks/noops, branch protection
and audit policy unchanged. No real mail or production mutation.

The existing PR #1528 groups AWS SDK, Radix and React updates; this repair excludes
those changes. Nodemailer 10 requires Node >=20; CI and both Docker stages already
use Node 22. Its release notes preserve the Transporter/types layout. Validate
actual imports, message construction and application tests before accepting it.

Sources: https://github.com/nodemailer/nodemailer/releases/tag/v10.0.0 and
https://github.com/advisories/GHSA-v53p-9fqp-m79j; exact npm audit evidence retained
in the coordinator workspace. Files: package.json, package-lock.json, a focused
offline dependency compatibility test if needed, and progress documentation.

Implementation: Nodemailer 10.0.13, production brace-expansion 5.0.12, and the two
existing development brace-expansion copies patched within their current majors.
No unrelated package versions changed. Updated the existing npm optional-peer
comment; legacy-peer-deps behavior is unchanged. Actual ESM/CommonJS imports and
JSON transport message construction pass offline, along with existing mail driver
and self-test suites: 65 tests. Production audit now reports zero vulnerabilities.
Full repository validation, independent review and actual GitHub checks pending.
