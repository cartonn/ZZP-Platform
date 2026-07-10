"use client";

// Concept 238 — "Voxel" · isometrische pixelblokken.
// Speels-serieus: isometrische voxel-kubussen (drie parallellogram-vlakken via inline-SVG —
// top licht, links medium, rechts donker → dithered schaduw-gevoel). KPI's als torens die
// oprijzen (hoogte ∝ waarde), statussen als gekleurde blokjes, de match-score als een stapel
// blokken. Game-strategiekaart-gevoel, maar direct af te lezen — een écht werkend dashboard.
// Palet: koel lichtgrijs-blauw bg, diep indigo-nacht ink, paars accent, heldere blok-kleuren.
// Silkscreen ALLEEN voor korte koppen/labels/cijfers in grotere maat; body altijd Inter.

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  Search,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  FileText,
  Plus,
  Check,
  MapPin,
  Wallet,
  Send,
  Layers,
  Inbox,
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
  bg: "#eef0f5", // koel lichtgrijs-blauw canvas
  panel: "#ffffff",
  panelSoft: "#f5f6fa",
  ink: "#1b1d2a", // diep indigo-nacht
  inkSoft: "#4c4f63",
  inkFaint: "#8a8ea3",
  line: "#dfe2ec",
  lineStrong: "#c9cddd",
  accent: "#7c3aed", // paars accent
  accentSoft: "#efe7fe",
  // heldere blok-kleuren (statussen / torens)
  green: "#22a565",
  amber: "#e0961f",
  red: "#e0463a",
  blue: "#2f76e0",
};

const pixel = { fontFamily: "var(--font-lab-silkscreen)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Donkerder/lichter varianten voor kubusvlakken (vaste tinten, deterministisch).
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// ── Status: altijd label + icoon + gekleurd blokje ────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

function matchTone(v: number): string {
  return v >= 90 ? C.green : v >= 80 ? C.amber : C.blue;
}

// ── Isometrische voxel-kubus (drie parallellogram-vlakken) ────────────────────
// w = breedte van het topvlak; h = extra hoogte van de zijvlakken (torenhoogte).
function VoxelCube({
  color,
  w = 26,
  h = 18,
  className = "",
}: {
  color: string;
  w?: number;
  h?: number;
  className?: string;
}) {
  const half = w / 2;
  const q = half / 2; // isometrische verkorting (2:1)
  // Totale SVG-hoogte: top-ruit (w breed, half hoog) + zijvlakken (q + h)
  const svgW = w;
  const svgH = half + q + h;
  const topFill = shade(color, 34);
  const leftFill = shade(color, -6);
  const rightFill = shade(color, -42);
  // Topvlak-ruit
  const cx = half;
  const topPts = `${cx},0 ${w},${q} ${cx},${half} 0,${q}`;
  // Linkervlak
  const leftPts = `0,${q} ${cx},${half} ${cx},${half + h} 0,${q + h}`;
  // Rechtervlak
  const rightPts = `${cx},${half} ${w},${q} ${w},${q + h} ${cx},${half + h}`;
  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={className}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polygon points={rightPts} fill={rightFill} />
      <polygon points={leftPts} fill={leftFill} />
      <polygon points={topPts} fill={topFill} />
      {/* dithered schaduwhint op het rechtervlak */}
      <polygon points={rightPts} fill="url(#vx-dither)" opacity="0.35" />
    </svg>
  );
}

function VoxelDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <pattern id="vx-dither" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="transparent" />
          <rect x="0" y="0" width="1" height="1" fill="#000" opacity="0.5" />
        </pattern>
        <pattern id="vx-grid" width="28" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M0 8 L14 0 L28 8 L14 16 Z"
            fill="none"
            stroke={C.lineStrong}
            strokeWidth="0.75"
          />
        </pattern>
      </defs>
    </svg>
  );
}

