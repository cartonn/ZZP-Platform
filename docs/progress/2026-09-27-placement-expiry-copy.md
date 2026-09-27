# Placement expiry wording

Claim for the 27 September 00:22 UTC build slot. Base112a6473.
Actual SamenwerkingenPage render reproduction for CLIENT and FREELANCER: verified
required VOG expires in45 days, placement ends in90 days. The assessment correctly
returns expiringDuringPlacement, but alertPhrase shows an empty in-review message.
Two render regressions fail; six controls for imminent expiry, open end and dispute pass.

Scope: the missing wording branch and role-render regression coverage only.
No credential status, authorization, design, provider or review-policy change.
Separate from PR1521 loader-window selection; no overlapping product files.
Implementation, validation, independent/native review and release remain pending.
