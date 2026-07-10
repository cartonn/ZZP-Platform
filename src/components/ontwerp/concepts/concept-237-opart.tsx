"use client";

// Concept 237 — "Op-art" · optische kinetiek, moiré & lijnvelden.
// Vasarely/Bridget Riley in een dashboard: strakke zwart-wit lijnvelden en subtiele moiré-/
// streeppatronen als sfeer AAN DE RANDEN (header, sidebar, lege vlakken), getekend met inline-SVG
// (<pattern> met repeterende lijnen + concentrische cirkels) en CSS repeating-linear-gradient.
// Bij hover schuiven/kantelen patronen subtiel (CSS transform, deterministisch — geen JS-random).
// De DATA staat op rustige, hoog-contrast egale vlakken: leesbaarheid lijdt nooit onder het patroon.
// Palet: gebroken-wit, hard zwart, één signaalkleur (fel oranje-rood). Koppen in Space Grotesk.

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Inbox,
  FileText,
  Plus,
  Check,
  Circle,
  MapPin,
  Wallet,
  Send,
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

// ── Palet ─────────────────────────────────────────────────────────────────────
const C = {
  paper: "#f7f7f5", // gebroken-wit canvas
  ink: "#0c0c0c", // hard zwart
  inkSoft: "#3a3a38", // secundaire tekst
  inkFaint: "#77776f", // labels / gedempt
  line: "#dedcd4", // hairline
  lineStrong: "#c6c4ba",
  panel: "#ffffff", // egaal datavlak
  signal: "#ff4d1c", // signaalkleur (oranje-rood)
  signalSoft: "#ffe9e1",
  green: "#1f7a4d", // geverifieerd (label + icoon, niet enkel kleur)
  amber: "#b26a00", // verloopt
  red: "#c02a1a", // afgewezen
};

const disp = { fontFamily: "var(--font-lab-space)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// ── Status: altijd label + icoon ──────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.inkSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

function matchTone(v: number): string {
  return v >= 90 ? C.signal : v >= 80 ? C.ink : C.inkSoft;
}

// ── Op-art patroonvelden (inline-SVG defs, deterministisch) ───────────────────
function OpArtDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {/* Verticale lijnvelden — Riley-ritmiek */}
        <pattern id="oa-lines" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={C.ink} />
          <rect x="0" width="4" height="8" fill={C.paper} />
        </pattern>
        {/* Fijner lijnveld voor moiré aan de randen */}
        <pattern id="oa-fine" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="transparent" />
          <rect x="0" width="2.5" height="5" fill={C.ink} opacity="0.9" />
        </pattern>
        {/* Concentrische cirkels — Vasarely-oog */}
        <pattern id="oa-rings" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill={C.ink} />
          {[10, 26, 42, 58, 74, 90].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={C.paper} strokeWidth="8" />
          ))}
        </pattern>
        {/* Diagonale signaal-strepen */}
        <pattern
          id="oa-diag"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="14" height="14" fill="transparent" />
          <rect x="0" width="7" height="14" fill={C.signal} opacity="0.85" />
        </pattern>
      </defs>
    </svg>
  );
}

// Randstrook met bewegende lijnen (schuift subtiel bij group-hover).
function EdgeBand({ id, className = "" }: { id: string; className?: string }) {
  return (
    <span className={`pointer-events-none block overflow-hidden ${className}`} aria-hidden="true">
      <span className="block h-full w-[140%] origin-left transition-transform duration-500 ease-out group-hover:translate-x-[-8%] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
      </span>
    </span>
  );
}

// ── Kleine bouwstenen ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ ...disp, color: C.inkFaint }}
    >
      {children}
    </span>
  );
}

function Chip({
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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
      style={
        solid
          ? { background: tone, color: C.paper }
          : { background: C.paper, color: C.ink, border: `1.5px solid ${tone}` }
      }
    >
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const st = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: C.panel, color: st.tone, border: `1.5px solid ${st.tone}` }}
    >
      <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {st.label}
    </span>
  );
}

// Bar-spark op egaal vlak (hoog contrast, geen ruis).
function BarSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const h = 20 + ((v - min) / span) * 80;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-full"
            style={{ height: `${h}%`, background: last ? tone : C.lineStrong }}
          />
        );
      })}
    </div>
  );
}

