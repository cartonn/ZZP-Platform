// Operationeel-monitoring-endpoint (/api/metrics): PURE shaping + rendering van machine-leesbare
// operationele metrics voor een externe monitor (Prometheus-scraper of uptime-dienst). Dit vult het
// gat tussen /api/health (alleen liveness) en /admin/systeemstatus (admin-UI, vereist een mens die
// inlogt): de dead-man's-switch-signalen (cron-/back-up-heartbeat), DB-bereikbaarheid en de
// verificatie-wachtrij worden nu ook zonder login uitleesbaar, zodat een monitor erop kan alarmeren.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen een plat input-object → Metric[] → tekst. De
// DB-/heartbeat-collectie zit in de route (src/app/api/metrics/route.ts). Zo blijft deze module
// volledig puur en unit-testbaar.
//
// PRIVACY: er komen NOOIT persoonsgegevens in de uitvoer — alleen geaggregeerde tellingen, leeftijden
// en booleaanse gezondheidsvlaggen. Het endpoint is beveiligd met dezelfde Bearer CRON_SECRET als de
// taak-/heartbeat-routes (fail-closed).

/** Prometheus-metrictype. We gebruiken uitsluitend gauges (momentopnames). */
export type MetricType = "gauge";

/** Eén metric-regel: naam, mensvriendelijke uitleg, type en (numerieke) waarde. */
export interface Metric {
  name: string;
  help: string;
  type: MetricType;
  value: number;
  /**
   * Optionele Prometheus-labels ({ task: "payment-reminders" } → `{task="payment-reminders"}`). Alleen
   * gebruikt voor gelabelde families (meerdere reeksen onder één metric-naam); ontbreekt bij gewone
   * gauges. De labelwaarden worden bij het renderen ge-escaped en bevatten uitsluitend statische
   * code-identifiers — nooit persoonsgegevens.
   */
  labels?: Record<string, string>;
}

/** Sentinel voor "nog nooit gemeten" (heartbeat heeft nog niet gedraaid). */
export const AGE_NEVER = -1;

/**
 * Platte, DB-vrije invoer voor de metric-shaping. De route vult dit uit de heartbeat-lezers en een
 * DB-ping; deze module vertaalt het deterministisch naar Metric[].
 */
