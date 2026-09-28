# Prestatieherinneringen voorbij de eerste querybatch

Claim: twee echte SQLite-proeven op main tonen dat 500 oudere, reeds geëscaleerde
SUBMITTED-prestaties een nieuwe dag-3-herinnering blokkeren; 499 rijen werkt wel.
Scope: uitsluitend performance-approval-reminders-task en gerichte tests/documentatie.
Gebruik begrensde deterministische paginering; behoud planner, deduplicatie,
transacties en status/dispuutvoorwaarden. Factuurvariant blijft buiten scope.
Implementatie, volledige controles, onafhankelijke review en release volgen.
