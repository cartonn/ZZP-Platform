"use client";

// Concept 558 — "Schrijn" · het reliekschrijn als bewaarplaats voor gevoelige documenten.
// Richting: VOG, diploma’s en BIG-registratie worden behandeld als kostbaarheden in een verlicht
// schrijn. Diep donker fluweel-veld, verguld lijstwerk in hairline-goud, verlichte nissen waarin
// één bewijsstuk centraal staat met een zachte lichtval, lakzegels als statusdragers en gegraveerde,
// gecentreerde typografie. Het gevoel: eerbied en bewaargeving — dit platform bewaart iets van jou.
// Verificatie is de kern-ervaring: elke nis toont herkomst (“afgegeven door”, “geverifieerd op”) en
// een toegangslog (“wie heeft dit ingezien”). Ondanks de sfeer blijft het een werkend
// besturingssysteem: opdrachten, acties en facturen zijn even bruikbaar als elders.
// Inspiratie/bronnen: Monymusk-reliekschrijn (National Museums Scotland) en het Reliquary Shrine
// van Jean de Touyl (Wikipedia/Met) — schrijnen als miniatuur-kapel met nissen, trefoilbogen en
// bergkristal-vensters; britishmuseum.org collectie “shrine; reliquary; relic”; britannica.com
// “reliquary”: glanzend edelmetaal als metafoor voor licht. Museale nisverlichting = zachte
// lichtval van boven, nooit een harde glow.
// Fonts: Cormorant Garamond (gegraveerde koppen) + Inter (functionele tekst).
// Deterministisch — geen random, geen datum-API. Contrast: alle tekst ruim boven WCAG AA.

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Key,
  Landmark,
  Lock,
  Mail,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — fluweel, goud, ivoor. Alle teksttinten ≥ AA op het donkere veld ─────────────
const C = {
  veld: "#14100f",
  nis: "#1c1614",
  nisDiep: "#241b17",
  plint: "#100c0b",
  goud: "#c8a24a",
  goudLicht: "#e6cd8e",
  goudDof: "#7d6530",
  ivoor: "#f4efe4",
  zacht: "#cabfad",
  flauw: "#a4977f",
  ok: "#8dc199",
  wacht: "#c9b98f",
  waarschuw: "#e5b262",
  fout: "#eb9384",
};

const gegraveerd = { fontFamily: "var(--font-lab-cormorant)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// ── Bladen ─────────────────────────────────────────────────────────────────────────────
type Blad = ScreenKey | "bewaarders";

const EXTRA: { key: Blad; label: string }[] = [
  { key: "documenten", label: "Documenten" },
  { key: "berichten", label: "Berichten" },
  { key: "bewaarders", label: "Bewaarders" },
];

const BLADEN: { key: Blad; label: string }[] = [
  ...SCREENS.map((s) => ({ key: s.key as Blad, label: s.label })),
  ...EXTRA,
];

const OPSCHRIFT: Record<Blad, { titel: string; onder: string }> = {
  dashboard: { titel: "De schatkamer", onder: "Wat u bewaart, en wat vandaag uw zorg vraagt" },
  marktplaats: { titel: "Aangeboden werk", onder: "Opdrachten die bij uw bewijsstukken passen" },
  opdracht: { titel: "Eén opdracht, nauwkeurig", onder: "Wat pleit ervoor, en wat ertegen" },
  verificatie: {
    titel: "De nissen",
    onder: "Elk bewijsstuk in eigen licht, met zegel en herkomst",
  },
  acties: { titel: "Wat uw zorg vraagt", onder: "Op volgorde van wat het eerst vervalt" },
  facturen: { titel: "De rekenkamer", onder: "Wat is voldaan en wat nog open staat" },
  documenten: { titel: "Bewaargeving", onder: "Uw bestanden, veilig en gesloten opgeborgen" },
  berichten: { titel: "Correspondentie", onder: "Wat opdrachtgevers u schreven" },
  bewaarders: { titel: "De bewaarders", onder: "Bemiddelaars die namens u dossiers beheren" },
};

// ── Statusvertaling — label, icoon én zegelkleur; nooit alleen kleur ────────────────────
type ZegelMeta = { label: string; Icon: LucideIcon; tint: string; merk: string };

function zegelMeta(s: CredStatus): ZegelMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Bezegeld", Icon: ShieldCheck, tint: C.ok, merk: "✓" };
    case "SUBMITTED":
      return { label: "Ter keuring", Icon: Clock, tint: C.wacht, merk: "…" };
    case "EXPIRING":
      return { label: "Zegel verbleekt", Icon: AlertTriangle, tint: C.waarschuw, merk: "!" };
    case "REJECTED":
      return { label: "Zegel verbroken", Icon: XCircle, tint: C.fout, merk: "×" };
  }
}

// ── Primitieven ────────────────────────────────────────────────────────────────────────

/** Deterministisch lakzegel — golvende rand via vaste sinus, geen random. */
function zegelPad(punten: number, straal: number, amplitude: number, mid: number): string {
  const stukken: string[] = [];
  for (let i = 0; i < punten; i++) {
    const hoek = (i / punten) * Math.PI * 2;
    const r = straal + Math.sin(hoek * 9) * amplitude;
    const x = mid + Math.cos(hoek) * r;
    const y = mid + Math.sin(hoek) * r;
    stukken.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `${stukken.join(" ")} Z`;
}

const ZEGEL_MID = 30;
const ZEGEL_PAD = zegelPad(72, 25, 1.4, ZEGEL_MID);

function Lakzegel({ status, maat = 52 }: { status: CredStatus; maat?: number }) {
  const m = zegelMeta(status);
  const mid = ZEGEL_MID;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: maat, height: maat }}
      role="img"
      aria-label={`Zegel: ${m.label}`}
    >
      <svg viewBox="0 0 60 60" width={maat} height={maat} aria-hidden="true">
        <defs>
          <radialGradient id={`zg-${status}`} cx="38%" cy="30%" r="72%">
            <stop offset="0%" stopColor={m.tint} stopOpacity="0.95" />
            <stop offset="70%" stopColor={m.tint} stopOpacity="0.42" />
            <stop offset="100%" stopColor={m.tint} stopOpacity="0.24" />
          </radialGradient>
        </defs>
        <path
          d={ZEGEL_PAD}
          fill={`url(#zg-${status})`}
          stroke={m.tint}
          strokeWidth="0.8"
          opacity="0.9"
        />
        <circle
          cx={mid}
          cy={mid}
          r="17"
          fill="none"
          stroke={C.veld}
          strokeWidth="0.9"
          opacity="0.55"
        />
        <text
          x={mid}
          y={mid + 6}
          textAnchor="middle"
          fontSize="17"
          fill={C.veld}
          fontFamily="var(--font-lab-cormorant)"
          opacity="0.85"
        >
          {m.merk}
        </text>
      </svg>
    </span>
  );
}

