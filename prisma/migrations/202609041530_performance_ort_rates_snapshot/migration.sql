-- Bevries de ORT-toeslagen (bps per categorie) op de prestatie zodra hij wordt goedgekeurd, net zoals
-- `rateCents` het uurtarief bevriest en `Invoice.subtotalCents` het factuursubtotaal. Zonder deze
-- snapshot herberekenen de overzichten (factuurpagina, werkproces, urenstaat-PDF) de ORT-uitsplitsing
-- uit de LIVE `Collaboration.ortProfile/ortCustomRates`; wijzigt de opdrachtgever dat profiel ná
-- goedkeuring (toegestaan zolang er geen SUBMITTED-urenstaat wacht), dan dreef de getoonde
-- ORT-subtotaal weg van de bevroren factuur — een zelf-tegensprekende factuur.
-- Puur additief (één nullable kolom); bestaande rijen blijven op de live-fallback tot ze nieuw
-- worden goedgekeurd. Geen expand/contract nodig.

-- AlterTable
ALTER TABLE "Performance" ADD COLUMN "ortRatesSnapshot" TEXT;
