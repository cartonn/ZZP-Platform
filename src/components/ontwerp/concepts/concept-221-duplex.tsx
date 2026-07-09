"use client";

// Concept 221 — "Duplex" · duotoon split-screen editorial. Eén harde verticale scheidslijn deelt elk scherm
// in een donker inkt-paneel (masthead + navigatie) en een licht papier-paneel (inhoud). Oversized display-serif
// (Fraunces) tegen een strakke grotesk (Libre Franklin), precies twee basiskleuren — inkt & papier — plus één
// scherp vermiljoen-accent. Redactioneel ritme: genummerde secties, uppercase kickers, hairline-regels, grote
// koppen. Statussen dragen altijd een woord én een icoon (nooit alleen kleur), dus de duotoon blijft leesbaar.
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen. UI Nederlands, code Engels.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  TriangleAlert,
  RefreshCw,
  BadgeCheck,
  LayoutGrid,
  Store,
  ListChecks,
  Receipt,
  Minus,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — twee basiskleuren (inkt & papier) + één scherp accent. ──
const C = {
  ink: "#14110c", // diep warm-zwart
  inkSoft: "#37322a", // zachter inkt
  paper: "#f4f0e6", // warm papier
  paperAlt: "#eae3d3", // licht vlak
  paperLine: "#d7cfbc", // hairline op papier
  onInk: "#f4f0e6", // papier-tekst op inkt
  onInkSoft: "#bcb3a1", // secundair op inkt
  onInkFaint: "#867e6e", // labels op inkt
  inkLine: "#3a352c", // hairline op inkt
  accent: "#df3b1f", // vermiljoen
  accentDeep: "#a5260f", // dieper accent (tekst op papier)
  accentInk: "#2a0a03", // tekst op accent-vlak
};

const displayF = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };

// ── Status-model — monochroom (inkt/papier) + accent voor negatief; altijd label + icoon. ──
type StatusStyle = { label: string; Icon: LucideIcon; kind: "solid" | "line" | "alarm" };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, kind: "solid" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, kind: "line" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, kind: "alarm" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, kind: "alarm" };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const style: React.CSSProperties =
    m.kind === "solid"
      ? { background: C.ink, color: C.onInk, border: `1px solid ${C.ink}` }
      : m.kind === "alarm"
        ? { background: "transparent", color: C.accentDeep, border: `1.5px solid ${C.accent}` }
        : { background: "transparent", color: C.inkSoft, border: `1px solid ${C.paperLine}` };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ ...bodyF, ...style }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Editorial kaart — vierkant, hairline-rand, geen radius, geen schaduw.
function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ background: C.paper, border: `1px solid ${C.paperLine}`, ...style }}
    >
      {children}
    </div>
  );
}

