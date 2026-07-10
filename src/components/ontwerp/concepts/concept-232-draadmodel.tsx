"use client";

// Concept 232 — "Draadmodel" · wireframe logic as the final UI.
// 2026 trend: a refined lo-fi wireframe that happens to actually work. Thin 1px gray outline
// frames, image placeholders with a diagonal cross, hatch-filled blocks, and handwritten
// annotation callouts (Architects Daughter) with dotted arrows that label each function
// ("← volgende beste actie"). Grayscale palette with exactly one blue accent for primary
// actions/links. Sketch script for labels/headings; Inter for body and data so numbers stay
// crisp. Signature: an honest, function-forward prototype — every element named, nothing loud.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  MapPin,
  Coins,
  CalendarDays,
  Bookmark,
  Check,
  Inbox,
  RefreshCw,
  ShieldCheck,
  FileText,
  MessageSquare,
  Square,
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

// ── Palet — grijstinten + precies één blauw accent ─────────────────────────────
const C = {
  bg: "#fbfbfa",
  panel: "#ffffff",
  panelSoft: "#f5f6f7",
  ink: "#1f2430", // hoofdtekst
  inkSoft: "#4b5162",
  gray: "#6b7280", // secundair
  grayFaint: "#9aa1ad",
  line: "#c9ccd4", // 1px outline
  lineSoft: "#e2e4e9",
  blue: "#2563eb", // enige accent
  blueSoft: "#dbe6fe",
  green: "#4b5162", // status blijft grijs-neutraal met icoon
};

const sketch = { fontFamily: "var(--font-lab-architects)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Hachuur-vulling (diagonale arcering) — deterministische CSS.
const hatch = "repeating-linear-gradient(45deg, rgba(31,36,48,0.06) 0 1px, transparent 1px 7px)";

// ── Status → label + icoon + kleur ────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.blue };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.gray };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.ink };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.ink };
  }
}

// ── Helper-componenten ─────────────────────────────────────────────────────────

