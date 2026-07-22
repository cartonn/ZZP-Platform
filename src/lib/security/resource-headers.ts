// Gedeelde bron van waarheid voor de security-headers op responses die rauwe, privé bestanden
// serveren (geüploade documenten, facturen-PDF's, media). Deze route-handlers vallen buiten de
// per-request CSP-nonce-pipeline van de middleware (het zijn geen HTML-documenten) en zetten hun
// headers zelf. Eén geteste helper voorkomt drift tussen die routes.
//
// Cross-Origin-Resource-Policy is de kern: hij verhindert dat een andere origin onze privé-resource
// inlaadt via een no-cors request (`<img>`, `<script>`, `fetch(..., {mode:"no-cors"})`). Defense-in-
// depth voor documentprivacy (CLAUDE.md regel 4) bovenop de auth-/ownership-keten: zelfs een
// gelekte URL kan een gevoelig document (VOG/diploma/verzekering) niet cross-origin embedden.

/** `same-origin` = alleen onze eigen origin mag de resource inladen. */
export const CROSS_ORIGIN_RESOURCE_POLICY = "same-origin";

/**
 * Saneert een download-bestandsnaam: alleen woordtekens, punt en koppelteken; nooit leeg. Voorkomt
 * header-injectie/aanhalingsteken-breuk in `Content-Disposition` en een misleidende lege naam.
 */
export function sanitizeAttachmentFilename(filename: string): string {
  const cleaned = filename.replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : "bestand";
}

/** `Content-Disposition: inline`-waarde met een gesaneerde bestandsnaam. */
export function inlineDisposition(filename: string): string {
  return `inline; filename="${sanitizeAttachmentFilename(filename)}"`;
}

/**
 * Headers voor een privé-bestand-download (factuur-PDF, geüpload document): nooit buiten de browser
 * cachen, nooit MIME-sniffen, nooit cross-origin embedden.
 */
export function privateFileHeaders(contentType: string, filename: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Content-Disposition": inlineDisposition(filename),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": CROSS_ORIGIN_RESOURCE_POLICY,
  };
}

/**
 * Headers voor het serveren van een door-de-gebruiker-geüpload gevoelig document (VOG, diploma,
 * verzekering). Bovenop `privateFileHeaders` een strikte sandbox-CSP: zelfs als een verkeerd getypt
 * bestand inline opent, mag het geen scripts/embeds uitvoeren (defense-in-depth bovenop de
 * magic-byte-validatie bij upload).
 */
export function sandboxedDocumentHeaders(
  mimeType: string,
  filename: string,
): Record<string, string> {
  return {
    ...privateFileHeaders(mimeType, filename),
    "Content-Security-Policy": "sandbox; default-src 'none'",
  };
}