/** Statuslabel naast het zegel — tekst + icoon, voor wie kleur niet ziet. */
function Zegelband({ status }: { status: CredStatus }) {
  const m = zegelMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-medium"
      style={{ color: m.tint, border: `1px solid ${m.tint}55`, background: `${m.tint}12` }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

/** Verguld lijstwerk — hairline goud met een dunne binnenlijn. */
function lijstwerk(sterk = false): React.CSSProperties {
  return {
    border: `1px solid ${sterk ? `${C.goud}66` : `${C.goud}33`}`,
    boxShadow: sterk
      ? `inset 0 0 0 1px ${C.goud}14, 0 1px 0 0 ${C.goud}1a`
      : `inset 0 0 0 1px ${C.goud}0d`,
  };
}

/** Gegraveerde kop met dun goudlijntje eronder. */
function Opschrift({
  kop,
  onder,
  gecentreerd = true,
}: {
  kop: string;
  onder?: string;
  gecentreerd?: boolean;
}) {
  return (
    <div className={gecentreerd ? "text-center" : "text-left"}>
      <h2
        className="text-[24px] font-normal leading-tight tracking-[0.02em] sm:text-[28px]"
        style={{ ...gegraveerd, color: C.ivoor }}
      >
        {kop}
      </h2>
      <div
        className={`mt-2 h-px w-16 ${gecentreerd ? "mx-auto" : ""}`}
        style={{ background: `linear-gradient(to right, transparent, ${C.goud}, transparent)` }}
        aria-hidden="true"
      />
      {onder ? (
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.flauw }}>
          {onder}
        </p>
      ) : null}
    </div>
  );
}

/** Nis — een verlichte holte waarin één ding centraal staat. */
function Nis({
  children,
  actief = false,
  vlak = false,
}: {
  children: React.ReactNode;
  actief?: boolean;
  vlak?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-b-lg rounded-t-[44px]"
      style={{
        background: C.nis,
        ...lijstwerk(actief),
      }}
    >
      {!vlak ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 70% at 50% -8%, ${C.goud}${actief ? "24" : "14"} 0%, transparent 62%)`,
          }}
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Sober paneel zonder nis-boog — voor tabellen en lijsten. */
function Paneel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-lg ${className}`}
      style={{ background: C.nis, ...lijstwerk(false) }}
    >
      {children}
    </section>
  );
}

/** Klein gegraveerd label. */
function Kapitaal({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: C.goud, ...ui }}>
      {children}
    </span>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────
