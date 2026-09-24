# Freelancer credential impact window

Build slot24September2026 20:22UTC. Base112a6473.

Actual isolated SQLite loader reproduction:200 active collaborations without required credentials consume the whole window, hiding one later requiredVOG placement. getActiveCollaborationRequirements returns no rows and linkExpiryToInzet reports zero impacted placements; removing one irrelevant row from ACTIVE reveals it. The certificate page uses this loader directly.

Claim: filter required-credential placements before the existing200-row bound and order them deterministically, preserving freelancer ownership and current status semantics. Add actualSQLite regression and focused boundaries. No dispute-policy or design changes.

Implementation, validation and independent/native reviews remain pending.
