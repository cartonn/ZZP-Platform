ALTER TABLE "CredentialVerification" ADD COLUMN "reviewMethod" TEXT;
ALTER TABLE "CredentialVerification" ADD COLUMN "reviewEvidence" TEXT;

CREATE TABLE "ContractSigning" (
  "collaborationId" TEXT NOT NULL,
  "documentJson" TEXT NOT NULL,
  "documentHash" TEXT NOT NULL,
  "documentPdf" BYTEA NOT NULL,
  "pdfHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractSigning_pkey" PRIMARY KEY ("collaborationId")
);
CREATE TABLE "ContractSignature" (
  "id" TEXT NOT NULL,
  "collaborationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "party" TEXT NOT NULL,
  "signerName" TEXT NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "authenticationMethod" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContractSignature_collaborationId_party_key" ON "ContractSignature"("collaborationId", "party");
CREATE INDEX "ContractSignature_actorId_idx" ON "ContractSignature"("actorId");
ALTER TABLE "ContractSigning" ADD CONSTRAINT "ContractSigning_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "ContractSigning"("collaborationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Collaboration" ADD COLUMN "signingEvidenceErasedAt" TIMESTAMP(3);
