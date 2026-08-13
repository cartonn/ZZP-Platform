"use client";

// Concept 555 — "Shaker" · Shaker-ambacht (Amerikaanse Shaker-gemeenschappen, 19e eeuw) als
// interfaceprincipe: utilitaire puurheid, geen enkel ornament, "don’t make something unless it is
// both necessary and useful". De ordenende vorm is de peg rail — een houten lat waar alles aan
// hangt en weer van af kan: navigatie is een pegboard-lat, documenten/opdrachten/certificaten
// hangen aan hun eigen haak. Alles heeft precies één functie, en die is af.
// Inspiratie/bronnen: Remodelista "Object Lessons: The Shaker Peg Rail" en "Where to hang Shaker
// peg rails" (gelijkmatige pegafstand, vloer/vlak vrijhouden, orde en herhaling), Shaker-motto
// "beauty rests on utility", en de kraaltjes-hairline langs boven- en onderrand van de originele
// latten. Geen schaduwen, alleen eerlijke lijnen en maatvoering.
// Deterministisch: geen random, geen datum-afhankelijkheid. Alle grafiek is eigen CSS/SVG.
// Fonts: Newsreader (koppen) + Inter (body).

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ACTIES,
  CREDENTIALS,
  DOCUMENTEN,
  FACTUREN,
  KPIS,
  OPDRACHTEN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
  type ScreenKey,
} from "./mock";

// ── Palet — warm ivoor/kalk, kastanjebruin hout, Shaker-blauw als enige accent ──────────────
const C = {
  kalk: "#f3efe6",
  papier: "#faf8f2",
  hout: "#7a5230",
  houtLicht: "#9a6f47",
  blauw: "#3c5a72",
  blauwLicht: "#e2e8ed",
  inkt: "#2b261f",
  inktZacht: "#5f594e",
  inktFaint: "#6e6759",
  lijn: "#ddd6c7",
  lijnZacht: "#e8e2d5",
  ok: "#4a6b4f",
  warn: "#8a6320",
  bad: "#8f3f34",
} as const;

const kop = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-inter)" };

type Scherm = ScreenKey | "profiel";

const SCHERMEN: { key: Scherm; label: string }[] = [
  { key: "dashboard", label: "Werkbank" },
  { key: "marktplaats", label: "Opdrachtenrek" },
  { key: "opdracht", label: "Opdrachtblad" },
  { key: "verificatie", label: "Certificaten" },
  { key: "acties", label: "Dagorde" },
  { key: "facturen", label: "Kasboek" },
  { key: "documenten", label: "Documenten" },
  { key: "profiel", label: "Naamplaat" },
];

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c5a72]";

// ── Lokale, presentationele mock ───────────────────────────────────────────────────────────
const WEEK: { dag: string; uren: number; plaats: string }[] = [
  { dag: "ma", uren: 6, plaats: "Overvecht" },
  { dag: "di", uren: 8, plaats: "Zuilen" },
  { dag: "wo", uren: 4, plaats: "Overvecht" },
  { dag: "do", uren: 8, plaats: "Lombok" },
  { dag: "vr", uren: 6, plaats: "Zuilen" },
  { dag: "za", uren: 0, plaats: "—" },
  { dag: "zo", uren: 0, plaats: "—" },
];

const VAKMANSCHAP: { titel: string; jaren: string; waar: string }[] = [
  { titel: "Wijkverpleegkundige", jaren: "2019 — nu", waar: "Zelfstandig, regio Utrecht" },
  { titel: "Verpleegkundige somatiek", jaren: "2015 — 2019", waar: "Diakonessenhuis" },
  { titel: "Verzorgende IG", jaren: "2012 — 2015", waar: "Careyn" },
];

const HAAKJES: { haak: string; wat: string }[] = [
  { haak: "I", wat: "Wat je vandaag doet" },
  { haak: "II", wat: "Wat je moet regelen" },
  { haak: "III", wat: "Wat er binnenkomt" },
];

// ── Bouwstenen: de peg rail ────────────────────────────────────────────────────────────────
function Peg({ groot = false }: { groot?: boolean }) {
  const d = groot ? 14 : 11;
  return (
    <span
      className="block shrink-0 rounded-full"
      style={{
        width: d,
        height: d,
        background: C.hout,
        border: `1px solid ${C.inkt}22`,
      }}
      aria-hidden="true"
    />
  );
}

/** Een houten lat met kraallijn boven en onder — de drager van alles wat eraan hangt. */
function Lat({ dik = false }: { dik?: boolean }) {
  return (
    <div
      className="w-full"
      style={{
        height: dik ? 14 : 10,
        background: C.hout,
        borderTop: `1px solid ${C.houtLicht}`,
        borderBottom: `1px solid ${C.inkt}55`,
      }}
      aria-hidden="true"
    />
  );
}

