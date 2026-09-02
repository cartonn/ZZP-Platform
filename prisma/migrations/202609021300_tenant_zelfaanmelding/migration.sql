-- Zelfaanmelding van een bemiddelingsbureau: contact-/dossiervelden op de tenant.
-- Puur additief (vier nullable kolommen + één unieke index op een nieuwe kolom); raakt geen
-- bestaande rijen. Tenant.status krijgt geen DDL-wijziging — de nieuwe waarden PENDING en
-- REJECTED zijn strings in een bestaande TEXT-kolom (CLAUDE.md regel 6: geen native db-enums).

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "activationNote" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "kvkNumber" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_kvkNumber_key" ON "Tenant"("kvkNumber");
