# Independent Codex review

The required check remains `agent-review`, emitted by GitHub Actions. Its Codex
job has read-only repository access; a separate job validates and publishes the
result. The preparatory `codex-review` job is not a new required branch check.

The reviewer uses **GPT-5.5 / high**, separate from the **GPT-6 Astra** orchestrator
and building routines at takeover. Preserve that model separation if builders
change later. GPT-5.5 supports Responses, structured output and high reasoning;
see the [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.5).

The official `openai/codex-action` v1 ref was resolved on 11 September 2026 to
`86365089eb2b84e0a8fb0717b304f8bdcb13b20e`. The workflow pins that commit. Its
`output-schema-file`, `permission-profile` and `safety-strategy` inputs were
checked against the upstream action source at that commit.

## Authentication and activation

This public repository requires an `OPENAI_API_KEY` repository secret to run the
[Codex Action](https://learn.chatgpt.com/docs/github-action). That key was absent
at takeover. The migration does not provision credentials, export a subscription
login, install a self-hosted runner, or claim a completed review. Missing
authentication produces **INCOMPLETE** and the required check stays red.

API usage has separate billing from the local ChatGPT subscription. The local
Codex routines can use the existing local login; that does not authenticate this
GitHub-hosted review job.

## First run and manual retries

Normal pull-request events load the validator, schema and prompt from the trusted
base SHA. The first migration PR therefore cannot use those files from main yet.
After independently reviewing the migration and configuring the missing API
authentication, dispatch the already-existing workflow on the migration PR's
current head branch:

```sh
gh workflow run pr-review.yml --ref <pr-head-branch> -f pr=<number>
```

The same command applies to later manual retries. The dispatcher checks that its
own commit equals the PR head. Dispatching on `main` for a different PR is rejected
because GitHub would attach the check to the wrong SHA. Review the selected
workflow changes before dispatching a branch that modifies the review controls.
Verify the actual `agent-review` result on the PR; do not infer success from a
workflow start or weaken branch protection for bootstrap.

## Evidence and failure semantics

The wrapper obtains the entire changed-file manifest from GitHub, checks pagination
and detects head/base changes during retrieval. The final job independently
retrieves it again and validates the runtime outcome, strict JSON schema, repository,
PR, head SHA, base SHA and exact coverage. No preexisting verdict file is accepted.

- **PASS:** complete review, every changed file assessed, no blockers.
- **BLOCK:** concrete content blocker, including a contradictory PASS that lists one.
- **INCOMPLETE:** missing authentication, runtime failure, malformed or missing output,
  stale head/base, incomplete file coverage, or unfinished review.

Both BLOCK and INCOMPLETE fail the required check. The run summary, PR comment and
30-day artifact preserve the distinction and the structured evidence. A human
review remains necessary before handling real sensitive documents in production.

Run the dependency-free regression suite with
`node --test scripts/agent-review-codex.test.mjs`. The Vitest wrapper also includes
it in the normal required unit-test run.
