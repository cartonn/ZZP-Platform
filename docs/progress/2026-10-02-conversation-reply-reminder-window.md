# Conversation reply-reminder scan — scope claim

Synthetic SQLite reproduces that >500 conversations inside the moving reply-reminder window
(`updatedAt` roughly day 3–9) excluded a later-eligible day-3 nudge: the runner did a single
`findMany` with `take: 500` and no pagination loop, so a conversation sorted beyond the cap was
never processed and — once its `updatedAt` aged past `notBefore` — lost both its day-3 and day-7
reply nudge permanently. Same class as the merged reachable-beyond-the-cap series #1529–#1534.

Scope: stable keyset ID traversal in `src/lib/conversation-reply-reminders-task.ts`, real SQLite
regression coverage and existing mock compatibility. Preserve the coarse `updatedAt` window
selector, last-message anchor, the exact stage-day planner (`conversation-reply-reminders.ts`,
unchanged), recipient = every participant except the last sender, dedupe keys and the atomic
event/notification/audit effects per reminder. No new functionality, schema or UI change.
Independent review and all six protected checks remain required.

Status: claimed before implementation. Keyset pages (`id` asc, `CONVERSATION_BATCH_SIZE` 1000)
now traverse the whole window. Three real SQLite cases cover 999/1000/2001 quiet conversations
with a due target sorted past the cap (delivered exactly once, idempotent on repeat); the five
existing mock-based unit tests stay green. Independent review, GitHub checks and release remain
pending.

Limitations: synthetic SQLite establishes the missing-window regression, not production
prevalence or PostgreSQL concurrency. The query still loads each selected conversation's last
message and participants; this change bounds conversation pages, not per-conversation history.
Effects stay atomic per reminder and dedupe behavior is unchanged.
