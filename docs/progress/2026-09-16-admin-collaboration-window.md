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

## Native review correction — bounded server pagination

Native finding 4026160402 blocked the first implementation on d419a2a5: a narrow
projection alone did not bound global row/child cardinality or rendered HTML.
That head was not merged. The feature branch alone was unlocked for repair.

The database now applies status, concatenated-name substring and DBA predicates,
returns aggregate counts over the full set, and selects one deterministic page
of at most 50 IDs/rows. Performance/submitted-invoice counts are filtered relation
aggregates; paid/processed invoice groups are restricted to the page's IDs.
Previous/next links preserve all filters; submitting filters resets to page one.
Invalid page values normalize to one and overlarge values clamp to the last page.
The existing ADMIN route authorization and V5 primitives remain unchanged.

DBA filtering mirrors the existing static-threshold assessment and local calendar
month arithmetic, including null dates, supervision priority, threshold-day end,
month-end clamping and leap years. One request timestamp drives filtering/display.
Search parameters remain bound SQL values; LIKE wildcard characters are escaped,
and phrases may cross the same title/company/freelancer boundaries as before.
Text case conversion now follows database LOWER/collation, consistent with the
platform's database search approach: PostgreSQL uses its locale; SQLite folds
ASCII only. This is not a claim of byte-for-byte JavaScript Unicode lowercasing
parity across providers. The PostgreSQL regression includes accented text and
literal wildcard characters; it runs only on CI's disposable loopback database.

Five real SQLite/component tests cover the original 501-row regression, bounded
nonoverlapping pages/global counts/filter links, literal/concatenated search,
76 submitted performances plus 240 mixed-lifecycle invoices without child arrays,
and DBA predicate/assessment parity over date/flag/level combinations. The
PostgreSQL-only test is explicitly skipped locally and must pass in the actual
PostgreSQL CI job. Fresh full checks and independent/native reviews are required
on the new head; prior PASS results are historical only.