export interface MetricsInput {
  /** Is de database bereikbaar (SELECT 1 geslaagd)? */
  dbReachable: boolean;
  /**
   * Rondde de DB-collectie álle backlog-tellingen af binnen de scrape-deadline
   * (METRICS_COLLECT_TIMEOUT_MS)? true = compleet; false = de scrape werd afgekapt (een trage/gelockte
   * DB overschreed de deadline), waardoor sommige backlog-gauges hun default (0) houden zónder dat hun
   * query afrondde. KRITIEK voor de interpretatie: bij false mag een monitor de backlog-nullen NIET als
   * gezond lezen (vals-negatief) — daarom een eigen alarmeerbaar signaal i.p.v. stil degraderen. De
   * cron-/backup-heartbeats en dbReachable staan hier los van; deze vlag zegt alleen iets over de
   * volledigheid van de per-scrape DB-tellingen.
   */
  metricsCollectionComplete: boolean;
  /** Leeftijd van de laatste geplande-taken-cron-run in seconden, of null als 'ie nog nooit draaide. */
  cronAgeSeconds: number | null;
  /** Draaide de laatste cron-run zonder taakfouten? null als er nog nooit een run was. */
  cronOk: boolean | null;
  /** Staat de cron-heartbeat op "stale" (buiten het venster)? */
  cronStale: boolean;
  /**
   * Namen van de sub-taken (runners) die tijdens de laatste `run-all` faalden — leeg wanneer de run
   * slaagde of nog nooit draaide. Statische code-identifiers (bv. "payment-reminders"), géén
   * persoonsgegevens. Het aggregaat `cronOk` (→ `zzp_cron_heartbeat_ok`) zegt alléén *dát* er een
   * taakfout was; deze lijst zegt *welke* runner faalde, zodat een via Prometheus gepagete operator de
   * vastgelopen runner ziet zonder op /admin/systeemstatus in te loggen. Wordt gerenderd als de
   * gelabelde gauge-familie `zzp_cron_task_failed{task="..."}` (1 per gefaalde runner).
   */
  cronFailedTasks: readonly string[];
  /** Leeftijd van de laatste database-back-up-heartbeat in seconden, of null. */
  backupAgeSeconds: number | null;
  /** Slaagde de laatste back-up? null als er nog nooit een melding was. */
  backupOk: boolean | null;
  /** Staat de back-up-heartbeat op "stale" (buiten het venster)? */
  backupStale: boolean;
  /** Aantal openstaande (SUBMITTED) verificatie-inzendingen — wachtrijdiepte voor de admin-queue. */
  verificationQueue: number;
  /**
   * Leeftijd in seconden van de langst wachtende (SUBMITTED) verificatie-inzending, gemeten vanaf het
   * moment dat 'ie de wachtrij in ging (`waitingSince` = `submittedAt` ?? `updatedAt`), of null als de
   * wachtrij leeg is. Vult de blinde vlek van de kale `verificationQueue`-telling: een kleine wachtrij
   * kan tóch een SLA-breach verbergen als de oudste inzending al dagen wacht (afgehandelde inzendingen
   * werden verwerkt, één blijft hangen). Verificatie is de kern-differentiatie; een monitor kan hierop
   * alarmeren ("oudste wachtende verificatie > X uur").
   */
  verificationQueueOldestAgeSeconds: number | null;
  /** Staat de app in onderhoudsmodus (MAINTENANCE_MODE)? Zodat een monitor niet paget om de 503's. */
  maintenanceMode: boolean;
  /**
   * Aantal VERIFIED-credentials wier vervaldatum in het verleden ligt maar die nog niet naar EXPIRED
   * zijn omgezet — werk dat de expiry-cron had moeten doen. Een stille-faal-detector: de
   * cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie zijn werk deed. Blijft dit getal
   * hoog/oplopend terwijl de heartbeat "vers" is, dan verwerkt de expiry-pijplijn niets meer.
   */
  overdueExpiryCredentials: number;
  /**
   * Aantal betaalde (priceCents > 0) ACTIVE-abonnementen wier `currentPeriodEnd` in het verleden ligt
   * maar die de `subscription-expiry`-cron nog niet op CANCELLED (→ Gratis) zette — werk dat die cron
   * had moeten doen. Dezelfde stille-faal-detector-klasse als `overdueExpiryCredentials`: de
   * cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de verval-pijplijn verwerkte. De
   * server-side entitlement-guard behandelt zo'n verlopen periode al als Gratis (geen toegangslek),
   * maar een oplopende DB-backlog betekent dat de verval-/renewal-cyclus (notificaties, ledger) stilligt.
   */
  overdueExpirySubscriptions: number;
  /**
   * Aantal abonnementen dat langer dan het geconfigureerde venster (`SUBSCRIPTION_PENDING_STALE_HOURS`)
   * in status `PENDING` hangt — een betaalde checkout die nooit door de webhook is bevestigd. Anders dan
   * `overdueExpirySubscriptions` bewaakt dit GEEN cron maar de betaal-**webhook**: een PENDING-rij
   * wordt alleen door de webhook naar ACTIVE (paid) of PAST_DUE (failed) getild; er is geen cron die
   * PENDING verwerkt. Dezelfde stille-faal-detector-klasse: een verlaten checkout is één stille rij,
   * maar een stil kapotte webhook (verkeerde callback-URL, handtekening-mismatch, geblokkeerde poort)
   * laat ÉLKE checkout op PENDING staan — niemand wordt geactiveerd, de platform-omzet lekt stil weg,
   * zonder dat iets dat toont. De mock-provider (pilot-default) maakt nooit een PENDING-rij aan, dus is
   * deze gauge dan per definitie `0`; 'ie wordt pas relevant met een echte betaalprovider.
   */
  stalePendingSubscriptions: number;
  /**
   * Aantal PAST_DUE-abonnementen wier effectieve PAST_DUE-leeftijd (`pastDueAt ?? updatedAt`) de
   * downgrade-drempel (`PAST_DUE_DOWNGRADE_AFTER_DAYS`, 7 dagen) heeft overschreden maar die de
   * `subscription-past-due`-cron nog niet naar `CANCELLED` (→ Gratis) zette. Sluit het laatste gat in de
   * abonnement-stille-faal-familie: `overdueExpirySubscriptions` dekt ACTIVE-verval, `stalePendingSubscriptions`
   * dekt PENDING, deze dekt PAST_DUE. Een mislukte betaling zet de rij op PAST_DUE (webhook); de cron
   * herinnert (dag 1/3/7) en downgradet daarna. De entitlement-guard behandelt PAST_DUE al als Gratis
   * (geen toegangslek), maar een oplopende backlog terwijl de cron-heartbeat "vers" is betekent dat de
   * hele past-due-pijplijn stilligt: mislukte betalingen blijven eeuwig in PAST_DUE hangen en de
   * herstel-herinneringen gaan niet uit (verloren omzet-herstel + rommelige abonnementstaat). De
   * mock-provider (pilot-default) maakt nooit een PAST_DUE-rij aan → per definitie `0`.
   */
  overduePastDueDowngrades: number;
  /**
   * Aantal cascade-facturen met `lifecycleStatus === "APPROVED"` wier `dueAt` in het verleden ligt maar
   * die de payment-reminders-cron nog niet op `OVERDUE` zette — werk dat die cron had moeten doen
   * (`planPaymentReminders.toMarkOverdue` → `APPROVED → OVERDUE`). Dezelfde stille-faal-detector-klasse
   * als `overdueExpiryCredentials`/`overdueExpirySubscriptions`: de cron-heartbeat bewijst alleen dát de
   * run afrondde, niet dát 'ie de betaal-verval-pijplijn verwerkte. Een oplopende backlog terwijl de
   * heartbeat "vers" is betekent dat facturen niet meer op OVERDUE komen → geen aanmaningsladder, geen
   * te-laat-signaal richting de opdrachtgever, en de ZZP'er wordt trager betaald.
   */
  overdueUnflippedInvoices: number;
  /**
   * Aantal beoordelingen (`Review`) wier double-blind reveal-venster verstreken is (`PENDING_REVEAL`
   * met `revealDeadline` in het verleden) maar die de `reviews-reveal`-cron nog niet publiceerde — werk
   * dat die cron had moeten doen (`PENDING_REVEAL → PUBLISHED`). Dezelfde stille-faal-detector-klasse als
   * `overdueExpiryCredentials`/`overdueExpirySubscriptions`/`overdueUnflippedInvoices`: de cron-heartbeat
   * bewijst alleen dát de run afrondde, niet dát 'ie de reveal-pijplijn verwerkte. Blijft dit getal
   * oplopen terwijl de heartbeat "vers" is, dan blijven afgeronde beoordelingen ná hun venstersluiting
   * verborgen — een SLA-breach op de vertrouwens-differentiatie (het beoordelingssysteem): de beoordeelde
   * ziet zijn ontvangen beoordeling niet, de auteur weet niet dat de zijne zichtbaar had moeten worden.
   * Een klein, tijdelijk aantal (tot één cron-interval tussen venstersluiting en de 05:00-run) is normaal.
   */
  overdueReviewReveals: number;
  /**
   * Aantal ingediende prestaties (`SUBMITTED`) wier grace-venster (`PERFORMANCE_GRACE_DAYS`) verstreken
   * is — op een niet-geannuleerde en niet-betwiste samenwerking — die de `performance-grace`-cron nog
   * niet automatisch goedkeurde (SUBMITTED → APPROVED). Dezelfde stille-faal-detector-klasse als
   * `overdueExpiryCredentials`/`overdueExpirySubscriptions`/`overdueUnflippedInvoices`/`overdueReviewReveals`:
   * de cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de grace-pijplijn verwerkte. Auto-
   * goedkeuring is de trigger die de factuur-cascade start; blijft dit getal oplopen terwijl de heartbeat
   * "vers" is, dan blijven prestaties na hun grace-deadline in SUBMITTED hangen → er wordt geen factuur
   * aangemaakt en de ZZP'er wordt niet uitbetaald, zonder dat iets dat toont. Staat het grace-venster UIT
   * (`PERFORMANCE_GRACE_DAYS` leeg/0 = geen auto-goedkeuring, de pilot-default), dan is er per definitie
   * geen achterstand en is deze gauge `0`.
   */
  overduePerformanceGrace: number;
  /**
   * Aantal open disputen (Collaboration.disputedAt gezet, status != CANCELLED) wier leeftijd de
   * dispute-escalatie-drempel (`DISPUTE_ESCALATE_AFTER_DAYS`, 7 dagen) overschreed maar die de
   * `dispute-reminders`-cron nog niet naar admins escaleerde — werk dat die cron had moeten doen
   * (`planDisputeReminders` vuurt bij `d > DISPUTE_ESCALATE_AFTER_DAYS` een `DISPUTE_ESCALATION`-event
   * naar de admins). Dezelfde stille-faal-detector-klasse als de andere overdue-backlogs: de
   * cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de dispute-escalatie-pijplijn
   * verwerkte. Een klein, tijdelijk aantal (tot één cron-interval nadat een dispuut d=8 passeert) is
   * normaal; blijft dit getal oplopen terwijl de heartbeat "vers" is, dan blijven open disputen boven
   * de drempel eeuwig zonder escalatie naar admins → de facturatie-cascade blijft bevroren (geen
   * factuur, geen betaling, geen afronding), admins worden nooit gepaget om te bemiddelen, en de
   * ZZP'er wacht op geld terwijl de opdrachtgever niet weet dat 'ie bevroren is. Anders dan de
   * abonnement-familie is er hier GEEN entitlement-guard-vangnet — een stille cron is een echt gat.
   */
  overdueDisputeEscalations: number;
  /**
   * Aantal auditregels ouder dan het geconfigureerde `AUDIT_LOG_RETENTION_DAYS`-venster die de
   * `audit-retention`-cron nog niet snoeide — werk dat die cron had moeten doen. Dezelfde
   * stille-faal-detector-klasse als `overdueExpiryCredentials`/`overdueExpirySubscriptions`/
   * `overdueUnflippedInvoices`, maar op de meest privacygevoelige retentie-garantie: auditregels dragen
   * IP-adres + user-agent en zijn gedocumenteerd op 12 maanden (AVG art. 5 lid 1e dataminimalisatie).
   * De cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn verwerkte;
   * blijft dit getal oplopen terwijl de heartbeat "vers" is, dan bewaart de app persoonsgegevens over
   * de wettelijke termijn heen zonder dat iets dat toont. Staat retentie UIT (venster leeg/0 = onbeperkt
   * bewaren, de pilot-default), dan is er per definitie geen achterstand en is deze gauge `0`.
   */
  auditRetentionBacklog: number;
  /**
   * Aantal terminale reacties (Application, status REJECTED/WITHDRAWN, zónder samenwerking) ouder dan het
   * geconfigureerde `APPLICATION_RETENTION_DAYS`-venster die de `application-retention`-cron nog niet
   * snoeide — werk dat die cron had moeten doen. Dezelfde stille-faal-detector-klasse als
   * `auditRetentionBacklog`, en net zo privacygevoelig: een Application-rij draagt vrije-tekst-PII in
   * `motivation`/`note`, en het verwerkingsregister belooft die "tot 4 weken na afronding van de
   * selectieprocedure" (AVG art. 5 lid 1e opslagbeperking). De cron-heartbeat bewijst alleen dát de run
   * afrondde, niet dát 'ie de snoei-pijplijn verwerkte; blijft dit getal oplopen terwijl de heartbeat
   * "vers" is, dan bewaart de app reactie-PII over de beloofde termijn heen zonder dat iets dat toont.
   * Staat retentie UIT (venster leeg/0 = onbeperkt bewaren, de pilot-default), dan is er per definitie
   * geen achterstand en is deze gauge `0`.
   */
  applicationsRetentionBacklog: number;
  /**
   * Aantal notificaties (Notification) ouder dan het geconfigureerde `NOTIFICATION_RETENTION_DAYS`-venster
   * die de `notification-retention`-cron nog niet snoeide — werk dat die cron had moeten doen. Dezelfde
   * stille-faal-detector-klasse als `auditRetentionBacklog`/`applicationsRetentionBacklog`, en net zo
   * privacygevoelig: een Notification-rij draagt PII in title/body (namen, bedragen, statusupdates), en het
   * verwerkingsregister belooft "Notificatiehistorie max. 6 maanden" (AVG art. 5 lid 1e opslagbeperking).
   * De cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn verwerkte; blijft
   * dit getal oplopen terwijl de heartbeat "vers" is, dan bewaart de app notificatie-PII over de beloofde
   * termijn heen zonder dat iets dat toont. Staat retentie UIT (venster leeg/0 = onbeperkt bewaren, de
   * pilot-default), dan is er per definitie geen achterstand en is deze gauge `0`.
   */
  notificationsRetentionBacklog: number;
  /**
   * Aantal beslíste acquisitie-leads (Lead, status KLANT/NO_DEAL, zónder actieve pijplijn) ouder dan het
   * geconfigureerde `LEAD_RETENTION_DAYS`-venster die de `lead-retention`-cron nog niet snoeide — werk dat
   * die cron had moeten doen. Dezelfde stille-faal-detector-klasse en net zo privacygevoelig: een Lead
   * (met cascade-gekoppeld `LeadContact`-logboek) draagt contact-PII, en het verwerkingsregister belooft
   * "tot de lead klant wordt of afvalt + 12 maanden" (AVG art. 5 lid 1e opslagbeperking). De cron-heartbeat
   * bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn verwerkte; blijft dit getal oplopen
   * terwijl de heartbeat "vers" is, dan bewaart de app lead-PII over de beloofde termijn heen zonder dat
   * iets dat toont. Staat retentie UIT (venster leeg/0 = onbeperkt bewaren, de pilot-default), dan is er
   * per definitie geen achterstand en is deze gauge `0`.
   */
  leadsRetentionBacklog: number;
  /**
   * Aantal beveiligingsincidenten (HealthIncident, uit de anomaliedetector) ouder dan het geconfigureerde
   * `HEALTH_INCIDENT_IP_RETENTION_DAYS`-venster wier bron-IP de `health-incident-retention`-cron nog niet
   * redigeerde — werk dat die cron had moeten doen. Dezelfde stille-faal-detector-klasse als de andere
   * retentie-backlogs, en net zo privacygevoelig: een incident legt bij een inlog-burst/reset-flood het
   * bron-IP (een persoonsgegeven) vast in `evidence` én `summary`. Anders dan de andere retentie-crons
   * staat déze standaard AAN (venster leeg → default 90 dagen), want onbeperkte IP-retentie is hier de
   * overtreding (AVG art. 5(1)(c)/(e) minimalisatie + opslagbeperking). De cron-heartbeat bewijst alleen
   * dát de run afrondde, niet dát 'ie de redactie-pijplijn verwerkte; blijft dit getal oplopen terwijl de
   * heartbeat "vers" is, dan bewaart de app incident-IP's over de termijn heen zonder dat iets dat toont.
   */
  healthIncidentsIpRetentionBacklog: number;
  /**
   * Aantal berichten (Message) ouder dan het geconfigureerde `MESSAGE_RETENTION_DAYS`-venster die de
   * `message-retention`-cron nog niet snoeide — werk dat die cron had moeten doen (mits het gesprek niet
   * aan een lopende samenwerking hangt). Dezelfde stille-faal-detector-klasse als de andere retentie-
   * backlogs, en het meest PII-dragende vrije-tekstveld op het platform: een Message-rij draagt de
   * daadwerkelijke chatinhoud (`body`) tussen ZZP'er en opdrachtgever, en het verwerkingsregister belooft
   * "duur van de samenwerking + max. 12 maanden na beëindiging" (AVG art. 5 lid 1e opslagbeperking). De
   * cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn verwerkte; blijft dit
   * getal oplopen terwijl de heartbeat "vers" is, dan bewaart de app berichtinhoud over de beloofde termijn
   * heen zonder dat iets dat toont. Staat retentie UIT (venster leeg/0 = onbeperkt bewaren, de pilot-
   * default), dan is er per definitie geen achterstand en is deze gauge `0`.
   */
  messagesRetentionBacklog: number;
  /**
   * Aantal webhook-ledgerrijen (ProcessedWebhookEvent) ouder dan het geconfigureerde
   * `WEBHOOK_EVENT_RETENTION_DAYS`-venster die de `webhook-event-retention`-cron nog niet snoeide — werk
   * dat die cron had moeten doen. Dezelfde stille-faal-detector-klasse als de andere retentie-backlogs,
   * maar — anders dan die — NIET privacygedreven: de ledgerrijen dragen geen persoonsgegevens (alleen een
   * opaque providerreferentie + status). Dit is opslag-hygiëne/availability: de ledger groeit monotoon met
   * elk betaal-webhook-event, en zodra recurring billing het volume opvoert zet een operator een
   * snoeivenster. De cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn
   * verwerkte; blijft dit getal oplopen terwijl de heartbeat "vers" is, dan groeit de tabel/index onbeperkt
   * door (schijf-/querylast) ondanks het gezette venster, zonder dat iets dat toont. Staat retentie UIT
   * (venster leeg/0 = onbeperkt bewaren, de pilot-default), dan is er per definitie geen achterstand en is
   * deze gauge `0`.
   */
  webhookEventsRetentionBacklog: number;
  /**
   * Aantal routing-cacherijen (GeocodeCache + TravelRouteCache) wier eigen TTL (`expiresAt`) is verstreken
   * maar die de `routing-cache-retention`-cron nog niet fysiek verwijderde — werk dat die cron had moeten
   * doen. Dezelfde stille-faal-detector-klasse als de andere retentie-backlogs, en net zo privacygevoelig:
   * beide tabellen bewaren PLATTE-TEKST locatiegegevens (`query`/`fromQuery`/`toQuery` — herleidbare adres-/
   * plaatsindicaties van ZZP'ers en opdrachten die naar Geoapify zijn gestuurd of daaruit zijn afgeleid). De
   * leeslaag negeert verlopen rijen alleen LAZY (routing.ts) — fysiek blijven ze staan, dus deze cron is de
   * enige die de opslagbeperking (AVG art. 5(1)(e)) afdwingt. Anders dan de config-gevensterde retenties is
   * er hier GEEN instelvenster: de TTL zit per rij ingebakken, dus retentie is altijd "aan" (de gauge is niet
   * `0`-per-definitie). De cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de snoei-pijplijn
   * verwerkte; blijft dit getal oplopen terwijl de heartbeat "vers" is, dan bewaart de app locatie-PII over de
   * eigen TTL heen zonder dat iets dat toont.
   */
  routingCacheRetentionBacklog: number;
  /**
   * Aantal actieve ZZP'ers in de LOPENDE maand (≥1 goedgekeurde prestatie wier maand op deze periode
   * valt) die nog GEEN `ZzpMembershipCharge` voor die maand hebben — werk dat de `zzp-membership`-cron
   * had moeten registreren (de kern-ZZP-monetisatie: een maandbijdrage per actieve ZZP'er, PIDZ-model).
   * Dezelfde stille-faal-detector-klasse als `overdueExpirySubscriptions`, maar op de OMZET-registratie:
   * de cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de bijdrage-registratie verwerkte.
   * Blijft dit getal oplopen terwijl de heartbeat "vers" is, dan blijven actieve ZZP'ers deze maand
   * ongefactureerd → de platform-omzet lekt stil weg (er wordt geen bijdrage vastgelegd, dus later niets
   * geïncasseerd), zonder dat iets dat toont. Een klein, tijdelijk aantal is normaal: een ZZP'er die
   * vandaag actief wordt is "unbilled" tot de volgende dagelijkse run. Staat het lidmaatschap UIT
   * (`ZZP_MEMBERSHIP.enabled` = false, de pilot-default), dan is er per definitie geen registratie en is
   * deze gauge `0` (geen misleidend signaal).
   */
  membershipUnbilledActive: number;
  /**
   * Levert het e-mailkanaal momenteel af? true = de laatste échte verzending slaagde (of er is nog
   * nooit iets verzonden — neutraal gezond), false = de laatste verzending mislukte (het kanaal wijst
   * af). Anders dan de cron-/back-up-heartbeat is dit GEEN staleness-op-leeftijd: e-mail is
   * event-gedreven, dus een rustige periode is normaal. Het alarm zit op OPEENVOLGENDE mislukkingen
   * (mailDeliveryConsecutiveFailures), niet op een oude laatste-verzending.
   */
  mailDeliveryOk: boolean;
  /**
   * Aantal opeenvolgende mislukte e-mailverzendingen sinds de laatste geslaagde (0 als het kanaal ok is
   * of nog nooit iets verstuurde). Een systematisch afwijzend kanaal (verlopen sleutel, gede-verifieerd
   * domein, geschorst account, harde rate-limit) laat élke notificatie/reset/herinnering stil mislukken;
   * een monitor paget op een aanhoudende teller, niet op één transiënte bounce.
   */
  mailDeliveryConsecutiveFailures: number;
  /** Leeftijd van de laatste mislukte e-mailverzending in seconden, of null als er nooit één was. */
  mailDeliveryLastFailureAgeSeconds: number | null;
  /**
   * Levert het web-push-kanaal momenteel af? true = de laatste afleverronde leverde af (of er is nog
   * nooit iets afgeleverd — neutraal gezond), false = de laatste ronde probeerde af te leveren maar
   * niets kwam aan (het kanaal wijst af). Net als de mail-heartbeat GEEN staleness-op-leeftijd: push is
   * event-gedreven. Het alarm zit op OPEENVOLGENDE mislukkingen (pushDeliveryConsecutiveFailures).
   * Verlopen abonnementen (churn, 404/410) tellen bewust NIET als mislukking.
   */
  pushDeliveryOk: boolean;
  /**
   * Aantal opeenvolgende mislukte web-push-afleverrondes sinds de laatste geslaagde (0 als het kanaal ok
   * is of nog nooit iets afleverde). Een systematisch afwijzend kanaal (geroteerde/verlopen VAPID-
   * sleutels, provider-storing) laat élke pushmelding stil mislukken; een monitor paget op een
   * aanhoudende teller, niet op één transiënte fout.
   */
  pushDeliveryConsecutiveFailures: number;
  /** Leeftijd van de laatste mislukte web-push-afleverronde in seconden, of null als er nooit één was. */
  pushDeliveryLastFailureAgeSeconds: number | null;
  /**
   * Opereert het object-opslagkanaal (S3, STORAGE_DRIVER=s3) momenteel? true = de laatste échte operatie
   * (put/get/delete/exists) slaagde (of er is nog nooit iets opgeslagen/opgehaald — neutraal gezond),
   * false = de laatste operatie mislukte (de backend wijst af). Net als de mail-/push-heartbeat GEEN
   * staleness-op-leeftijd: opslag is event-gedreven. Het alarm zit op OPEENVOLGENDE mislukkingen
   * (storageDeliveryConsecutiveFailures), niet op een oude laatste-operatie.
   */
  storageDeliveryOk: boolean;
  /**
   * Aantal opeenvolgende mislukte object-opslag-operaties sinds de laatste geslaagde (0 als het kanaal ok
   * is of nog nooit iets deed). Een systematisch falende backend (verlopen AWS-sleutel, ingetrokken IAM,
   * verwijderde/verkeerde bucket, regio-storing) laat élke document-upload/-download stil mislukken; een
   * monitor paget op een aanhoudende teller, niet op één transiënte fout.
   */
  storageDeliveryConsecutiveFailures: number;
  /** Leeftijd van de laatste mislukte object-opslag-operatie in seconden, of null als er nooit één was. */
  storageDeliveryLastFailureAgeSeconds: number | null;
  /**
   * Opereert het betaalprovider-kanaal (Stripe/Mollie, BILLING_PROVIDER=stripe|mollie) momenteel? true = de
   * laatste échte uitgaande operatie (startCheckout/paymentStatus/checkConnectivity) slaagde (of er is nog
   * nooit iets gedaan — neutraal gezond), false = de laatste operatie mislukte (de provider wijst af). Net als
   * de mail-/push-/opslag-heartbeat GEEN staleness-op-leeftijd: betalingen zijn event-gedreven. Het alarm zit
   * op OPEENVOLGENDE mislukkingen (billingDeliveryConsecutiveFailures), niet op een oude laatste-operatie.
   */
  billingDeliveryOk: boolean;
  /**
   * Aantal opeenvolgende mislukte betaalprovider-operaties sinds de laatste geslaagde (0 als het kanaal ok
   * is of nog nooit iets deed). Een systematisch falende backend (verlopen/ingetrokken API-sleutel, geschorst
   * account, provider-storing) laat élke checkout/statuscontrole stil mislukken; een monitor paget op een
   * aanhoudende teller, niet op één transiënte fout.
   */
  billingDeliveryConsecutiveFailures: number;
  /** Leeftijd van de laatste mislukte betaalprovider-operatie in seconden, of null als er nooit één was. */
  billingDeliveryLastFailureAgeSeconds: number | null;
}