// Match-meter als segment-balk (zwart-wit ritmiek + accent op de gevulde segmenten).
function SegMeter({ value }: { value: number }) {
  const tone = matchTone(value);
  const filled = Math.round((value / 100) * 10);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-[6px]"
            style={{ background: i < filled ? tone : C.line }}
          />
        ))}
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...disp, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export function Concept237() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...ui, background: C.paper, color: C.ink }}
    >
      <OpArtDefs />

      {/* Header met moiré-randband */}
      <header
        className="group relative flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-7"
        style={{ background: C.panel, borderBottom: `2px solid ${C.ink}` }}
      >
        <EdgeBand id="oa-lines" className="absolute inset-y-0 right-0 w-24 opacity-[0.14]" />
        <div className="relative flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center overflow-hidden"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <svg width="36" height="36" viewBox="0 0 36 36">
              <rect width="36" height="36" fill={C.ink} />
              {[6, 12, 18].map((r) => (
                <circle
                  key={r}
                  cx="18"
                  cy="18"
                  r={r}
                  fill="none"
                  stroke={C.signal}
                  strokeWidth="3"
                />
              ))}
            </svg>
          </span>
          <div className="leading-none">
            <div
              className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.01em]"
              style={{ ...disp, color: C.ink }}
            >
              MOIRÉ
              <span
                className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ background: C.signal, color: C.paper }}
              >
                Op-art
              </span>
            </div>
            <div className="mt-1 text-[11px]" style={{ color: C.inkFaint }}>
              Zorgmarktplaats voor zelfstandigen
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center text-[12px] font-bold"
            style={{ ...disp, background: C.ink, color: C.paper }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tab-nav */}
      <nav
        className="flex items-center gap-0 overflow-x-auto px-4 md:px-6"
        style={{ background: C.paper, borderBottom: `1.5px solid ${C.line}` }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  ...disp,
                  color: on ? C.ink : C.inkFaint,
                  "--tw-ring-color": C.signal,
                } as React.CSSProperties
              }
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-2.5 -bottom-[1.5px] h-[3px]"
                  style={{ background: C.signal }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats />}
        {screen === "opdracht" && <Marktplaats initialId={OPDRACHTEN[0]?.id} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-6">
      {/* Prioriteit-banner met diagonaal signaalpatroon aan de rand */}
      <div
        className="group relative overflow-hidden"
        style={{ background: C.ink, border: `2px solid ${C.ink}` }}
      >
        <EdgeBand id="oa-diag" className="absolute inset-y-0 right-0 w-40 opacity-40" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center"
              style={{ background: C.signal }}
              aria-hidden="true"
            >
              <TriangleAlert size={18} strokeWidth={2.4} style={{ color: C.paper }} />
            </span>
            <div className="min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ ...disp, color: C.signal }}
              >
                Prioriteit · actie vereist
              </span>
              <h2
                className="mt-1 text-[17px] font-bold leading-tight tracking-[-0.01em]"
                style={{ ...disp, color: C.paper }}
              >
                {primair.titel}
              </h2>
              <p
                className="mt-1 max-w-md text-[12.5px] leading-relaxed"
                style={{ color: "#c9c9c4" }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group/btn inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            style={
              {
                ...disp,
                background: C.signal,
                color: C.paper,
                "--tw-ring-color": C.signal,
              } as React.CSSProperties
            }
          >
            {primair.cta}
            <ArrowRight
              size={15}
              className="transition-transform group-hover/btn:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* KPI-grid op egale vlakken */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="p-4 transition-shadow hover:shadow-[4px_4px_0_0_rgba(12,12,12,1)]"
            style={{ background: C.panel, border: `1.5px solid ${C.ink}` }}
          >
            <div className="flex items-center justify-between">
              <Label>{k.label}</Label>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                style={{ ...disp, color: k.up ? C.green : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...disp, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <BarSpark data={k.spark} tone={C.signal} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Beste match */}
        <button
          onClick={onOpen}
          className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ "--tw-ring-color": C.signal } as React.CSSProperties}
        >
          <div
            className="h-full transition-shadow group-hover:shadow-[5px_5px_0_0_rgba(255,77,28,1)]"
            style={{ background: C.panel, border: `2px solid ${C.ink}` }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1.5px solid ${C.line}` }}
            >
              <Label>Beste match voor jou</Label>
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
                style={{ color: C.signal }}
                aria-hidden="true"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                    style={{ ...disp, color: C.ink }}
                  >
                    {top.titel}
                  </div>
                  <div
                    className="mt-1 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.inkSoft }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {top.opdrachtgever} · {top.plaats}
                  </div>
                </div>
                <span
                  className="shrink-0 px-2 py-1 text-[12px] font-bold tabular-nums"
                  style={{ ...disp, background: C.signalSoft, color: C.signal }}
                >
                  {top.tarief}
                </span>
              </div>
              <div className="mt-3">
                <SegMeter value={top.match} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Chip key={t} tone={C.lineStrong}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Credentials-samenvatting */}
        <div style={{ background: C.panel, border: `2px solid ${C.ink}` }}>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1.5px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: C.ink }} aria-hidden="true" />
              <Label>Verificatie</Label>
            </div>
            <span className="text-[11px] font-bold" style={{ ...disp, color: C.green }}>
              {PROFIEL.trust}
            </span>
          </div>
          <ul>
            {CREDENTIALS.map((c) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ borderTop: `1px solid ${C.line}` }}
                >
                  <st.Icon
                    size={15}
                    strokeWidth={2.2}
                    style={{ color: st.tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Berichten-inbox met loading / empty / error demonstratie */}
      <InboxPanel />
    </div>
  );
}

// Inbox met expliciete loading-, empty- én error-state (deterministisch omschakelbaar).
type InboxState = "data" | "loading" | "empty" | "error";
function InboxPanel() {
  const [state, setState] = useState<InboxState>("data");
  const states: { key: InboxState; label: string }[] = [
    { key: "data", label: "Data" },
    { key: "loading", label: "Laden" },
    { key: "empty", label: "Leeg" },
    { key: "error", label: "Fout" },
  ];
  return (
    <div style={{ background: C.panel, border: `2px solid ${C.ink}` }}>
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ borderBottom: `1.5px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <Inbox size={15} style={{ color: C.ink }} aria-hidden="true" />
          <Label>Berichten</Label>
        </div>
        <div className="flex items-center gap-0" role="group" aria-label="Weergavestatus">
          {states.map((s) => {
            const on = s.key === state;
            return (
              <button
                key={s.key}
                onClick={() => setState(s.key)}
                aria-pressed={on}
                className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  {
                    ...disp,
                    background: on ? C.ink : "transparent",
                    color: on ? C.paper : C.inkFaint,
                    "--tw-ring-color": C.signal,
                  } as React.CSSProperties
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {state === "loading" && (
        <ul aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span className="h-9 w-9 shrink-0 animate-pulse" style={{ background: C.line }} />
              <div className="flex-1 space-y-2">
                <span className="block h-3 w-1/3 animate-pulse" style={{ background: C.line }} />
                <span className="block h-3 w-2/3 animate-pulse" style={{ background: C.line }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {state === "empty" && (
        <div className="relative flex flex-col items-center justify-center gap-2 overflow-hidden py-12 text-center">
          <span className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true">
            <svg width="100%" height="100%">
              <rect width="100%" height="100%" fill="url(#oa-rings)" />
            </svg>
          </span>
          <Inbox size={28} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="relative text-[13px] font-bold" style={{ ...disp, color: C.ink }}>
            Geen berichten
          </p>
          <p className="relative max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
            Zodra een opdrachtgever reageert, verschijnt het gesprek hier.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center"
            style={{ background: C.signalSoft }}
            aria-hidden="true"
          >
            <XCircle size={22} style={{ color: C.red }} />
          </span>
          <div>
            <p className="text-[13px] font-bold" style={{ ...disp, color: C.ink }}>
              Berichten konden niet worden geladen
            </p>
            <p className="mt-1 max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
              De verbinding met de server is verbroken. Probeer het opnieuw.
            </p>
          </div>
          <button
            onClick={() => setState("data")}
            className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            style={
              {
                ...disp,
                background: C.ink,
                color: C.paper,
                "--tw-ring-color": C.signal,
              } as React.CSSProperties
            }
          >
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw proberen
          </button>
        </div>
      )}

      {state === "data" && (
        <ul>
          {BERICHTEN.map((b) => (
            <li
              key={b.van}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02]"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold"
                style={{
                  ...disp,
                  background: b.ongelezen ? C.ink : C.paper,
                  color: b.ongelezen ? C.paper : C.ink,
                  border: `1.5px solid ${C.ink}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...disp, background: C.signal, color: C.paper }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.inkFaint }}>
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Marktplaats (zoekfilter + reageren-toggle) ────────────────────────────────
function Marktplaats({ initialId }: { initialId?: string }) {
  // When opened from the "opdracht" screen we pre-filter to that assignment so the view reads as a
  // focused detail; the plain marktplaats tab receives no id and starts unfiltered.
  const initialOpd = initialId ? OPDRACHTEN.find((o) => o.id === initialId) : undefined;
  const [q, setQ] = useState(initialOpd?.titel ?? "");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[18px] font-bold tracking-[-0.01em]" style={{ ...disp, color: C.ink }}>
          Marktplaats
        </h1>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ background: C.panel, border: `1.5px solid ${C.ink}` }}
        >
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-56 max-w-[60vw] bg-transparent py-0.5 text-[12.5px] outline-none placeholder:opacity-50"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="relative flex flex-col items-center justify-center gap-2 overflow-hidden py-16 text-center"
          style={{ background: C.panel, border: `2px solid ${C.ink}` }}
        >
          <span className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
            <svg width="100%" height="100%">
              <rect width="100%" height="100%" fill="url(#oa-lines)" />
            </svg>
          </span>
          <Search size={30} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="relative text-[14px] font-bold" style={{ ...disp, color: C.ink }}>
            Geen resultaten
          </p>
          <p className="relative max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
            Niets past bij “{q}”. Pas je zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQ("")}
            className="relative mt-1 px-4 py-2 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                ...disp,
                background: C.ink,
                color: C.paper,
                "--tw-ring-color": C.signal,
              } as React.CSSProperties
            }
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const isSaved = saved[o.id] ?? false;
            return (
              <li key={o.id}>
                <div
                  className="group relative overflow-hidden transition-shadow hover:shadow-[5px_5px_0_0_rgba(12,12,12,1)]"
                  style={{ background: C.panel, border: `2px solid ${C.ink}` }}
                >
                  <EdgeBand id="oa-fine" className="absolute inset-y-0 left-0 w-2 opacity-70" />
                  <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold uppercase tabular-nums tracking-[0.12em]"
                          style={{ ...disp, color: C.inkFaint }}
                        >
                          {o.id}
                        </span>
                        <Chip tone={matchTone(o.match)} solid>
                          {o.match}% match
                        </Chip>
                      </div>
                      <h3
                        className="mt-1.5 text-[15px] font-bold leading-tight tracking-[-0.01em]"
                        style={{ ...disp, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div
                        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]"
                        style={{ color: C.inkSoft }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet size={12} aria-hidden="true" /> {o.tarief}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} aria-hidden="true" /> {o.uren} · {o.start}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 text-[11px] font-medium"
                            style={{ color: C.green }}
                          >
                            <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                          </span>
                        ))}
                        {o.redenen.min.slice(0, 1).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 text-[11px] font-medium"
                            style={{ color: C.amber }}
                          >
                            <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() => setSaved((s) => ({ ...s, [o.id]: !isSaved }))}
                        aria-pressed={isSaved}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={
                          {
                            ...disp,
                            background: isSaved ? C.ink : C.paper,
                            color: isSaved ? C.paper : C.ink,
                            border: `1.5px solid ${C.ink}`,
                            "--tw-ring-color": C.signal,
                          } as React.CSSProperties
                        }
                      >
                        {isSaved ? (
                          <BookmarkCheck size={14} aria-hidden="true" />
                        ) : (
                          <Bookmark size={14} aria-hidden="true" />
                        )}
                        {isSaved ? "Bewaard" : "Bewaar"}
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                        style={
                          {
                            ...disp,
                            background: C.signal,
                            color: C.paper,
                            "--tw-ring-color": C.signal,
                          } as React.CSSProperties
                        }
                      >
                        Reageer <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Verificatie (checklist-toggle) ────────────────────────────────────────────
function Verificatie() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  const steps = [
    "Upload een geldig legitimatiebewijs",
    "Koppel je BIG-registratie",
    "Voeg een recente VOG toe",
    "Bevestig je verzekeringsbewijs",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[18px] font-bold tracking-[-0.01em]" style={{ ...disp, color: C.ink }}>
          Verificatie & documenten
        </h1>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ background: C.ink, color: C.paper }}
        >
          <ShieldCheck size={15} aria-hidden="true" />
          <span className="text-[12px] font-bold tabular-nums" style={disp}>
            {pct}% dekking
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Credentials */}
        <div style={{ background: C.panel, border: `2px solid ${C.ink}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1.5px solid ${C.line}` }}>
            <Label>Certificaten</Label>
          </div>
          <ul>
            {CREDENTIALS.map((c) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: C.paper, border: `1.5px solid ${st.tone}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} strokeWidth={2.2} style={{ color: st.tone }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Checklist */}
        <div style={{ background: C.panel, border: `2px solid ${C.ink}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1.5px solid ${C.line}` }}>
            <Label>Profiel compleet maken</Label>
          </div>
          <ul className="p-2">
            {steps.map((step) => {
              const on = done[step] ?? false;
              return (
                <li key={step}>
                  <button
                    onClick={() => setDone((d) => ({ ...d, [step]: !on }))}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ "--tw-ring-color": C.signal } as React.CSSProperties}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center"
                      style={{
                        background: on ? C.signal : C.paper,
                        border: `1.5px solid ${on ? C.signal : C.lineStrong}`,
                      }}
                      aria-hidden="true"
                    >
                      {on && <Check size={14} strokeWidth={3} style={{ color: C.paper }} />}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{
                        color: on ? C.inkFaint : C.ink,
                        textDecoration: on ? "line-through" : "none",
                      }}
                    >
                      {step}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Documenten-tabel */}
      <div style={{ background: C.panel, border: `2px solid ${C.ink}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1.5px solid ${C.line}` }}>
          <Label>Documenten (privé)</Label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...disp, color: C.inkFaint }}
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
                  className="transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-2 text-[13px] font-medium"
                      style={{ color: C.ink }}
                    >
                      <FileText size={14} style={{ color: C.inkFaint }} aria-hidden="true" />{" "}
                      {d.naam}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkSoft }}>
                    {d.type}
                  </td>
                  <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                    {d.grootte}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                    {d.bijgewerkt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Acties ────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-bold tracking-[-0.01em]" style={{ ...disp, color: C.ink }}>
        Volgende acties
      </h1>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.signal : C.ink;
          return (
            <li key={a.titel}>
              <div
                className="group relative overflow-hidden"
                style={{ background: C.panel, border: `2px solid ${C.ink}` }}
              >
                <EdgeBand
                  id={warn ? "oa-diag" : "oa-fine"}
                  className="absolute inset-y-0 left-0 w-2.5 opacity-70"
                />
                <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-bold tabular-nums"
                    style={{ ...disp, background: tone, color: C.paper }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <TriangleAlert
                          size={14}
                          strokeWidth={2.6}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          size={12}
                          strokeWidth={3}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ ...disp, color: tone }}
                      >
                        {warn ? "Urgent" : "Informatief"}
                      </span>
                    </div>
                    <h3
                      className="mt-1 text-[15px] font-bold leading-tight"
                      style={{ ...disp, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="shrink-0 self-start px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                    style={
                      {
                        ...disp,
                        background: tone,
                        color: C.paper,
                        "--tw-ring-color": tone,
                      } as React.CSSProperties
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ──────────────────────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const badgeTone = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.inkFaint;
    return C.ink;
  };
  const badgeIcon = (status: string): LucideIcon => {
    if (status === "Betaald") return BadgeCheck;
    if (status === "Openstaand") return Clock;
    if (status === "Concept") return FileText;
    return Send;
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[18px] font-bold tracking-[-0.01em]" style={{ ...disp, color: C.ink }}>
          Facturen
        </h1>
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          style={
            {
              ...disp,
              background: C.signal,
              color: C.paper,
              "--tw-ring-color": C.signal,
            } as React.CSSProperties
          }
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-x-auto"
        style={{ background: C.panel, border: `2px solid ${C.ink}` }}
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...disp, color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badgeTone(f.status);
              const Icon = badgeIcon(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3 text-[12px] font-semibold tabular-nums"
                    style={{ ...disp, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: C.panel, color: tone, border: `1.5px solid ${tone}` }}
                    >
                      <Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-bold tabular-nums"
                    style={{ ...disp, color: C.ink }}
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
                className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...disp, color: C.inkFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-3.5 text-right text-[16px] font-bold tabular-nums"
                style={{ ...disp, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
