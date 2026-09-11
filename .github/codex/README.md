# Independent Codex review

The required check remains `agent-review`, published by GitHub Actions on the
reviewed PR head through the Checks API. Three jobs separate trusted context/check
creation, read-only model review, and validation/publication. Their automatic job
names are distinct from the required check.

The reviewer uses **GPT-5.5 / high**, separate from the **GPT-6 Astra** orchestrator
and building routines at takeover. Preserve that model separation if builders
change. GPT-5.5 supports the Responses API, high reasoning, function calling and
strict structured output; see the [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.5).

## Direct API execution

The model job calls the official Responses API through trusted
`scripts/run-agent-review.mjs`. It receives the complete bounded diff and stat,
then can request additional source through `scripts/review-source-reader.mjs`.
The source reader resolves the exact head/base trees to Git object IDs. It never
opens a model-supplied host path or executes repository code. The model has no
shell, web, MCP, host-file or repository-write tools. No PR installers or local
actions run. Pull-request refs also cover forks; a changed head is rejected before
an API call. The current main commit must be an ancestor of the PR head;
merge current `main` into an outdated PR branch before requesting review. This
keeps the delivered base-to-head diff identical to GitHub's PR diff.

Small WOFF2 font assets (up to 256 KiB) may be delivered losslessly as base64 with
Git/SHA256 hashes and bounded header metadata. Header validation is not font-table,
glyph, provenance or safety validation; the independent model must assess the
available content evidence and may return INCOMPLETE. Other unsupported binary
assets and Git submodule entries never satisfy complete source delivery.