/** boolean → 1/0; null → 0 (afwezigheid telt als "niet ok" voor een alarmeerbare gauge). */
function flag(value: boolean | null): number {
  return value === true ? 1 : 0;
}

/** null → AGE_NEVER-sentinel; anders de (naar beneden afgeronde, niet-negatieve) leeftijd. */
function age(seconds: number | null): number {
  if (seconds === null) return AGE_NEVER;
  return Math.max(0, Math.floor(seconds));
}

/**
 * Bouwt de gelabelde gauge-familie `zzp_cron_task_failed{task="..."}`: één reeks (waarde 1) per
 * sub-taak-runner die tijdens de laatste `run-all` faalde. Bij een volledig geslaagde run (lege lijst)
 * verschijnt er GEEN enkele reeks — een gezonde run is de afwezigheid van deze familie, precies zoals
 * een Prometheus-conditie `zzp_cron_task_failed == 1` verwacht. De namen worden ontdubbeld én gesorteerd
 * zodat de expositie deterministisch is (de heartbeat bewaart ze in faalvolgorde; alleen de *set* telt).
 */
function cronFailedTaskMetrics(failedTasks: readonly string[]): Metric[] {
  const unique = [...new Set(failedTasks)].sort();
  return unique.map((task) => ({
    name: "zzp_cron_task_failed",
    help: "1 per geplande-taak-runner die tijdens de laatste run-all faalde (label `task` = de runner-naam, een statische identifier, geen PII). Alleen gefaalde runners exposeren een reeks; bij een volledig geslaagde run is er geen enkele. Complementeert het aggregaat zzp_cron_heartbeat_ok (0/1) met per-runner-attributie zodat een gepagete operator ziet WELKE runner vastloopt zonder op /admin/systeemstatus in te loggen.",
    type: "gauge" as const,
    labels: { task },
    value: 1,
  }));
}

