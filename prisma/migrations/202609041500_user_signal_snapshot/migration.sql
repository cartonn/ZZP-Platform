-- Signaal-snapshot per gebruiker: een cache van de UITKOMST van navBadges + pendingTaskCount + de
-- ongelezen-meldingenteller, zodat de app-shell niet op élke beschermde pagina 18–46 queries doet.
-- Puur additief: twee nieuwe tabellen + één index op DomainEvent. Geen bestaande data wordt geraakt,
-- dus geen expand/contract nodig — de oude en de nieuwe code kunnen tijdens een rolling deploy naast
-- elkaar draaien (de oude code kent de tabellen simpelweg niet).

-- CreateTable
CREATE TABLE "UserSignalSnapshot" (
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "pendingTaskCount" INTEGER NOT NULL DEFAULT 0,
    "unreadNotifications" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staleAfter" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSignalSnapshot_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserSignalBadge" (
    "userId" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "tone" TEXT NOT NULL,

    CONSTRAINT "UserSignalBadge_pkey" PRIMARY KEY ("userId","href")
);

-- CreateIndex
CREATE INDEX "UserSignalSnapshot_staleAfter_idx" ON "UserSignalSnapshot"("staleAfter");

-- CreateIndex
CREATE INDEX "DomainEvent_occurredAt_idx" ON "DomainEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "UserSignalSnapshot" ADD CONSTRAINT "UserSignalSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSignalBadge" ADD CONSTRAINT "UserSignalBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSignalSnapshot"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