/** Kaart die aan een haakje hangt: peg + koord + blad. Geen schaduw, alleen hairlines. */
function Hangend({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section className={`flex flex-col items-stretch ${className}`} aria-label={label}>
      <div className="flex items-center justify-center">
        <Peg />
      </div>
      <div className="flex justify-center">
        <span className="block h-4 w-px" style={{ background: C.lijn }} aria-hidden="true" />
      </div>
      <div className="p-4 sm:p-5" style={{ background: C.papier, border: `1px solid ${C.lijn}` }}>
        {children}
      </div>
    </section>
  );
}

function Titel({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2
        className="text-[19px] font-normal leading-tight tracking-[-0.01em] sm:text-[22px]"
        style={{ ...kop, color: C.inkt }}
      >
        {children}
      </h2>
      {sub ? (
        <p className="mt-1 text-[12px]" style={{ color: C.inktFaint }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.blauw };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad };
  }
}

function Merk({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
      style={{ color: m.tone }}
    >
      <m.Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Knop({
  children,
  onClick,
  variant = "hout",
  type = "button",
  disabled = false,
  title,
  ariaPressed,
  ariaExpanded,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "hout" | "lijn" | "stil";
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  className?: string;
}) {
  const stijl =
    variant === "hout"
      ? { background: C.blauw, color: C.papier, border: `1px solid ${C.blauw}` }
      : variant === "lijn"
        ? { background: "transparent", color: C.inkt, border: `1px solid ${C.inkt}` }
        : { background: "transparent", color: C.inktZacht, border: `1px solid ${C.lijn}` };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium transition-colors ${RING} ${className}`}
      style={{
        ...stijl,
        ...(disabled ? { color: C.inktFaint, borderColor: C.lijn, cursor: "not-allowed" } : {}),
      }}
    >
      {children}
    </button>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────────
export function Concept555() {
  const [scherm, setScherm] = useState<Scherm>("dashboard");
  const [opdrachtId, setOpdrachtId] = useState(OPDRACHTEN[0]!.id);
  const opdracht = useMemo(
    () => OPDRACHTEN.find((o) => o.id === opdrachtId) ?? OPDRACHTEN[0]!,
    [opdrachtId],
  );
  const open = useCallback((id: string) => {
    setOpdrachtId(id);
    setScherm("opdracht");
  }, []);

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...body, background: C.kalk, color: C.inkt }}
    >
      <header className="mx-auto max-w-5xl px-4 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-[26px] font-normal leading-none tracking-[-0.015em] sm:text-[32px]"
              style={kop}
            >
              Shaker
            </h1>
            <p className="mt-2 text-[12.5px]" style={{ color: C.inktFaint }}>
              Alles hangt aan zijn haak. Niets meer dan nodig.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-medium">{PROFIEL.naam}</div>
            <div className="text-[12px]" style={{ color: C.inktFaint }}>
              {PROFIEL.rol}
            </div>
          </div>
        </div>
      </header>

      {/* De peg rail — navigatie hangt aan de lat */}
      <nav className="mx-auto mt-6 max-w-5xl px-4 sm:px-8" aria-label="Schermen">
        <Lat dik />
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1 sm:min-w-0 sm:justify-between" role="tablist">
            {SCHERMEN.map((s) => {
              const on = s.key === scherm;
              return (
                <div key={s.key} className="flex flex-1 flex-col items-center">
                  <span
                    className="-mt-[7px] block h-3.5 w-3.5 rounded-full"
                    style={{ background: C.hout, border: `1px solid ${C.inkt}33` }}
                    aria-hidden="true"
                  />
                  <span
                    className="block h-3 w-px"
                    style={{ background: on ? C.blauw : C.lijn }}
                    aria-hidden="true"
                  />
                  <button
                    role="tab"
                    type="button"
                    id={`shk-tab-${s.key}`}
                    aria-selected={on}
                    aria-controls="shk-panel"
                    onClick={() => setScherm(s.key)}
                    className={`w-full whitespace-nowrap px-3 py-2 text-[12.5px] font-medium transition-colors ${RING}`}
                    style={{
                      background: on ? C.blauw : "transparent",
                      color: on ? C.papier : C.inktZacht,
                      border: `1px solid ${on ? C.blauw : C.lijn}`,
                    }}
                  >
                    {s.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <main
        id="shk-panel"
        role="tabpanel"
        aria-labelledby={`shk-tab-${scherm}`}
        className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14"
      >
        {scherm === "dashboard" && <Werkbank onNaarRek={() => setScherm("marktplaats")} />}
        {scherm === "marktplaats" && <Opdrachtenrek onOpen={open} />}
        {scherm === "opdracht" && (
          <Opdrachtblad opdracht={opdracht} onTerug={() => setScherm("marktplaats")} />
        )}
        {scherm === "verificatie" && <Certificaten />}
        {scherm === "acties" && <Dagorde onNaarCert={() => setScherm("verificatie")} />}
        {scherm === "facturen" && <Kasboek />}
        {scherm === "documenten" && <DocumentenRek />}
        {scherm === "profiel" && <Naamplaat />}
        {scherm === "berichten" && <DocumentenRek />}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 sm:px-8">
        <Lat />
        <p className="mt-3 text-center text-[11.5px]" style={{ color: C.inktFaint }}>
          Maak niets tenzij het nodig én bruikbaar is — is het beide, maak het dan mooi.
        </p>
      </footer>
    </div>
  );
}

// ── Werkbank (dashboard) ───────────────────────────────────────────────────────────────────
function Werkbank({ onNaarRek }: { onNaarRek: () => void }) {
  const [haak, setHaak] = useState(0);
  const maxUren = Math.max(...WEEK.map((w) => w.uren));
  const totaal = WEEK.reduce((s, w) => s + w.uren, 0);

  return (
    <div className="space-y-12">
      <section aria-label="Overzicht">
        <Titel sub="Wat er nu aan je lat hangt">Werkbank</Titel>
        <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: C.lijn }}>
          {KPIS.map((k) => (
            <div key={k.label} className="p-4" style={{ background: C.papier }}>
              <div className="text-[12px]" style={{ color: C.inktFaint }}>
                {k.label}
              </div>
              <div className="mt-2 text-[24px] font-normal tabular-nums leading-none" style={kop}>
                {k.value}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11.5px]">
                {k.up ? (
                  <Plus size={11} strokeWidth={3} style={{ color: C.ok }} aria-hidden="true" />
                ) : (
                  <Minus size={11} strokeWidth={3} style={{ color: C.warn }} aria-hidden="true" />
                )}
                <span style={{ color: k.up ? C.ok : C.warn }}>{k.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Drie haakjes: één ordening, drie lades */}
      <section aria-label="Haakjes">
        <Lat />
        <div className="mt-0 flex" role="group" aria-label="Kies een haakje">
          {HAAKJES.map((h, i) => {
            const on = i === haak;
            return (
              <div key={h.haak} className="flex flex-1 flex-col items-center">
                <span
                  className="-mt-[5px] block h-3 w-3 rounded-full"
                  style={{ background: C.hout }}
                  aria-hidden="true"
                />
                <span
                  className="block h-4 w-px"
                  style={{ background: on ? C.blauw : C.lijn }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setHaak(i)}
                  aria-pressed={on}
                  className={`w-full px-2 py-2.5 text-center transition-colors ${RING}`}
                  style={{
                    background: on ? C.papier : "transparent",
                    border: `1px solid ${on ? C.inkt : C.lijn}`,
                    color: C.inkt,
                  }}
                >
                  <span className="block text-[12px] tracking-[0.14em]" style={{ color: C.hout }}>
                    {h.haak}
                  </span>
                  <span className="mt-1 block text-[12.5px] font-medium leading-tight">
                    {h.wat}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6" style={{ background: C.papier, border: `1px solid ${C.lijn}` }}>
          {haak === 0 ? (
            <div className="p-5">
              <h3 className="text-[16px] font-normal" style={kop}>
                Deze week · {totaal} uur ingepland
              </h3>
              <ul className="mt-4 space-y-2.5">
                {WEEK.map((w) => (
                  <li key={w.dag} className="flex items-center gap-3">
                    <span
                      className="w-8 shrink-0 text-[12px] uppercase tracking-[0.08em]"
                      style={{ color: C.inktFaint }}
                    >
                      {w.dag}
                    </span>
                    <span
                      className="h-2.5 min-w-[2px]"
                      style={{
                        width: `${maxUren === 0 ? 0 : (w.uren / maxUren) * 60}%`,
                        background: w.uren === 0 ? C.lijn : C.hout,
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-[12.5px] tabular-nums" style={{ color: C.inktZacht }}>
                      {w.uren === 0 ? "vrij" : `${w.uren} u`}
                    </span>
                    <span className="ml-auto text-[12px]" style={{ color: C.inktFaint }}>
                      {w.plaats}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : haak === 1 ? (
            <ul>
              {ACTIES.map((a, i) => (
                <li
                  key={a.titel}
                  className="flex flex-wrap items-start gap-4 p-5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lijnZacht}` }}
                >
                  <span
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] tabular-nums"
                    style={{ border: `1px solid ${C.lijn}`, color: C.inktFaint }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-[14px] font-medium">{a.titel}</p>
                    <p
                      className="mt-1 text-[12.5px] leading-relaxed"
                      style={{ color: C.inktZacht }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: a.urgentie === "warning" ? C.warn : C.blauw }}
                  >
                    {a.urgentie === "warning" ? (
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <Clock size={13} aria-hidden="true" />
                    )}
                    {a.urgentie === "warning" ? "Vraagt actie" : "Ter kennisgeving"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lijnZacht}` }}
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{o.titel}</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.inktFaint }}>
                      {o.opdrachtgever} · {o.plaats} · {o.start}
                    </p>
                  </div>
                  <span className="text-[13px] tabular-nums" style={{ color: C.inktZacht }}>
                    {o.match}% · {o.tarief}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div>
        <Knop onClick={onNaarRek} variant="lijn">
          Naar het opdrachtenrek <ArrowRight size={15} aria-hidden="true" />
        </Knop>
      </div>
    </div>
  );
}

// ── Opdrachtenrek (marktplaats) — met alle toestanden ──────────────────────────────────────
type Toestand = "gereed" | "laden" | "leeg" | "fout";

function Opdrachtenrek({ onOpen }: { onOpen: (id: string) => void }) {
  const [zoek, setZoek] = useState("");
  const [toestand, setToestand] = useState<Toestand>("gereed");

  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter(
      (o) =>
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t),
    );
  }, [zoek]);

  const zichtbaar = toestand === "leeg" ? [] : lijst;

  return (
    <div className="space-y-8">
      <Titel sub="Elke opdracht hangt aan zijn eigen haak — één blik en je weet wat het is.">
        Opdrachtenrek
      </Titel>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="shk-zoek">
          Zoeken in het rek
        </label>
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 px-3 py-2"
          style={{ background: C.papier, border: `1px solid ${C.lijn}` }}
        >
          <Search size={15} style={{ color: C.inktFaint }} aria-hidden="true" />
          <input
            id="shk-zoek"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Rol, plaats of opdrachtgever"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.inkt }}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Toestand tonen">
          {(["gereed", "laden", "leeg", "fout"] as Toestand[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setToestand(t)}
              aria-pressed={toestand === t}
              className={`px-3 py-2 text-[12px] transition-colors ${RING}`}
              style={{
                background: toestand === t ? C.blauwLicht : "transparent",
                border: `1px solid ${toestand === t ? C.blauw : C.lijn}`,
                color: toestand === t ? C.blauw : C.inktZacht,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {toestand === "laden" ? (
        <div className="grid gap-6 sm:grid-cols-2" aria-busy="true" aria-live="polite">
          {[0, 1].map((n) => (
            <Hangend key={n} label="Bezig met laden">
              <div className="h-4 w-2/3" style={{ background: C.lijnZacht }} aria-hidden="true" />
              <div
                className="mt-3 h-3 w-1/2"
                style={{ background: C.lijnZacht }}
                aria-hidden="true"
              />
              <div
                className="mt-6 h-px w-full"
                style={{ background: C.lijnZacht }}
                aria-hidden="true"
              />
              <div
                className="mt-4 h-3 w-1/3"
                style={{ background: C.lijnZacht }}
                aria-hidden="true"
              />
              <p className="sr-only">Opdrachten worden opgehaald</p>
            </Hangend>
          ))}
        </div>
      ) : toestand === "fout" ? (
        <Hangend label="Fout">
          <div className="py-6 text-center">
            <Unplug
              size={22}
              className="mx-auto"
              style={{ color: C.bad }}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <h3 className="mt-3 text-[17px] font-normal" style={kop}>
              De haak is los
            </h3>
            <p
              className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed"
              style={{ color: C.inktZacht }}
            >
              We konden het rek niet ophalen. Je eigen gegevens zijn niet gewijzigd.
            </p>
            <div className="mt-5 flex justify-center">
              <Knop onClick={() => setToestand("gereed")}>
                <RefreshCw size={14} aria-hidden="true" /> Opnieuw proberen
              </Knop>
            </div>
          </div>
        </Hangend>
      ) : zichtbaar.length === 0 ? (
        <Hangend label="Leeg rek">
          <div className="py-6 text-center">
            <Inbox
              size={22}
              className="mx-auto"
              style={{ color: C.inktFaint }}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <h3 className="mt-3 text-[17px] font-normal" style={kop}>
              Het rek is leeg
            </h3>
            <p
              className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed"
              style={{ color: C.inktZacht }}
            >
              Er hangt nu niets dat aan je zoekopdracht voldoet. Haal het filter eraf en kijk
              opnieuw.
            </p>
            <div className="mt-5 flex justify-center">
              <Knop
                variant="lijn"
                onClick={() => {
                  setZoek("");
                  setToestand("gereed");
                }}
              >
                Zoekopdracht wissen
              </Knop>
            </div>
          </div>
        </Hangend>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {zichtbaar.map((o) => (
            <Hangend key={o.id} label={o.titel}>
              <h3 className="text-[18px] font-normal leading-snug" style={kop}>
                {o.titel}
              </h3>
              <p className="mt-1.5 text-[12.5px]" style={{ color: C.inktZacht }}>
                {o.opdrachtgever}
              </p>
              <dl className="mt-4 space-y-2">
                {[
                  { l: "Plaats", v: o.plaats },
                  { l: "Tarief", v: o.tarief },
                  { l: "Omvang", v: o.uren },
                  { l: "Start", v: o.start },
                ].map((r) => (
                  <div
                    key={r.l}
                    className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-b-0"
                    style={{ borderColor: C.lijnZacht }}
                  >
                    <dt className="text-[12px]" style={{ color: C.inktFaint }}>
                      {r.l}
                    </dt>
                    <dd className="text-[13px] tabular-nums">{r.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[12px]" style={{ color: C.inktFaint }}>
                  Match
                </span>
                <span className="h-2 flex-1" style={{ background: C.lijnZacht }} aria-hidden="true">
                  <span
                    className="block h-full"
                    style={{ width: `${o.match}%`, background: C.blauw }}
                  />
                </span>
                <span className="text-[12.5px] tabular-nums">{o.match}%</span>
              </div>
              <div className="mt-5">
                <Knop onClick={() => onOpen(o.id)} variant="lijn" className="w-full">
                  Opdrachtblad openen <ArrowRight size={14} aria-hidden="true" />
                </Knop>
              </div>
            </Hangend>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdrachtblad (detail) ──────────────────────────────────────────────────────────────────
function Opdrachtblad({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [uitgeklapt, setUitgeklapt] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <button
        type="button"
        onClick={onTerug}
        className={`inline-flex items-center gap-2 text-[12.5px] font-medium ${RING}`}
        style={{ color: C.inktZacht }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar het rek
      </button>

      <header>
        <p className="text-[12px] tracking-[0.1em]" style={{ color: C.hout }}>
          {opdracht.id}
        </p>
        <h1
          className="mt-2 text-[26px] font-normal leading-tight tracking-[-0.015em] sm:text-[34px]"
          style={kop}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inktZacht }}>
          {opdracht.opdrachtgever} ·{" "}
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" /> {opdracht.plaats}
          </span>
        </p>
      </header>

      <div className="grid gap-px sm:grid-cols-4" style={{ background: C.lijn }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((f) => (
          <div key={f.l} className="p-4" style={{ background: C.papier }}>
            <div className="text-[12px]" style={{ color: C.inktFaint }}>
              {f.l}
            </div>
            <div className="mt-1.5 text-[17px] font-normal tabular-nums" style={kop}>
              {f.v}
            </div>
          </div>
        ))}
      </div>

      <section aria-label="Waarom deze match">
        <Lat />
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <Hangend label="Voor">
            <h3 className="text-[16px] font-normal" style={kop}>
              Wat ervoor pleit
            </h3>
            <ul className="mt-3 space-y-1">
              {opdracht.redenen.plus.map((r, i) => {
                const open = uitgeklapt === `plus-${i}`;
                return (
                  <li key={r} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                    <button
                      type="button"
                      onClick={() => setUitgeklapt(open ? null : `plus-${i}`)}
                      aria-expanded={open}
                      className={`flex w-full items-start gap-2.5 py-2.5 text-left ${RING}`}
                    >
                      <Check
                        size={14}
                        strokeWidth={2.6}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.ok }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-[13px] leading-snug">{r}</span>
                      <ChevronDown
                        size={14}
                        className="mt-0.5 shrink-0 transition-transform"
                        style={{
                          color: C.inktFaint,
                          transform: open ? "rotate(180deg)" : "none",
                        }}
                        aria-hidden="true"
                      />
                    </button>
                    {open ? (
                      <p
                        className="pb-3 pl-6 text-[12.5px] leading-relaxed"
                        style={{ color: C.inktZacht }}
                      >
                        Weegt {68 + i * 11} van de 100 mee in de score. Deze reden is server-side
                        vastgesteld op basis van je geverifieerde gegevens.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Hangend>

          <Hangend label="Tegen">
            <h3 className="text-[16px] font-normal" style={kop}>
              Wat je moet wegen
            </h3>
            <ul className="mt-3 space-y-1">
              {opdracht.redenen.min.map((r, i) => {
                const open = uitgeklapt === `min-${i}`;
                return (
                  <li key={r} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                    <button
                      type="button"
                      onClick={() => setUitgeklapt(open ? null : `min-${i}`)}
                      aria-expanded={open}
                      className={`flex w-full items-start gap-2.5 py-2.5 text-left ${RING}`}
                    >
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.4}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.warn }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-[13px] leading-snug">{r}</span>
                      <ChevronDown
                        size={14}
                        className="mt-0.5 shrink-0 transition-transform"
                        style={{
                          color: C.inktFaint,
                          transform: open ? "rotate(180deg)" : "none",
                        }}
                        aria-hidden="true"
                      />
                    </button>
                    {open ? (
                      <p
                        className="pb-3 pl-6 text-[12.5px] leading-relaxed"
                        style={{ color: C.inktZacht }}
                      >
                        Trekt {18 + i * 9} punten van de score af. Bespreek dit vooraf met de
                        opdrachtgever, dan weet je waar je aan toe bent.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Hangend>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Knop>Reageren op deze opdracht</Knop>
        <Knop variant="lijn">Aan je eigen haak hangen</Knop>
        <Knop disabled title="Beschikbaar zodra je VOG opnieuw is geverifieerd">
          Direct bevestigen
        </Knop>
      </div>
    </div>
  );
}

// ── Certificaten (verificatie) ─────────────────────────────────────────────────────────────
function Certificaten() {
  const [alleenActie, setAlleenActie] = useState(false);
  const zichtbaar = CREDENTIALS.filter((c) => !alleenActie || c.status !== "VERIFIED");
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Titel sub={`${geverifieerd} van ${CREDENTIALS.length} certificaten zijn geverifieerd.`}>
          Certificaten aan de lat
        </Titel>
        <Knop
          variant="stil"
          onClick={() => setAlleenActie((v) => !v)}
          ariaPressed={alleenActie}
          className="mb-4"
        >
          {alleenActie ? "Toon alles" : "Toon wat actie vraagt"}
        </Knop>
      </div>

      <div
        className="flex flex-wrap items-center gap-4 p-5"
        style={{ background: C.papier, border: `1px solid ${C.inkt}` }}
      >
        <ShieldCheck size={20} style={{ color: C.blauw }} strokeWidth={1.8} aria-hidden="true" />
        <div className="min-w-[200px] flex-1">
          <p className="text-[14px] font-medium">{PROFIEL.trust}</p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inktZacht }}>
            Opdrachtgevers zien alleen de status, nooit het document zelf.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-28" style={{ background: C.lijnZacht }} aria-hidden="true">
            <span
              className="block h-full"
              style={{
                width: `${Math.round((geverifieerd / CREDENTIALS.length) * 100)}%`,
                background: C.blauw,
              }}
            />
          </span>
          <span className="text-[12.5px] tabular-nums" style={{ color: C.inktZacht }}>
            {Math.round((geverifieerd / CREDENTIALS.length) * 100)}%
          </span>
        </div>
      </div>

      <Lat />
      {zichtbaar.length === 0 ? (
        <Hangend label="Niets te doen">
          <div className="py-6 text-center">
            <Check
              size={22}
              strokeWidth={2.4}
              className="mx-auto"
              style={{ color: C.ok }}
              aria-hidden="true"
            />
            <h3 className="mt-3 text-[17px] font-normal" style={kop}>
              Niets te regelen
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.inktZacht }}>
              Alle certificaten zijn geverifieerd en geldig.
            </p>
          </div>
        </Hangend>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {zichtbaar.map((c) => (
            <Hangend key={c.naam} label={c.naam}>
              <h3 className="text-[16px] font-normal leading-snug" style={kop}>
                {c.naam}
              </h3>
              <p className="mt-1.5 text-[12.5px]" style={{ color: C.inktZacht }}>
                {c.detail}
              </p>
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
                style={{ borderColor: C.lijnZacht }}
              >
                <Merk status={c.status} />
                {c.status === "VERIFIED" ? (
                  <Knop disabled title="Geverifieerd en geldig — er is nu niets te doen">
                    Geen actie nodig
                  </Knop>
                ) : (
                  <Knop>
                    {c.status === "EXPIRING" ? "Vernieuwen" : "Status bekijken"}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Knop>
                )}
              </div>
            </Hangend>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dagorde (acties) ───────────────────────────────────────────────────────────────────────
function Dagorde({ onNaarCert }: { onNaarCert: () => void }) {
  const [afgevinkt, setAfgevinkt] = useState<string[]>([]);
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const open = gesorteerd.filter((a) => !afgevinkt.includes(a.titel));

  return (
    <div className="space-y-8">
      <Titel sub="Op volgorde van belang. Eén ding tegelijk, en dan echt af.">Dagorde</Titel>

      {open.length === 0 ? (
        <Hangend label="Dagorde leeg">
          <div className="py-8 text-center">
            <Check
              size={22}
              strokeWidth={2.4}
              className="mx-auto"
              style={{ color: C.ok }}
              aria-hidden="true"
            />
            <h3 className="mt-3 text-[17px] font-normal" style={kop}>
              De lat is leeg
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.inktZacht }}>
              Alles is afgewerkt. Nieuwe punten verschijnen vanzelf zodra er iets verandert.
            </p>
            <div className="mt-5 flex justify-center">
              <Knop variant="lijn" onClick={() => setAfgevinkt([])}>
                Dagorde terugzetten
              </Knop>
            </div>
          </div>
        </Hangend>
      ) : (
        <ol className="space-y-8">
          {open.map((a, i) => (
            <li key={a.titel}>
              <Hangend label={a.titel}>
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[12px] tabular-nums"
                    style={{ border: `1px solid ${C.inkt}`, color: C.inkt }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <h3 className="text-[16px] font-normal leading-snug" style={kop}>
                      {a.titel}
                    </h3>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ color: C.inktZacht }}
                    >
                      {a.detail}
                    </p>
                    <p
                      className="mt-2 inline-flex items-center gap-1.5 text-[11.5px]"
                      style={{ color: a.urgentie === "warning" ? C.warn : C.blauw }}
                    >
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={12} aria-hidden="true" />
                      ) : (
                        <Clock size={12} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Vraagt actie" : "Ter kennisgeving"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Knop onClick={onNaarCert}>{a.cta}</Knop>
                    <Knop variant="stil" onClick={() => setAfgevinkt((g) => [...g, a.titel])}>
                      Van de haak halen
                    </Knop>
                  </div>
                </div>
              </Hangend>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Kasboek (facturen) ─────────────────────────────────────────────────────────────────────
function Kasboek() {
  const [oplopend, setOplopend] = useState(false);
  const bedrag = (b: string): number => Number(b.replace(/[^0-9]/g, "")) || 0;
  const rijen = useMemo(
    () =>
      [...FACTUREN].sort((a, b) =>
        oplopend ? bedrag(a.bedrag) - bedrag(b.bedrag) : bedrag(b.bedrag) - bedrag(a.bedrag),
      ),
    [oplopend],
  );
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");

  const tone = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.inktFaint;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Titel sub={`${openstaand.length} factuur wacht nog op betaling. Alles staat op één blad.`}>
          Kasboek
        </Titel>
        <Knop
          variant="stil"
          onClick={() => setOplopend((v) => !v)}
          ariaPressed={oplopend}
          className="mb-4"
        >
          <ArrowUpDown size={14} aria-hidden="true" />
          Bedrag {oplopend ? "oplopend" : "aflopend"}
        </Knop>
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.lijn}` }}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr style={{ background: C.papier, borderBottom: `1px solid ${C.inkt}` }}>
              {["Nummer", "Opdrachtgever", "Datum", "Status", "Bedrag"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[11.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: C.inktFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: C.papier }}>
            {rijen.map((f) => (
              <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                <th scope="row" className="px-4 py-3 text-left text-[12.5px] font-medium">
                  {f.nr}
                </th>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: C.inktZacht }}>
                  {f.datum}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px]"
                    style={{ color: tone(f.status) }}
                  >
                    {f.status === "Betaald" ? (
                      <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                    ) : f.status === "Openstaand" ? (
                      <Clock size={12} strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <FileText size={12} strokeWidth={2.6} aria-hidden="true" />
                    )}
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[13px] tabular-nums">{f.bedrag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openstaand.length > 0 ? (
        <Hangend label="Openstaand">
          <h3 className="text-[16px] font-normal" style={kop}>
            Nog te ontvangen
          </h3>
          <ul className="mt-3 space-y-2">
            {openstaand.map((f) => (
              <li key={f.nr} className="flex items-center justify-between gap-3">
                <span className="text-[13px]">
                  {f.nr} · {f.klant}
                </span>
                <span className="text-[13px] tabular-nums">{f.bedrag}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Knop>Herinnering sturen</Knop>
          </div>
        </Hangend>
      ) : null}
    </div>
  );
}