/**
 * Vertaalt de operationele invoer naar een deterministische lijst gauges. Pure functie: dezelfde
 * invoer geeft altijd exact dezelfde uitvoer (stabiele volgorde), geschikt voor snapshot-tests én
 * voor een Prometheus-scraper.
 */
export function buildMetrics(input: MetricsInput): Metric[] {
  return [
    {
      name: "zzp_up",
      help: "1 als de applicatie het metrics-verzoek verwerkte.",
      type: "gauge",
      value: 1,
    },
    {
      name: "zzp_db_reachable",
      help: "1 als de database bereikbaar was (SELECT 1 geslaagd), anders 0.",
      type: "gauge",
      value: flag(input.dbReachable),
    },
    {
      name: "zzp_metrics_collection_complete",
      help: "1 als de DB-collectie alle backlog-tellingen binnen de scrape-deadline (METRICS_COLLECT_TIMEOUT_MS) afrondde, 0 als de scrape werd afgekapt door een trage/gelockte DB. Bij 0 houden sommige backlog-gauges hun default (0) zonder afgeronde query — lees die nullen dan NIET als gezond (vals-negatief).",
      type: "gauge",
      value: input.metricsCollectionComplete ? 1 : 0,
    },
    {
      name: "zzp_cron_heartbeat_age_seconds",
      help: `Leeftijd van de laatste geplande-taken-cron-run in seconden (${AGE_NEVER} = nog nooit gedraaid).`,
      type: "gauge",
      value: age(input.cronAgeSeconds),
    },
    {
      name: "zzp_cron_heartbeat_ok",
      help: "1 als de laatste cron-run zonder taakfouten verliep, anders 0.",
      type: "gauge",
      value: flag(input.cronOk),
    },
    {
      name: "zzp_cron_heartbeat_stale",
      help: "1 als de cron langer dan het venster (CRON_MAX_AGE_HOURS) niet draaide — dead-man's-switch.",
      type: "gauge",
      value: input.cronStale ? 1 : 0,
    },
    // Gelabelde familie: 1 reeks per gefaalde runner op de laatste run (leeg bij een geslaagde run).
    ...cronFailedTaskMetrics(input.cronFailedTasks),
    {
      name: "zzp_backup_heartbeat_age_seconds",
      help: `Leeftijd van de laatste database-back-up-heartbeat in seconden (${AGE_NEVER} = nog nooit gemeld).`,
      type: "gauge",
      value: age(input.backupAgeSeconds),
    },
    {
      name: "zzp_backup_heartbeat_ok",
      help: "1 als de laatste database-back-up slaagde, anders 0.",
      type: "gauge",
      value: flag(input.backupOk),
    },
    {
      name: "zzp_backup_heartbeat_stale",
      help: "1 als de back-up langer dan het venster (BACKUP_MAX_AGE_HOURS) niet meldde — dead-man's-switch.",
      type: "gauge",
      value: input.backupStale ? 1 : 0,
    },
    {
      name: "zzp_verification_queue",
      help: "Aantal openstaande (SUBMITTED) verificatie-inzendingen in de admin-wachtrij.",
      type: "gauge",
      value: Math.max(0, Math.floor(input.verificationQueue)),
    },
    {
      name: "zzp_verification_queue_oldest_age_seconds",
      help: `Leeftijd in seconden van de langst wachtende (SUBMITTED) verificatie-inzending (${AGE_NEVER} = lege wachtrij). Vangt een SLA-breach die de kale wachtrijdiepte mist: alarmeer wanneer de oudste inzending te lang wacht.`,
      type: "gauge",
      value: age(input.verificationQueueOldestAgeSeconds),
    },
    {
      name: "zzp_maintenance_mode",
      help: "1 als de app in onderhoudsmodus staat (MAINTENANCE_MODE) en bezoekers een 503 krijgen, anders 0.",
      type: "gauge",
      value: input.maintenanceMode ? 1 : 0,
    },
    {
      name: "zzp_credentials_overdue_expiry",
      help: "Aantal VERIFIED-credentials met een vervaldatum in het verleden die de expiry-cron nog niet op EXPIRED zette (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen expiry-pijplijn).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueExpiryCredentials)),
    },
    {
      name: "zzp_subscriptions_overdue_expiry",
      help: "Aantal betaalde ACTIVE-abonnementen met een verstreken periode-einde die de subscription-expiry-cron nog niet op CANCELLED (→ Gratis) zette (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen verval-/renewal-pijplijn).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueExpirySubscriptions)),
    },
    {
      name: "zzp_subscriptions_stale_pending",
      help: "Aantal abonnementen dat langer dan het geconfigureerde venster (SUBSCRIPTION_PENDING_STALE_HOURS, default 24u) in status PENDING hangt — een betaalde checkout die de betaal-webhook nooit op ACTIVE/PAST_DUE tilde (0 met de mock-provider — de pilot-default; een enkele verlaten checkout is normaal; aanhoudend/oplopend duidt op een stil kapotte webhook: verkeerde callback-URL/handtekening-mismatch/geblokkeerde poort → niemand wordt geactiveerd en de platform-omzet lekt stil weg).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.stalePendingSubscriptions)),
    },
    {
      name: "zzp_subscriptions_past_due_overdue_downgrade",
      help: "Aantal PAST_DUE-abonnementen wier PAST_DUE-leeftijd de downgrade-drempel (PAST_DUE_DOWNGRADE_AFTER_DAYS, 7 dagen) overschreed maar die de subscription-past-due-cron nog niet op CANCELLED (→ Gratis) zette (0 met de mock-provider — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen past-due-pijplijn: mislukte betalingen blijven eeuwig in PAST_DUE hangen en de herstel-herinneringen gaan niet uit).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overduePastDueDowngrades)),
    },
    {
      name: "zzp_invoices_overdue_unflipped",
      help: "Aantal cascade-facturen met status APPROVED en een verstreken vervaldatum die de payment-reminders-cron nog niet op OVERDUE zette (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen betaal-verval-pijplijn: geen aanmaningen, geen te-laat-signaal).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueUnflippedInvoices)),
    },
    {
      name: "zzp_reviews_overdue_reveal",
      help: "Aantal beoordelingen met een verstreken double-blind reveal-venster (PENDING_REVEAL, revealDeadline in het verleden) die de reviews-reveal-cron nog niet publiceerde (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen reveal-pijplijn: afgeronde beoordelingen blijven na venstersluiting verborgen — SLA-breach op het beoordelingssysteem).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueReviewReveals)),
    },
    {
      name: "zzp_performances_overdue_grace",
      help: "Aantal ingediende prestaties (SUBMITTED) wier grace-venster (PERFORMANCE_GRACE_DAYS) verstreken is — op een niet-geannuleerde/niet-betwiste samenwerking — die de performance-grace-cron nog niet automatisch goedkeurde (0 als het grace-venster uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen grace-pijplijn: prestaties blijven na hun deadline in SUBMITTED hangen → geen factuur, de ZZP'er wordt niet uitbetaald).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overduePerformanceGrace)),
    },
    {
      name: "zzp_disputes_overdue_escalation",
      help: "Aantal open disputen (Collaboration.disputedAt gezet, status != CANCELLED) wier leeftijd de dispute-escalatie-drempel (DISPUTE_ESCALATE_AFTER_DAYS, 7 dagen) overschreed maar die de dispute-reminders-cron nog niet naar admins escaleerde (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen escalatie-pijplijn: bevroren cascade blijft bevroren, admins worden nooit gepaget om te bemiddelen, ZZP'er wacht op geld).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueDisputeEscalations)),
    },
    {
      name: "zzp_audit_retention_backlog",
      help: "Aantal auditregels (IP + user-agent) ouder dan het geconfigureerde AUDIT_LOG_RETENTION_DAYS-venster die de audit-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → persoonsgegevens bewaard over de wettelijke termijn heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.auditRetentionBacklog)),
    },
    {
      name: "zzp_applications_retention_backlog",
      help: "Aantal terminale reacties (REJECTED/WITHDRAWN, vrije-tekst-PII in motivation/note) ouder dan het geconfigureerde APPLICATION_RETENTION_DAYS-venster die de application-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → reactie-PII bewaard over de beloofde termijn heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.applicationsRetentionBacklog)),
    },
    {
      name: "zzp_notifications_retention_backlog",
      help: "Aantal notificaties (PII in title/body) ouder dan het geconfigureerde NOTIFICATION_RETENTION_DAYS-venster die de notification-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → notificatie-PII bewaard over de beloofde termijn heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.notificationsRetentionBacklog)),
    },
    {
      name: "zzp_leads_retention_backlog",
      help: "Aantal beslíste acquisitie-leads (KLANT/NO_DEAL, met contact-PII in het cascade-gekoppelde logboek) ouder dan het geconfigureerde LEAD_RETENTION_DAYS-venster die de lead-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → lead-PII bewaard over de beloofde termijn heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.leadsRetentionBacklog)),
    },
    {
      name: "zzp_health_incidents_ip_retention_backlog",
      help: "Aantal beveiligingsincidenten (HealthIncident) ouder dan het geconfigureerde HEALTH_INCIDENT_IP_RETENTION_DAYS-venster wier bron-IP de health-incident-retention-cron nog niet redigeerde (deze retentie staat standaard AAN — default 90 dagen; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen redactie-pijplijn → incident-IP's (persoonsgegeven) bewaard over de bewaartermijn heen, AVG art. 5(1)(c)/(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.healthIncidentsIpRetentionBacklog)),
    },
    {
      name: "zzp_messages_retention_backlog",
      help: "Aantal berichten (Message, chatinhoud in body) ouder dan het geconfigureerde MESSAGE_RETENTION_DAYS-venster (en niet gekoppeld aan een lopende samenwerking) die de message-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → berichtinhoud bewaard over de beloofde termijn heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.messagesRetentionBacklog)),
    },
    {
      name: "zzp_webhook_events_retention_backlog",
      help: "Aantal webhook-ledgerrijen (ProcessedWebhookEvent, geen PII — opaque providerreferentie + status) ouder dan het geconfigureerde WEBHOOK_EVENT_RETENTION_DAYS-venster die de webhook-event-retention-cron nog niet snoeide (0 als retentie uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → de ledger groeit onbeperkt door ondanks het gezette venster: schijf-/querylast, geen AVG-kwestie).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.webhookEventsRetentionBacklog)),
    },
    {
      name: "zzp_routing_cache_retention_backlog",
      help: "Aantal routing-cacherijen (GeocodeCache + TravelRouteCache, platte-tekst locatie-PII in query/fromQuery/toQuery) wier eigen TTL (expiresAt) is verstreken die de routing-cache-retention-cron nog niet fysiek verwijderde (deze retentie staat altijd AAN — de TTL zit per rij ingebakken, geen instelvenster; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen snoei-pijplijn → locatie-PII bewaard over de eigen TTL heen, AVG art. 5(1)(e)).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.routingCacheRetentionBacklog)),
    },
    {
      name: "zzp_membership_unbilled_active",
      help: "Aantal actieve ZZP'ers in de lopende maand (≥1 goedgekeurde prestatie die op deze maand valt) zonder ZzpMembershipCharge voor die maand die de zzp-membership-cron nog niet registreerde (0 als het lidmaatschap uit staat — de pilot-default; een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen bijdrage-registratie → actieve ZZP'ers blijven ongefactureerd en de platform-omzet lekt stil weg).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.membershipUnbilledActive)),
    },
    {
      name: "zzp_mail_delivery_ok",
      help: "1 als de laatste échte e-mailverzending slaagde (of er nog nooit iets verstuurd is — neutraal gezond), 0 als de laatste verzending mislukte (kanaal wijst af). E-mail is een productie-kernkanaal (notificaties, wachtwoordherstel, herinneringen); een afwijzend kanaal laat die stil mislukken.",
      type: "gauge",
      value: flag(input.mailDeliveryOk),
    },
    {
      name: "zzp_mail_consecutive_failures",
      help: "Aantal opeenvolgende mislukte e-mailverzendingen sinds de laatste geslaagde (0 = kanaal ok of nog niets verstuurd). Alarmeer op een AANHOUDENDE teller (systematisch afwijzende provider: verlopen sleutel, gede-verifieerd domein, geschorst account, rate-limit), niet op één transiënte bounce.",
      type: "gauge",
      value: Math.max(0, Math.floor(input.mailDeliveryConsecutiveFailures)),
    },
    {
      name: "zzp_mail_last_failure_age_seconds",
      help: `Leeftijd van de laatste mislukte e-mailverzending in seconden (${AGE_NEVER} = nog nooit een mislukking). Rauwe context; de alarmeerbare conditie zit in zzp_mail_consecutive_failures / zzp_mail_delivery_ok.`,
      type: "gauge",
      value: age(input.mailDeliveryLastFailureAgeSeconds),
    },
    {
      name: "zzp_push_delivery_ok",
      help: "1 als de laatste web-push-afleverronde afleverde (of er nog nooit iets afgeleverd is — neutraal gezond), 0 als de laatste ronde wél echte (niet-verlopen) endpoints probeerde maar niets aankwam (kanaal wijst af). Web-push is een gebruikersgericht afleverkanaal; een afwijzend kanaal (geroteerde/verlopen VAPID-sleutels, provider-storing) laat pushmeldingen stil mislukken.",
      type: "gauge",
      value: flag(input.pushDeliveryOk),
    },
    {
      name: "zzp_push_consecutive_failures",
      help: "Aantal opeenvolgende mislukte web-push-afleverrondes sinds de laatste geslaagde (0 = kanaal ok of nog niets afgeleverd). Alarmeer op een AANHOUDENDE teller (systematisch afwijzend kanaal: geroteerde/verlopen VAPID-sleutels, provider-storing), niet op één transiënte fout. Verlopen abonnementen (churn) tellen niet mee.",
      type: "gauge",
      value: Math.max(0, Math.floor(input.pushDeliveryConsecutiveFailures)),
    },
    {
      name: "zzp_push_last_failure_age_seconds",
      help: `Leeftijd van de laatste mislukte web-push-afleverronde in seconden (${AGE_NEVER} = nog nooit een mislukking). Rauwe context; de alarmeerbare conditie zit in zzp_push_consecutive_failures / zzp_push_delivery_ok.`,
      type: "gauge",
      value: age(input.pushDeliveryLastFailureAgeSeconds),
    },
    {
      name: "zzp_storage_delivery_ok",
      help: "1 als de laatste échte object-opslag-operatie (put/get/delete/exists via STORAGE_DRIVER=s3) slaagde (of er nog nooit iets opgeslagen/opgehaald is — neutraal gezond), 0 als de laatste operatie mislukte (backend wijst af). Object-opslag is een productie-kernkanaal (VOG/diploma/verzekering upload+download); een falende backend laat die stil mislukken.",
      type: "gauge",
      value: flag(input.storageDeliveryOk),
    },
    {
      name: "zzp_storage_consecutive_failures",
      help: "Aantal opeenvolgende mislukte object-opslag-operaties sinds de laatste geslaagde (0 = kanaal ok of nog niets gedaan). Alarmeer op een AANHOUDENDE teller (systematisch falende backend: verlopen AWS-sleutel, ingetrokken IAM, verwijderde/verkeerde bucket, regio-storing), niet op één transiënte fout.",
      type: "gauge",
      value: Math.max(0, Math.floor(input.storageDeliveryConsecutiveFailures)),
    },
    {
      name: "zzp_storage_last_failure_age_seconds",
      help: `Leeftijd van de laatste mislukte object-opslag-operatie in seconden (${AGE_NEVER} = nog nooit een mislukking). Rauwe context; de alarmeerbare conditie zit in zzp_storage_consecutive_failures / zzp_storage_delivery_ok.`,
      type: "gauge",
      value: age(input.storageDeliveryLastFailureAgeSeconds),
    },
    {
      name: "zzp_billing_delivery_ok",
      help: "1 als de laatste échte betaalprovider-operatie (startCheckout/paymentStatus/checkConnectivity via BILLING_PROVIDER=stripe|mollie) slaagde (of er nog nooit iets gedaan is — neutraal gezond), 0 als de laatste operatie mislukte (provider wijst af). De betaalprovider is een productie-kernkanaal (abonnement-checkout + statuscontrole); een falende backend laat checkouts stil op PENDING hangen.",
      type: "gauge",
      value: flag(input.billingDeliveryOk),
    },
    {
      name: "zzp_billing_consecutive_failures",
      help: "Aantal opeenvolgende mislukte betaalprovider-operaties sinds de laatste geslaagde (0 = kanaal ok of nog niets gedaan). Alarmeer op een AANHOUDENDE teller (systematisch falende backend: verlopen/ingetrokken API-sleutel, geschorst account, provider-storing), niet op één transiënte fout.",
      type: "gauge",
      value: Math.max(0, Math.floor(input.billingDeliveryConsecutiveFailures)),
    },
    {
      name: "zzp_billing_last_failure_age_seconds",
      help: `Leeftijd van de laatste mislukte betaalprovider-operatie in seconden (${AGE_NEVER} = nog nooit een mislukking). Rauwe context; de alarmeerbare conditie zit in zzp_billing_consecutive_failures / zzp_billing_delivery_ok.`,
      type: "gauge",
      value: age(input.billingDeliveryLastFailureAgeSeconds),
    },
  ];
}

