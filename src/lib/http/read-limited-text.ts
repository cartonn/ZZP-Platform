// Gestreamde body-limiet voor publieke, ongeauthenticeerde POST-endpoints.
//
// Waarom: de body-lezende publieke endpoints (`/api/client-error`, `/api/csp-report`,
// `/api/billing/webhook`, `/api/mail-intake/webhook`) lazen tot nu toe de body via
// `request.text()` — dat buffert de VOLLEDIGE stream in het geheugen vóór er een byte-grens
// wordt gecontroleerd. Een `Content-Length`-pre-check (bij twee van de vier aanwezig) dekt alleen
// een eerlijke header af; een chunked request (Transfer-Encoding: chunked) draagt géén
// `Content-Length`, dus een aanvaller kan — binnen de per-IP count-rate-limit — een arbitrair
// grote body sturen die volledig gebufferd wordt vóór afwijzing (CWE-400, geheugen-DoS).
//
// Deze helper leest de body **gestreamd** en breekt af zodra de lopende byte-som de grens
// overschrijdt: er wordt nooit méér dan de grens (+ één laatste chunk) in het geheugen gehouden,
// óók zonder `Content-Length`. De `Content-Length`-header (indien aanwezig) wijst een overmaatse
// body af zónder ook maar één byte te lezen.
//
// Byte-nauwkeurig: de grens geldt op werkelijke UTF-8-bytes (niet `string.length`, dat
// UTF-16-code-units telt en multibyte-tekens onderschat). De geretourneerde string is exact wat
// `request.text()` zou opleveren (UTF-8-decode van dezelfde bytes) — cruciaal voor endpoints die
// de rauwe body nodig hebben voor handtekeningverificatie (Stripe).
//
// Retour: de gedecodeerde string (mogelijk "") bij succes; `null` als de body te groot of
// onleesbaar is. De aanroeper mapt beide faalgevallen op zijn eigen responsbeleid (204 / 200).

/**
 * Lees de request-body als tekst, hard begrensd op `maxBytes` UTF-8-bytes.
 *
 * @returns de gedecodeerde body bij succes (kan "" zijn), of `null` bij te groot / onleesbaar.
 */
export async function readLimitedText(request: Request, maxBytes: number): Promise<string | null> {
  // Verdedig tegen een onzinnige grens: een niet-positieve/niet-eindige grens laat niets door.
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) return null;

  // Pre-check op de aangegeven lengte: een overmaatse body afwijzen zónder hem te lezen.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const body = request.body;

  // Geen stream beschikbaar (body-loze request, of een runtime zonder `request.body`): val terug
  // op de eenmalige tekstlezing, mét dezelfde byte-grens ná het lezen. Zonder stream is er geen
  // manier om vroegtijdig af te breken; de `Content-Length`-pre-check hierboven is dan de enige
  // voorafgaande bescherming.
  if (!body) {
    let text: string;
    try {
      text = await request.text();
    } catch {
      return null;
    }
    return utf8ByteLength(text) > maxBytes ? null : text;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        // Grens overschreden: stop met lezen en geef de stream vrij. Niets verder bufferen.
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch {
    // Netwerk-/stream-fout tijdens het lezen: behandel als onleesbaar.
    return null;
  }

  // Herassembleer de exacte bytes en decodeer als UTF-8 (identiek aan `request.text()`).
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

/** Aantal UTF-8-bytes van een string (zonder de hele buffer te bewaren). */
function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}