// ── Documentenrek ──────────────────────────────────────────────────────────────────────────
function DocumentenRek() {
  const [open, setOpen] = useState<string | null>(DOCUMENTEN[0]?.naam ?? null);

  return (
    <div className="space-y-8">
      <Titel sub="Privé opgeborgen. Alleen jij bepaalt wie iets van de haak mag halen.">
        Documentenrek
      </Titel>
      <Lat />
      <ul className="space-y-1">
        {DOCUMENTEN.map((d) => {
          const uit = open === d.naam;
          return (
            <li key={d.naam} style={{ borderBottom: `1px solid ${C.lijn}` }}>
              <button
                type="button"
                onClick={() => setOpen(uit ? null : d.naam)}
                aria-expanded={uit}
                className={`flex w-full flex-wrap items-center gap-3 px-1 py-4 text-left ${RING}`}
              >
                <Peg />
                <FileText size={16} style={{ color: C.hout }} aria-hidden="true" />
                <span className="min-w-[160px] flex-1 text-[13.5px] font-medium">{d.naam}</span>
                <span className="text-[12px] tabular-nums" style={{ color: C.inktFaint }}>
                  {d.type} · {d.grootte}
                </span>
                <Merk status={d.status} />
                <ChevronDown
                  size={15}
                  className="transition-transform"
                  style={{ color: C.inktFaint, transform: uit ? "rotate(180deg)" : "none" }}
                  aria-hidden="true"
                />
              </button>
              {uit ? (
                <div className="pb-5 pl-8 pr-1">
                  <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {[
                      { l: "Bijgewerkt", v: d.bijgewerkt },
                      { l: "Zichtbaar voor", v: "Alleen jij en de beoordelaar" },
                      { l: "Bewaartermijn", v: "Zolang je account bestaat" },
                      { l: "Bestandstype", v: `${d.type} · ${d.grootte}` },
                    ].map((r) => (
                      <div key={r.l} className="flex items-baseline justify-between gap-3">
                        <dt className="text-[12px]" style={{ color: C.inktFaint }}>
                          {r.l}
                        </dt>
                        <dd className="text-[12.5px]">{r.v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Knop variant="lijn">Vervangen</Knop>
                    <Knop
                      variant="stil"
                      disabled={d.status === "SUBMITTED"}
                      title={
                        d.status === "SUBMITTED"
                          ? "Kan niet worden verwijderd zolang het in beoordeling is"
                          : undefined
                      }
                    >
                      Van de haak halen
                    </Knop>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Naamplaat (profiel) ────────────────────────────────────────────────────────────────────
function Naamplaat() {
  return (
    <div className="space-y-10">
      <Titel sub="Wie je bent, in één blad. Niet meer dan nodig.">Naamplaat</Titel>

      <section
        className="flex flex-wrap items-center gap-5 p-6"
        style={{ background: C.papier, border: `1px solid ${C.inkt}` }}
        aria-label="Persoonsgegevens"
      >
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center text-[16px]"
          style={{ border: `1px solid ${C.hout}`, color: C.hout, ...kop }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
        <div className="min-w-[200px] flex-1">
          <h2 className="text-[22px] font-normal leading-tight" style={kop}>
            {PROFIEL.naam}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: C.inktZacht }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
          <p
            className="mt-2 inline-flex items-center gap-1.5 text-[12px]"
            style={{ color: C.blauw }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </p>
        </div>
        <Knop variant="lijn">Gegevens bewerken</Knop>
      </section>

      <section aria-label="Vakmanschap">
        <Lat />
        <h3 className="mt-6 text-[17px] font-normal" style={kop}>
          Vakmanschap
        </h3>
        <ol className="mt-3">
          {VAKMANSCHAP.map((v) => (
            <li
              key={v.titel}
              className="flex flex-wrap items-baseline justify-between gap-3 py-3.5"
              style={{ borderBottom: `1px solid ${C.lijnZacht}` }}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium">{v.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.inktZacht }}>
                  {v.waar}
                </p>
              </div>
              <span className="text-[12.5px] tabular-nums" style={{ color: C.inktFaint }}>
                {v.jaren}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Certificaten in het kort">
        <h3 className="text-[17px] font-normal" style={kop}>
          Certificaten in het kort
        </h3>
        <ul className="mt-3 grid gap-px sm:grid-cols-2" style={{ background: C.lijn }}>
          {CREDENTIALS.map((c) => (
            <li key={c.naam} className="p-4" style={{ background: C.papier }}>
              <p className="text-[13.5px] font-medium">{c.naam}</p>
              <div className="mt-1.5">
                <Merk status={c.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
