# Placement expiry wording

Claim for the 27 September 00:22 UTC build slot, PR #1522. Base `112a6473`.

The actual SamenwerkingenPage render for CLIENT and FREELANCER showed an empty
in-review message when a verified required VOG expires in 45 days and the placement
ends in 90 days. The assessment already returns `expiringDuringPlacement` correctly.

The missing wording branch now names the credential and says it expires during the
assignment. Existing urgent/imminent warnings keep their priority; the freelancer
retains the document-update link. Credential status, authorization, design, providers
and review policy are unchanged. This is separate from PR #1521 loader-window selection.

Validation:

- Actual page-render regressions: two failed before the fix, with ten controls passing.
- After the fix, all 12 page-render cases pass. Both roles cover imminent expiry,
  no placement end, dispute suppression, submitted credentials and expired-item priority.
- Together with the existing credential assessment suite: 45 tests pass.
- Full-repository formatting, lint and typecheck pass. Full suite: 9,102 tests pass,
  three skipped; 859 suites pass, two skipped.
- The sandbox build failed fetching existing design-lab Google Fonts (DNS).
  The network-enabled build retry completed successfully.

Independent review, remote CI, native review, merge and live verification remain pending.
