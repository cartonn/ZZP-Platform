# Exact placement-end credential boundary

Claim for 27 September 08:22 UTC build slot, base5b889d75.
Real helper/task/dashboard/dossier reproduction: a verified required VOG expires
exactly at placement end in60days. Freelancer gets a renewal task while client
assessment and dossier show no concern. One parity regression fails, three controls
pass. Original1404 used strict expiry before placement end;1472 introduced inclusive
max-cutoff behavior.

Scope: restore strict placement-end boundary beyond the existing inclusive30-day
window, with boundary/multiple-placement regressions. No new policy or design.
Separate from pending1521 database selection and merged1522 wording.
Implementation, tests, independent/native review and release remain pending.