// Wireframe-kader — dunne outline, optioneel hachuur of "sketch"-titel.
function Frame({
  children,
  className = "",
  interactive = false,
  dashed = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  dashed?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-md bg-white ${
        interactive
          ? "transition-colors duration-150 hover:border-[color:var(--wf-blue)] motion-reduce:transition-none"
          : ""
      } ${className}`}
      style={{
        border: `1px ${dashed ? "dashed" : "solid"} ${C.line}`,
        ["--wf-blue" as string]: C.blue,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Handgeschreven callout met stippel-pijltje.
function Callout({
  children,
  side = "left",
}: {
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  return (
    <span
      className={`hidden items-center gap-1.5 text-[13px] leading-tight lg:inline-flex ${
        side === "right" ? "flex-row-reverse" : ""
      }`}
      style={{ ...sketch, color: C.blue }}
      aria-hidden="true"
    >
      <span
        className="inline-block h-0 w-8 border-t"
        style={{ borderColor: C.blue, borderStyle: "dotted", borderTopWidth: 2 }}
      />
      {children}
    </span>
  );
}

// Afbeeldings-placeholder met diagonaal kruis.
function ImgPlaceholder({ size = 48, label }: { size?: number; label?: string }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded"
      style={{ width: size, height: size, border: `1px solid ${C.line}`, background: C.panelSoft }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" width={size} height={size} className="absolute inset-0">
        <line x1="1" y1="1" x2="39" y2="39" stroke={C.line} strokeWidth="1" />
        <line x1="39" y1="1" x2="1" y2="39" stroke={C.line} strokeWidth="1" />
      </svg>
      {label && (
        <span className="relative text-[11px] font-semibold" style={{ ...body, color: C.gray }}>
          {label}
        </span>
      )}
    </span>
  );
}

function StatusChip({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        big ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ ...body, color: tone, border: `1px solid ${C.line}`, background: C.panelSoft }}
    >
      <Icon size={big ? 14 : 12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px]"
      style={{ ...body, color: C.gray, border: `1px dashed ${C.line}` }}
    >
      {children}
    </span>
  );
}

// Sectiekop — sketch-titel met onderstrepende potloodlijn.
function Kop({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div>
      <div className="flex items-end gap-3">
        <h2 className="text-[24px] leading-none sm:text-[28px]" style={{ ...sketch, color: C.ink }}>
          {children}
        </h2>
        {note && (
          <span className="pb-0.5 text-[12px]" style={{ ...body, color: C.grayFaint }}>
            {note}
          </span>
        )}
      </div>
      <span
        className="mt-2 block h-0 w-full border-t"
        style={{ borderColor: C.line, borderStyle: "dashed" }}
        aria-hidden="true"
      />
    </div>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={C.blue}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match-balk — gearceerd/gevuld draadmodel-meter.
function MatchBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px]" style={{ ...body, color: C.gray }}>
          Match
        </span>
        <span className="text-[13px] font-semibold tabular-nums" style={{ ...body, color: C.ink }}>
          {value}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ border: `1px solid ${C.line}`, background: C.panelSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: C.blue }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ── Hoofdcomponent ─────────────────────────────────────────────────────────────
export function Concept232() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      {/* Kop */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ border: `1px solid ${C.line}`, background: C.panel }}
            aria-hidden="true"
          >
            <Square size={20} strokeWidth={1.6} style={{ color: C.blue }} />
          </span>
          <div className="leading-none">
            <div className="text-[22px] leading-none" style={{ ...sketch, color: C.ink }}>
              Draadmodel
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.28em]"
              style={{ ...body, color: C.gray }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ ...body, color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ ...body, color: C.gray }}>
              {PROFIEL.rol}
            </div>
          </div>
          <ImgPlaceholder size={44} label={PROFIEL.initialen} />
        </div>
      </header>

      {/* Navigatie */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-t-md px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...body, color: on ? C.blue : C.gray, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2px]"
                  style={{ background: C.blue }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties onOpen={() => setScreen("marktplaats")} />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-10">
      <section>
        <div className="text-[12px] uppercase tracking-[0.24em]" style={{ ...body, color: C.gray }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[34px] leading-[1.05] sm:text-[42px]"
          style={{ ...sketch, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p
          className="mt-2 max-w-md text-[14px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Een doordacht prototype dat toevallig echt werkt. Elk blok is benoemd; één vraagt nu je
          aandacht.
        </p>
      </section>

      {/* Primaire actie met callout */}
      <div className="flex items-center gap-4">
        <Frame className="flex-1 p-6" dashed>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-2 text-[12px] font-medium"
                style={{ ...body, color: C.ink }}
              >
                <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
              </span>
              <h2 className="mt-2 text-[22px] leading-tight" style={{ ...sketch, color: C.ink }}>
                {primair.titel}
              </h2>
              <p
                className="mt-2 max-w-md text-[13.5px] leading-relaxed"
                style={{ ...body, color: C.inkSoft }}
              >
                {primair.detail}
              </p>
            </div>
            <button
              onClick={onOpen}
              className="group inline-flex shrink-0 items-center gap-2 rounded-md px-6 py-3 text-[13px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
              style={{ ...body, background: C.blue }}
            >
              {primair.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </Frame>
        <Callout>volgende beste actie</Callout>
      </div>

      {/* KPI's */}
      <section>
        <Kop note="/* meetwaarden deze maand */">Cijfers</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Frame key={k.label} interactive className="p-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px]" style={{ ...body, color: C.gray }}>
                  {k.label}
                </span>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ ...body, color: k.up ? C.blue : C.ink }}
                >
                  {k.up ? "↑" : "↓"} {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...body, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </Frame>
          ))}
        </div>
      </section>

      {/* Top-match met callout */}
      <section>
        <Kop note="/* hoogste match voor jou */">Beste match</Kop>
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={onOpen}
            className="group block flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <Frame interactive className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
              <ImgPlaceholder size={72} label={`${top.match}%`} />
              <div className="min-w-0 flex-1">
                <h3 className="text-[19px] leading-tight" style={{ ...sketch, color: C.ink }}>
                  {top.titel}
                </h3>
                <div className="mt-1 text-[12.5px]" style={{ ...body, color: C.gray }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </div>
                <div className="mt-3">
                  <MatchBar value={top.match} />
                </div>
              </div>
              <ArrowRight
                size={22}
                className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
                style={{ color: C.blue }}
                aria-hidden="true"
              />
            </Frame>
          </button>
          <Callout>match = som van redenen</Callout>
        </div>
      </section>

      {/* Berichten met loading/empty/error */}
      <section>
        <Kop note="/* gesprekken met opdrachtgevers */">Postvak</Kop>
        <div className="mt-5">
          <BerichtenPaneel />
        </div>
      </section>
    </div>
  );
}

// ── Berichten-paneel: loading / empty / error / data ────────────────────────────
type Fase = "data" | "loading" | "empty" | "error";
const FASES: { key: Fase; label: string }[] = [
  { key: "data", label: "Geladen" },
  { key: "loading", label: "Laden" },
  { key: "empty", label: "Leeg" },
  { key: "error", label: "Fout" },
];

function BerichtenPaneel() {
  const [fase, setFase] = useState<Fase>("data");
  return (
    <Frame>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: C.lineSoft }}
      >
        <span
          className="inline-flex items-center gap-2 text-[13px] font-semibold"
          style={{ ...body, color: C.ink }}
        >
          <MessageSquare size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />{" "}
          Berichten
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Toestand tonen">
          {FASES.map((f) => {
            const on = f.key === fase;
            return (
              <button
                key={f.key}
                onClick={() => setFase(f.key)}
                aria-pressed={on}
                className="rounded px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  ...body,
                  background: on ? C.blue : "transparent",
                  color: on ? "#fff" : C.gray,
                  border: `1px solid ${on ? C.blue : C.line}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {fase === "loading" && (
          <ul className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="h-10 w-10 shrink-0 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3 w-2/5 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <span
                    className="block h-3 w-4/5 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {fase === "empty" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Inbox size={30} strokeWidth={1.6} style={{ color: C.grayFaint }} aria-hidden="true" />
            <p className="text-[18px]" style={{ ...sketch, color: C.ink }}>
              Postvak leeg
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...body, color: C.gray }}>
              Geen nieuwe berichten. Reageer op een opdracht om een gesprek te openen.
            </p>
          </div>
        )}

        {fase === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <TriangleAlert
              size={30}
              strokeWidth={1.8}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
            <p className="text-[18px]" style={{ ...sketch, color: C.ink }}>
              Laden mislukt
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...body, color: C.gray }}>
              De berichten konden niet worden opgehaald. Probeer het opnieuw.
            </p>
            <button
              onClick={() => setFase("data")}
              className="mt-1 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...body, background: C.blue }}
            >
              <RefreshCw size={13} aria-hidden="true" /> Opnieuw proberen
            </button>
          </div>
        )}

        {fase === "data" && (
          <ul className="space-y-1">
            {BERICHTEN.map((b) => (
              <li
                key={b.van}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[color:var(--wf-soft)]"
                style={{ ["--wf-soft" as string]: C.panelSoft }}
              >
                <ImgPlaceholder size={40} label={b.initialen} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.blue }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="truncate text-[12.5px]" style={{ ...body, color: C.gray }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...body, color: C.grayFaint }}
                >
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  );
}

// ── Marktplaats ────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-7">
      <Kop note="/* open opdrachten */">Marktplaats</Kop>

      <Frame className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.gray }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...body, color: C.gray }}
        >
          {filtered.length}
        </span>
      </Frame>

      {filtered.length === 0 ? (
        <Frame dashed className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={30} strokeWidth={1.6} style={{ color: C.grayFaint }} aria-hidden="true" />
          <p className="text-[22px]" style={{ ...sketch, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.gray }}>
            Geen opdrachten onder “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.blue }}
          >
            Zoekopdracht wissen
          </button>
        </Frame>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <Frame interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <button
                  onClick={onOpen}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <h3 className="text-[18px] leading-tight" style={{ ...sketch, color: C.ink }}>
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.gray }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </button>
                <div className="flex items-center gap-3 sm:w-56">
                  <div className="min-w-0 flex-1">
                    <MatchBar value={o.match} />
                  </div>
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    aria-pressed={!!saved[o.id]}
                    aria-label={saved[o.id] ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: `1px solid ${saved[o.id] ? C.blue : C.line}`,
                      background: saved[o.id] ? C.blueSoft : "transparent",
                      color: saved[o.id] ? C.blue : C.gray,
                    }}
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={2}
                      fill={saved[o.id] ? C.blue : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Frame>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] transition-colors hover:text-[color:var(--wf-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...body, color: C.gray, ["--wf-blue" as string]: C.blue }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] uppercase tracking-[0.12em]"
            style={{ ...body, color: C.gray }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
            style={{ ...body, color: C.blue, background: C.blueSoft }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-2 text-[30px] leading-[1.06] sm:text-[38px]"
          style={{ ...sketch, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ ...body, color: C.gray }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Frame key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.blue }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...body, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.1em]"
              style={{ ...body, color: C.gray }}
            >
              {m.l}
            </div>
          </Frame>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Frame className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold"
            style={{ ...body, color: C.ink }}
          >
            <Check size={14} strokeWidth={2.4} style={{ color: C.blue }} aria-hidden="true" /> Wat
            past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ ...body, color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.blue }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Frame>
        <Frame className="p-5" style={{ backgroundImage: hatch }}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold"
            style={{ ...body, color: C.ink }}
          >
            <TriangleAlert size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ ...body, color: C.ink }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.gray }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Frame>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-md px-7 py-3.5 text-[13.5px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...body, background: C.blue }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <Kop note="/* vertrouwensniveau */">Verificatie</Kop>

      <Frame className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.lineSoft} strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.blue}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...body, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ ...body, color: C.gray }}
            >
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: C.blue }} aria-hidden="true" />
            <span className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
              {PROFIEL.trust}
            </span>
          </div>
          <p
            className="mt-2 max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...body, color: C.inkSoft }}
          >
            {verified} van de {CREDENTIALS.length} bewijsstukken zijn geverifieerd. Vernieuw wat
            binnenkort verloopt om zichtbaar te blijven voor opdrachtgevers.
          </p>
        </div>
      </Frame>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => (
          <li key={c.naam}>
            <Frame className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
                  {c.naam}
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.gray }}>
                  {c.detail}
                </p>
              </div>
              <StatusChip status={c.status} big />
            </Frame>
          </li>
        ))}
      </ul>

      <section>
        <div
          className="mb-3 flex items-center gap-2 text-[12px] font-semibold"
          style={{ ...body, color: C.gray }}
        >
          <FileText size={14} aria-hidden="true" /> Documenten
        </div>
        <Frame className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-[11px] uppercase tracking-[0.08em]"
                      style={{ ...body, color: C.gray }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d) => (
                  <tr
                    key={d.naam}
                    className="transition-colors hover:bg-[color:var(--wf-soft)]"
                    style={{
                      borderBottom: `1px solid ${C.lineSoft}`,
                      ["--wf-soft" as string]: C.panelSoft,
                    }}
                  >
                    <td
                      className="px-3 py-3 text-[13px] font-medium"
                      style={{ ...body, color: C.ink }}
                    >
                      {d.naam}
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ ...body, color: C.gray }}>
                      {d.type}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px] tabular-nums"
                      style={{ ...body, color: C.gray }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={d.status} />
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ ...body, color: C.gray }}>
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Frame>
      </section>
    </div>
  );
}