The client uses `store:false` and only POST `/v1/responses`. It preserves returned
reasoning items, encrypted reasoning content, assistant phases and function-call
IDs across rounds as required by the [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning)
and [function-calling protocol](https://developers.openai.com/api/docs/guides/function-calling).
It does not blindly retry an uncertain paid POST. Missing, incomplete, refused,
oversized or timed-out output cannot produce a successful model job. Commentary
and open function calls are not a final verdict. API metadata and source-delivery
evidence are retained without credentials or raw reasoning.

Assistant `phase` is supported but optional in the
[official Responses output type](https://github.com/openai/openai-python/blob/main/src/openai/types/responses/response_output_message.py).
The client preserves supplied values exactly and never treats explicit commentary
as final. A completed response without a phase can supply a verdict only when
there are no open calls and exactly one unambiguous, schema-valid final message.
Missing phase does not relax authentication, source delivery or report validation.

The separate publisher independently validates the completed runtime outcome,
strict report schema, exact PR/head/base, current file manifest, full model
coverage and genuine check identity. An existing result file never supplies a
successful verdict by itself.

Final head/base/report validation precedes public verdict text. The publisher
completes and reads back the exact check result before posting the same verdict
as a PR comment. A comment transport failure records a safe warning and cannot
leave the confirmed check pending; check publication or read-back failures still
fail the publisher job. Before merging, verify that job and its complete evidence
as well as the six required checks.

## Authentication and integration history

`OPENAI_API_KEY` was configured on **11 September 2026** after explicit owner
authorization. It has Restricted permissions for **List models: Read** and
**Responses: Write**, expiring **11 October 2026**. The direct client needs no
additional key rights. Never print or store its value, account details or billing
settings in repository files, prompts or logs. API usage is billed separately
from the local ChatGPT subscription; the local login is not exported to GitHub.
The morning briefing reports expiry starting seven days beforehand.

The historical [run 34575468042](https://github.com/cartonn/ZZP-Platform/actions/runs/34575468042)
reached OpenAI but had no available credit and correctly produced INCOMPLETE.
The owner subsequently added credit. [Run 34576381918](https://github.com/cartonn/ZZP-Platform/actions/runs/34576381918)
produced a visible BLOCK because manual execution loaded review controls from the
PR head, then the official action remained running. The trusted three-job design
addresses that control-origin finding.

[Run 34581684896](https://github.com/cartonn/ZZP-Platform/actions/runs/34581684896)
used independently inspected, frozen controls at `bf91dbbb47383a8be3d9d94a595016e0f34742e7`.
Its UI showed PASS text for 20 files, but the official action again remained
running after final output. Cancellation produced a real **INCOMPLETE** failure
check and a null archived report; that visible text is not a completed approval.
A hash-bound lifecycle patch did not resolve the observed hang. The official
release used was `86365089eb2b84e0a8fb0717b304f8bdcb13b20e`.
The direct API client replaces that action and its temporary patch. Historic
commits and frozen branches remain available as evidence.

The first direct API [run 34587741147](https://github.com/cartonn/ZZP-Platform/actions/runs/34587741147)
completed seven requests successfully and retained the full 23-file BLOCK report.
It identified optional-phase compatibility and comment-publication ordering. The
claim that phase is non-standard conflicts with the official type and model guide;
its observation that valid output may omit phase is addressed by the strict
fallback above. A corrected PR head still needs a fresh genuine model review.

Current integration results must be verified from GitHub and the coordinator's
durable run register. These historical runs do not approve subsequent commits or
prove scheduled routine execution. Do not infer a current quota problem from the
old credit failure. If a new quota failure occurs, wait for a confirmed change
before repeating the same paid request.

## Trusted activation and manual retries

Normal reviews use `pull_request_target`; workflow, client, reader, validator,
schema and prompt come from protected default `main` at the exact workflow SHA.
Manual retries run only from protected `main`:

```sh
gh workflow run pr-review.yml --ref main -f pr=<number>
```

The first migration needs a separately inspected execution basis because the new
controls are not yet on `main`. Its current bootstrap branch is
`codex/review-bootstrap-20260911-3`:

1. Independently inspect every control file and record the full commit outside
   the PR. This approves execution of fixed controls, not the PR itself.
2. Create that branch at the inspected commit. Freeze it with an active,
   branch-specific ruleset forbidding updates/deletion and no bypass actors.
   Verify the exact ref and effective rules. Set repository variable
   `CODEX_REVIEW_BOOTSTRAP_SHA` to that same control commit.
3. Dispatch the workflow from that frozen ref for PR #1475. Verify run `head_sha`,
   actual model completion, full report and check-ID/run/attempt/control identity.
   The frozen controls may review a newer PR head without being changed: the
   control SHA stays pinned while preparation separately binds the current source
   head. A prior BLOCK is never changed or reused as approval.
4. Require all six real checks on the current PR head and verify current base
   again before merge. GitHub's Actions app ID identifies the app, not a workflow;
   the merge coordinator also checks the trusted run and report provenance.
5. Delete `CODEX_REVIEW_BOOTSTRAP_SHA` after integration on `main`. Keep the frozen
   branches as evidence; removing the variable disables their bootstrap access.

Never dispatch a real review from a PR branch or adopt PR-supplied controls.
Main's six checks and administrator enforcement remain in force throughout.
The separate offline diagnostic branch publishes no required review check and
uses no real API credential; its help-only results are not model-review evidence.

## Evidence and failure semantics

- **PASS:** a complete review, all changed files assessed, no blockers.
- **BLOCK:** concrete content blockers, including a contradictory PASS listing one.
- **INCOMPLETE:** missing authentication, unavailable API credit, transport/runtime
  failure, refusal, incomplete or malformed output, stale context, missing source,
  exceeded limits or incomplete file coverage.

Both BLOCK and INCOMPLETE fail the required check. The PR comment, run summary and
30-day artifacts preserve the validated outcome. Failed or cancelled jobs may
have missing job outputs; consult their actual step/run evidence before inferring
an invalid credential. A human review remains necessary before handling real
sensitive documents in production.

Run the dependency-free review tests with `node --test scripts/*review*.test.mjs`.
Vitest wrappers include the tests in the normal required unit-test run.
