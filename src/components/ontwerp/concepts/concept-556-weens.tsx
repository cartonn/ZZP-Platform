"use client";

// Concept 556 — "Weens" · Wiener Werkstätte / Weense Secession (Josef Hoffmann, Koloman Moser,
// ca. 1903-1910). Het gitter draagt alles: een obsessief zwart-wit vierkantsraster als structuur,
// gevlochten kaderranden, schaakbordstroken en vierkantjes-rijen die ornament én maatstaf zijn.
// Eén spaarzaam bladgoud-accent markeert wat geverifieerd en vertrouwd is. Het raster ordent —
// het versiert niet alleen: elke vierkantjes-rij is tegelijk een meetlat.
// Inspiratie/bronnen: Wiener Werkstätte-overzichten (theartstory.org, Klimt-Datenbank, Minnie
// Muse) over "contrasten van zwart en wit, ornament gebaseerd op het vierkant"; Hoffmanns
// "Gitterwerk" (o.a. de bloemenmand uit 1906) en Mosers Series-B-meubels; de Secession-traditie
// van wijd gespatieerde kapitalen.
// Deterministisch: geen random, geen datum-afhankelijkheid. Alle grafiek is eigen CSS/SVG.
// Fonts: Space Grotesk (koppen, uppercase, wijde letterspacing) + Libre Franklin (body).

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
  Search,
  Send,
  ShieldCheck,
  Unplug,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ACTIES,
  BERICHTEN,
  CREDENTIALS,
  FACTUREN,
  KPIS,
  OPDRACHTEN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
  type ScreenKey,
} from "./mock";

// ── Palet — bijna-zwart op wit, één bladgoud-accent ────────────────────────────────────────
const C = {
  wit: "#fbfbf9",
  blad: "#ffffff",
  inkt: "#141414",
  inktZacht: "#4a4a48",
  inktFaint: "#6a6a66",
  lijn: "#141414",
  lijnZacht: "#dcdcd6",
  goud: "#c9a227",
  goudDiep: "#8a6f14",
} as const;

const kop = {
  fontFamily: "var(--font-lab-space)",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
};
const body = { fontFamily: "var(--font-lab-franklin)" };

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]";

type Scherm = ScreenKey | "queue";

const SCHERMEN: { key: Scherm; label: string; nr: string }[] = [
  { key: "dashboard", label: "Overzicht", nr: "I" },
  { key: "marktplaats", label: "Register", nr: "II" },
  { key: "opdracht", label: "Opdracht", nr: "III" },
  { key: "verificatie", label: "Verificatie", nr: "IV" },
  { key: "acties", label: "Acties", nr: "V" },
  { key: "facturen", label: "Facturen", nr: "VI" },
  { key: "berichten", label: "Berichten", nr: "VII" },
  { key: "queue", label: "Beoordeling", nr: "VIII" },
];

// ── Lokale, presentationele mock ───────────────────────────────────────────────────────────
type QueueRij = {
  id: string;
  persoon: string;
  initialen: string;
  document: string;
  ingediend: string;
  bron: string;
};

const QUEUE: QueueRij[] = [
  {
    id: "VER-4411",
    persoon: "Sanne de Vries",
    initialen: "SV",
    document: "Reanimatie / BLS",
    ingediend: "21 juni",
    bron: "Eigen upload · PDF",
  },
  {
    id: "VER-4410",
    persoon: "Peter Sanders",
    initialen: "PS",
    document: "BIG-registratie",
    ingediend: "20 juni",
    bron: "Register-controle",
  },
  {
    id: "VER-4408",
    persoon: "Nienke Prins",
    initialen: "NP",
    document: "VOG (zorg)",
    ingediend: "19 juni",
    bron: "Eigen upload · PDF",
  },
  {
    id: "VER-4405",
    persoon: "Timo Kortekaas",
    initialen: "TK",
    document: "SKJ-registratie",
    ingediend: "18 juni",
    bron: "Register-controle",
  },
];

const THREAD: { van: "wij" | "zij"; tekst: string; tijd: string }[] = [
  { van: "zij", tekst: "Goedemorgen Sanne, is de avonddienst van 1 juli akkoord?", tijd: "08:41" },
  { van: "wij", tekst: "Ja, maandag en woensdag kan ik. Vrijdag helaas niet.", tijd: "09:02" },
  {
    van: "zij",
    tekst: "Top, we plannen je graag in voor de avonddienst per 1 juli.",
    tijd: "09:24",
  },
];

// ── Ornament uit het raster ────────────────────────────────────────────────────────────────

/** Schaakbordstrook — het meest herkenbare Weense randmotief, opgebouwd uit 8px-vierkanten. */
function Schaakrand({ hoogte = 8, dubbel = false }: { hoogte?: number; dubbel?: boolean }) {
  const strook = (offset: number) => (
    <div
      className="w-full"
      style={{
        height: hoogte,
        backgroundImage: `linear-gradient(90deg, ${C.inkt} 50%, transparent 50%)`,
        backgroundSize: `${hoogte * 2}px ${hoogte}px`,
        backgroundPosition: `${offset}px 0`,
      }}
    />
  );
  return (
    <div aria-hidden="true" className="w-full">
      {strook(0)}
      {dubbel ? strook(hoogte) : null}
    </div>
  );
}

/** Gitterwerk — het raster van Hoffmann als achtergrond, altijd decoratief. */
function Gitter({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `linear-gradient(${C.inkt} 1px, transparent 1px), linear-gradient(90deg, ${C.inkt} 1px, transparent 1px)`,
        backgroundSize: "8px 8px",
      }}
    />
  );
}

