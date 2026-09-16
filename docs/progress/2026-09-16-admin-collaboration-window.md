# Admin collaboration overview window

Scheduled build 16 September 2026, 12:22 UTC. Base 3b7d8a6c.

Source: the same-day synthetic persona audit reproduced an old ACTIVE collaboration
with an escalated SUBMITTED performance plus 500 newer COMPLETED collaborations.
The action/badge finds the old work, but the admin overview applies take: 500 before
status counts and search, so the ACTIVE count and search results omit it. Direct
action links still work; this is an overview/search consistency defect.

Claim before implementation. Scope: src/components/admin/samenwerkingen-panel.tsx,
a focused regression test, and progress documentation. Preserve route authorization,
DBA assessment, filters, visual design and status semantics. Select only needed fields
from the complete overview before counting/filtering. No product feature or mutation.

Validation and independent/native review are pending. No completion claimed.

## Implementation — PR #1503

Removed the recent-500 cap before counts/filtering and replaced the full scalar
include with the exact overview field projection. The ADMIN route boundary, row
order, filter/DBA/status logic, links and styling are unchanged. Counts and search
now include older actionable rows. This loads all overview rows, like the corrected
tenant overview in #1498; future pagination must keep whole-set counts and filters.
No document, contract text or signing evidence is selected.

The actual async component regression creates 501 collaborations in temporary
SQLite, verifies the escalation task/badge, then renders the ACTIVE/search result.
Base fails with total 500, ACTIVE 0 and empty search; fixed query passes with total
501, ACTIVE 1 and the expected collaboration link/pending performance. The focused
component/filter/escalation selection passes 26 tests. Full checks and independent
review remain pending.
