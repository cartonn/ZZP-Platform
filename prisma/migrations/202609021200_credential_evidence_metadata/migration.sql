-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "evidenceRemovedAt" TIMESTAMP(3),
ADD COLUMN     "evidenceSeenAt" TIMESTAMP(3),
ADD COLUMN     "evidenceSeenById" TEXT;
