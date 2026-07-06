"use client";

// Concept 135 — "Kaartenbak" · bibliotheek-kaartcatalogus.
// Een houten bibliotheek-kaartenbak/catalogus: warm eiken-canvas (#e9dcc4), crème indexkaarten
// (#faf4e6) met geponste geleiding-gaatjes en een messing label-houder, getypte catalogus-regels,
// A–Z tab-scheidingskaarten en classificatie-codes (Dewey-achtig). Opdrachten/credentials als
// doorbladerbare catalogus-kaarten. Rustig, warm, ambachtelijk-georganiseerd. Onderscheidend van
// "dossier" (manila-map) en "boekband" (Penguin-omslag): dit is een KAARTCATALOGUS met indexkaarten
// en A–Z-tabs. Fonts: Newsreader (display) + Spline Mono (getypt).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  Library,
  BookMarked,
  Hash,
  MapPin,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Eiken/messing/crème palet.
const C = {
  bg: "#e4d5b9", // warm eiken kast
  bgDeep: "#d8c39f",
  card: "#faf4e6", // crème indexkaart
  cardEdge: "#efe4cc",
  ink: "#33291a", // getypte inkt
  inkSoft: "#6b5a3e", // gedempte inkt
  inkFaint: "#9a876a", // labels / gaatjes-schaduw
  brass: "#a9812f", // messing label-houder / accent
  brassDeep: "#846226",
  oak: "#b79a63", // eiken lijn
  oakDark: "#8a7444",
  green: "#4b7a45", // geverifieerd (potlood-groen)
  red: "#a8452f", // afgewezen (rood potlood)
  amber: "#b57e28", // caution
  rule: "#e6dbc2", // liniatuur op de kaart
  ruleStrong: "#d8c9a8",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const typed = { fontFamily: "var(--font-lab-spline-mono)" };

// Classificatie-codes (Dewey-achtig) per scherm — puur presentationeel.
const CLASS: Record<ScreenKey, string> = {
  dashboard: "000",
  marktplaats: "025.4",
  opdracht: "331.7",
  verificatie: "614.2",
  acties: "153.8",
  facturen: "657.7",
  documenten: "651.5",
  berichten: "384.3",
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.brass };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Houtnerf-textuur van de kast.
const oakGrain =
  "repeating-linear-gradient(90deg, rgba(138,116,68,0.05) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(90deg, rgba(105,86,48,0.03) 0 1px, transparent 1px 22px)," +
  "radial-gradient(120% 80% at 10% 0%, rgba(250,244,230,0.28), transparent 55%)," +
  "radial-gradient(100% 90% at 95% 100%, rgba(138,116,68,0.14), transparent 60%)";

// ── Indexkaart ────────────────────────────────────────────────────────────────
// De signatuur-bouwsteen: crème kaart met geponst geleidingsgat bovenaan, liniatuur en
// een zachte schaduw alsof hij in de bak staat.
function IndexCard({
  children,
  className = "",
  interactive = false,
  punch = true,
  accent,
  ruled = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  punch?: boolean;
  accent?: string;
  ruled?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: ruled
          ? `repeating-linear-gradient(${C.card}, ${C.card} 27px, ${C.rule} 27px, ${C.rule} 28px)`
          : C.card,
        border: `1px solid ${C.cardEdge}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 14px -10px rgba(51,41,26,0.45), 0 1px 2px rgba(51,41,26,0.08)",
        ...(accent ? { borderTop: `2px solid ${accent}` } : null),
      }}
    >
      {punch && (
        <span
          className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full"
          style={{ background: C.bgDeep, boxShadow: "inset 0 1px 2px rgba(51,41,26,0.5)" }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Messing tab-label (op de scheidingskaart / kop).
function BrassTab({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
      style={{
        ...typed,
        background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
        color: C.card,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(51,41,26,0.3)",
      }}
    >
      {children}
    </span>
  );
}

function Stamp({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={
        solid
          ? { ...typed, background: tone, color: C.card }
          : { ...typed, color: tone, border: `1.5px solid ${tone}`, background: `${tone}12` }
      }
    >
      {children}
    </span>
  );
}

// Getypte catalogus-regel-key.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="shrink-0 text-[10.5px] uppercase tracking-[0.14em]"
        style={{ ...typed, color: C.inkFaint }}
      >
        {label}
      </span>
      <span
        className="h-px flex-1 self-center"
        style={{ background: C.ruleStrong }}
        aria-hidden="true"
      />
      <span className="text-[12.5px] tabular-nums" style={{ ...typed, color: C.ink }}>
        {value}
      </span>
    </div>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Sectiekop met classificatie-signatuur.
function CatHeader({ screen, title, sub }: { screen: ScreenKey; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[3px]"
        style={{
          background: C.card,
          border: `1px solid ${C.cardEdge}`,
          boxShadow: "0 2px 6px -4px rgba(51,41,26,0.5)",
        }}
        aria-hidden="true"
      >
        <Hash size={11} style={{ color: C.brass }} />
        <span className="text-[9px] tabular-nums" style={{ ...typed, color: C.inkSoft }}>
          {CLASS[screen]}
        </span>
      </span>
      <div>
        {sub && (
          <div
            className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{ ...typed, color: C.brass }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[26px] font-medium leading-none tracking-[-0.01em] sm:text-[30px]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export function Concept135() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ background: C.bg, backgroundImage: oakGrain, color: C.ink }}
    >
      {/* Kast-kop */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[3px]"
            style={{
              background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px -3px rgba(51,41,26,0.5)",
            }}
          >
            <Library size={22} strokeWidth={2} style={{ color: C.card }} aria-hidden="true" />
          </span>
          <div className="leading-none">
            <div
              className="text-[22px] font-medium tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Kaartenbak
            </div>
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...typed, color: C.inkFaint }}
            >
              <BookMarked size={11} aria-hidden="true" /> ZZP · Catalogus
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ ...typed, color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[13px] font-semibold"
            style={{
              ...typed,
              background: C.card,
              border: `1px solid ${C.cardEdge}`,
              color: C.brassDeep,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tab-scheidingskaarten (nav) */}
      <nav
        className="mx-auto mt-7 max-w-5xl overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        <div className="flex items-end gap-1" style={{ borderBottom: `2px solid ${C.oakDark}` }}>
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative shrink-0 rounded-t-[4px] px-4 pb-2 pt-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: on ? C.card : C.cardEdge,
                  border: `1px solid ${C.oak}`,
                  borderBottom: "none",
                  transform: on ? "translateY(1px)" : "translateY(4px)",
                  boxShadow: on ? "0 -2px 6px -4px rgba(51,41,26,0.4)" : "none",
                }}
              >
                <span
                  className="block text-[8.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...typed, color: on ? C.brass : C.inkFaint }}
                >
                  {CLASS[s.key]}
                </span>
                <span
                  className="block text-[12.5px]"
                  style={{ ...display, color: on ? C.ink : C.inkSoft, fontWeight: on ? 600 : 400 }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-11">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.brass, C.green, C.oakDark, C.red];
  return (
    <div className="space-y-9">
      <section>
        <BrassTab>Vandaag · {PROFIEL.plaats}</BrassTab>
        <h1
          className="mt-3 text-[34px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p
          className="mt-2 max-w-md text-[14px] leading-relaxed"
          style={{ ...typed, color: C.inkSoft }}
        >
          De bak is geordend. Eén kaart is uit de rij gehaald — die vraagt vandaag om aandacht.
        </p>
      </section>

      {/* Primaire actie-kaart, uit de bak getild */}
      <IndexCard accent={C.red} punch className="p-0">
        <div className="flex flex-col gap-5 p-6 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
              style={{ background: `${C.red}14`, border: `1.5px solid ${C.red}55` }}
            >
              <AlertTriangle
                size={20}
                strokeWidth={2.2}
                style={{ color: C.red }}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...typed, color: C.red }}
              >
                Uitgelicht · vraagt aandacht
              </span>
              <h2
                className="mt-1.5 text-[22px] font-medium leading-tight sm:text-[25px]"
                style={{ ...display, color: C.ink }}
              >
                {primair.titel}
              </h2>
              <p
                className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                style={{ ...typed, color: C.inkSoft }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{
              ...typed,
              background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
              color: C.card,
            }}
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </IndexCard>

      {/* KPI-kaartjes */}
      <section>
        <CatHeader screen="dashboard" title="In cijfers" sub="Registratie" />
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <IndexCard key={k.label} interactive punch={false} className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...typed, color: C.inkFaint }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[10.5px] font-semibold tabular-nums"
                    style={{ ...typed, color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[27px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </IndexCard>
            );
          })}
        </div>
      </section>

      {/* Top-match kaart */}
      <section>
        <CatHeader screen="marktplaats" title="Voor jou" sub="Beste match" />
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <IndexCard
            interactive
            accent={C.brass}
            className="flex flex-col gap-5 p-5 pt-6 sm:flex-row sm:items-center"
          >
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full"
              style={{ background: `${C.brass}16`, border: `1.5px solid ${C.brass}55` }}
              aria-hidden="true"
            >
              <span
                className="text-[20px] font-medium tabular-nums leading-none"
                style={{ ...display, color: C.brassDeep }}
              >
                {top.match}
              </span>
              <span
                className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...typed, color: C.brass }}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-medium leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...typed, color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Stamp key={t} tone={C.brassDeep}>
                    {t}
                  </Stamp>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.brass }}
              aria-hidden="true"
            />
          </IndexCard>
        </button>
      </section>
    </div>
  );
}

function MatchGauge({ value }: { value: number }) {
  const tone = value >= 90 ? C.green : C.brass;
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.ruleStrong }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
      <span className="text-[12.5px] font-semibold tabular-nums" style={{ ...typed, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <div className="space-y-7">
      <CatHeader screen="marktplaats" title="Marktplaats" sub="Doorbladeren" />

      <IndexCard punch={false} className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.inkFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek in de catalogus op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...typed, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11.5px] font-semibold tabular-nums"
          style={{ ...typed, color: C.inkFaint }}
        >
          {filtered.length} krt
        </span>
      </IndexCard>

      {filtered.length === 0 ? (
        <IndexCard className="flex flex-col items-center justify-center gap-3 p-14 pt-16 text-center">
          <Library size={44} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[20px] font-medium" style={{ ...display, color: C.ink }}>
            Geen kaarten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...typed, color: C.inkSoft }}>
            Niets in de bak past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...typed,
              background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
              color: C.card,
            }}
          >
            Zoekopdracht wissen
          </button>
        </IndexCard>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <IndexCard interactive className="p-5 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                        style={{ ...typed, color: C.inkFaint }}
                      >
                        {o.id}
                      </span>
                      <h3
                        className="mt-0.5 text-[19px] font-medium leading-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[12.5px]" style={{ ...typed, color: C.inkSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                    </div>
                    <ArrowRight
                      size={19}
                      className="mt-1 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.brass }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Stamp key={t} tone={C.oakDark}>
                          {t}
                        </Stamp>
                      ))}
                    </div>
                    <MatchGauge value={o.match} />
                  </div>
                </IndexCard>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Plaats", v: opdracht.plaats },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...typed, color: C.inkSoft }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar catalogus
      </button>

      {/* Hoofdkaart */}
      <IndexCard accent={C.brass} className="p-6 pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <BrassTab>{opdracht.id}</BrassTab>
          <Stamp tone={C.green} solid>
            {opdracht.match}% match
          </Stamp>
        </div>
        <h1
          className="mt-3 text-[30px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-1.5 flex items-center gap-1.5 text-[13.5px]"
          style={{ ...typed, color: C.inkSoft }}
        >
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {feiten.map((m) => (
            <Field key={m.l} label={m.l} value={m.v} />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <Stamp key={t} tone={C.brassDeep}>
              {t}
            </Stamp>
          ))}
        </div>
      </IndexCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <IndexCard punch={false} accent={C.green} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...typed, color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </IndexCard>
        <IndexCard punch={false} accent={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...typed, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </IndexCard>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[3px] px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{
            ...typed,
            background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
            color: C.card,
          }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...typed, border: `1.5px solid ${C.oak}`, color: C.ink }}
        >
          Bewaar in bak
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <CatHeader screen="verificatie" title="Verificatie" sub="Signatuur" />

      <IndexCard accent={C.brass} className="flex flex-col items-center gap-6 p-6 pt-7 sm:flex-row">
        <span
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full"
          style={{ background: `${C.brass}16`, border: `2px solid ${C.brass}55` }}
          aria-hidden="true"
        >
          <span
            className="text-[26px] font-medium tabular-nums leading-none"
            style={{ ...display, color: C.brassDeep }}
          >
            {pct}%
          </span>
          <span
            className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...typed, color: C.brass }}
          >
            gedekt
          </span>
        </span>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-[2px] px-3 py-1 text-[12px] font-semibold"
            style={{
              ...typed,
              background: `${C.green}16`,
              color: C.green,
              border: `1.5px solid ${C.green}44`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p
            className="mt-3 max-w-md text-[14px] leading-relaxed"
            style={{ ...typed, color: C.inkSoft }}
          >
            {verified} van {CREDENTIALS.length} kaarten volledig gesigneerd. Elke geverifieerde
            kaart versterkt je dossier — één vraagt binnenkort om vernieuwing.
          </p>
        </div>
      </IndexCard>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <IndexCard punch={false} className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{
                    background: `${st.tone}14`,
                    border: `1.5px solid ${st.tone}44`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-medium leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...typed, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Stamp tone={st.tone}>
                  <st.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Stamp>
              </IndexCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <CatHeader screen="acties" title="Volgende acties" sub="Uitgehaald" />
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.brass;
          return (
            <li key={a.titel}>
              <IndexCard
                punch={false}
                accent={warn ? C.red : C.oak}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[16px] font-medium tabular-nums"
                  style={{
                    ...display,
                    background: `${tone}14`,
                    color: tone,
                    border: `1.5px solid ${tone}44`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <BookMarked
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ ...typed, color: tone }}
                    >
                      {warn ? "Urgent" : "Informatief"}
                    </span>
                  </div>
                  <h3
                    className="mt-1 text-[17px] font-medium leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {a.titel}
                  </h3>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...typed, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-[3px] px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...typed, background: tone, color: C.card }}
                >
                  {a.cta}
                </button>
              </IndexCard>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.red;
    if (status === "Concept") return C.inkFaint;
    return C.brass;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <CatHeader screen="facturen" title="Facturen" sub="Grootboek" />
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{
            ...typed,
            background: `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
            color: C.card,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <IndexCard punch={false} className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.ruleStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...typed, color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: `1px solid ${C.rule}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...typed, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ ...display, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...typed, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Stamp tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Stamp>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-medium tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.ruleStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...typed, color: C.inkFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-medium tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </IndexCard>
    </div>
  );
}