// KPI-toren: gestapelde kubussen, aantal ∝ waarde (0..maxBlocks).
function VoxelTower({ ratio, color }: { ratio: number; color: string }) {
  const maxBlocks = 6;
  const blocks = Math.max(1, Math.round(ratio * maxBlocks));
  return (
    <div
      className="flex flex-col items-center justify-end"
      style={{ height: 96 }}
      aria-hidden="true"
    >
      {Array.from({ length: blocks }).map((_, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : -6 }}>
          <VoxelCube color={color} w={30} h={8} />
        </div>
      ))}
    </div>
  );
}

// Match-score als stapel blokjes (gevuld = accentkleur).
function VoxelStack({ value }: { value: number }) {
  const tone = matchTone(value);
  const total = 10;
  const filled = Math.round((value / 100) * total);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-row-reverse items-end gap-[2px]" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="block"
            style={{
              width: 7,
              height: 16,
              background: i < filled ? tone : C.line,
              boxShadow: i < filled ? `inset -2px 0 0 ${shade(tone, -40)}` : "none",
            }}
          />
        ))}
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...pixel, color: tone }}>
        {value}
      </span>
    </div>
  );
}

// ── Kleine bouwstenen ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[9px] uppercase tracking-[0.12em]"
      style={{ ...pixel, color: C.inkFaint }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const st = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: `${st.tone}18`,
        color: shade(st.tone, -40),
        border: `1px solid ${st.tone}55`,
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-[1px]"
        style={{ background: st.tone }}
        aria-hidden="true"
      />
      <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {st.label}
    </span>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
      style={{ background: C.panelSoft, color: C.inkSoft, border: `1px solid ${C.line}` }}
    >
      {children}
    </span>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export function Concept238() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <VoxelDefs />

      {/* Header */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-7"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center" aria-hidden="true">
            <VoxelCube color={C.accent} w={34} h={12} />
          </span>
          <div className="leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[13px] tracking-[0.02em]" style={{ ...pixel, color: C.ink }}>
                VOXEL
              </span>
              <span
                className="rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ background: C.accentSoft, color: C.accent }}
              >
                Zorgmarktplaats
              </span>
            </div>
            <div className="mt-1.5 text-[11px]" style={{ color: C.inkFaint }}>
              Bouw je opdrachtenblok voor blok op
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[10px] font-bold"
            style={{ ...pixel, background: C.ink, color: "#fff" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tab-nav */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        style={{ background: C.panelSoft, borderBottom: `1px solid ${C.line}` }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  background: on ? C.accent : "transparent",
                  color: on ? "#fff" : C.inkSoft,
                  boxShadow: on ? `2px 2px 0 0 ${shade(C.accent, -50)}` : "none",
                  "--tw-ring-color": C.accent,
                } as React.CSSProperties
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
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

// Kaart-omhulsel met voxel-schaduw.
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[6px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: `3px 3px 0 0 ${C.lineStrong}`,
      }}
    >
      {children}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const towerColors = [C.accent, C.blue, C.green, C.amber];
  // Ratio's voor torenhoogte (deterministisch, presentationeel).
  const ratios = [0.92, 0.6, 0.82, 0.45];

  return (
    <div className="space-y-6">
      {/* Prioriteit-banner */}
      <div
        className="relative overflow-hidden rounded-[6px]"
        style={{ background: C.ink, boxShadow: `4px 4px 0 0 ${shade(C.accent, -60)}` }}
      >
        <span className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true">
          <svg width="100%" height="100%">
            <rect width="100%" height="100%" fill="url(#vx-grid)" />
          </svg>
        </span>
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              <VoxelCube color={C.amber} w={30} h={14} />
            </span>
            <div className="min-w-0">
              <span
                className="text-[9px] uppercase tracking-[0.14em]"
                style={{ ...pixel, color: C.amber }}
              >
                Prioriteit
              </span>
              <h2 className="mt-1.5 text-[16px] font-bold leading-tight" style={{ color: "#fff" }}>
                {primair.titel}
              </h2>
              <p
                className="mt-1 max-w-md text-[12.5px] leading-relaxed"
                style={{ color: "#bfc2d6" }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2 rounded-[5px] px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            style={
              {
                background: C.accent,
                color: "#fff",
                boxShadow: `2px 2px 0 0 ${shade(C.accent, -60)}`,
                "--tw-ring-color": C.accent,
              } as React.CSSProperties
            }
          >
            {primair.cta}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* KPI-torens */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const color = towerColors[i % towerColors.length] as string;
          return (
            <Panel key={k.label}>
              <div className="flex items-start justify-between gap-2 p-4 pb-0">
                <div className="min-w-0">
                  <Label>{k.label}</Label>
                  <div
                    className="mt-2 text-[22px] font-bold tabular-nums leading-none"
                    style={{ ...pixel, color: C.ink }}
                  >
                    {k.value}
                  </div>
                  <div
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </div>
                </div>
                <VoxelTower ratio={ratios[i] ?? 0.5} color={color} />
              </div>
              <div
                className="h-1 w-full rounded-b-[6px]"
                style={{ background: color }}
                aria-hidden="true"
              />
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Beste match */}
        <button
          onClick={onOpen}
          className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ "--tw-ring-color": C.accent } as React.CSSProperties}
        >
          <Panel className="h-full transition-transform group-hover:-translate-y-0.5">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-2">
                <Layers size={15} style={{ color: C.accent }} aria-hidden="true" />
                <Label>Beste match</Label>
              </div>
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
                style={{ color: C.accent }}
                aria-hidden="true"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-bold leading-tight" style={{ color: C.ink }}>
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
                  className="shrink-0 rounded-[4px] px-2 py-1 text-[12px] font-bold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  {top.tarief}
                </span>
              </div>
              <div className="mt-3">
                <VoxelStack value={top.match} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </div>
            </div>
          </Panel>
        </button>

        {/* Verificatie-samenvatting */}
        <Panel>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: C.accent }} aria-hidden="true" />
              <Label>Verificatie</Label>
            </div>
            <span className="text-[11px] font-bold" style={{ color: C.green }}>
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
                  <span
                    className="h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ background: st.tone }}
                    aria-hidden="true"
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <st.Icon
                    size={14}
                    strokeWidth={2.2}
                    style={{ color: st.tone }}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ul>
          {/* Status-legenda met blokjes */}
          <div
            className="flex flex-wrap gap-2 px-4 py-3"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
              const st = statusMeta(s);
              return (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-[10.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-[1px]"
                    style={{ background: st.tone }}
                    aria-hidden="true"
                  />
                  {st.label}
                </span>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Inbox met loading / empty / error */}
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
    <Panel>
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <Inbox size={15} style={{ color: C.accent }} aria-hidden="true" />
          <Label>Berichten</Label>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Weergavestatus">
          {states.map((s) => {
            const on = s.key === state;
            return (
              <button
                key={s.key}
                onClick={() => setState(s.key)}
                aria-pressed={on}
                className="rounded-[4px] px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  {
                    ...pixel,
                    background: on ? C.accent : C.panelSoft,
                    color: on ? "#fff" : C.inkFaint,
                    "--tw-ring-color": C.accent,
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
              <span
                className="h-9 w-9 shrink-0 animate-pulse rounded-[4px]"
                style={{ background: C.line }}
              />
              <div className="flex-1 space-y-2">
                <span
                  className="block h-3 w-1/3 animate-pulse rounded-[2px]"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-2/3 animate-pulse rounded-[2px]"
                  style={{ background: C.line }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {state === "empty" && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <VoxelCube color={C.lineStrong} w={38} h={16} />
          <p className="text-[13px] font-bold" style={{ color: C.ink }}>
            Nog geen berichten
          </p>
          <p className="max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
            Reageer op een opdracht en start het gesprek met de opdrachtgever.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[6px]"
            style={{ background: `${C.red}18`, border: `1px solid ${C.red}55` }}
            aria-hidden="true"
          >
            <XCircle size={22} style={{ color: C.red }} />
          </span>
          <div>
            <p className="text-[13px] font-bold" style={{ color: C.ink }}>
              Berichten niet geladen
            </p>
            <p className="mt-1 max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
              De verbinding is verbroken. Probeer het opnieuw.
            </p>
          </div>
          <button
            onClick={() => setState("data")}
            className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            style={
              {
                background: C.ink,
                color: "#fff",
                boxShadow: `2px 2px 0 0 ${C.lineStrong}`,
                "--tw-ring-color": C.accent,
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
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.015]"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold"
                style={{
                  ...pixel,
                  background: b.ongelezen ? C.accent : C.panelSoft,
                  color: b.ongelezen ? "#fff" : C.inkSoft,
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
                      className="h-2 w-2 rounded-[1px]"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
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
    </Panel>
  );
}

// ── Marktplaats (zoekfilter + bewaar-toggle) ──────────────────────────────────
function Marktplaats({ initialId }: { initialId?: string }) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>(
    initialId ? { [initialId]: true } : {},
  );
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
        <h1 className="text-[15px] tracking-[0.02em]" style={{ ...pixel, color: C.ink }}>
          MARKTPLAATS
        </h1>
        <div
          className="flex items-center gap-2 rounded-[5px] px-3 py-1.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
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
        <Panel>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <VoxelCube color={C.lineStrong} w={40} h={16} />
            <p className="text-[14px] font-bold" style={{ color: C.ink }}>
              Geen resultaten
            </p>
            <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
              Niets past bij “{q}”. Pas je zoekterm aan of wis het filter.
            </p>
            <button
              onClick={() => setQ("")}
              className="rounded-[5px] px-4 py-2 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  background: C.accent,
                  color: "#fff",
                  boxShadow: `2px 2px 0 0 ${shade(C.accent, -60)}`,
                  "--tw-ring-color": C.accent,
                } as React.CSSProperties
              }
            >
              Filter wissen
            </button>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const isSaved = saved[o.id] ?? false;
            const tone = matchTone(o.match);
            return (
              <li key={o.id}>
                <Panel className="transition-transform hover:-translate-y-0.5">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 shrink-0 self-start" aria-hidden="true">
                        <VoxelCube color={tone} w={30} h={12} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] uppercase tabular-nums tracking-[0.1em]"
                            style={{ ...pixel, color: C.inkFaint }}
                          >
                            {o.id}
                          </span>
                          <span
                            className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{ background: `${tone}18`, color: shade(tone, -40) }}
                          >
                            {o.match}% match
                          </span>
                        </div>
                        <h3
                          className="mt-1 text-[15px] font-bold leading-tight"
                          style={{ color: C.ink }}
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
                        <div className="mt-2.5 flex flex-col gap-1">
                          {o.redenen.plus.slice(0, 2).map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1.5 text-[11px]"
                              style={{ color: shade(C.green, -30) }}
                            >
                              <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                            </span>
                          ))}
                          {o.redenen.min.slice(0, 1).map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1.5 text-[11px]"
                              style={{ color: shade(C.amber, -20) }}
                            >
                              <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start sm:flex-col sm:items-stretch">
                      <button
                        onClick={() => setSaved((s) => ({ ...s, [o.id]: !isSaved }))}
                        aria-pressed={isSaved}
                        className="inline-flex items-center justify-center gap-1.5 rounded-[5px] px-3 py-2 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={
                          {
                            background: isSaved ? C.accent : C.panel,
                            color: isSaved ? "#fff" : C.ink,
                            border: `1px solid ${isSaved ? C.accent : C.lineStrong}`,
                            "--tw-ring-color": C.accent,
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
                        className="inline-flex items-center justify-center gap-1.5 rounded-[5px] px-3.5 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                        style={
                          {
                            background: C.accent,
                            color: "#fff",
                            boxShadow: `2px 2px 0 0 ${shade(C.accent, -60)}`,
                            "--tw-ring-color": C.accent,
                          } as React.CSSProperties
                        }
                      >
                        Reageer <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Verificatie (checklist-toggle + documenten) ───────────────────────────────
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
        <h1 className="text-[15px] tracking-[0.02em]" style={{ ...pixel, color: C.ink }}>
          VERIFICATIE
        </h1>
        <div
          className="flex items-center gap-2 rounded-[5px] px-3 py-1.5"
          style={{ background: C.ink, color: "#fff", boxShadow: `2px 2px 0 0 ${C.lineStrong}` }}
        >
          <ShieldCheck size={15} aria-hidden="true" />
          <span className="text-[11px] tabular-nums" style={pixel}>
            {pct}% DEKKING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Credentials als blokjes-rij */}
        <Panel>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
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
                  <span className="shrink-0" aria-hidden="true">
                    <VoxelCube color={st.tone} w={24} h={10} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Checklist */}
        <Panel>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
            <Label>Profiel afbouwen</Label>
          </div>
          <ul className="p-2">
            {steps.map((step) => {
              const on = done[step] ?? false;
              return (
                <li key={step}>
                  <button
                    onClick={() => setDone((d) => ({ ...d, [step]: !on }))}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 rounded-[4px] px-2 py-2.5 text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ "--tw-ring-color": C.accent } as React.CSSProperties}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px]"
                      style={{
                        background: on ? C.accent : C.panel,
                        border: `1.5px solid ${on ? C.accent : C.lineStrong}`,
                      }}
                      aria-hidden="true"
                    >
                      {on && <Check size={14} strokeWidth={3} style={{ color: "#fff" }} />}
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
        </Panel>
      </div>

      {/* Documenten-tabel */}
      <Panel>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <Label>Documenten (privé)</Label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[9px] uppercase tracking-[0.1em]"
                    style={{ ...pixel, color: C.inkFaint }}
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
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                    {d.bijgewerkt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
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
      <h1 className="text-[15px] tracking-[0.02em]" style={{ ...pixel, color: C.ink }}>
        ACTIES
      </h1>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          return (
            <li key={a.titel}>
              <Panel>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex shrink-0 items-center gap-3">
                    <span aria-hidden="true">
                      <VoxelCube color={tone} w={28} h={12} />
                    </span>
                    <span className="text-[16px] tabular-nums" style={{ ...pixel, color: tone }}>
                      {i + 1}
                    </span>
                  </div>
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
                        <Send
                          size={13}
                          strokeWidth={2.4}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className="text-[9px] uppercase tracking-[0.14em]"
                        style={{ ...pixel, color: tone }}
                      >
                        {warn ? "Urgent" : "Info"}
                      </span>
                    </div>
                    <h3
                      className="mt-1 text-[15px] font-bold leading-tight"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="shrink-0 self-start rounded-[5px] px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                    style={
                      {
                        background: tone,
                        color: "#fff",
                        boxShadow: `2px 2px 0 0 ${shade(tone, -60)}`,
                        "--tw-ring-color": tone,
                      } as React.CSSProperties
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Panel>
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
    return C.blue;
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
        <h1 className="text-[15px] tracking-[0.02em]" style={{ ...pixel, color: C.ink }}>
          FACTUREN
        </h1>
        <button
          className="inline-flex items-center gap-2 rounded-[5px] px-3.5 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          style={
            {
              background: C.accent,
              color: "#fff",
              boxShadow: `2px 2px 0 0 ${shade(C.accent, -60)}`,
              "--tw-ring-color": C.accent,
            } as React.CSSProperties
          }
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[9px] uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...pixel, color: C.inkFaint }}
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
                      className="px-4 py-3 text-[11px] font-semibold tabular-nums"
                      style={{ ...pixel, color: C.inkSoft }}
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
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: `${tone}18`,
                          color: shade(tone, -40),
                          border: `1px solid ${tone}55`,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-[1px]"
                          style={{ background: tone }}
                          aria-hidden="true"
                        />
                        <Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
                <td
                  colSpan={4}
                  className="px-4 py-3.5 text-[9px] uppercase tracking-[0.12em]"
                  style={{ ...pixel, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...pixel, color: C.green }}
                >
                  {total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