// Redactionele sectie-kop — genummerde kicker + serif-titel + hairline eronder.
function SectionHead({ num, kicker, title }: { num: string; kicker: string; title: string }) {
  return (
    <div className="border-b pb-3" style={{ borderColor: C.paperLine }}>
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ ...bodyF, color: C.accentDeep }}
        >
          {num}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...bodyF, color: C.onInkFaint }}
        >
          {kicker}
        </span>
      </div>
      <h2 className="mt-1 text-[26px] leading-[1.05]" style={{ ...displayF, color: C.ink }}>
        {title}
      </h2>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ color: C.onInkFaint }}>
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={bodyF}>
          {label}
        </span>
      </div>
      <div className="mt-1 text-[15px] font-medium tabular-nums" style={{ ...bodyF, color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

// Hairline-sparkline in inkt (editorial, geen vulling).
function Spark({ data, tone = "ink" }: { data: number[]; tone?: "ink" | "accent" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const line = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 24 - ((v - min) / span) * 20 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="h-6 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polyline
        points={line}
        fill="none"
        stroke={tone === "accent" ? C.accent : C.ink}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Oversized redactioneel match-cijfer.
function MatchFigure({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const num = size === "lg" ? "text-[76px]" : size === "sm" ? "text-[34px]" : "text-[52px]";
  return (
    <div className="flex items-start leading-none" style={{ color: C.ink }}>
      <span className={`${num} tabular-nums`} style={displayF}>
        {value}
      </span>
      <span
        className="mt-1 text-[13px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...bodyF, color: C.accentDeep }}
      >
        %
      </span>
    </div>
  );
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: FileText,
  acties: ListChecks,
};

// ── Root — de harde split: inkt-rail links, papier-inhoud rechts. ──────────────────
export function Concept221() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased lg:flex"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      {/* Inkt-paneel — masthead + navigatie; blijft donker over alle schermen. */}
      <aside
        className="relative shrink-0 lg:sticky lg:top-0 lg:h-screen lg:w-[300px]"
        style={{
          background: C.ink,
          color: C.onInk,
          borderRight: `2px solid ${C.accent}`,
        }}
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-7 py-7" style={{ borderColor: C.inkLine }}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ background: C.accent, color: C.paper }}
                aria-hidden="true"
              >
                <span className="text-[16px] font-bold" style={displayF}>
                  D
                </span>
              </span>
              <div>
                <div className="text-[20px] leading-none" style={{ ...displayF, color: C.onInk }}>
                  Duplex
                </div>
                <div
                  className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: C.onInkFaint }}
                >
                  Editie 2026
                </div>
              </div>
            </div>
          </div>

          <nav
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-5"
            aria-label="Schermen"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const Icon = NAV_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: on ? C.accent : "transparent",
                    color: on ? C.paper : C.onInkSoft,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: on ? C.paper : C.onInkFaint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="text-[14px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t px-7 py-6" style={{ borderColor: C.inkLine }}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
                style={{ ...displayF, background: C.paper, color: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold" style={{ color: C.onInk }}>
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[11px]" style={{ color: C.onInkFaint }}>
                  {PROFIEL.rol}
                </div>
              </div>
            </div>
            <span
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ border: `1px solid ${C.accent}`, color: C.accent }}
            >
              <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </aside>

      {/* Papier-paneel — de inhoud. */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 lg:px-14">
        <div className="mx-auto max-w-5xl">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}

          <footer
            className="mt-14 flex flex-wrap items-center gap-2 border-t pt-6 text-[11px]"
            style={{ borderColor: C.paperLine, color: C.onInkFaint }}
          >
            <Minus size={12} strokeWidth={2.4} style={{ color: C.accent }} aria-hidden="true" />
            Redactionele duotoon — twee kleuren, één accent; elke status draagt een woord én een
            icoon.
          </footer>
        </div>
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-10">
      {/* Masthead — oversized editorial kop over de volle breedte. */}
      <header className="border-b pb-6" style={{ borderColor: C.ink }}>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: C.accentDeep }}
          >
            Dagoverzicht
          </span>
          <span className="h-px flex-1" style={{ background: C.paperLine }} aria-hidden="true" />
          <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.onInkFaint }}>
            {PROFIEL.plaats}
          </span>
        </div>
        <h1
          className="mt-4 text-[40px] leading-[0.98] sm:text-[58px]"
          style={{ ...displayF, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          <br />
          <span style={{ color: C.accentDeep }}>Drie matches</span> vragen om een besluit.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Eén punt vraagt aandacht — je VOG verloopt binnenkort. De rest van je week staat op groen.
          Neem de tijd, kies scherp.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Bekijk je matches <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            onClick={onActies}
            className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: "transparent",
              color: C.accentDeep,
              border: `1.5px solid ${C.accent}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <TriangleAlert size={14} strokeWidth={2.4} aria-hidden="true" /> Regel je VOG
          </button>
        </div>
      </header>

      {/* KPI-strook — hairline-gescheiden kolommen, geen kaarten. */}
      <section
        className="grid grid-cols-2 gap-px lg:grid-cols-4"
        style={{ background: C.paperLine }}
      >
        {KPIS.map((k, i) => (
          <div key={k.label} className="p-5" style={{ background: C.paper }}>
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.onInkFaint }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.ink : C.accentDeep }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[30px] tabular-nums leading-none"
              style={{ ...displayF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} tone={i === 3 ? "accent" : "ink"} />
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.7fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            num="01"
            kicker="Voor jou geselecteerd"
            title="Opdrachten met de beste aansluiting"
          />
          <div>
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-5 border-b py-5 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderColor: C.paperLine,
                  ["--hov" as string]: C.ink,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <MatchFigure value={o.match} size="sm" />
                <div
                  className="min-w-0 flex-1 transition-colors group-hover:text-[color:var(--onhov)]"
                  style={{ ["--onhov" as string]: C.onInk }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.accentDeep }}
                  >
                    {o.id}
                  </div>
                  <div className="mt-0.5 text-[19px] leading-tight" style={displayF}>
                    {o.titel}
                  </div>
                  <div className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Rechterkolom — aandachtspunt + verificatiestand */}
        <section className="space-y-6">
          <div>
            <SectionHead num="02" kicker="Vraagt aandacht" title="Nu regelen" />
            <Card className="mt-4 p-5" style={{ borderColor: C.accent, borderWidth: 1.5 }}>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ background: C.accent, color: C.paper }}
              >
                <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
              </span>
              <h3 className="mt-3 text-[19px] leading-tight" style={{ ...displayF, color: C.ink }}>
                {warn.titel}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.ink,
                  color: C.paper,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.paper,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </Card>
          </div>

          <div>
            <SectionHead num="03" kicker="Vertrouwen" title="Verificatiestand" />
            <Card className="mt-4 p-5">
              <div className="flex items-end justify-between">
                <div
                  className="text-[46px] tabular-nums leading-none"
                  style={{ ...displayF, color: C.ink }}
                >
                  {dek}%
                </div>
                <StatusChip status="VERIFIED" />
              </div>
              <div
                className="mt-4 h-2 w-full"
                style={{ background: C.paperAlt }}
                aria-hidden="true"
              >
                <div className="h-full" style={{ width: `${dek}%`, background: C.ink }} />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {verified} van je {CREDENTIALS.length} certificaten zijn gecontroleerd.
                Opdrachtgevers zien uitsluitend geverifieerde documenten.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, skeleton, empty- én foutstate ─────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <SectionHead num="01" kicker="Alle open opdrachten" title="Marktplaats" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ border: `1px solid ${C.paperLine}`, background: C.paper }}
        >
          <Search size={15} strokeWidth={2} style={{ color: C.accentDeep }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ color: C.ink }}
          />
        </div>
        <button
          onClick={refresh}
          aria-label="Opdrachten verversen"
          className="flex h-10 items-center gap-2 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            border: `1px solid ${C.paperLine}`,
            color: C.inkSoft,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Verversen
        </button>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ border: `1.5px solid ${C.accent}`, background: C.paper }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.accentDeep }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ color: C.ink }}>
              Niet alles kon worden geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              Enkele opdrachten reageerden traag. Ververs om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.accentDeep, ["--tw-ring-color" as string]: C.accent }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ borderTop: `1px solid ${C.paperLine}` }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-5 border-b py-6"
              style={{ borderColor: C.paperLine }}
            >
              <span
                className="h-10 w-14 shrink-0 animate-pulse"
                style={{ background: C.paperAlt }}
              />
              <div className="flex-1 space-y-2">
                <span
                  className="block h-4 w-2/3 animate-pulse"
                  style={{ background: C.paperAlt }}
                />
                <span
                  className="block h-3 w-1/2 animate-pulse"
                  style={{ background: C.paperAlt }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ border: `1.5px solid ${C.paperLine}` }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.6} style={{ color: C.onInkFaint }} />
          </span>
          <p className="text-[24px]" style={{ ...displayF, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Voor &ldquo;{q}&rdquo; staat nu niets open. Pas je zoekterm aan of wis het veld voor het
            volledige overzicht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Toon alles
          </button>
        </Card>
      ) : (
        <div style={{ borderTop: `2px solid ${C.ink}` }}>
          {filtered.map((o) => (
            <article
              key={o.id}
              className="grid grid-cols-[auto_1fr] items-start gap-5 border-b py-6 sm:grid-cols-[auto_1fr_auto]"
              style={{ borderColor: C.paperLine }}
            >
              <MatchFigure value={o.match} size="md" />
              <div className="min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.accentDeep }}
                >
                  {o.id} · {o.opdrachtgever}
                </div>
                <h3
                  className="mt-1 text-[23px] leading-tight"
                  style={{ ...displayF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <dl className="mt-3 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-4">
                  <Meta Icon={MapPin} label="Plaats" value={o.plaats} />
                  <Meta Icon={Coins} label="Tarief" value={o.tarief} />
                  <Meta Icon={Clock} label="Omvang" value={o.uren} />
                  <Meta Icon={CalendarDays} label="Start" value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[11px] font-medium"
                      style={{ border: `1px solid ${C.paperLine}`, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:self-center">
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: "transparent",
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.paper,
                  }}
                >
                  Lees opdracht <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail — redactionele twee-kolom met plus/min ─────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ color: C.accentDeep, ["--tw-ring-color" as string]: C.accent }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Masthead-split: titel groot links, cijfer groot rechts. */}
      <header
        className="grid grid-cols-1 items-end gap-6 border-b pb-6 sm:grid-cols-[1fr_auto]"
        style={{ borderColor: C.ink }}
      >
        <div className="min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.accentDeep }}
          >
            {opdracht.id} · Start {opdracht.start}
          </div>
          <h1
            className="mt-2 text-[36px] leading-[1.02] sm:text-[46px]"
            style={{ ...displayF, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <MatchFigure value={opdracht.match} size="lg" />
      </header>

      <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.paperLine }}>
        {[
          { Icon: Coins, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Omvang", value: opdracht.uren },
          { Icon: CalendarDays, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((f) => (
          <div key={f.label} className="p-5" style={{ background: C.paper }}>
            <Meta Icon={f.Icon} label={f.label} value={f.value} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section>
          <SectionHead num="01" kicker="In het voordeel" title="Waarom dit past" />
          <ul className="mt-4 space-y-0">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 border-b py-3 text-[14px] leading-snug"
                style={{ borderColor: C.paperLine, color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <SectionHead num="02" kicker="Om te wegen" title="Aandachtspunten" />
          <ul className="mt-4 space-y-0">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 border-b py-3 text-[14px] leading-snug"
                style={{ borderColor: C.paperLine, color: C.ink }}
              >
                <Minus
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.accentDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <SectionHead num="03" kicker="Gevraagd" title="Wat de opdrachtgever verwacht" />
        <div className="mt-4 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium"
              style={{ border: `1px solid ${C.ink}`, color: C.ink }}
            >
              <BadgeCheck
                size={13}
                strokeWidth={2.2}
                style={{ color: C.accentDeep }}
                aria-hidden="true"
              />{" "}
              {t}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row" style={{ borderColor: C.ink }}>
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: applied ? C.paper : C.ink,
            color: applied ? C.accentDeep : C.paper,
            border: `1.5px solid ${applied ? C.accent : C.ink}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          {applied ? (
            <>
              <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Reactie verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: saved ? C.ink : "transparent",
            color: saved ? C.paper : C.ink,
            border: `1.5px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          {saved ? "Bewaard" : "Bewaren"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead num="01" kicker="Documenten & vertrouwen" title="Jouw certificaten" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      {/* Duotoon-bandeau: inkt-blok met dekking. */}
      <div
        className="grid grid-cols-1 items-stretch gap-px sm:grid-cols-[auto_1fr]"
        style={{ background: C.paperLine }}
      >
        <div
          className="flex flex-col justify-center p-7"
          style={{ background: C.ink, color: C.onInk }}
        >
          <div
            className="text-[64px] tabular-nums leading-none"
            style={{ ...displayF, color: C.paper }}
          >
            {dek}%
          </div>
          <div
            className="mt-2 text-[11px] uppercase tracking-[0.18em]"
            style={{ color: C.onInkFaint }}
          >
            geverifieerd
          </div>
        </div>
        <div className="flex flex-col justify-center p-7" style={{ background: C.paper }}>
          <div className="text-[20px]" style={{ ...displayF, color: C.ink }}>
            {verified} van {CREDENTIALS.length} certificaten gecontroleerd
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Elk geverifieerd document versterkt je profiel. Nog even en je staat volledig op groen.
          </p>
          <span
            className="mt-3 inline-flex w-fit items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ border: `1px solid ${C.ink}`, color: C.ink }}
          >
            <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `2px solid ${C.ink}` }}>
        {CREDENTIALS.map((c) => {
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center gap-4 border-b py-4"
              style={{ borderColor: C.paperLine }}
            >
              <FileText
                size={20}
                strokeWidth={1.8}
                style={{ color: C.inkSoft }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[16px]" style={{ ...displayF, color: C.ink }}>
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
              </div>
              <StatusChip status={c.status} />
              {actionable && (
                <button
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: C.accentDeep, ["--tw-ring-color" as string]: C.accent }}
                >
                  {c.status === "EXPIRING"
                    ? "Vernieuwen"
                    : c.status === "REJECTED"
                      ? "Opnieuw indienen"
                      : "Bekijken"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Documenten-tabel */}
      <section>
        <SectionHead num="02" kicker="Veilig & privé bewaard" title="Je documenten" />
        <div className="mt-4 overflow-x-auto" style={{ border: `1px solid ${C.paperLine}` }}>
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.ink }}>
                {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.onInkSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENTEN.map((d, i) => (
                <tr
                  key={d.naam}
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.paperLine}` }}
                >
                  <td className="px-4 py-3 text-[13.5px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: C.inkSoft }}>
                    {d.type}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.inkSoft }}>
                    {d.grootte}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={d.status} />
                  </td>
                  <td
                    className="px-4 py-3 text-[12.5px] tabular-nums"
                    style={{ color: C.onInkFaint }}
                  >
                    {d.bijgewerkt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead num="01" kicker="Van belangrijk naar minder" title="Vandaag te doen" />
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={
            openCount === 0
              ? { background: C.ink, color: C.paper }
              : { border: `1.5px solid ${C.accent}`, color: C.accentDeep }
          }
        >
          {openCount === 0 ? (
            <>
              <Check size={12} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "punt" : "punten"}
            </>
          )}
        </span>
      </div>

      <ol style={{ borderTop: `2px solid ${C.ink}` }}>
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          return (
            <li
              key={a.titel}
              className="border-b"
              style={{ borderColor: C.paperLine, opacity: isDone ? 0.6 : 1 }}
            >
              <div className="flex items-stretch gap-4 py-5">
                <span
                  className="w-1 shrink-0"
                  style={{ background: warn ? C.accent : C.ink }}
                  aria-hidden="true"
                />
                <span
                  className="text-[30px] tabular-nums leading-none"
                  style={{ ...displayF, color: warn ? C.accentDeep : C.onInkFaint }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={
                        warn
                          ? { background: C.accent, color: C.paper }
                          : { border: `1px solid ${C.paperLine}`, color: C.inkSoft }
                      }
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Aandacht" : "Kans"}
                    </span>
                    <h3
                      className={`text-[18px] leading-tight ${isDone ? "line-through" : ""}`}
                      style={{ ...displayF, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              background: C.ink,
                              color: C.paper,
                              ["--tw-ring-color" as string]: C.accent,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                          : {
                              border: `1.5px solid ${C.ink}`,
                              color: C.ink,
                              ["--tw-ring-color" as string]: C.accent,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                      style={{ color: C.onInkFaint, ["--tw-ring-color" as string]: C.accent }}
                    >
                      <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                      {isDone ? "Ongedaan maken" : "Markeer klaar"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Check size={28} strokeWidth={2} style={{ color: C.ink }} aria-hidden="true" />
          <p className="text-[22px]" style={{ ...displayF, color: C.ink }}>
            Alles afgerond
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je hebt elk punt afgehandeld. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; kind: "solid" | "line" | "alarm" } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, kind: "solid" };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, kind: "alarm" };
    return { label: "Concept", Icon: FileText, kind: "line" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead num="01" kicker="Omzet & openstaand" title="Facturen" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.paperLine }}>
        {[
          { l: "Betaald deze maand", v: betaald, tone: "ink" as const },
          { l: "Openstaand", v: `${open}`, tone: "accent" as const },
          { l: "Nog te factureren", v: "€ 1.350", tone: "ink" as const },
        ].map((s) => (
          <div key={s.l} className="p-5" style={{ background: C.paper }}>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.onInkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[32px] tabular-nums leading-none"
              style={{ ...displayF, color: s.tone === "accent" ? C.accentDeep : C.ink }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.paperLine}` }}>
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.onInkSoft }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = factMeta(f.status);
              const style: React.CSSProperties =
                m.kind === "solid"
                  ? { background: C.ink, color: C.onInk, border: `1px solid ${C.ink}` }
                  : m.kind === "alarm"
                    ? { color: C.accentDeep, border: `1.5px solid ${C.accent}` }
                    : { color: C.inkSoft, border: `1px solid ${C.paperLine}` };
              return (
                <tr
                  key={f.nr}
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.paperLine}` }}
                >
                  <td
                    className="px-4 py-4 text-[14px] tabular-nums"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ color: C.inkSoft }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ color: C.onInkFaint }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{ ...bodyF, ...style }}
                    >
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                    </span>
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[16px] tabular-nums"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.ink}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkSoft }}
              >
                Totaal betaald deze maand
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] tabular-nums"
                style={{ ...displayF, color: C.ink }}
              >
                {betaald}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
