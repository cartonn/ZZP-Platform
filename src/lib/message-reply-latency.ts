// Reactietijd-signaal van de gesprekspartner op /berichten/[id]: "reageert meestal binnen ~X".
// Zet verwachtingen en neemt de "heb ik geghost?"-onzekerheid weg — voor alle drie de rollen even
// bruikbaar. Benchmark: Intercom/WhatsApp/Malt tonen "reageert doorgaans binnen X".
//
// --- Bron & waarom dit eerlijk is ---
// We leiden de mediane reactietijd af uit de onveranderlijke `Message.createdAt` (immutable, precies)
// + `senderId`. Anders dan bij een reactie (`Application`, zie client-responsiveness.ts) is er hier
// géén driftgevoelig `updatedAt`-probleem: een bericht wordt nooit bijgewerkt, dus de tijdstippen zijn
// exact reproduceerbaar. Puur en deterministisch; uitsluitend de berichten van dít gesprek (die beide
// deelnemers al zien) — geen data van andere gesprekken of gebruikers (privacy by design).
//
// --- Definitie van "reactietijd" ---
// Een beurt telt wanneer de partner antwoordt nádat de andere kant iets stuurde. De reactietijd is de
// tijd vanaf het *eerste onbeantwoorde* inkomende bericht tot het eerste antwoord van de partner — dus
// "hoe lang liet de partner de andere kant wachten". Opeenvolgende berichten van de partner in één
// beurt tellen als één antwoord. We rapporteren de mediaan (robuust tegen één uitschieter) in grove,
// uitlegbare buckets — nooit een exact getal (geen schijnprecisie).

export interface ReplyLatencyMessage {
  senderId: string;
  createdAt: Date;
}

export type ReplyLatencyBucket = "hour" | "hours" | "day" | "days" | "week_plus";

export interface ReplyLatency {
  /** Aantal beantwoorde beurten waarop de mediaan rust. */
  sampleSize: number;
  /** Mediane reactietijd in minuten (voor transparantie/tests). */
  medianMinutes: number;
  bucket: ReplyLatencyBucket;
  /** Mensentaal, leest natuurlijk na "Reageert meestal " (bv. "binnen een dag"). */
  label: string;
}

/** Minstens twee beantwoorde beurten — anders is één toevallige reactie geen "gewoonte". */
const MIN_SAMPLE = 2;
const MS_PER_MINUTE = 60_000;

// Bucket-grenzen in minuten (enkele richting). Grof en uitlegbaar.
const HOUR = 60;
const HOURS_MAX = 6 * 60; // t/m ~6 uur → "binnen enkele uren"
const DAY = 24 * 60;
const DAYS_MAX = 7 * 24 * 60; // t/m een week → "binnen enkele dagen"

const BUCKET_LABEL: Record<ReplyLatencyBucket, string> = {
  hour: "binnen een uur",
  hours: "binnen enkele uren",
  day: "binnen een dag",
  days: "binnen enkele dagen",
  week_plus: "na een week of langer",
};

function bucketFor(medianMinutes: number): ReplyLatencyBucket {
  if (medianMinutes <= HOUR) return "hour";
  if (medianMinutes <= HOURS_MAX) return "hours";
  if (medianMinutes <= DAY) return "day";
  if (medianMinutes <= DAYS_MAX) return "days";
  return "week_plus";
}

/** Mediaan van een niet-lege lijst (afgerond op hele minuten). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? 0;
}

/**
 * Berekent het reactietijd-signaal van `partnerId` uit de berichten van één gesprek, of `null` wanneer
 * er te weinig beantwoorde beurten zijn (< {@link MIN_SAMPLE}) om een gewoonte te tonen. De invoer hoeft
 * niet gesorteerd te zijn; we sorteren defensief op `createdAt`. Puur en deterministisch.
 */
export function summarizeReplyLatency(
  messages: readonly ReplyLatencyMessage[],
  partnerId: string,
): ReplyLatency | null {
  const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const latencies: number[] = [];
  // Tijdstip van het eerste nog-onbeantwoorde inkomende bericht (van de andere kant), of null.
  let pendingInboundAt: Date | null = null;

  for (const m of sorted) {
    if (m.senderId === partnerId) {
      // Antwoord van de partner: sluit de openstaande beurt (indien er een inkomend bericht wachtte).
      if (pendingInboundAt) {
        const minutes = (m.createdAt.getTime() - pendingInboundAt.getTime()) / MS_PER_MINUTE;
        // Negatieve waarde = tijdruis (gelijke/omgekeerde timestamps) → overslaan i.p.v. misleiden.
        if (minutes >= 0) latencies.push(minutes);
        pendingInboundAt = null;
      }
    } else {
      // Inkomend bericht voor de partner. Meet vanaf het EERSTE onbeantwoorde bericht van een reeks.
      if (!pendingInboundAt) pendingInboundAt = m.createdAt;
    }
  }

  if (latencies.length < MIN_SAMPLE) return null;

  const medianMinutes = median(latencies);
  const bucket = bucketFor(medianMinutes);
  return { sampleSize: latencies.length, medianMinutes, bucket, label: BUCKET_LABEL[bucket] };
}