/**
 * Escapet een Prometheus-labelwaarde volgens de tekstexpositie: backslash, dubbele quote en newline.
 * De labelwaarden zijn vandaag uitsluitend statische taaknamen (veilig), maar het escapen houdt de
 * expositie robuust tegen een toekomstige labelbron.
 */
function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Rendert de optionele labels naar het Prometheus-suffix `{k="v",...}` (gesorteerd op sleutel voor een
 * deterministische uitvoer). Geen/lege labels → lege string, zodat gewone gauges byte-identiek blijven.
 */
function formatLabels(labels: Record<string, string> | undefined): string {
  if (!labels) return "";
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return "";
  return `{${keys.map((k) => `${k}="${escapeLabelValue(labels[k] ?? "")}"`).join(",")}}`;
}

/**
 * Rendert Metric[] naar de Prometheus-tekstexpositie (versie 0.0.4): per metric-NAAM één `# HELP`- en
 * `# TYPE`-regel (ook bij een gelabelde familie met meerdere reeksen onder dezelfde naam — Prometheus
 * verbiedt dubbele HELP/TYPE), gevolgd door de waarde-regel(s) mét labelsuffix. Pure functie.
 * Niet-eindige waarden vallen veilig terug op 0 zodat een scraper nooit een `NaN`/`Inf`-parsefout krijgt.
 */
export function renderPrometheus(metrics: Metric[]): string {
  const lines: string[] = [];
  const headerEmitted = new Set<string>();
  for (const metric of metrics) {
    const value = Number.isFinite(metric.value) ? metric.value : 0;
    if (!headerEmitted.has(metric.name)) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      headerEmitted.add(metric.name);
    }
    lines.push(`${metric.name}${formatLabels(metric.labels)} ${value}`);
  }
  // Prometheus vereist een afsluitende newline.
  return lines.join("\n") + "\n";
}

/**
 * Rendert Metric[] naar een plat JSON-object { naam: waarde } voor niet-Prometheus-monitors. Een
 * gelabelde reeks krijgt de labels als sleutel-suffix (`zzp_cron_task_failed{task="..."}`) zodat
 * meerdere reeksen onder dezelfde naam niet over elkaar heen schrijven; gewone gauges houden de kale
 * naam als sleutel (byte-identiek aan voorheen).
 */
export function metricsToJson(metrics: Metric[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const metric of metrics) {
    out[`${metric.name}${formatLabels(metric.labels)}`] = Number.isFinite(metric.value)
      ? metric.value
      : 0;
  }
  return out;
}