// ── Acties (checklist-toggle) ───────────────────────────────────────────────────
function Acties({ onOpen }: { onOpen: () => void }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const openCount = ACTIES.length - Object.values(done).filter(Boolean).length;
  return (
    <div className="space-y-7">
      <Kop note="/* checklist volgende acties */">Acties</Kop>

      <Frame className="flex items-center justify-between gap-4 p-5" dashed>
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ ...body, color: C.gray }}
          >
            Openstaand
          </div>
          <div
            className="mt-1 text-[34px] font-semibold tabular-nums leading-none"
            style={{ ...body, color: C.ink }}
          >
            {openCount}
          </div>
        </div>
        <p
          className="max-w-xs text-right text-[13px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Vink af wat je hebt gedaan. Wat overblijft is de volgende beste actie.
        </p>
      </Frame>

      <ul className="space-y-3">
        {ACTIES.map((a, i) => {
          const isDone = !!done[i];
          return (
            <li key={a.titel}>
              <Frame className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" interactive>
                <button
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  aria-pressed={isDone}
                  aria-label={isDone ? "Markeer als open" : "Markeer als gedaan"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    border: `1.5px solid ${isDone ? C.blue : C.line}`,
                    background: isDone ? C.blue : "transparent",
                    color: "#fff",
                  }}
                >
                  {isDone && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {a.urgentie === "warning" ? (
                      <TriangleAlert
                        size={14}
                        strokeWidth={2}
                        style={{ color: C.ink }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: C.blue }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className={`text-[15px] font-semibold ${isDone ? "line-through" : ""}`}
                      style={{ ...body, color: isDone ? C.grayFaint : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug" style={{ ...body, color: C.gray }}>
                    {a.detail}
                  </p>
                </div>
                {!isDone && (
                  <button
                    onClick={onOpen}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={{
                      ...body,
                      border: `1px solid ${C.blue}`,
                      color: C.blue,
                      background: C.panel,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </Frame>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────
function Facturen() {
  const statusStyle = (s: string): { color: string; bg: string } =>
    s === "Betaald"
      ? { color: C.blue, bg: C.blueSoft }
      : s === "Openstaand"
        ? { color: C.ink, bg: C.panelSoft }
        : { color: C.gray, bg: C.panelSoft };
  return (
    <div className="space-y-7">
      <Kop note="/* facturen & status */">Facturen</Kop>

      <Frame className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] uppercase tracking-[0.08em]"
                    style={{ ...body, color: C.gray }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const st = statusStyle(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[color:var(--wf-soft)]"
                    style={{
                      borderBottom: `1px solid ${C.lineSoft}`,
                      ["--wf-soft" as string]: C.panelSoft,
                    }}
                  >
                    <td
                      className="px-4 py-3.5 text-[13px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px]" style={{ ...body, color: C.gray }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-[14px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                        style={{ ...body, color: st.color, background: st.bg }}
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Frame>
    </div>
  );
}
