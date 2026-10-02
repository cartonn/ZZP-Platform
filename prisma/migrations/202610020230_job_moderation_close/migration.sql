-- Moderatie-sluiting: markering op Job zodat een door een beheerder gesloten opdracht niet door de
-- eigenaar heropend of bewerkt kan worden (OWASP A01 — moderatie-bypass). null = geen moderatie-sluiting.
ALTER TABLE "Job" ADD COLUMN "moderationClosedAt" TIMESTAMP(3);
