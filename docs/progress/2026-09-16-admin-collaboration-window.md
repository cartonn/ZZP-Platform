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
