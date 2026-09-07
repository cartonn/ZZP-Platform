// Gedeelde bron van waarheid voor de `Content-Disposition`-headerwaarde op elke response die een
// bestand serveert (geüploade documenten, facturen-PDF's, media, presigned download-URLs). Bouwt de
// waarde volgens RFC 6266: naast de ASCII-`filename=`-fallback (injectie-proof, voor oude clients) een
// moderne `filename*=UTF-8''…`-parameter zodra de naam informatie draagt die de ASCII-fallback verliest
// (letters met diakritische tekens, spaties). Zo behoudt de browser de echte bestandsnaam
// ("Diploma André.pdf") terwijl legacy-clients een veilige fallback krijgen.
//
// Veiligheid: `filename=` bevat alleen `[\w.-]` (alle andere tekens → `_`), dus geen aanhalingsteken-/
// CRLF-injectie in de header. `filename*` wordt RFC 5987 percent-gecodeerd (UTF-8-bytes), dus óók daar
// kan geen rauwe `"`, `;`, CR of LF de header breken. De unicode-variant strippt daarbovenop
// control-tekens en padscheidingstekens — defense-in-depth/cosmetisch, niet de injectiebarrière zelf.

/** RFC 5987 attr-char: de ASCII-tekens die we onversleuteld in de ext-value mogen laten staan. */
const ASCII_ATTR_CHAR = /[A-Za-z0-9!#$&+\-.^_`|~]/;

/** Ruime bovengrens op de bestandsnaam (beide parameters) — voorkomt een absurd lange header. */
const MAX_FILENAME_LEN = 200;

/**
 * Percent-codeert een waarde als RFC 5987 ext-value: elke niet-attr-char-byte van de UTF-8-representatie
 * wordt `%XX` (hoofdletter-hex). Puur/testbaar; werkt in Edge- én Node-runtime (Web `TextEncoder`).
 */
export function encodeRfc5987(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let out = "";
  for (const byte of bytes) {
    if (byte < 0x80 && ASCII_ATTR_CHAR.test(String.fromCharCode(byte))) {
      out += String.fromCharCode(byte);
    } else {
      out += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return out;
}

/**
 * ASCII-only bestandsnaam voor de legacy `filename=`-parameter. Vervangt elk onveilig teken door `_`,
 * strippt omringende underscores en valt terug op "bestand" bij een lege/volledig gestripte naam.
 * Voorkomt Content-Disposition-injectie (geen `"`, `;`, CR, LF). Nooit leeg.
 */
export function asciiFallbackFilename(filename: string): string {
  const cleaned = filename
    .replace(/[^\w.\-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_FILENAME_LEN);
  return cleaned.length > 0 ? cleaned : "bestand";
}

/**
 * Unicode-behoudende bestandsnaam voor de moderne `filename*=UTF-8''`-parameter: behoudt letters,
 * diakritische tekens, cijfers, spaties en gangbare leestekens, maar strippt control-tekens (C0/C1) en
 * pad-/filesystem-gereserveerde tekens die zinloos of gevaarlijk zijn in een bestandsnaam. De waarde
 * wordt hierna nog RFC 5987 percent-gecodeerd, dus dit is defense-in-depth/cosmetica.
 */
export function unicodePreservingFilename(filename: string): string {
  return (
    filename
      // eslint-disable-next-line no-control-regex -- bewust: C0/C1 control-tekens uit de naam strippen
      .replace(/[\u0000-\u001f\u007f-\u009f]+/g, "")
      .replace(/[\\/]+/g, "_") // padscheidingstekens
      .replace(/[<>:"|?*]+/g, "_") // filesystem-gereserveerde tekens
      .trim()
      .slice(0, MAX_FILENAME_LEN)
  );
}

/**
 * Bouwt een RFC 6266 `Content-Disposition`-headerwaarde. Zonder bestandsnaam: alleen het type
 * (`inline`/`attachment`). Met bestandsnaam: altijd de ASCII-`filename=`-fallback, plus
 * `filename*=UTF-8''…` alleen wanneer die parameter écht iets toevoegt wat de ASCII-fallback niet kan
 * dragen — d.w.z. de percent-codering bevat minstens één `%XX` (een spatie, diakritisch teken, …).
 * Zo krijgt een naam die na sanering toch puur uit ASCII-attr-chars bestaat (bv. een gestripte
 * traversal-poging) géén overbodige, identieke `filename*`. Puur/testbaar.
 */
export function contentDispositionValue(type: "inline" | "attachment", filename?: string): string {
  if (filename === undefined) return type;
  const ascii = asciiFallbackFilename(filename);
  let value = `${type}; filename="${ascii}"`;
  const encoded = encodeRfc5987(unicodePreservingFilename(filename));
  if (encoded.includes("%")) {
    value += `; filename*=UTF-8''${encoded}`;
  }
  return value;
}
