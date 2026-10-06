CREATE TABLE "EvidenceCleanupCursor" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastCredentialId" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EvidenceCleanupCursor_pkey" PRIMARY KEY ("id")
);
