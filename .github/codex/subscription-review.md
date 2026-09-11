# Native subscription review

The owner stopped further paid API reviews on 11 September 2026. Keep
`pr-review.yml` disabled. `subscription-review.yml` uses the connected Codex GitHub
service through the existing subscription; it contains no OpenAI API request,
credential export, new secret, PR checkout, install or PR-code execution.

The [official GitHub integration](https://learn.chatgpt.com/docs/third-party/github)
accepts `@codex review` and posts reviews or a no-findings reaction. The bridge
recognizes only app **1144995**, bot **199175422**,
`chatgpt-codex-connector[bot]`. It publishes the existing required `agent-review`
through GitHub Actions app **15368**. All six required checks remain unchanged.
Native evidence has its own artifact format. No old API JSON report, model name,
reasoning setting, token usage or per-file coverage is invented.

## Fixed trust contract

- Only same-repository, non-draft, open PRs against protected `main` are supported.
  Current main must be an ancestor of the reviewed head. Forks fail closed.
- Controls come from the exact protected main workflow SHA or the independently
  reviewed, externally pinned immutable bootstrap described below. A PR cannot
  supply executable review controls.
- Before preparation, freeze the exact source branch with active `update` and
  `deletion` rules and **no bypass actors**. Keep it frozen through final evidence
  validation and merge. A separate exact-main `non_fast_forward` + `deletion`
  ruleset with no bypass prevents main from moving away and back; normal forward
  merges remain possible. The six classical branch checks are untouched.
- Preparation verifies idle native status and no outstanding manual request or
  native eyes reaction on the PR or any previous review/security-review command,
  snapshots existing PR reaction IDs, then creates a genuine
  head/base/control/run/attempt-bound check and a unique request challenge.
  The observation window starts before these reads; a separate challenge-ready
  timestamp requires the trigger to postdate check creation. Edits and metadata
  changes during preparation cannot fall into an unobserved gap. Existing
  reactions cannot be imported. GitHub's whole-second timestamps are handled
  conservatively: observation starts at the beginning of the first second, edits
  in a completion's second are ambiguous, and positive signals must follow the
  trigger's second.
- The workflow actor must be the linked human account with repository write,
  maintain or admin access. That same account posts the exact displayed request
  **after preparation**. The bridge itself never posts a model request. Additional,
  edited, stale, scoped-down or differently authored requests are rejected.
- A no-findings result requires a fresh completed Manual-request Code Review
  summary, a new unedited authentic app comment saying it found no major issues
  and naming the reviewed commit, plus a fresh native thumbs-up on the PR itself.
  The reaction ID must be absent from the idle snapshot, and both positive signals
  must postdate the unique unchanged trigger. The displayed short hashes are only
  cross-checks: the full binding comes from the pre-established immutable source
  ref, main history rule and unique request.
  Equal short prefixes cannot substitute a different full head. PR retargeting,
  draft/reopen changes and head/base movement invalidate the window, including ABA.
- Every native formal review/finding on the current full head is checked. Existing
  concerns on an unchanged head remain BLOCK, even if dismissed or followed by a
  new thumbs-up. This intentionally treats all native findings conservatively.
- Publication re-reads native evidence, source, base and effective rules, then
  completes and reads back the same check. A failed wait, malformed or changed
  evidence, unsupported status/format, API failure or 35-minute timeout is
  INCOMPLETE. Raw API artifacts are never an alternate approval input.

Native status/trigger semantics are supplied by the Codex GitHub service; its
private task queue and underlying model are not exposed in these GitHub objects.
The bridge trusts the service's authenticated completed/no-findings signals, not
an assertion that it independently proved every line was read. The captured idle
snapshot and unique trigger exclude known outstanding/overlapping requests.
Changed native formats, concurrent Security Review rows and missing reaction
evidence fail closed. Disabling automatic reviews is recommended to avoid overlap,
but the setting is not assumed verified or used as approval evidence. The unique
trigger, fresh positive signals and frozen-source checks remain mandatory.

The no-findings provider shape was observed directly on PR 1476 on 11 September
2026: summary 5635366684, clean comment 5635402167 and PR reaction 500970057.
GitHub serializes the reaction account as `User`, even though app comments use
`Bot`. Only reaction objects allow those two type values, always with the same
fixed account ID and login; comments retain the Bot and app-ID requirements.
The bridge requires this complete positive evidence, never absence of findings
alone. These historical objects are not an approval input for a new review.

## Non-secret owner policy pin

GitHub does not expose ruleset `bypass_actors` to callers without ruleset write
access. Classical branch-protection reads require Administration permission.
Do not export an administrator credential to Actions or treat a missing bypass
list as empty. The owner instead reads the full real rulesets locally and sets
repository variable `CODEX_SUBSCRIPTION_REVIEW_SOURCE_POLICY` to:

```json
{
  "version": 1,
  "repository": "cartonn/ZZP-Platform",
  "pr": 1478,
  "headSha": "<full current PR head>",
  "baseSha": "<full current main>",
  "source": { "branch": "<exact source branch>", "rule": {} },
  "main": { "rule": {} }
}
```

Replace each `rule` with the full response of the authenticated owner request
`GET /repos/cartonn/ZZP-Platform/rulesets/<id>`, including the explicit empty
`bypass_actors` array. Never construct a supposedly empty array when it was absent.
The source rule targets exactly the source ref; the main rule targets exactly
`refs/heads/main`. Use the observed ID, original creation/update timestamps,
conditions and rules. Main history rule **22921021** was created on 11 September
2026; read its current full response rather than copying an old snapshot.

The workflow compares the public rule projection (`id`, `name`, `source`,
`source_type`, `target`, `enforcement`, `conditions`, `rules`, `created_at`,
`updated_at`) to this external policy and checks effective update/deletion/history
rules. A toggle-and-restore changes `updated_at` and invalidates the pin. These
values prove control protection only: they contain no review verdict. Repository
owners able to change the policy and rules remain trusted administrators, as they
already are for protected checks and bootstrap controls.

## First activation and normal operation

1. Finish code/tests and independently review the complete execution basis using
   a separate strong reviewer. Record the full control commit outside the PR.
   Combining the reviewed bridge and product changes in one PR is allowed only
   after this separate control review; it is not approval of the product PR.
2. Freeze the final PR source branch, establish the main history rule, inspect
   both effective/full rulesets and set the source policy above.
3. Before creating the bootstrap branch, create an exact-ref active ruleset for
   `refs/heads/codex/review-subscription-bootstrap-20260911`, with update/deletion
   blocked and no bypass. Pin the independently inspected control commit in
   `CODEX_SUBSCRIPTION_REVIEW_BOOTSTRAP_SHA` and the target PR number in
   `CODEX_SUBSCRIPTION_REVIEW_PR`.
4. Create/push that bootstrap ref at the exact pinned commit. Its narrowly allowed
   push trigger starts the workflow even though the file is not on main yet.
   Arbitrary PR refs, main push events and the paid workflow cannot use this path.
   Re-read the exact branch SHA/effective rules and actual run provenance.
5. Open the preparation job summary. Post its exact request text from the linked
   workflow actor account, preserving the full head/base and challenge. Leave the
   source and rules unchanged. The read-only watcher checks at 55-second intervals.
6. Inspect the full final artifact, genuine check ID/app/external ID, native
   trigger/PR-reaction/clean-comment/summary/formal-review IDs and run result. Verify all six current
   checks and main/base again before merging. Keep the source frozen until merge;
   do not use auto-merge or delete the source branch prematurely.
7. After integration, remove the bootstrap SHA/PR variables; keep the immutable
   control branch as evidence. Normal runs use `workflow_dispatch` from protected
   main, with the current source policy. The paid workflow stays disabled.

On a content BLOCK, retain the evidence, unlock only the feature branch to fix
the findings, commit a new head, establish a new source-policy snapshot and start
a fresh review window. Never edit old verdicts or import an old thumbs-up. This
bridge does not merge, deploy, modify rules, dismiss reviews or change secrets.

Sources: [GitHub ruleset visibility](https://docs.github.com/en/rest/repos/rules#get-a-repository-ruleset),
[effective branch rules](https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch),
[branch protection permissions](https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection).