/** Kader met gevlochten hoeken: vier kleine vierkanten die het raster vasthouden. */
function Kader({
  children,
  label,
  goud = false,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  goud?: boolean;
  className?: string;
}) {
  const hoek = (pos: string) => (
    <span
      aria-hidden="true"
      className={`absolute h-2 w-2 ${pos}`}
      style={{ background: goud ? C.goud : C.inkt }}
    />
  );
  return (
    <section
      aria-label={label}
      className={`relative ${className}`}
      style={{ border: `1px solid ${C.inkt}`, background: C.blad }}
    >
      {hoek("-left-px -top-px")}
      {hoek("-right-px -top-px")}
      {hoek("-bottom-px -left-px")}
      {hoek("-bottom-px -right-px")}
      {children}
    </section>
  );
}

/** Vierkantjes-rij: ornament én meetlat. Gevulde vierkanten = bereikte waarde. */
function Meetlat({
  waarde,
  totaal = 10,
  label,
}: {
  waarde: number;
  totaal?: number;
  label: string;
}) {
  const gevuld = Math.max(0, Math.min(totaal, Math.round((waarde / 100) * totaal)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px]" style={{ ...kop, color: C.inktFaint }}>
          {label}
        </span>
        <span className="text-[12px] tabular-nums" style={{ color: C.inkt }}>
          {waarde}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {Array.from({ length: totaal }, (_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1"
            style={{
              background: i < gevuld ? (i === gevuld - 1 ? C.goud : C.inkt) : "transparent",
              border: `1px solid ${i < gevuld ? "transparent" : C.lijnZacht}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Monogram-blok: initialen in een vierkant, met gouden onderregel bij vertrouwd. */
function Monogram({
  initialen,
  groot = false,
  vertrouwd = false,
}: {
  initialen: string;
  groot?: boolean;
  vertrouwd?: boolean;
}) {
  const d = groot ? 56 : 36;
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: d,
        height: d,
        border: `1px solid ${C.inkt}`,
        borderBottom: vertrouwd ? `3px solid ${C.goud}` : `1px solid ${C.inkt}`,
        background: C.blad,
      }}
      aria-hidden="true"
    >
      <span
        className={groot ? "text-[16px]" : "text-[11px]"}
        style={{ ...kop, color: C.inkt, letterSpacing: "0.1em" }}
      >
        {initialen}
      </span>
    </span>
  );
}

function Kop({ nr, children, sub }: { nr?: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-3">
        {nr ? (
          <span className="text-[11px]" style={{ ...kop, color: C.goudDiep }}>
            {nr}
          </span>
        ) : null}
        <h2 className="text-[15px] leading-tight sm:text-[18px]" style={{ ...kop, color: C.inkt }}>
          {children}
        </h2>
      </div>
      {sub ? (
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

// Status zonder kleur-afhankelijkheid: label + icoon + vulpatroon van het vierkant.
function credMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  vulling: string;
  goud: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, vulling: C.inkt, goud: true };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, vulling: "repeating", goud: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, vulling: "leeg", goud: false };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, vulling: "kruis", goud: false };
  }
}

function StatusMerk({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const vak =
    m.vulling === "repeating"
      ? {
          backgroundImage: `repeating-linear-gradient(45deg, ${C.inkt} 0 2px, transparent 2px 4px)`,
          border: `1px solid ${C.inkt}`,
        }
      : m.vulling === "leeg"
        ? { border: `1px solid ${C.inkt}` }
        : m.vulling === "kruis"
          ? {
              backgroundImage: `linear-gradient(45deg, transparent 45%, ${C.inkt} 45% 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, ${C.inkt} 45% 55%, transparent 55%)`,
              border: `1px solid ${C.inkt}`,
            }
          : { background: C.inkt, borderBottom: `3px solid ${C.goud}` };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3 w-3 shrink-0" style={vak} aria-hidden="true" />
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" style={{ color: C.inkt }} />
      <span className="text-[10px]" style={{ ...kop, color: C.inkt }}>
        {m.label}
      </span>
    </span>
  );
}

function Knop({
  children,
  onClick,
  variant = "vol",
  type = "button",
  disabled = false,
  title,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "vol" | "lijn" | "goud";
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
  ariaPressed?: boolean;
  className?: string;
}) {
  const stijl =
    variant === "vol"
      ? { background: C.inkt, color: C.blad, border: `1px solid ${C.inkt}` }
      : variant === "goud"
        ? {
            background: C.blad,
            color: C.inkt,
            border: `1px solid ${C.inkt}`,
            borderBottomWidth: 3,
            borderBottomColor: C.goud,
          }
        : { background: "transparent", color: C.inkt, border: `1px solid ${C.inkt}` };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[10.5px] transition-opacity hover:opacity-80 ${RING} ${className}`}
      style={{
        ...kop,
        ...stijl,
        ...(disabled
          ? {
              background: C.blad,
              color: C.inktFaint,
              borderColor: C.lijnZacht,
              cursor: "not-allowed",
              opacity: 1,
            }
          : {}),
      }}
    >
      {children}
    </button>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────────
export function Concept556() {
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
      style={{ ...body, background: C.wit, color: C.inkt }}
    >
      <Schaakrand hoogte={8} dubbel />

      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Monogram initialen="WW" groot vertrouwd />
            <div>
              <h1 className="text-[18px] leading-none sm:text-[22px]" style={kop}>
                Weens
              </h1>
              <p className="mt-2 text-[12px]" style={{ color: C.inktFaint }}>
                Werkplaats voor zelfstandigen · Utrecht
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monogram initialen={PROFIEL.initialen} vertrouwd />
            <div className="text-right">
              <div className="text-[13px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[11.5px]" style={{ color: C.inktFaint }}>
                {PROFIEL.rol}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="mx-auto mt-7 max-w-6xl px-4 sm:px-8" aria-label="Schermen">
        <div
          className="overflow-x-auto"
          style={{ borderTop: `1px solid ${C.inkt}`, borderBottom: `1px solid ${C.inkt}` }}
        >
          <div className="flex min-w-max" role="tablist">
            {SCHERMEN.map((s, i) => {
              const on = s.key === scherm;
              return (
                <button
                  key={s.key}
                  role="tab"
                  type="button"
                  id={`wns-tab-${s.key}`}
                  aria-selected={on}
                  aria-controls="wns-panel"
                  onClick={() => setScherm(s.key)}
                  className={`flex shrink-0 items-baseline gap-2 px-4 py-3 transition-colors ${RING}`}
                  style={{
                    background: on ? C.inkt : "transparent",
                    color: on ? C.blad : C.inkt,
                    borderLeft: i === 0 ? "none" : `1px solid ${C.lijnZacht}`,
                  }}
                >
                  <span
                    className="text-[9.5px]"
                    style={{ ...kop, color: on ? C.goud : C.inktFaint }}
                  >
                    {s.nr}
                  </span>
                  <span className="text-[11px]" style={kop}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main
        id="wns-panel"
        role="tabpanel"
        aria-labelledby={`wns-tab-${scherm}`}
        className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-12"
      >
        {scherm === "dashboard" && <Overzicht onNaarRegister={() => setScherm("marktplaats")} />}
        {scherm === "marktplaats" && <Register onOpen={open} />}
        {scherm === "opdracht" && (
          <OpdrachtBlad opdracht={opdracht} onTerug={() => setScherm("marktplaats")} />
        )}
        {scherm === "verificatie" && <Verificatie />}
        {scherm === "acties" && <Acties onNaarVerificatie={() => setScherm("verificatie")} />}
        {scherm === "facturen" && <Facturen />}
        {scherm === "berichten" && <Berichten />}
        {scherm === "queue" && <Beoordeling />}
        {scherm === "documenten" && <Verificatie />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
        <Schaakrand hoogte={6} />
        <p className="mt-4 text-center text-[10px]" style={{ ...kop, color: C.inktFaint }}>
          Het raster ordent · goud markeert wat geverifieerd is
        </p>
      </footer>
    </div>
  );
}

// ── I. Overzicht (dashboard) ───────────────────────────────────────────────────────────────
function Overzicht({ onNaarRegister }: { onNaarRegister: () => void }) {
  const [paneel, setPaneel] = useState<"acties" | "opdrachten">("acties");
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-10">
      <Kop
        nr="I"
        sub="Alles staat op hetzelfde raster: één blik leert je de stand, de eerstvolgende stap en wat je kunt vertrouwen."
      >
        Overzicht
      </Kop>

      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: C.inkt }}>
        {KPIS.map((k, i) => {
          const max = Math.max(...k.spark);
          return (
            <div
              key={k.label}
              className="relative overflow-hidden p-5"
              style={{ background: C.blad }}
            >
              <Gitter opacity={0.05} />
              <div className="relative">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[9.5px]" style={{ ...kop, color: C.inktFaint }}>
                    {k.label}
                  </span>
                  <span className="text-[9.5px]" style={{ ...kop, color: C.goudDiep }}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                </div>
                <div className="mt-3 text-[26px] font-semibold tabular-nums leading-none">
                  {k.value}
                </div>
                <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">
                  {k.spark.map((v, j) => (
                    <span
                      key={j}
                      className="flex-1"
                      style={{
                        height: `${Math.max(12, (v / max) * 100)}%`,
                        background: j === k.spark.length - 1 ? C.goud : C.inkt,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 text-[11px]" style={{ color: C.inktZacht }}>
                  {k.trend} tegenover vorige week
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div
            className="flex"
            role="group"
            aria-label="Paneel kiezen"
            style={{ borderBottom: `1px solid ${C.inkt}` }}
          >
            {(
              [
                { k: "acties", l: "Eerstvolgende stappen" },
                { k: "opdrachten", l: "Nieuwe opdrachten" },
              ] as const
            ).map((t) => {
              const on = paneel === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setPaneel(t.k)}
                  aria-pressed={on}
                  className={`px-4 py-2.5 text-[10.5px] ${RING}`}
                  style={{
                    ...kop,
                    background: on ? C.inkt : "transparent",
                    color: on ? C.blad : C.inktZacht,
                  }}
                >
                  {t.l}
                </button>
              );
            })}
          </div>

          {paneel === "acties" ? (
            <ol className="mt-6 space-y-px" style={{ background: C.lijnZacht }}>
              {ACTIES.map((a, i) => (
                <li
                  key={a.titel}
                  className="flex flex-wrap items-start gap-4 p-5"
                  style={{ background: C.blad }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[11px] tabular-nums"
                    style={{
                      ...kop,
                      border: `1px solid ${C.inkt}`,
                      borderBottom: a.urgentie === "warning" ? `3px solid ${C.goud}` : undefined,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[13.5px] font-semibold">{a.titel}</p>
                    <p
                      className="mt-1 text-[12.5px] leading-relaxed"
                      style={{ color: C.inktZacht }}
                    >
                      {a.detail}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[10px]" style={kop}>
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={12} aria-hidden="true" />
                      ) : (
                        <Clock size={12} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Vraagt actie" : "Ter kennisgeving"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="mt-6 space-y-px" style={{ background: C.lijnZacht }}>
              {OPDRACHTEN.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                  style={{ background: C.blad }}
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold">{o.titel}</p>
                    <p className="mt-1 text-[12px]" style={{ color: C.inktFaint }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </p>
                  </div>
                  <div className="w-40 shrink-0">
                    <Meetlat waarde={o.match} label="Match" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <Knop variant="lijn" onClick={onNaarRegister}>
              Naar het register <ArrowRight size={13} aria-hidden="true" />
            </Knop>
          </div>
        </div>

        <div className="space-y-6">
          <Kader label="Vertrouwen" goud className="p-5">
            <p className="text-[10px]" style={{ ...kop, color: C.goudDiep }}>
              Vertrouwensniveau
            </p>
            <p className="mt-3 text-[20px] font-semibold leading-tight">{PROFIEL.trust}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.inktZacht }}>
              {geverifieerd} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Goud in het
              raster betekent: door een mens gecontroleerd.
            </p>
            <div className="mt-4">
              <Meetlat
                waarde={Math.round((geverifieerd / CREDENTIALS.length) * 100)}
                label="Dossier compleet"
              />
            </div>
          </Kader>

          <Kader label="Weekbeeld" className="p-5">
            <p className="text-[10px]" style={{ ...kop, color: C.inktFaint }}>
              Weekbeeld
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => {
                const gevuld = (i * 5) % 7 < 4;
                const goud = i === 11 || i === 22;
                return (
                  <span
                    key={i}
                    className="aspect-square w-full"
                    style={{
                      background: goud ? C.goud : gevuld ? C.inkt : "transparent",
                      border: gevuld || goud ? "none" : `1px solid ${C.lijnZacht}`,
                    }}
                  />
                );
              })}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: C.inktZacht }}>
              Elk vierkant is een dagdeel. Gevuld = ingepland, goud = bevestigde nieuwe opdracht.
            </p>
          </Kader>
        </div>
      </div>
    </div>
  );
}

// ── II. Register (marktplaats) ─────────────────────────────────────────────────────────────
type Toestand = "gereed" | "laden" | "leeg" | "fout";

function Register({ onOpen }: { onOpen: (id: string) => void }) {
  const [zoek, setZoek] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [toestand, setToestand] = useState<Toestand>("gereed");

  const tags = useMemo(() => {
    const set = new Set<string>();
    OPDRACHTEN.forEach((o) => o.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, []);

  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter((o) => {
      const tekst =
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t);
      const label = !tag || o.tags.includes(tag);
      return tekst && label;
    });
  }, [zoek, tag]);

  const zichtbaar = toestand === "leeg" ? [] : lijst;

  return (
    <div className="space-y-8">
      <Kop
        nr="II"
        sub="Het register van openstaande opdrachten. Filter op eigenschap; de meetlat toont hoe goed elke opdracht op jouw profiel past."
      >
        Register
      </Kop>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="wns-zoek">
          Zoeken in het register
        </label>
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 px-3 py-2"
          style={{ border: `1px solid ${C.inkt}`, background: C.blad }}
        >
          <Search size={15} aria-hidden="true" />
          <input
            id="wns-zoek"
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
              className={`px-3 py-2 text-[9.5px] ${RING}`}
              style={{
                ...kop,
                background: toestand === t ? C.inkt : "transparent",
                color: toestand === t ? C.blad : C.inktZacht,
                border: `1px solid ${toestand === t ? C.inkt : C.lijnZacht}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filteren op eigenschap">
        <button
          type="button"
          onClick={() => setTag(null)}
          aria-pressed={tag === null}
          className={`px-3 py-1.5 text-[9.5px] ${RING}`}
          style={{
            ...kop,
            background: tag === null ? C.inkt : "transparent",
            color: tag === null ? C.blad : C.inkt,
            border: `1px solid ${C.inkt}`,
          }}
        >
          Alles
        </button>
        {tags.map((t) => {
          const on = tag === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTag(on ? null : t)}
              aria-pressed={on}
              className={`px-3 py-1.5 text-[9.5px] ${RING}`}
              style={{
                ...kop,
                background: on ? C.inkt : "transparent",
                color: on ? C.blad : C.inkt,
                border: `1px solid ${on ? C.inkt : C.lijnZacht}`,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {toestand === "laden" ? (
        <div
          className="grid gap-px sm:grid-cols-2"
          style={{ background: C.lijnZacht }}
          aria-busy="true"
          aria-live="polite"
        >
          {[0, 1].map((n) => (
            <div key={n} className="p-6" style={{ background: C.blad }}>
              <div className="h-4 w-2/3" style={{ background: C.lijnZacht }} aria-hidden="true" />
              <div
                className="mt-3 h-3 w-1/2"
                style={{ background: C.lijnZacht }}
                aria-hidden="true"
              />
              <div className="mt-6 flex gap-1" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className="h-2.5 flex-1"
                    style={{ border: `1px solid ${C.lijnZacht}` }}
                  />
                ))}
              </div>
              <p className="sr-only">Register wordt geladen</p>
            </div>
          ))}
        </div>
      ) : toestand === "fout" ? (
        <Kader label="Fout" className="p-10 text-center">
          <Unplug size={22} className="mx-auto" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="mt-4 text-[13px]" style={kop}>
            Register niet bereikbaar
          </h3>
          <p
            className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed"
            style={{ color: C.inktZacht }}
          >
            De verbinding met het register is verbroken. Je eigen gegevens zijn ongewijzigd
            gebleven.
          </p>
          <div className="mt-6 flex justify-center">
            <Knop onClick={() => setToestand("gereed")}>Opnieuw proberen</Knop>
          </div>
        </Kader>
      ) : zichtbaar.length === 0 ? (
        <Kader label="Leeg" className="p-10 text-center">
          <Inbox size={22} className="mx-auto" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="mt-4 text-[13px]" style={kop}>
            Geen inschrijvingen
          </h3>
          <p
            className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed"
            style={{ color: C.inktZacht }}
          >
            Er staat op dit moment niets in het register dat aan je filters voldoet.
          </p>
          <div className="mt-6 flex justify-center">
            <Knop
              variant="lijn"
              onClick={() => {
                setZoek("");
                setTag(null);
                setToestand("gereed");
              }}
            >
              Filters wissen
            </Knop>
          </div>
        </Kader>
      ) : (
        <ul className="grid gap-px sm:grid-cols-2" style={{ background: C.inkt }}>
          {zichtbaar.map((o) => (
            <li key={o.id} className="relative overflow-hidden p-6" style={{ background: C.blad }}>
              <Gitter opacity={0.04} />
              <article className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9.5px]" style={{ ...kop, color: C.inktFaint }}>
                      {o.id}
                    </p>
                    <h3 className="mt-2 text-[16px] font-semibold leading-snug">{o.titel}</h3>
                    <p className="mt-1.5 text-[12.5px]" style={{ color: C.inktZacht }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <Monogram
                    initialen={o.opdrachtgever
                      .split(" ")
                      .map((w) => w.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { l: "Plaats", v: o.plaats },
                    { l: "Tarief", v: o.tarief },
                    { l: "Omvang", v: o.uren },
                    { l: "Start", v: o.start },
                  ].map((r) => (
                    <div key={r.l} className="flex items-baseline justify-between gap-2">
                      <dt className="text-[9.5px]" style={{ ...kop, color: C.inktFaint }}>
                        {r.l}
                      </dt>
                      <dd className="text-[12.5px] tabular-nums">{r.v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5">
                  <Meetlat waarde={o.match} label="Match" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 text-[9.5px]"
                      style={{ ...kop, border: `1px solid ${C.lijnZacht}`, color: C.inktZacht }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-5">
                  <Knop variant="lijn" onClick={() => onOpen(o.id)} className="w-full">
                    Opdracht openen <ArrowRight size={13} aria-hidden="true" />
                  </Knop>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── III. Opdracht ──────────────────────────────────────────────────────────────────────────
function OpdrachtBlad({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [uit, setUit] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <button
        type="button"
        onClick={onTerug}
        className={`inline-flex items-center gap-2 text-[10px] ${RING}`}
        style={{ ...kop, color: C.inktZacht }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar het register
      </button>

      <header
        className="relative overflow-hidden"
        style={{ border: `1px solid ${C.inkt}`, background: C.blad }}
      >
        <Gitter opacity={0.05} />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[9.5px]" style={{ ...kop, color: C.goudDiep }}>
                {opdracht.id}
              </p>
              <h1 className="mt-3 text-[22px] font-semibold leading-tight sm:text-[28px]">
                {opdracht.titel}
              </h1>
              <p
                className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"
                style={{ color: C.inktZacht }}
              >
                <span>{opdracht.opdrachtgever}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" /> {opdracht.plaats}
                </span>
              </p>
            </div>
            <div className="w-44 shrink-0">
              <Meetlat waarde={opdracht.match} label="Matchscore" />
            </div>
          </div>
        </div>
        <Schaakrand hoogte={6} />
      </header>

      <div className="grid gap-px sm:grid-cols-4" style={{ background: C.inkt }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Plaats", v: opdracht.plaats },
        ].map((f) => (
          <div key={f.l} className="p-5" style={{ background: C.blad }}>
            <div className="text-[9.5px]" style={{ ...kop, color: C.inktFaint }}>
              {f.l}
            </div>
            <div className="mt-2 text-[16px] font-semibold tabular-nums">{f.v}</div>
          </div>
        ))}
      </div>

      <section aria-label="Verklaring van de match">
        <Kop sub="Elke reden is server-side vastgesteld en telt herleidbaar mee in de score.">
          Waarom deze match
        </Kop>
        <div className="grid gap-px md:grid-cols-2" style={{ background: C.inkt }}>
          <div className="p-6" style={{ background: C.blad }}>
            <p className="text-[10px]" style={{ ...kop, color: C.goudDiep }}>
              In het voordeel
            </p>
            <ul className="mt-4 space-y-px" style={{ background: C.lijnZacht }}>
              {opdracht.redenen.plus.map((r, i) => {
                const open = uit === `p${i}`;
                return (
                  <li key={r} style={{ background: C.blad }}>
                    <button
                      type="button"
                      onClick={() => setUit(open ? null : `p${i}`)}
                      aria-expanded={open}
                      className={`flex w-full items-start gap-3 py-3 text-left ${RING}`}
                    >
                      <span
                        className="mt-0.5 h-3 w-3 shrink-0"
                        style={{ background: C.inkt, borderBottom: `3px solid ${C.goud}` }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-[13px] leading-snug">{r}</span>
                      <Check
                        size={14}
                        strokeWidth={2.6}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <ChevronDown
                        size={14}
                        className="mt-0.5 shrink-0 transition-transform"
                        style={{ transform: open ? "rotate(180deg)" : "none" }}
                        aria-hidden="true"
                      />
                    </button>
                    {open ? (
                      <div className="pb-4 pl-6 pr-1">
                        <Meetlat waarde={70 + i * 10} label="Weging in de score" />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-6" style={{ background: C.blad }}>
            <p className="text-[10px]" style={{ ...kop, color: C.inktFaint }}>
              In het nadeel
            </p>
            <ul className="mt-4 space-y-px" style={{ background: C.lijnZacht }}>
              {opdracht.redenen.min.map((r, i) => {
                const open = uit === `m${i}`;
                return (
                  <li key={r} style={{ background: C.blad }}>
                    <button
                      type="button"
                      onClick={() => setUit(open ? null : `m${i}`)}
                      aria-expanded={open}
                      className={`flex w-full items-start gap-3 py-3 text-left ${RING}`}
                    >
                      <span
                        className="mt-0.5 h-3 w-3 shrink-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, ${C.inkt} 0 2px, transparent 2px 4px)`,
                          border: `1px solid ${C.inkt}`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-[13px] leading-snug">{r}</span>
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.4}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <ChevronDown
                        size={14}
                        className="mt-0.5 shrink-0 transition-transform"
                        style={{ transform: open ? "rotate(180deg)" : "none" }}
                        aria-hidden="true"
                      />
                    </button>
                    {open ? (
                      <div className="pb-4 pl-6 pr-1">
                        <Meetlat waarde={20 + i * 12} label="Aftrek op de score" />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Knop>Reageren op deze opdracht</Knop>
        <Knop variant="goud">Op de lijst zetten</Knop>
        <Knop disabled title="Beschikbaar zodra je VOG opnieuw is geverifieerd">
          Direct bevestigen
        </Knop>
      </div>
    </div>
  );
}

// ── IV. Verificatie ────────────────────────────────────────────────────────────────────────
function Verificatie() {
  const [alleenActie, setAlleenActie] = useState(false);
  const zichtbaar = CREDENTIALS.filter((c) => !alleenActie || c.status !== "VERIFIED");
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop
          nr="IV"
          sub="Goud staat uitsluitend voor: door een beoordelaar gecontroleerd. Documenten zelf blijven privé."
        >
          Verificatie
        </Kop>
        <Knop
          variant="lijn"
          onClick={() => setAlleenActie((v) => !v)}
          ariaPressed={alleenActie}
          className="mb-5"
        >
          {alleenActie ? "Toon alles" : "Toon wat actie vraagt"}
        </Knop>
      </div>

      <Kader label="Dossier" goud className="relative overflow-hidden p-6">
        <Gitter opacity={0.05} />
        <div className="relative flex flex-wrap items-center gap-5">
          <Monogram initialen={PROFIEL.initialen} groot vertrouwd />
          <div className="min-w-[200px] flex-1">
            <p className="text-[16px] font-semibold">{PROFIEL.naam}</p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.inktZacht }}>
              {PROFIEL.rol} · {PROFIEL.plaats}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-[10px]" style={kop}>
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
          </div>
          <div className="w-48">
            <Meetlat
              waarde={Math.round((geverifieerd / CREDENTIALS.length) * 100)}
              label="Dossier compleet"
            />
          </div>
        </div>
      </Kader>

      {zichtbaar.length === 0 ? (
        <Kader label="Niets te doen" className="p-10 text-center">
          <Check size={22} strokeWidth={2.4} className="mx-auto" aria-hidden="true" />
          <h3 className="mt-4 text-[13px]" style={kop}>
            Niets openstaand
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-[13px]" style={{ color: C.inktZacht }}>
            Alle certificaten zijn geverifieerd en geldig.
          </p>
        </Kader>
      ) : (
        <ul className="grid gap-px sm:grid-cols-2" style={{ background: C.inkt }}>
          {zichtbaar.map((c) => (
            <li
              key={c.naam}
              className="flex flex-col justify-between p-6"
              style={{ background: C.blad }}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-semibold leading-snug">{c.naam}</h3>
                  <FileText size={16} aria-hidden="true" style={{ color: C.inktFaint }} />
                </div>
                <p className="mt-2 text-[12.5px]" style={{ color: C.inktZacht }}>
                  {c.detail}
                </p>
              </div>
              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4"
                style={{ borderTop: `1px solid ${C.lijnZacht}` }}
              >
                <StatusMerk status={c.status} />
                {c.status === "VERIFIED" ? (
                  <Knop disabled title="Geverifieerd en geldig — er is nu niets te doen">
                    Geen actie
                  </Knop>
                ) : (
                  <Knop variant="goud">
                    {c.status === "EXPIRING" ? "Vernieuwen" : "Status bekijken"}
                  </Knop>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── V. Acties ──────────────────────────────────────────────────────────────────────────────
function Acties({ onNaarVerificatie }: { onNaarVerificatie: () => void }) {
  const [gedaan, setGedaan] = useState<string[]>([]);
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const open = gesorteerd.filter((a) => !gedaan.includes(a.titel));

  return (
    <div className="space-y-8">
      <Kop
        nr="V"
        sub="De eerstvolgende stappen, op volgorde van belang. Eén rij per stap — geen ruis."
      >
        Acties
      </Kop>

      {open.length === 0 ? (
        <Kader label="Leeg" className="p-10 text-center">
          <Check size={22} strokeWidth={2.4} className="mx-auto" aria-hidden="true" />
          <h3 className="mt-4 text-[13px]" style={kop}>
            Alles afgewerkt
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-[13px]" style={{ color: C.inktZacht }}>
            Er staat op dit moment geen actie open. Nieuwe stappen verschijnen zodra er iets
            verandert.
          </p>
          <div className="mt-6 flex justify-center">
            <Knop variant="lijn" onClick={() => setGedaan([])}>
              Lijst terugzetten
            </Knop>
          </div>
        </Kader>
      ) : (
        <ol className="space-y-px" style={{ background: C.inkt }}>
          {open.map((a, i) => (
            <li key={a.titel} className="relative overflow-hidden" style={{ background: C.blad }}>
              <div className="flex flex-wrap items-start gap-5 p-6">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-[13px] tabular-nums"
                  style={{
                    ...kop,
                    border: `1px solid ${C.inkt}`,
                    borderBottom:
                      a.urgentie === "warning" ? `3px solid ${C.goud}` : `1px solid ${C.inkt}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-[200px] flex-1">
                  <h3 className="text-[15px] font-semibold leading-snug">{a.titel}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inktZacht }}>
                    {a.detail}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[10px]" style={kop}>
                    {a.urgentie === "warning" ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {a.urgentie === "warning" ? "Vraagt actie" : "Ter kennisgeving"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Knop onClick={onNaarVerificatie}>{a.cta}</Knop>
                  <Knop variant="lijn" onClick={() => setGedaan((g) => [...g, a.titel])}>
                    Afgehandeld
                  </Knop>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── VI. Facturen ───────────────────────────────────────────────────────────────────────────
function Facturen() {
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

  const merk = (status: string) => {
    if (status === "Betaald") {
      return { vak: { background: C.inkt, borderBottom: `3px solid ${C.goud}` }, Icon: Check };
    }
    if (status === "Openstaand") {
      return {
        vak: {
          backgroundImage: `repeating-linear-gradient(45deg, ${C.inkt} 0 2px, transparent 2px 4px)`,
          border: `1px solid ${C.inkt}`,
        },
        Icon: Clock,
      };
    }
    return { vak: { border: `1px solid ${C.inkt}` }, Icon: FileText };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop nr="VI" sub={`${openstaand.length} factuur wacht nog op betaling.`}>
          Facturen
        </Kop>
        <Knop
          variant="lijn"
          onClick={() => setOplopend((v) => !v)}
          ariaPressed={oplopend}
          className="mb-5"
        >
          <ArrowUpDown size={13} aria-hidden="true" />
          Bedrag {oplopend ? "oplopend" : "aflopend"}
        </Knop>
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.inkt}` }}>
        <table className="w-full min-w-[600px] border-collapse text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr style={{ background: C.inkt, color: C.blad }}>
              {["Nummer", "Opdrachtgever", "Datum", "Status", "Bedrag"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-[9.5px]" style={kop}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: C.blad }}>
            {rijen.map((f) => {
              const m = merk(f.status);
              return (
                <tr key={f.nr} style={{ borderTop: `1px solid ${C.lijnZacht}` }}>
                  <th
                    scope="row"
                    className="px-4 py-3.5 text-left text-[12px] font-semibold tabular-nums"
                  >
                    {f.nr}
                  </th>
                  <td className="px-4 py-3.5 text-[13px]">{f.klant}</td>
                  <td className="px-4 py-3.5 text-[12.5px]" style={{ color: C.inktZacht }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0" style={m.vak} aria-hidden="true" />
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                      <span className="text-[10px]" style={kop}>
                        {f.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums">
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openstaand.length > 0 ? (
        <Kader label="Openstaand" className="p-6">
          <p className="text-[10px]" style={{ ...kop, color: C.inktFaint }}>
            Nog te ontvangen
          </p>
          <ul className="mt-4 space-y-2">
            {openstaand.map((f) => (
              <li key={f.nr} className="flex items-center justify-between gap-3">
                <span className="text-[13px]">
                  {f.nr} · {f.klant}
                </span>
                <span className="text-[13px] font-semibold tabular-nums">{f.bedrag}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Knop>Herinnering sturen</Knop>
          </div>
        </Kader>
      ) : null}
    </div>
  );
}

// ── VII. Berichten ─────────────────────────────────────────────────────────────────────────
function Berichten() {
  const [gekozen, setGekozen] = useState(0);
  const gesprek = BERICHTEN[gekozen] ?? BERICHTEN[0]!;

  return (
    <div className="space-y-8">
      <Kop
        nr="VII"
        sub="Korte lijnen met opdrachtgevers. Eén gesprek per rij, in hetzelfde raster."
      >
        Berichten
      </Kop>

      <div
        className="grid gap-px lg:grid-cols-[300px_minmax(0,1fr)]"
        style={{ background: C.inkt }}
      >
        <ul style={{ background: C.blad }}>
          {BERICHTEN.map((b, i) => {
            const on = i === gekozen;
            return (
              <li key={b.van} style={{ borderBottom: `1px solid ${C.lijnZacht}` }}>
                <button
                  type="button"
                  onClick={() => setGekozen(i)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-start gap-3 p-4 text-left ${RING}`}
                  style={{ background: on ? C.inkt : "transparent", color: on ? C.blad : C.inkt }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[10px]"
                    style={{
                      ...kop,
                      border: `1px solid ${on ? C.blad : C.inkt}`,
                      color: on ? C.blad : C.inkt,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold">{b.van}</span>
                      <span
                        className="shrink-0 text-[10.5px] tabular-nums"
                        style={{ color: on ? C.blad : C.inktFaint }}
                      >
                        {b.tijd}
                      </span>
                    </span>
                    <span
                      className="mt-1 line-clamp-2 block text-[12px] leading-snug"
                      style={{ color: on ? C.blad : C.inktZacht }}
                    >
                      {b.preview}
                    </span>
                    {b.ongelezen ? (
                      <span
                        className="mt-2 inline-flex items-center gap-1.5 text-[9.5px]"
                        style={kop}
                      >
                        <span
                          className="h-2 w-2"
                          style={{ background: C.goud }}
                          aria-hidden="true"
                        />
                        Ongelezen
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="p-6" style={{ background: C.blad }}>
          <div
            className="flex items-center gap-4 pb-4"
            style={{ borderBottom: `1px solid ${C.inkt}` }}
          >
            <Monogram initialen={gesprek.initialen} />
            <div>
              <p className="text-[15px] font-semibold">{gesprek.van}</p>
              <p className="text-[11.5px]" style={{ color: C.inktFaint }}>
                Laatste bericht {gesprek.tijd}
              </p>
            </div>
          </div>

          <ol className="mt-5 space-y-3">
            {THREAD.map((m, i) => (
              <li key={i} className={m.van === "wij" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[86%] px-4 py-3"
                  style={{
                    background: m.van === "wij" ? C.inkt : C.blad,
                    color: m.van === "wij" ? C.blad : C.inkt,
                    border: `1px solid ${C.inkt}`,
                  }}
                >
                  <p className="text-[13px] leading-relaxed">{m.tekst}</p>
                  <p
                    className="mt-1.5 text-[9.5px] tabular-nums"
                    style={{ ...kop, color: m.van === "wij" ? C.goud : C.inktFaint }}
                  >
                    {m.tijd}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <form
            className="mt-6 flex items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Bericht sturen"
          >
            <label className="sr-only" htmlFor="wns-bericht">
              Bericht
            </label>
            <input
              id="wns-bericht"
              placeholder="Schrijf een bericht"
              className="min-w-0 flex-1 px-3 py-2.5 text-[13px] outline-none"
              style={{ border: `1px solid ${C.inkt}`, background: C.blad, color: C.inkt }}
            />
            <Knop type="submit">
              <Send size={13} aria-hidden="true" /> Sturen
            </Knop>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── VIII. Beoordeling (admin-verificatiequeue) ─────────────────────────────────────────────
type Besluit =
  | { status: "open" }
  | { status: "goedgekeurd" }
  | { status: "afgewezen"; reden: string };

function Beoordeling() {
  const [besluiten, setBesluiten] = useState<Record<string, Besluit>>({});
  const [afwijzen, setAfwijzen] = useState<string | null>(null);
  const [reden, setReden] = useState("");
  const [alleenOpen, setAlleenOpen] = useState(true);

  const status = useCallback(
    (id: string): Besluit => besluiten[id] ?? { status: "open" },
    [besluiten],
  );

  const rijen = QUEUE.filter((r) => !alleenOpen || status(r.id).status === "open");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop
          nr="VIII"
          sub="Beoordelaarsweergave: goedkeuren kan direct, afwijzen alleen met een reden. Elk besluit wordt vastgelegd."
        >
          Beoordelingsqueue
        </Kop>
        <Knop
          variant="lijn"
          onClick={() => setAlleenOpen((v) => !v)}
          ariaPressed={alleenOpen}
          className="mb-5"
        >
          {alleenOpen ? "Alleen openstaand" : "Alles tonen"}
        </Knop>
      </div>

      {rijen.length === 0 ? (
        <Kader label="Queue leeg" className="p-10 text-center">
          <Check size={22} strokeWidth={2.4} className="mx-auto" aria-hidden="true" />
          <h3 className="mt-4 text-[13px]" style={kop}>
            Queue is leeg
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-[13px]" style={{ color: C.inktZacht }}>
            Er wachten geen aanvragen op beoordeling. Zet het filter uit om afgehandelde aanvragen
            te zien.
          </p>
          <div className="mt-6 flex justify-center">
            <Knop variant="lijn" onClick={() => setAlleenOpen(false)}>
              Alles tonen
            </Knop>
          </div>
        </Kader>
      ) : (
        <ul className="space-y-px" style={{ background: C.inkt }}>
          {rijen.map((r) => {
            const s = status(r.id);
            const bezig = afwijzen === r.id;
            return (
              <li key={r.id} className="p-6" style={{ background: C.blad }}>
                <div className="flex flex-wrap items-start gap-5">
                  <Monogram initialen={r.initialen} vertrouwd={s.status === "goedgekeurd"} />
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[9.5px]" style={{ ...kop, color: C.inktFaint }}>
                      {r.id} · ingediend {r.ingediend}
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold leading-snug">{r.document}</h3>
                    <p className="mt-1 text-[12.5px]" style={{ color: C.inktZacht }}>
                      {r.persoon} · {r.bron}
                    </p>
                    <p className="mt-3">
                      {s.status === "open" ? (
                        <StatusMerk status="SUBMITTED" />
                      ) : s.status === "goedgekeurd" ? (
                        <StatusMerk status="VERIFIED" />
                      ) : (
                        <StatusMerk status="REJECTED" />
                      )}
                    </p>
                    {s.status === "afgewezen" ? (
                      <p className="mt-2 text-[12.5px]" style={{ color: C.inktZacht }}>
                        Reden: {s.reden}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {s.status === "open" ? (
                      <>
                        <Knop
                          variant="goud"
                          onClick={() =>
                            setBesluiten((b) => ({ ...b, [r.id]: { status: "goedgekeurd" } }))
                          }
                        >
                          <Check size={13} aria-hidden="true" /> Goedkeuren
                        </Knop>
                        <Knop
                          variant="lijn"
                          onClick={() => {
                            setAfwijzen(bezig ? null : r.id);
                            setReden("");
                          }}
                          ariaPressed={bezig}
                        >
                          <X size={13} aria-hidden="true" /> Afwijzen
                        </Knop>
                      </>
                    ) : (
                      <Knop
                        variant="lijn"
                        onClick={() =>
                          setBesluiten((b) => {
                            const kopie = { ...b };
                            delete kopie[r.id];
                            return kopie;
                          })
                        }
                      >
                        Besluit terugdraaien
                      </Knop>
                    )}
                  </div>
                </div>

                {bezig && s.status === "open" ? (
                  <form
                    className="mt-5 pt-5"
                    style={{ borderTop: `1px solid ${C.lijnZacht}` }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!reden.trim()) return;
                      setBesluiten((b) => ({
                        ...b,
                        [r.id]: { status: "afgewezen", reden: reden.trim() },
                      }));
                      setAfwijzen(null);
                      setReden("");
                    }}
                  >
                    <label
                      className="text-[9.5px]"
                      style={{ ...kop, color: C.inktFaint }}
                      htmlFor={`wns-reden-${r.id}`}
                    >
                      Reden van afwijzing (verplicht)
                    </label>
                    <textarea
                      id={`wns-reden-${r.id}`}
                      value={reden}
                      onChange={(e) => setReden(e.target.value)}
                      rows={2}
                      className="mt-2 w-full px-3 py-2 text-[13px] outline-none"
                      style={{ border: `1px solid ${C.inkt}`, background: C.blad, color: C.inkt }}
                      placeholder="Bijvoorbeeld: het document is onleesbaar"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Knop
                        type="submit"
                        disabled={!reden.trim()}
                        title={!reden.trim() ? "Vul eerst een reden in" : undefined}
                      >
                        Afwijzing vastleggen
                      </Knop>
                      <Knop variant="lijn" onClick={() => setAfwijzen(null)}>
                        Annuleren
                      </Knop>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
