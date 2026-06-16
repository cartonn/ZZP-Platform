// Pure helpers voor web-push. Geen I/O, los te unit-testen. De payload is het JSON-bericht dat de
// service worker (public/sw.js) in het `push`-event ontvangt en als systeemnotificatie toont.

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface PushSource {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}

// Bouwt de payload uit een opgeslagen notificatie. `tag` = het type zodat de browser opeenvolgende
// meldingen van hetzelfde type samenvouwt i.p.v. ze te stapelen. `url` valt terug op de notificatie-
// inbox zodat een klik altijd ergens zinnigs landt.
export function buildPushPayload(n: PushSource): PushPayload {
  return {
    title: n.title,
    body: n.body ?? "",
    url: n.link && n.link.startsWith("/") ? n.link : "/notificaties",
    tag: n.type,
  };
}

// Een pushdienst antwoordt 404 (Not Found) of 410 (Gone) als het endpoint niet meer bestaat
// (gebruiker heeft toestemming ingetrokken / app verwijderd). Zulke abonnementen ruimen we op.
export function isExpiredSubscriptionStatus(status: number): boolean {
  return status === 404 || status === 410;
}