export function Concept558() {
  const [blad, setBlad] = useState<Blad>("dashboard");
  const opdracht = OPDRACHTEN[0]!;
  const o = OPSCHRIFT[blad];

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...ui, background: C.veld, color: C.ivoor }}
    >
      <style>{`
        .schr-focus:focus-visible { outline: 2px solid ${C.goudLicht}; outline-offset: 2px; }
        @keyframes schrRijs { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .schr-rijs { animation: schrRijs 520ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes schrGloed { 0%,100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        .schr-gloed { animation: schrGloed 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .schr-rijs, .schr-gloed { animation: none !important; } }
      `}</style>

      {/* Zacht licht van boven over het hele veld */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
        style={{
          background: `radial-gradient(80% 100% at 50% 0%, ${C.goud}12 0%, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-10">
        {/* ── Kroonlijst ─────────────────────────────────────────────────────────────── */}
        <header className="pt-8 sm:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-b-sm rounded-t-full"
                style={{ background: C.nisDiep, ...lijstwerk(true) }}
                aria-hidden="true"
              >
                <Landmark size={18} strokeWidth={1.4} style={{ color: C.goud }} />
              </span>
              <div>
                <div
                  className="text-[21px] font-normal leading-none tracking-[0.06em]"
                  style={{ ...gegraveerd, color: C.ivoor }}
                >
                  Schrijn
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.flauw }}>
                  Bewaarplaats van {PROFIEL.naam} · {PROFIEL.rol}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] sm:inline-flex"
                style={{ color: C.goud, border: `1px solid ${C.goud}44` }}
              >
                <Lock size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[13px]"
                style={{
                  ...gegraveerd,
                  background: C.nisDiep,
                  color: C.goudLicht,
                  ...lijstwerk(true),
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>
          <div
            className="mt-6 h-px w-full"
            style={{
              background: `linear-gradient(to right, transparent, ${C.goud}55, transparent)`,
            }}
            aria-hidden="true"
          />
        </header>

        {/* ── Navigatie als gilden plaquettes ────────────────────────────────────────── */}
        <nav className="mt-5 overflow-x-auto" aria-label="Onderdelen">
          <div
            role="tablist"
            aria-label="Onderdelen"
            className="flex min-w-max items-center gap-1.5"
          >
            {BLADEN.map((b) => {
              const aan = b.key === blad;
              return (
                <button
                  key={b.key}
                  id={`schr-tab-${b.key}`}
                  role="tab"
                  type="button"
                  aria-selected={aan}
                  aria-controls="schr-panel"
                  tabIndex={aan ? 0 : -1}
                  onClick={() => setBlad(b.key)}
                  className="schr-focus whitespace-nowrap rounded-md px-3.5 py-1.5 text-[12.5px] transition-colors"
                  style={{
                    color: aan ? C.veld : C.zacht,
                    background: aan ? C.goud : "transparent",
                    border: `1px solid ${aan ? C.goud : `${C.goud}2e`}`,
                    fontWeight: aan ? 600 : 400,
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main
          id="schr-panel"
          role="tabpanel"
          aria-labelledby={`schr-tab-${blad}`}
          tabIndex={-1}
          className="mt-8"
        >
          <div className="schr-rijs" key={blad}>
            <Opschrift kop={o.titel} onder={o.onder} />
            <div className="mt-8">
              {blad === "dashboard" && <Schatkamer onGa={setBlad} />}
              {blad === "verificatie" && <Nissen />}
              {blad === "marktplaats" && <Markt onOpen={() => setBlad("opdracht")} />}
              {blad === "opdracht" && (
                <OpdrachtBlad opdracht={opdracht} onTerug={() => setBlad("marktplaats")} />
              )}
              {blad === "acties" && <Zorgen onGa={setBlad} />}
              {blad === "facturen" && <Rekenkamer />}
              {blad === "documenten" && <Bewaargeving />}
              {blad === "berichten" && <Correspondentie />}
              {blad === "bewaarders" && <Bewaarders />}
            </div>
          </div>
        </main>

        <footer className="mt-16">
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(to right, transparent, ${C.goud}33, transparent)`,
            }}
            aria-hidden="true"
          />
          <p className="mt-4 text-center text-[11.5px] leading-relaxed" style={{ color: C.flauw }}>
            Wat u hier bewaart, blijft van u. Documenten zijn gesloten opgeborgen; opdrachtgevers
            zien uitsluitend het zegel, nooit het stuk zelf.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Schatkamer (dashboard) ─────────────────────────────────────────────────────────────
function Schatkamer({ onGa }: { onGa: (b: Blad) => void }) {
  const dringend = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0]!;
  const bezegeld = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-10">
      {/* De hoofdnis — wat vandaag uw zorg vraagt */}
      <div className="mx-auto max-w-2xl">
        <Nis actief>
          <div className="px-6 pb-7 pt-9 text-center sm:px-10">
            <span
              className="schr-gloed mx-auto mb-4 block h-px w-24"
              style={{
                background: `linear-gradient(to right, transparent, ${C.goudLicht}, transparent)`,
              }}
              aria-hidden="true"
            />
            <Kapitaal>Eerstvolgende zorg</Kapitaal>
            <h3
              className="mt-3 text-[24px] font-normal leading-tight sm:text-[28px]"
              style={{ ...gegraveerd, color: C.ivoor }}
            >
              {dringend.titel}
            </h3>
            <p
              className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed"
              style={{ color: C.zacht }}
            >
              {dringend.detail}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => onGa("verificatie")}
                className="schr-focus rounded-md px-5 py-2.5 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
                style={{ background: C.goud, color: C.veld }}
              >
                {dringend.cta}
              </button>
              <button
                type="button"
                onClick={() => onGa("acties")}
                className="schr-focus rounded-md px-5 py-2.5 text-[13px] transition-colors hover:bg-[#241b17]"
                style={{ color: C.zacht, border: `1px solid ${C.goud}44` }}
              >
                Alle zorgen bekijken
              </button>
            </div>
          </div>
        </Nis>
      </div>

      {/* Gegraveerde plinten met de kerncijfers */}
      <section>
        <div className="mb-4 text-center">
          <Kapitaal>Wat het schrijn u opleverde</Kapitaal>
        </div>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-md px-4 py-4 text-center"
              style={{ background: C.plint, ...lijstwerk(false) }}
            >
              <dd
                className="text-[24px] font-normal tabular-nums leading-none"
                style={{ ...gegraveerd, color: C.goudLicht }}
              >
                {k.value}
              </dd>
              <dt className="mt-2 text-[11.5px] leading-tight" style={{ color: C.zacht }}>
                {k.label}
              </dt>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Golfje waarden={k.spark} />
                <span className="text-[11px] tabular-nums" style={{ color: C.flauw }}>
                  {k.trend}
                </span>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* De nissenrij — een blik op de bewijsstukken */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kapitaal>De nissen</Kapitaal>
            <p className="mt-1 text-[12.5px]" style={{ color: C.flauw }}>
              {bezegeld} van de {CREDENTIALS.length} bewijsstukken dragen een geldig zegel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGa("verificatie")}
            className="schr-focus rounded-md px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[#241b17]"
            style={{ color: C.goud, border: `1px solid ${C.goud}44` }}
          >
            Naar de nissen
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CREDENTIALS.map((c) => (
            <Nis key={c.naam}>
              <div className="flex flex-col items-center px-3 pb-4 pt-6 text-center">
                <Lakzegel status={c.status} maat={46} />
                <h3
                  className="mt-3 text-[15px] font-normal leading-tight"
                  style={{ ...gegraveerd, color: C.ivoor }}
                >
                  {c.naam}
                </h3>
                <p className="mt-1.5 text-[11px] leading-snug" style={{ color: C.flauw }}>
                  {c.detail}
                </p>
                <div className="mt-2.5">
                  <Zegelband status={c.status} />
                </div>
              </div>
            </Nis>
          ))}
        </div>
      </section>

      {/* Twee kolommen: aanbevolen werk + laatste correspondentie */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Paneel>
          <h3
            className="px-5 pb-3 pt-4 text-[16px] font-normal"
            style={{ ...gegraveerd, color: C.ivoor, borderBottom: `1px solid ${C.goud}22` }}
          >
            Aangeboden werk dat past
          </h3>
          <ul>
            {OPDRACHTEN.slice(0, 2).map((op) => (
              <li key={op.id} style={{ borderBottom: `1px solid ${C.goud}14` }}>
                <button
                  type="button"
                  onClick={() => onGa("opdracht")}
                  className="schr-focus flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#241b17]"
                >
                  <span className="min-w-0">
                    <span
                      className="block text-[14.5px] font-normal leading-tight"
                      style={{ ...gegraveerd, color: C.ivoor }}
                    >
                      {op.titel}
                    </span>
                    <span
                      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px]"
                      style={{ color: C.flauw }}
                    >
                      {op.opdrachtgever}
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} aria-hidden="true" /> {op.plaats}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="block text-[13px] tabular-nums"
                      style={{ ...gegraveerd, color: C.goudLicht }}
                    >
                      {op.match}%
                    </span>
                    <span className="block text-[11.5px] tabular-nums" style={{ color: C.zacht }}>
                      {op.tarief}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Paneel>

        <Paneel>
          <h3
            className="px-5 pb-3 pt-4 text-[16px] font-normal"
            style={{ ...gegraveerd, color: C.ivoor, borderBottom: `1px solid ${C.goud}22` }}
          >
            Laatste correspondentie
          </h3>
          <ul>
            {BERICHTEN.slice(0, 3).map((b) => (
              <li
                key={b.van}
                className="flex items-start gap-3 px-5 py-3.5"
                style={{ borderBottom: `1px solid ${C.goud}14` }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px]"
                  style={{
                    background: C.nisDiep,
                    color: C.goudLicht,
                    border: `1px solid ${C.goud}33`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px]" style={{ color: C.ivoor }}>
                      {b.van}
                    </span>
                    {b.ongelezen ? (
                      <span
                        className="rounded-full px-1.5 py-[1px] text-[10px]"
                        style={{ background: `${C.goud}22`, color: C.goud }}
                      >
                        ongelezen
                      </span>
                    ) : null}
                    <span className="text-[11px]" style={{ color: C.flauw }}>
                      {b.tijd}
                    </span>
                  </span>
                  <span
                    className="mt-0.5 block text-[12px] leading-snug"
                    style={{ color: C.zacht }}
                  >
                    {b.preview}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3">
            <button
              type="button"
              onClick={() => onGa("berichten")}
              className="schr-focus rounded-md px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[#241b17]"
              style={{ color: C.goud, border: `1px solid ${C.goud}44` }}
            >
              Alle correspondentie
            </button>
          </div>
        </Paneel>
      </section>
    </div>
  );
}

/** Fijn goudlijntje als verloopgrafiek. */
function Golfje({ waarden }: { waarden: number[] }) {
  const max = Math.max(...waarden);
  const min = Math.min(...waarden);
  const bereik = max - min || 1;
  const punten = waarden
    .map((w, i) => {
      const x = (i / (waarden.length - 1)) * 46;
      const y = 12 - ((w - min) / bereik) * 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="46" height="14" viewBox="0 0 46 14" aria-hidden="true">
      <polyline points={punten} fill="none" stroke={C.goud} strokeWidth="1" opacity="0.8" />
    </svg>
  );
}

// ── Nissen (verificatie) — de kern-ervaring ────────────────────────────────────────────
type Herkomst = {
  afgegevenDoor: string;
  nummer: string;
  geverifieerdOp: string;
  door: string;
  geldigTot: string;
  log: { wie: string; wanneer: string; wat: string }[];
};

const HERKOMST: Record<string, Herkomst> = {
  "BIG-registratie": {
    afgegevenDoor: "CIBG — BIG-register, Ministerie van VWS",
    nummer: "89 04 12 33 1",
    geverifieerdOp: "14 mei 2026",
    door: "Beoordelaar M. Jansen",
    geldigTot: "1 januari 2028",
    log: [
      { wie: "Thuiszorg De Linde", wanneer: "22 juni, 09:14", wat: "zegel ingezien" },
      { wie: "Zorggroep Almere", wanneer: "18 juni, 15:40", wat: "zegel ingezien" },
      { wie: "Beoordelaar M. Jansen", wanneer: "14 mei, 11:02", wat: "stuk gekeurd en bezegeld" },
    ],
  },
  "Diploma Verpleegkunde (hbo-v)": {
    afgegevenDoor: "Hogeschool Utrecht — diplomaregister DUO",
    nummer: "DUO-4471-982",
    geverifieerdOp: "14 mei 2026",
    door: "Beoordelaar M. Jansen",
    geldigTot: "onbeperkt geldig",
    log: [
      { wie: "Zorggroep Almere", wanneer: "18 juni, 15:41", wat: "zegel ingezien" },
      { wie: "Beoordelaar M. Jansen", wanneer: "14 mei, 11:06", wat: "stuk gekeurd en bezegeld" },
    ],
  },
  "VOG (zorg)": {
    afgegevenDoor: "Justis — screeningsautoriteit",
    nummer: "VOG-2024-77 210",
    geverifieerdOp: "2 juni 2025",
    door: "Beoordelaar S. Okoro",
    geldigTot: "over 23 dagen",
    log: [
      { wie: "Kwintes — Team GGZ", wanneer: "20 juni, 08:55", wat: "zegel ingezien" },
      { wie: "Systeemcontrole", wanneer: "1 juni, 03:00", wat: "houdbaarheid herberekend" },
    ],
  },
  "Reanimatie / BLS": {
    afgegevenDoor: "Nederlandse Reanimatie Raad — erkende instructeur",
    nummer: "NRR-BLS-5518",
    geverifieerdOp: "nog niet gekeurd",
    door: "in behandeling bij het keurloket",
    geldigTot: "onbekend tot keuring",
    log: [{ wie: "U zelf", wanneer: "21 juni, 19:22", wat: "stuk aangeboden ter keuring" }],
  },
};

function Nissen() {
  const [gekozen, setGekozen] = useState<string>(CREDENTIALS[0]?.naam ?? "");
  const [logOpen, setLogOpen] = useState(false);
  const cred = CREDENTIALS.find((c) => c.naam === gekozen) ?? CREDENTIALS[0]!;
  const h = HERKOMST[cred.naam];
  const m = zegelMeta(cred.status);

  const kies = useCallback((naam: string) => {
    setGekozen(naam);
    setLogOpen(false);
  }, []);

  return (
    <div className="space-y-8">
      {/* Nissenrij als keuzelijst */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CREDENTIALS.map((c) => {
          const aan = c.naam === gekozen;
          return (
            <button
              key={c.naam}
              type="button"
              onClick={() => kies(c.naam)}
              aria-pressed={aan}
              className="schr-focus text-left"
            >
              <Nis actief={aan}>
                <div className="flex flex-col items-center px-3 pb-4 pt-6 text-center">
                  <Lakzegel status={c.status} maat={aan ? 54 : 44} />
                  <h3
                    className="mt-3 text-[14.5px] font-normal leading-tight"
                    style={{ ...gegraveerd, color: aan ? C.ivoor : C.zacht }}
                  >
                    {c.naam}
                  </h3>
                  <p className="mt-1 text-[11px]" style={{ color: C.flauw }}>
                    {zegelMeta(c.status).label}
                  </p>
                </div>
              </Nis>
            </button>
          );
        })}
      </div>

      {/* De gekozen nis, groot en verlicht */}
      <Nis actief>
        <article className="px-5 py-8 sm:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <Lakzegel status={cred.status} maat={78} />
            <h3
              className="mt-4 text-[26px] font-normal leading-tight sm:text-[30px]"
              style={{ ...gegraveerd, color: C.ivoor }}
            >
              {cred.naam}
            </h3>
            <p className="mt-2 text-[12.5px]" style={{ color: C.zacht }}>
              {cred.detail}
            </p>
            <div className="mt-3 flex justify-center">
              <Zegelband status={cred.status} />
            </div>
          </div>

          {h ? (
            <>
              <div
                className="mx-auto mt-8 h-px w-full max-w-2xl"
                style={{
                  background: `linear-gradient(to right, transparent, ${C.goud}44, transparent)`,
                }}
                aria-hidden="true"
              />
              <dl className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  { l: "Afgegeven door", v: h.afgegevenDoor },
                  { l: "Kenmerk", v: h.nummer },
                  { l: "Geverifieerd op", v: `${h.geverifieerdOp} · ${h.door}` },
                  { l: "Geldig tot", v: h.geldigTot },
                ].map((r) => (
                  <div key={r.l}>
                    <dt
                      className="text-[10.5px] uppercase tracking-[0.2em]"
                      style={{ color: C.goud }}
                    >
                      {r.l}
                    </dt>
                    <dd className="mt-1 text-[13px] leading-snug" style={{ color: C.ivoor }}>
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Toegangslog — uitklapbaar */}
              <div className="mx-auto mt-7 max-w-2xl">
                <button
                  type="button"
                  onClick={() => setLogOpen((v) => !v)}
                  aria-expanded={logOpen}
                  aria-controls="schr-log"
                  className="schr-focus flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-left transition-colors hover:bg-[#241b17]"
                  style={{ border: `1px solid ${C.goud}33` }}
                >
                  <span
                    className="inline-flex items-center gap-2 text-[13px]"
                    style={{ color: C.ivoor }}
                  >
                    <Eye size={14} strokeWidth={1.8} aria-hidden="true" style={{ color: C.goud }} />
                    Wie heeft dit ingezien? ({h.log.length})
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="transition-transform"
                    style={{ color: C.goud, transform: logOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div id="schr-log" hidden={!logOpen} className="mt-2">
                  <ol className="rounded-md" style={{ border: `1px solid ${C.goud}22` }}>
                    {h.log.map((r) => (
                      <li
                        key={`${r.wie}-${r.wanneer}`}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5"
                        style={{ borderBottom: `1px solid ${C.goud}14` }}
                      >
                        <span className="text-[12.5px]" style={{ color: C.ivoor }}>
                          {r.wie}
                        </span>
                        <span className="text-[11.5px]" style={{ color: C.zacht }}>
                          {r.wat}
                        </span>
                        <span className="text-[11.5px] tabular-nums" style={{ color: C.flauw }}>
                          {r.wanneer}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: C.flauw }}>
                    Elke inzage wordt vastgelegd. Opdrachtgevers zien uitsluitend het zegel en de
                    geldigheid — nooit het document zelf.
                  </p>
                </div>
              </div>

              {cred.status !== "VERIFIED" ? (
                <div
                  className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center gap-3 rounded-md px-4 py-3"
                  style={{ border: `1px solid ${m.tint}55`, background: `${m.tint}10` }}
                  role="note"
                >
                  <m.Icon size={16} strokeWidth={2} aria-hidden="true" style={{ color: m.tint }} />
                  <p
                    className="min-w-0 flex-1 text-[12.5px] leading-relaxed"
                    style={{ color: C.ivoor }}
                  >
                    {cred.status === "EXPIRING"
                      ? "Het zegel van dit stuk verbleekt. Vernieuw het bewijsstuk vóór de vervaldatum; daarna vervalt het van rechtswege en verdwijnt het uit uw match."
                      : cred.status === "SUBMITTED"
                        ? "Dit stuk ligt bij het keurloket. Zodra een beoordelaar het heeft gekeurd, krijgt het zijn zegel en telt het mee."
                        : "Dit stuk is afgekeurd. De reden is vastgelegd; dien een nieuw, leesbaar exemplaar in."}
                  </p>
                  <button
                    type="button"
                    className="schr-focus shrink-0 rounded-md px-4 py-2 text-[12.5px] font-semibold"
                    style={{ background: C.goud, color: C.veld }}
                  >
                    {cred.status === "EXPIRING" ? "Vernieuwen" : "Nieuw stuk aanbieden"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-6 text-center text-[12.5px]" style={{ color: C.flauw }}>
              Van dit stuk is nog geen herkomst vastgelegd.
            </p>
          )}
        </article>
      </Nis>
    </div>
  );
}

// ── Markt ──────────────────────────────────────────────────────────────────────────────
type Toestand = "gereed" | "laden" | "fout";

function Markt({ onOpen }: { onOpen: () => void }) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md px-4 py-2.5 sm:max-w-md"
          style={{ background: C.nis, ...lijstwerk(false) }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.goud }} />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op functie, plaats of opdrachtgever"
            aria-label="Opdrachten zoeken"
            className="schr-focus w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.ivoor }}
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Weergavetoestand">
          {(["gereed", "laden", "fout"] as Toestand[]).map((t) => {
            const aan = toestand === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setToestand(t)}
                aria-pressed={aan}
                className="schr-focus rounded-md px-3 py-1.5 text-[12px] transition-colors"
                style={{
                  color: aan ? C.veld : C.zacht,
                  background: aan ? C.goud : "transparent",
                  border: `1px solid ${aan ? C.goud : `${C.goud}2e`}`,
                }}
              >
                {t === "gereed" ? "Aanbod" : t === "laden" ? "Laden" : "Storing"}
              </button>
            );
          })}
        </div>
      </div>

      {toestand === "laden" ? (
        <Skelet />
      ) : toestand === "fout" ? (
        <Storing onHerstel={() => setToestand("gereed")} />
      ) : lijst.length === 0 ? (
        <Leegte
          kop="Niets in het aanbod"
          uitleg={`Er is geen opdracht gevonden voor “${zoek}”. Wis uw zoekterm om het volledige aanbod te zien.`}
          knop="Zoekterm wissen"
          onKnop={() => setZoek("")}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {lijst.map((o) => (
            <li key={o.id}>
              <Nis>
                <article className="flex h-full flex-col px-5 pb-5 pt-7 text-center">
                  <span
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${C.goud}44`, background: C.nisDiep }}
                    aria-hidden="true"
                  >
                    <FileText size={16} strokeWidth={1.6} style={{ color: C.goud }} />
                  </span>
                  <h3
                    className="text-[17px] font-normal leading-tight"
                    style={{ ...gegraveerd, color: C.ivoor }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1.5 text-[12px]" style={{ color: C.flauw }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div
                    className="my-4 h-px w-full"
                    style={{
                      background: `linear-gradient(to right, transparent, ${C.goud}33, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                  <dl className="grid grid-cols-2 gap-y-2 text-left">
                    {[
                      { l: "Tarief", v: o.tarief },
                      { l: "Omvang", v: o.uren },
                      { l: "Aanvang", v: o.start },
                      { l: "Match", v: `${o.match}%` },
                    ].map((r) => (
                      <div key={r.l}>
                        <dt
                          className="text-[10px] uppercase tracking-[0.18em]"
                          style={{ color: C.goud }}
                        >
                          {r.l}
                        </dt>
                        <dd className="text-[12.5px] tabular-nums" style={{ color: C.ivoor }}>
                          {r.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {o.tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-full px-2.5 py-[3px] text-[11px]"
                        style={{ color: C.zacht, border: `1px solid ${C.goud}2e` }}
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="schr-focus mt-5 w-full rounded-md px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:scale-[1.01]"
                    style={{ background: C.goud, color: C.veld }}
                  >
                    Opdracht bekijken
                  </button>
                </article>
              </Nis>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ────────────────────────────────────────────────────────────────────
function OpdrachtBlad({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [gereageerd, setGereageerd] = useState(false);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={onTerug}
        className="schr-focus inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[#241b17]"
        style={{ color: C.zacht, border: `1px solid ${C.goud}2e` }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" /> Terug naar het aanbod
      </button>

      <Nis actief>
        <div className="px-5 py-8 text-center sm:px-10">
          <Kapitaal>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </Kapitaal>
          <h3
            className="mt-3 text-[26px] font-normal leading-tight sm:text-[32px]"
            style={{ ...gegraveerd, color: C.ivoor }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-3 text-[13px]" style={{ color: C.zacht }}>
            {opdracht.match}% overeenkomst met uw bewijsstukken en voorkeuren
          </p>
          <dl className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Aanvang", v: opdracht.start },
              { l: "Kenmerk", v: opdracht.id },
            ].map((r) => (
              <div key={r.l}>
                <dt className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.goud }}>
                  {r.l}
                </dt>
                <dd className="mt-1 text-[13px] tabular-nums" style={{ color: C.ivoor }}>
                  {r.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Nis>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Paneel className="px-5 py-5">
          <h4
            className="flex items-center gap-2 text-[16px] font-normal"
            style={{ ...gegraveerd, color: C.ivoor }}
          >
            <Check size={15} strokeWidth={2.2} aria-hidden="true" style={{ color: C.ok }} />
            Wat ervoor pleit
          </h4>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                <span
                  className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.ok }}
                  aria-hidden="true"
                />
                <span style={{ color: C.zacht }}>
                  {r} <span style={{ color: C.ok }}>· pleit vóór</span>
                </span>
              </li>
            ))}
          </ul>
        </Paneel>
        <Paneel className="px-5 py-5">
          <h4
            className="flex items-center gap-2 text-[16px] font-normal"
            style={{ ...gegraveerd, color: C.ivoor }}
          >
            <AlertTriangle
              size={15}
              strokeWidth={2.2}
              aria-hidden="true"
              style={{ color: C.waarschuw }}
            />
            Wat ertegen pleit
          </h4>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                <span
                  className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.waarschuw }}
                  aria-hidden="true"
                />
                <span style={{ color: C.zacht }}>
                  {r} <span style={{ color: C.waarschuw }}>· pleit tegen</span>
                </span>
              </li>
            ))}
          </ul>
        </Paneel>
      </div>

      <Paneel className="flex flex-wrap items-center gap-3 px-5 py-4">
        <Key size={16} strokeWidth={1.8} aria-hidden="true" style={{ color: C.goud }} />
        <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed" style={{ color: C.zacht }}>
          Voor deze opdracht is een geldige VOG (zorg) vereist. Uw zegel verbleekt over 23 dagen —
          vernieuw het stuk vóór u zich vastlegt.
        </p>
      </Paneel>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setGereageerd(true)}
          disabled={gereageerd}
          className="schr-focus rounded-md px-6 py-3 text-[13px] font-semibold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed"
          style={{
            background: gereageerd ? "transparent" : C.goud,
            color: gereageerd ? C.flauw : C.veld,
            border: `1px solid ${gereageerd ? `${C.goud}44` : C.goud}`,
          }}
        >
          {gereageerd ? "Uw reactie is bezorgd" : "Reageren op deze opdracht"}
        </button>
        <button
          type="button"
          onClick={() => setGereageerd(false)}
          disabled={!gereageerd}
          className="schr-focus inline-flex items-center gap-2 rounded-md px-5 py-3 text-[12.5px] transition-colors hover:bg-[#241b17] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ color: C.zacht, border: `1px solid ${C.goud}2e` }}
          title={!gereageerd ? "Intrekken kan pas nadat u heeft gereageerd" : undefined}
        >
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" /> Reactie intrekken
        </button>
      </div>
      {gereageerd ? (
        <p role="status" className="text-center text-[12px]" style={{ color: C.flauw }}>
          Bezorgd bij {opdracht.opdrachtgever}. Gemiddelde reactietijd: 6 uur.
        </p>
      ) : null}
    </div>
  );
}

// ── Zorgen (acties) ────────────────────────────────────────────────────────────────────
function Zorgen({ onGa }: { onGa: (b: Blad) => void }) {
  const [gedaan, setGedaan] = useState<Record<string, boolean>>({});
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const open = gesorteerd.filter((a) => !gedaan[a.titel]);

  if (open.length === 0) {
    return (
      <Leegte
        kop="Het schrijn is in rust"
        uitleg="Er vraagt op dit moment niets uw zorg. Zodra een zegel verbleekt of een opdracht reageert, verschijnt het hier."
        knop="Zorgen opnieuw tonen"
        onKnop={() => setGedaan({})}
      />
    );
  }

  return (
    <ol className="mx-auto max-w-3xl space-y-4">
      {gesorteerd.map((a, i) => {
        const klaar = !!gedaan[a.titel];
        const dringend = a.urgentie === "warning";
        const tint = dringend ? C.waarschuw : C.goud;
        return (
          <li key={a.titel} style={{ opacity: klaar ? 0.45 : 1 }}>
            <Paneel className="flex flex-wrap items-start gap-4 px-5 py-5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px]"
                style={{
                  ...gegraveerd,
                  color: tint,
                  border: `1px solid ${tint}55`,
                  background: C.nisDiep,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="flex flex-wrap items-center gap-2 text-[17px] font-normal leading-tight"
                  style={{ ...gegraveerd, color: C.ivoor }}
                >
                  <span style={klaar ? { textDecoration: "line-through" } : undefined}>
                    {a.titel}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px]"
                    style={{ ...ui, color: tint, border: `1px solid ${tint}55` }}
                  >
                    {dringend ? (
                      <AlertTriangle size={10} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Clock size={10} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {dringend ? "vervalt binnenkort" : "wanneer het u schikt"}
                  </span>
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.zacht }}>
                  {a.detail}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onGa(dringend ? "verificatie" : "marktplaats")}
                  className="schr-focus rounded-md px-4 py-2 text-[12.5px] font-semibold"
                  style={{ background: C.goud, color: C.veld }}
                >
                  {a.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setGedaan((v) => ({ ...v, [a.titel]: !v[a.titel] }))}
                  aria-pressed={klaar}
                  className="schr-focus rounded-md px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#241b17]"
                  style={{ color: C.zacht, border: `1px solid ${C.goud}2e` }}
                >
                  {klaar ? "Terugzetten" : "Afgedaan"}
                </button>
              </div>
            </Paneel>
          </li>
        );
      })}
    </ol>
  );
}

// ── Rekenkamer (facturen) ──────────────────────────────────────────────────────────────
type Sleutel = "nr" | "klant" | "bedrag" | "status";

function naarGetal(b: string): number {
  return Number(b.replace(/[^0-9.]/g, "").replace(/\./g, "")) || 0;
}

function Rekenkamer() {
  const [sleutel, setSleutel] = useState<Sleutel>("nr");
  const [omgekeerd, setOmgekeerd] = useState(false);

  const rijen = useMemo(() => {
    const kopie = [...FACTUREN];
    kopie.sort((a, b) => {
      let r = 0;
      if (sleutel === "bedrag") r = naarGetal(a.bedrag) - naarGetal(b.bedrag);
      else if (sleutel === "klant") r = a.klant.localeCompare(b.klant, "nl");
      else if (sleutel === "status") r = a.status.localeCompare(b.status, "nl");
      else r = a.nr.localeCompare(b.nr, "nl");
      return omgekeerd ? -r : r;
    });
    return kopie;
  }, [sleutel, omgekeerd]);

  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");
  const totaalOpen = openstaand.reduce((s, f) => s + naarGetal(f.bedrag), 0);
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + naarGetal(f.bedrag),
    0,
  );

  const statusTint = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.waarschuw : C.flauw;

  const kop = (k: Sleutel, label: string) => (
    <th
      scope="col"
      className="px-4 py-2.5 text-left"
      aria-sort={sleutel === k ? (omgekeerd ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => {
          if (sleutel === k) setOmgekeerd((v) => !v);
          else {
            setSleutel(k);
            setOmgekeerd(false);
          }
        }}
        className="schr-focus inline-flex items-center gap-1.5 rounded text-[10.5px] uppercase tracking-[0.18em]"
        style={{ color: sleutel === k ? C.goudLicht : C.goud }}
      >
        {label}
        <ArrowUpDown size={11} strokeWidth={2} aria-hidden="true" />
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Voldaan dit jaar", v: `€ ${totaalBetaald.toLocaleString("nl-NL")}`, t: C.ok },
          { l: "Nog open", v: `€ ${totaalOpen.toLocaleString("nl-NL")}`, t: C.waarschuw },
          {
            l: "In concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            t: C.flauw,
          },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-md px-5 py-4 text-center"
            style={{ background: C.plint, ...lijstwerk(false) }}
          >
            <div
              className="text-[22px] font-normal tabular-nums leading-none"
              style={{ ...gegraveerd, color: s.t }}
            >
              {s.v}
            </div>
            <div className="mt-2 text-[11.5px]" style={{ color: C.zacht }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <Paneel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <caption className="px-4 pt-4 text-left text-[12px]" style={{ color: C.flauw }}>
              {FACTUREN.length} facturen · sorteer door op een kolomkop te klikken.
            </caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.goud}33` }}>
                {kop("nr", "Nummer")}
                {kop("klant", "Opdrachtgever")}
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-[10.5px] uppercase tracking-[0.18em]"
                  style={{ color: C.goud }}
                >
                  Datum
                </th>
                {kop("bedrag", "Bedrag")}
                {kop("status", "Status")}
              </tr>
            </thead>
            <tbody>
              {rijen.map((f) => {
                const t = statusTint(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#241b17]"
                    style={{ borderBottom: `1px solid ${C.goud}14` }}
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 text-left text-[12.5px] font-normal tabular-nums"
                      style={{ color: C.ivoor }}
                    >
                      {f.nr}
                    </th>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: C.zacht }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.flauw }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] tabular-nums"
                      style={{ ...gegraveerd, color: C.goudLicht }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px]"
                        style={{ color: t, border: `1px solid ${t}55`, background: `${t}12` }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Paneel>
    </div>
  );
}

// ── Bewaargeving (documenten) ──────────────────────────────────────────────────────────
function Bewaargeving() {
  const [filter, setFilter] = useState<"alle" | CredStatus>("alle");
  const lijst = useMemo(
    () => (filter === "alle" ? DOCUMENTEN : DOCUMENTEN.filter((d) => d.status === filter)),
    [filter],
  );

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-center gap-1.5"
        role="group"
        aria-label="Filter op zegel"
      >
        {(["alle", "VERIFIED", "EXPIRING", "SUBMITTED", "REJECTED"] as const).map((f) => {
          const aan = filter === f;
          const label = f === "alle" ? "Alles" : zegelMeta(f).label;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={aan}
              className="schr-focus rounded-md px-3.5 py-1.5 text-[12px] transition-colors"
              style={{
                color: aan ? C.veld : C.zacht,
                background: aan ? C.goud : "transparent",
                border: `1px solid ${aan ? C.goud : `${C.goud}2e`}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {lijst.length === 0 ? (
        <Leegte
          kop="Geen stukken met dit zegel"
          uitleg="In uw bewaarplaats ligt op dit moment geen document met het gekozen zegel. Meestal is dat goed nieuws."
          knop="Alles tonen"
          onKnop={() => setFilter("alle")}
        />
      ) : (
        <Paneel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <caption className="px-4 pt-4 text-left text-[12px]" style={{ color: C.flauw }}>
                {lijst.length} stuk(ken) · versleuteld bewaard, alleen toegankelijk voor u en een
                beoordelaar.
              </caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.goud}33` }}>
                  {["Stuk", "Soort", "Omvang", "Bijgewerkt", "Zegel"].map((k) => (
                    <th
                      key={k}
                      scope="col"
                      className="px-4 py-2.5 text-left text-[10.5px] uppercase tracking-[0.18em]"
                      style={{ color: C.goud }}
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lijst.map((d) => (
                  <tr
                    key={d.naam}
                    className="transition-colors hover:bg-[#241b17]"
                    style={{ borderBottom: `1px solid ${C.goud}14` }}
                  >
                    <th scope="row" className="px-4 py-3 text-left">
                      <span
                        className="flex items-center gap-2 text-[12.5px]"
                        style={{ color: C.ivoor }}
                      >
                        <Lock
                          size={12}
                          strokeWidth={1.8}
                          aria-hidden="true"
                          style={{ color: C.goud }}
                        />
                        {d.naam}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-[12px]" style={{ color: C.zacht }}>
                      {d.type}
                    </td>
                    <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.zacht }}>
                      {d.grootte}
                    </td>
                    <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.flauw }}>
                      {d.bijgewerkt}
                    </td>
                    <td className="px-4 py-3">
                      <Zegelband status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paneel>
      )}

      <Paneel className="flex flex-wrap items-center gap-3 px-5 py-4">
        <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" style={{ color: C.goud }} />
        <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed" style={{ color: C.zacht }}>
          Bewaargeving betekent: u geeft het stuk in bewaring, niet uit handen. U kunt elk document
          intrekken zolang het niet aan een lopende opdracht is gekoppeld.
        </p>
      </Paneel>
    </div>
  );
}

// ── Correspondentie (berichten) ────────────────────────────────────────────────────────
function Correspondentie() {
  const [gekozen, setGekozen] = useState<string>(BERICHTEN[0]?.van ?? "");
  const actief = BERICHTEN.find((b) => b.van === gekozen) ?? null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Paneel>
        <ul>
          {BERICHTEN.map((b) => {
            const aan = b.van === gekozen;
            return (
              <li key={b.van} style={{ borderBottom: `1px solid ${C.goud}14` }}>
                <button
                  type="button"
                  onClick={() => setGekozen(b.van)}
                  aria-pressed={aan}
                  className="schr-focus flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[#241b17]"
                  style={{ background: aan ? C.nisDiep : "transparent" }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11.5px]"
                    style={{
                      background: C.plint,
                      color: C.goudLicht,
                      border: `1px solid ${C.goud}${aan ? "66" : "2e"}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px]" style={{ color: C.ivoor }}>
                        {b.van}
                      </span>
                      {b.ongelezen ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px]"
                          style={{ background: `${C.goud}22`, color: C.goud }}
                        >
                          <Mail size={9} strokeWidth={2.4} aria-hidden="true" /> ongelezen
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="mt-0.5 block text-[12px] leading-snug"
                      style={{ color: C.zacht }}
                    >
                      {b.preview}
                    </span>
                    <span className="mt-1 block text-[11px]" style={{ color: C.flauw }}>
                      {b.tijd}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Paneel>

      {actief ? (
        <Nis vlak>
          <article className="px-5 py-7 sm:px-8">
            <div className="text-center">
              <Kapitaal>Bericht van</Kapitaal>
              <h3
                className="mt-2 text-[22px] font-normal leading-tight"
                style={{ ...gegraveerd, color: C.ivoor }}
              >
                {actief.van}
              </h3>
              <div
                className="mx-auto mt-3 h-px w-14"
                style={{
                  background: `linear-gradient(to right, transparent, ${C.goud}, transparent)`,
                }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-5 text-[13.5px] leading-relaxed" style={{ color: C.ivoor }}>
              {actief.preview}
            </p>
            <dl className="mt-6 space-y-2 text-[12.5px]">
              {[
                { l: "Ontvangen", v: actief.tijd },
                { l: "Gemiddelde reactietijd", v: "6 uur" },
                { l: "Gedeeld met deze partij", v: "alleen zegels, geen documenten" },
              ].map((r) => (
                <div
                  key={r.l}
                  className="flex flex-wrap justify-between gap-2 pb-2"
                  style={{ borderBottom: `1px solid ${C.goud}14` }}
                >
                  <dt style={{ color: C.flauw }}>{r.l}</dt>
                  <dd style={{ color: C.ivoor }}>{r.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                className="schr-focus rounded-md px-4 py-2.5 text-[12.5px] font-semibold"
                style={{ background: C.goud, color: C.veld }}
              >
                Beantwoorden
              </button>
              <button
                type="button"
                className="schr-focus rounded-md px-4 py-2.5 text-[12.5px] transition-colors hover:bg-[#241b17]"
                style={{ color: C.zacht, border: `1px solid ${C.goud}2e` }}
              >
                Gesprek archiveren
              </button>
            </div>
          </article>
        </Nis>
      ) : (
        <Leegte
          kop="Geen gesprek gekozen"
          uitleg="Kies links een gesprek om het volledige bericht te lezen."
          knop="Eerste gesprek openen"
          onKnop={() => setGekozen(BERICHTEN[0]?.van ?? "")}
        />
      )}
    </div>
  );
}

// ── Bewaarders (bemiddelaars-overzicht) ────────────────────────────────────────────────
type Bewaarder = {
  naam: string;
  plaats: string;
  dossiers: number;
  bezegeld: number;
  verbleekt: number;
  terKeuring: number;
};

const BEWAARDERS: Bewaarder[] = [
  {
    naam: "Zorgbureau Vecht",
    plaats: "Utrecht",
    dossiers: 48,
    bezegeld: 41,
    verbleekt: 4,
    terKeuring: 3,
  },
  {
    naam: "Flexzorg Noord",
    plaats: "Groningen",
    dossiers: 31,
    bezegeld: 22,
    verbleekt: 7,
    terKeuring: 2,
  },
  {
    naam: "De Bemiddelkamer",
    plaats: "Rotterdam",
    dossiers: 64,
    bezegeld: 60,
    verbleekt: 1,
    terKeuring: 3,
  },
];

function Bewaarders() {
  const [gekozen, setGekozen] = useState<string | null>(null);
  const totaal = BEWAARDERS.reduce((s, b) => s + b.dossiers, 0);
  const verbleekt = BEWAARDERS.reduce((s, b) => s + b.verbleekt, 0);

  return (
    <div className="space-y-6">
      <p
        className="mx-auto max-w-2xl text-center text-[12.5px] leading-relaxed"
        style={{ color: C.zacht }}
      >
        Bemiddelaars beheren dossiers namens zelfstandigen. Zij zien uitsluitend zegels en
        geldigheidsdata — nooit het document zelf. {totaal} dossiers in beheer, waarvan {verbleekt}{" "}
        met een verbleekt zegel.
      </p>

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {BEWAARDERS.map((b) => {
          const aan = gekozen === b.naam;
          const pct = Math.round((b.bezegeld / b.dossiers) * 100);
          return (
            <li key={b.naam}>
              <Nis actief={aan}>
                <div className="px-5 pb-5 pt-7 text-center">
                  <span
                    className="mx-auto flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${C.goud}44`, background: C.nisDiep }}
                    aria-hidden="true"
                  >
                    <Users size={17} strokeWidth={1.6} style={{ color: C.goud }} />
                  </span>
                  <h3
                    className="mt-3 text-[18px] font-normal leading-tight"
                    style={{ ...gegraveerd, color: C.ivoor }}
                  >
                    {b.naam}
                  </h3>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.flauw }}>
                    {b.plaats} · {b.dossiers} dossiers
                  </p>

                  <div className="mt-4">
                    <span
                      className="block h-2 w-full overflow-hidden rounded-full"
                      style={{ background: C.plint, border: `1px solid ${C.goud}2e` }}
                      role="img"
                      aria-label={`${pct} procent van de dossiers is bezegeld`}
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${pct}%`, background: C.goud }}
                      />
                    </span>
                    <p className="mt-1.5 text-[11.5px]" style={{ color: C.zacht }}>
                      {pct}% bezegeld
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGekozen(aan ? null : b.naam)}
                    aria-expanded={aan}
                    aria-controls={`schr-bew-${b.naam.replace(/\W/g, "")}`}
                    className="schr-focus mt-4 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[#241b17]"
                    style={{ color: C.goud, border: `1px solid ${C.goud}44` }}
                  >
                    {aan ? "Verbergen" : "Uitsplitsing"}
                    <ChevronDown
                      size={13}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="transition-transform"
                      style={{ transform: aan ? "rotate(180deg)" : "none" }}
                    />
                  </button>

                  <dl
                    id={`schr-bew-${b.naam.replace(/\W/g, "")}`}
                    hidden={!aan}
                    className="mt-4 space-y-2 text-left text-[12px]"
                  >
                    {[
                      { l: "Bezegeld", v: b.bezegeld, t: C.ok },
                      { l: "Zegel verbleekt", v: b.verbleekt, t: C.waarschuw },
                      { l: "Ter keuring", v: b.terKeuring, t: C.wacht },
                    ].map((r) => (
                      <div
                        key={r.l}
                        className="flex items-center justify-between gap-3 pb-1.5"
                        style={{ borderBottom: `1px solid ${C.goud}14` }}
                      >
                        <dt className="inline-flex items-center gap-2" style={{ color: C.zacht }}>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: r.t }}
                            aria-hidden="true"
                          />
                          {r.l}
                        </dt>
                        <dd className="tabular-nums" style={{ color: C.ivoor }}>
                          {r.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Nis>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Gedeelde toestanden ────────────────────────────────────────────────────────────────

function Skelet() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      <li className="sr-only">Bezig met het openen van de nissen…</li>
      {[0, 1, 2].map((n) => (
        <li key={n}>
          <Nis>
            <div className="schr-gloed px-5 pb-5 pt-7" style={{ animationDelay: `${n * 220}ms` }}>
              <span
                className="mx-auto block h-10 w-10 rounded-full"
                style={{ background: `${C.goud}1f` }}
              />
              <span
                className="mx-auto mt-4 block h-3.5 w-3/4 rounded"
                style={{ background: `${C.goud}1f` }}
              />
              <span
                className="mx-auto mt-2 block h-3 w-1/2 rounded"
                style={{ background: `${C.goud}14` }}
              />
              <span className="mt-6 block h-px w-full" style={{ background: `${C.goud}1f` }} />
              <span
                className="mt-5 block h-9 w-full rounded"
                style={{ background: `${C.goud}14` }}
              />
            </div>
          </Nis>
        </li>
      ))}
    </ul>
  );
}

function Storing({ onHerstel }: { onHerstel: () => void }) {
  return (
    <div className="mx-auto max-w-lg" role="alert">
      <Nis>
        <div className="px-6 py-10 text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.fout}66`, background: `${C.fout}12` }}
            aria-hidden="true"
          >
            <AlertTriangle size={20} strokeWidth={1.8} style={{ color: C.fout }} />
          </span>
          <h3 className="mt-4 text-[21px] font-normal" style={{ ...gegraveerd, color: C.ivoor }}>
            De nissen blijven gesloten
          </h3>
          <p
            className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed"
            style={{ color: C.zacht }}
          >
            Het aanbod kon niet worden opgehaald (foutcode E-503). Uw bewaarplaats is ongewijzigd;
            er is niets verloren gegaan.
          </p>
          <button
            type="button"
            onClick={onHerstel}
            className="schr-focus mt-6 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[12.5px] font-semibold"
            style={{ background: C.goud, color: C.veld }}
          >
            <RotateCcw size={14} strokeWidth={2} aria-hidden="true" /> Opnieuw proberen
          </button>
        </div>
      </Nis>
    </div>
  );
}

function Leegte({
  kop,
  uitleg,
  knop,
  onKnop,
}: {
  kop: string;
  uitleg: string;
  knop: string;
  onKnop: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <Nis>
        <div className="px-6 py-12 text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.goud}44`, background: C.nisDiep }}
            aria-hidden="true"
          >
            <Landmark size={20} strokeWidth={1.6} style={{ color: C.goud }} />
          </span>
          <h3 className="mt-4 text-[21px] font-normal" style={{ ...gegraveerd, color: C.ivoor }}>
            {kop}
          </h3>
          <p
            className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed"
            style={{ color: C.zacht }}
          >
            {uitleg}
          </p>
          <button
            type="button"
            onClick={onKnop}
            className="schr-focus mt-6 rounded-md px-5 py-2.5 text-[12.5px] font-semibold"
            style={{ background: C.goud, color: C.veld }}
          >
            {knop}
          </button>
        </div>
      </Nis>
    </div>
  );
}
