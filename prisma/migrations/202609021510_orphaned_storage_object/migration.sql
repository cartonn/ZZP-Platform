-- CreateTable
CREATE TABLE "OrphanedStorageObject" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "firstFailedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reclaimedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "OrphanedStorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrphanedStorageObject_storageKey_key" ON "OrphanedStorageObject"("storageKey");

-- CreateIndex
CREATE INDEX "OrphanedStorageObject_reclaimedAt_idx" ON "OrphanedStorageObject"("reclaimedAt");
