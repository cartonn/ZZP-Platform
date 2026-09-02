-- Consolidatie van de tien identieke `*DeliveryHeartbeat`-tabellen naar één `DeliveryHeartbeat`
-- met een `channel`-kolom. De velden waren woord voor woord hetzelfde; alleen `driver` ontbrak op
-- het web-push-kanaal (die kolom is nu nullable).
--
-- VOLGORDE IS DE MIGRATIE: eerst de nieuwe tabel aanmaken, dan élke oude tabel overzetten met
-- INSERT ... SELECT (kanaal-id's zijn per tabel al uniek en blijven ongewijzigd), pas daarna de oude
-- tabellen droppen. Zo gaat er geen heartbeat-geschiedenis verloren — de teller
-- (`consecutiveFailures`) en de tijdstippen bepalen of /admin/systeemstatus een AANHOUDENDE storing
-- toont, dus een lege tabel zou een lopende storing stil op "nog niets geregistreerd" zetten.
--
-- `ON CONFLICT DO NOTHING` is een vangnet, geen verwachting: de kanaal-id's uit de tien tabellen zijn
-- onderling verschillend ("outbound", "web-push", "object-storage", "payment-provider",
-- "verification-*", "rate-limit-store", "password-breach", "error-monitoring", "upload-scan",
-- "routing"). Mocht een omgeving via de optionele channel-override toch een botsing hebben, dan mag
-- deze observability-migratie daar niet op afbreken.

-- CreateTable
CREATE TABLE "DeliveryHeartbeat" (
    "channel" TEXT NOT NULL,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "lastOk" BOOLEAN NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "driver" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryHeartbeat_pkey" PRIMARY KEY ("channel")
);

-- MigrateData: e-mailkanaal
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "MailDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: web-push (geen driver-begrip)
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", NULL, "updatedAt"
FROM "PushDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: object-opslag
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "StorageDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: betaalprovider
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "BillingDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: verificatieregisters (DUO / BIG / iDIN — meerdere rijen)
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "VerificationDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: gedeelde rate-limit-store
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "RateLimitDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: gelekt-wachtwoord-controle
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "PasswordBreachDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: externe error-monitoring
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "ErrorMonitoringDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: malware-scan van uploads
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "UploadScanDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- MigrateData: externe routing-provider
INSERT INTO "DeliveryHeartbeat" ("channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt")
SELECT "channel", "lastAttemptAt", "lastOk", "lastSuccessAt", "lastFailureAt", "consecutiveFailures", "driver", "updatedAt"
FROM "RoutingDeliveryHeartbeat"
ON CONFLICT ("channel") DO NOTHING;

-- DropTable
DROP TABLE "MailDeliveryHeartbeat";

-- DropTable
DROP TABLE "PushDeliveryHeartbeat";

-- DropTable
DROP TABLE "StorageDeliveryHeartbeat";

-- DropTable
DROP TABLE "BillingDeliveryHeartbeat";

-- DropTable
DROP TABLE "VerificationDeliveryHeartbeat";

-- DropTable
DROP TABLE "RateLimitDeliveryHeartbeat";

-- DropTable
DROP TABLE "PasswordBreachDeliveryHeartbeat";

-- DropTable
DROP TABLE "ErrorMonitoringDeliveryHeartbeat";

-- DropTable
DROP TABLE "UploadScanDeliveryHeartbeat";

-- DropTable
DROP TABLE "RoutingDeliveryHeartbeat";
