// Allowlist van bekende push-diensten. De server POST't de (VAPID-ondertekende) notificatie naar het
// abonnement-endpoint; zonder restrictie zou een aanvaller een eigen host kunnen registreren en zo de
// server laten posten naar willekeurige hosts (SSRF) én de inhoud van zijn eigen meldingen
// exfiltreren. Daarom: alleen https én alleen de officiële push-dienst-domeinen.

const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com", //          Chrome / Android / nieuwe Edge (FCM)
  "push.services.mozilla.com", //   Firefox (autopush, subdomeinen)
  "push.apple.com", //              Safari / Apple web-push (web.push.apple.com)
  "notify.windows.com", //          Windows / oude Edge (WNS, subdomeinen)
] as const;

/** True alleen voor een https-endpoint op een bekende push-dienst (exact of subdomein). */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_PUSH_HOSTS.some((d) => host === d || host.endsWith("." + d));
}
