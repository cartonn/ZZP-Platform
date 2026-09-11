# Independent Codex review

The required check remains `agent-review`, emitted by GitHub Actions on the
reviewed PR head through the Checks API. Three jobs separate context/check
creation, read-only model review, and validation/publication. Their job names
are distinct from the required check.

The reviewer uses **GPT-5.5 / high**, separate from the **GPT-6 Astra** orchestrator
and building routines at takeover. Preserve that model separation if builders
change later. GPT-5.5 supports Responses, structured output and high reasoning;
see the [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.5).

The official `openai/codex-action` v1 ref was resolved on 11 September 2026 to
`86365089eb2b84e0a8fb0717b304f8bdcb13b20e`. The workflow pins that commit. Its
`output-schema-file`, `permission-profile` and `safety-strategy` inputs were
checked against the upstream action source at that commit.

That release can stay running after the CLI prints its final report, matching
[upstream issue #150](https://github.com/openai/codex-action/issues/150).
[Proposed fix #151](https://github.com/openai/codex-action/pull/151) is still
unmerged. The workflow therefore checks out the official pinned action separately
and applies `scripts/patch-codex-action.mjs` **before authentication**. It requires
the exact official bundle hash and one exact lifecycle match. The small local
correction forwards private output pipes and finishes after the direct child
exits, with bounded draining; all existing action security controls remain.
No external fork or PR-controlled local action executes. Nonzero exit, absent
report or failed validation still cannot produce a successful review.
Remove the correction only after an official fixed release is independently
verified and the descendant-process regression passes against it.

## Authentication and activation

This public repository requires an `OPENAI_API_KEY` repository secret to run the
[Codex Action](https://learn.chatgpt.com/docs/github-action). That key was absent
at the initial takeover check. On **11 September 2026**, following explicit user
authorization, the `OPENAI_API_KEY` repository secret was confirmed configured.
It has Restricted permissions for only **List models: Read** and **Responses: Write**,
expiring **11 October 2026**. Never print or store the key value or account details
in repository files, prompts or logs.

**First-attempt history: unavailable API credit.** The completed
[test run 34575468042](https://github.com/cartonn/ZZP-Platform/actions/runs/34575468042)
on PR #1475 head `8be0b39ab270d9e826a90bbf2dce14d90d9a6314` confirms the blocker:
preparation, secret-presence validation and checkout succeed, and the official
Codex Action installs and starts. OpenAI returns **“You have no credits remaining.
Add credits to continue using the API”**. The final validator records **INCOMPLETE**
with `REVIEW_AUTHENTICATED=true`; no substantive review was completed. This proves
the historical credit failure and failure handling, not a successful review.

On **11 September**, the owner added API credit and its availability was verified
in the interface. [Follow-up run 34576381918](https://github.com/cartonn/ZZP-Platform/actions/runs/34576381918)
was then started on PR #1475 head `5acadf8790f34570db3575f68eaa067aeaf77f64`.
Its live model output reports **BLOCK**: dispatching from the PR head lets that
head also supply the review controls. The process had not yet exited at the time
of that observation, so this is not proof of a completed publication job. The
trusted-workflow design below addresses that finding; its current outcome must
be verified from GitHub, not inferred from this historical snapshot. Scheduled-run
evidence belongs in the coordinator's durable run register. Do not infer a present
credit failure from the historical test. If a new quota failure occurs, do not
repeat tests until a change is confirmed. Never publish balances, account details
or billing settings. The morning briefing reports key expiry starting seven days beforehand.
Missing authentication, unavailable credit or billing failures produce **INCOMPLETE**;
the required check must remain red until a complete valid review succeeds.

API usage has separate billing from the local ChatGPT subscription. The local
Codex routines can use the existing local login; that does not authenticate this
GitHub-hosted review job.

## First run and manual retries

Normal reviews use `pull_request_target`; the workflow itself, validator, schema
and prompt all come from protected default `main` at the workflow's exact execution SHA.
Manual retries run only from protected `main`:

```sh
gh workflow run pr-review.yml --ref main -f pr=<number>
```

The reviewed head and base are independently resolved through GitHub. The trusted
publisher creates a new `in_progress` check on that head before the model starts,
then updates that same check after validating the current context and full verdict.
The model job has no repository write token. No PR installers, hooks, scripts or
local actions execute in the privileged jobs; the PR checkout is review material.

The first migration cannot use controls from `main` until they are merged. Its
one-time execution basis is a separate `codex/review-bootstrap-20260911-2` branch:

1. Independently inspect the complete workflow, validator, schema and prompt.
   Record their full control commit outside the PR before execution.
2. Create that branch at the inspected commit. Freeze it with an active,
   branch-specific ruleset that forbids updates/deletion and has no bypass actors.
   Verify both the ref and effective protection before dispatch. Set repository
   variable `CODEX_REVIEW_BOOTSTRAP_SHA` to that exact reviewed control commit.
3. Dispatch this workflow on that frozen ref, targeting PR #1475. Verify the run's
   `head_sha` against the recorded control commit. This approves execution of the
   fixed controls; it does not approve the PR or supply a model verdict.
4. Require the complete independent model review and all six real checks on the
   current PR head. Verify the check ID, run/attempt, control SHA and report.
5. Delete `CODEX_REVIEW_BOOTSTRAP_SHA` after the trusted integration is on `main`;
   the bootstrap exception then fails closed. Keep its frozen branch as evidence.

Never dispatch from the PR branch or fall back to PR-controlled review files.
Main's six checks and administrator enforcement remain in force throughout.
Their GitHub Actions app ID identifies the app, not a specific workflow; the
merge coordinator therefore also verifies the trusted run and check provenance.

As verified on 11 September, the normal CI checks are green on both PR #1474 head
`fb4938bf3edbf74cccd6224cb4de22f6bcb5d9b1` and PR #1475 head
`8be0b39ab270d9e826a90bbf2dce14d90d9a6314`: `check`, all four e2e shards and aggregate,
PostgreSQL e2e, `audit`, `secret-scan`, `CodeQL` and `migrations`. Only the required
`agent-review` is absent or failing. Those successful checks do not replace it.
This is a snapshot for those SHAs, not a check result for subsequent commits.

## Evidence and failure semantics

The wrapper obtains the entire changed-file manifest from GitHub, checks pagination
and detects head/base changes during retrieval. The final job independently
retrieves it again and validates the runtime outcome, strict JSON schema, repository,
PR, head SHA, base SHA and exact coverage. No preexisting verdict file is accepted.

- **PASS:** complete review, every changed file assessed, no blockers.
- **BLOCK:** concrete content blocker, including a contradictory PASS that lists one.
- **INCOMPLETE:** missing authentication, API quota/billing failure, runtime failure, malformed or missing output,
  stale head/base, incomplete file coverage, or unfinished review.

Both BLOCK and INCOMPLETE fail the required check. The run summary, PR comment and
30-day artifact preserve the distinction and the structured evidence. A human
review remains necessary before handling real sensitive documents in production.

Run the dependency-free regression suite with
`node --test scripts/agent-review-codex.test.mjs`. The Vitest wrapper also includes
it in the normal required unit-test run.
