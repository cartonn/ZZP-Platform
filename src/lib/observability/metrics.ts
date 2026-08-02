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
  /** Leeftijd van de laatste geplande-taken-cron-run in seconden, of null als 'ie nog nooit draaide. */
  cronAgeSeconds: number | null;
  /** Draaide de laatste cron-run zonder taakfouten? null als er nog nooit een run was. */
  cronOk: boolean | null;
  /** Staat de cron-heartbeat op "stale" (buiten het venster)? */
  cronStale: boolean;
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
      name: "zzp_invoices_overdue_unflipped",
      help: "Aantal cascade-facturen met status APPROVED en een verstreken vervaldatum die de payment-reminders-cron nog niet op OVERDUE zette (een klein, tijdelijk aantal — tot één cron-interval — is normaal; aanhoudend/oplopend duidt op een vastgelopen betaal-verval-pijplijn: geen aanmaningen, geen te-laat-signaal).",
      type: "gauge",
      value: Math.max(0, Math.floor(input.overdueUnflippedInvoices)),
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
  ];
}

/**
 * Rendert Metric[] naar de Prometheus-tekstexpositie (versie 0.0.4): per metric een `# HELP`- en
 * `# TYPE`-regel gevolgd door de waarde. Pure functie. Niet-eindige waarden vallen veilig terug op 0
 * zodat een scraper nooit een `NaN`/`Inf`-parsefout krijgt.
 */
export function renderPrometheus(metrics: Metric[]): string {
  const lines: string[] = [];
  for (const metric of metrics) {
    const value = Number.isFinite(metric.value) ? metric.value : 0;
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} ${metric.type}`);
    lines.push(`${metric.name} ${value}`);
  }
  // Prometheus vereist een afsluitende newline.
  return lines.join("\n") + "\n";
}

/** Rendert Metric[] naar een plat JSON-object { naam: waarde } voor niet-Prometheus-monitors. */
export function metricsToJson(metrics: Metric[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const metric of metrics) {
    out[metric.name] = Number.isFinite(metric.value) ? metric.value : 0;
  }
  return out;
}
