"use client";

// Concept 153 — "Reglet" · guilloché-veiligheidsgravure (waardepapier/bankbiljet-vertrouwensmotief),
// past bij verificatie/vertrouwen. Fijne intaglio-hairline-patronen & rozetten (SVG line-art +
// repeating-radial/linear-gradients), warm ivoor (#f5f0e6) + diep groen-goud (#1f5c46 / #b08d3c),
// verfijnde reliëf-lijnen, microtekst-randen en een "geverifieerd"-zegel-motief. Onderscheidend van
// paspoort(MRZ)/postzegel/lakzegel: dit is de gegraveerde guilloché van waardepapier — hairline-
// rozetten en golvende lijnenweefsels, geen perforatie of MRZ-band. Deterministisch — geen
// random/Date. Fonts: Newsreader (serif) + IBM Plex Mono (data). Status: label + icoon + patroon.

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  Plus,
  ChevronLeft,
  BadgeCheck,
  Mail,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warm ivoor + diep groen-goud (waardepapier) ──────────────────────────
const C = {
  ivory: "#f5f0e6",
  ivoryDeep: "#ece4d2",
  paper: "#faf6ee",
  green: "#1f5c46",
  greenDeep: "#163f30",
  greenSoft: "#3a7a60",
  gold: "#b08d3c",
  goldSoft: "#c9a961",
  ink: "#2a2a22",
  inkSoft: "#5c5748",
  line: "rgba(31,92,70,0.22)",
  lineFaint: "rgba(31,92,70,0.12)",
  rose: "#a23b3b",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Guilloché-weefsel achtergrond — fijne hairline-lijnen (repeating conic/radial gradients).
function guillocheBg(color: string, opacity: number): React.CSSProperties {
  return {
    backgroundImage: [
      `repeating-radial-gradient(circle at 22% 28%, transparent 0 6px, ${color} 6px 6.6px, transparent 6.6px 13px)`,
      `repeating-radial-gradient(circle at 78% 72%, transparent 0 7px, ${color} 7px 7.6px, transparent 7.6px 15px)`,
      `repeating-linear-gradient(58deg, transparent 0 9px, ${color} 9px 9.5px, transparent 9.5px 19px)`,
    ].join(","),
    opacity,
  };
}

// Rozet-guilloché als SVG line-art (fijne concentrische golflijnen).
function Rosette({
  size = 120,
  color = C.green,
  opacity = 0.5,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const cx = size / 2;
  const rings = [0.94, 0.82, 0.7, 0.58, 0.46, 0.34, 0.22];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ opacity }}>
      <g fill="none" stroke={color} strokeWidth={0.35}>
        {rings.map((rr, ri) => {
          const r = rr * 46;
          const lobes = 24;
          const amp = 2.4 - ri * 0.12;
          const pts: string[] = [];
          for (let i = 0; i <= 96; i++) {
            const a = (i / 96) * Math.PI * 2;
            const rad = r + Math.sin(a * lobes + ri * 0.6) * amp;
            const x = cx + Math.cos(a) * rad;
            const y = cx + Math.sin(a) * rad;
            pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
          }
          return <polygon key={ri} points={pts.join(" ")} />;
        })}
        <circle cx={cx} cy={cx} r={4} strokeWidth={0.5} />
      </g>
    </svg>
  );
}

// Microtekst-rand — herhaalde tekst als veiligheidskenmerk (decoratief).
function MicroBorder({ text }: { text: string }) {
  return (
    <div
      className="overflow-hidden whitespace-nowrap py-0.5 text-[6.5px] uppercase tracking-[0.32em]"
      style={{ ...mono, color: C.gold, opacity: 0.6 }}
      aria-hidden="true"
    >
      {(text + " · ").repeat(24)}
    </div>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + patroon) ──────────────────
type StatusStyle = { label: string; Icon: LucideIcon; color: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.green, bg: "rgba(31,92,70,0.10)" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.gold, bg: "rgba(176,141,60,0.12)" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        color: "#9a7016",
        bg: "rgba(176,141,60,0.16)",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.rose, bg: "rgba(162,59,59,0.10)" };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{ ...mono, color: m.color, background: m.bg, border: `1px solid ${m.color}55` }}
    >
      <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Gegraveerde kaart — ivoor met hairline-rand, hoek-ornament en microtekst.
function Card({
  children,
  className = "",
  ornate = false,
  as = "div",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  ornate?: boolean;
  as?: "div" | "li";
  interactive?: boolean;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative overflow-hidden ${interactive ? "transition-shadow duration-200 hover:shadow-[0_6px_20px_-10px_rgba(31,92,70,0.4)]" : ""} ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "inset 0 0 0 1px rgba(250,246,238,0.9)",
      }}
    >
      {ornate && (
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-70" aria-hidden="true">
          <Rosette size={120} color={C.green} opacity={0.14} />
        </div>
      )}
      {children}
    </Tag>
  );
}

// Zegel-motief "Geverifieerd" (rozet + badge).
function Seal({ label = "Geverifieerd", size = 88 }: { label?: string; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Rosette size={size} color={C.gold} opacity={0.7} />
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <BadgeCheck size={size * 0.3} strokeWidth={1.6} style={{ color: C.green }} />
        <span
          className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.green }}
        >
          {label}
        </span>
      </span>
    </div>
  );
}

function matchColor(m: number): string {
  return m >= 90 ? C.green : m >= 85 ? C.greenSoft : C.gold;
}

// Gegraveerde meterbalk (hairline-ticks als waardepapier).
function EngravedMeter({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-3 w-full overflow-hidden"
      style={{ background: C.ivoryDeep, border: `1px solid ${C.line}` }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${C.lineFaint} 0 1px, transparent 1px 5px)`,
        }}
      />
      <div
        className="relative h-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.green}, ${C.greenSoft})`,
        }}
      />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept153() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const tabs: { key: ScreenKey; label: string }[] = [
    ...SCREENS,
    { key: "berichten", label: "Berichten" },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...serif, background: C.ivory, color: C.ink }}
    >
      {/* Guilloché-weefsel over de hele achtergrond (decoratief) */}
      <div
        className="pointer-events-none fixed inset-0"
        style={guillocheBg("rgba(31,92,70,1)", 0.05)}
        aria-hidden="true"
      />

      {/* Kop — gegraveerd waardepapier-vignet */}
      <header
        className="relative overflow-hidden"
        style={{ borderBottom: `2px solid ${C.green}`, background: C.paper }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={guillocheBg("rgba(176,141,60,1)", 0.07)}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 -top-16 hidden md:block"
          aria-hidden="true"
        >
          <Rosette size={220} color={C.green} opacity={0.1} />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center"
              style={{ border: `1.5px solid ${C.green}`, color: C.green }}
              aria-hidden="true"
            >
              <BadgeCheck size={24} strokeWidth={1.6} />
            </span>
            <div className="leading-none">
              <div
                className="text-[24px] font-semibold tracking-[-0.01em]"
                style={{ ...serif, color: C.greenDeep }}
              >
                Reglet
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.gold }}
              >
                Verificatie · Vertrouwen · Waarde
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
              style={{ ...mono, color: C.green, border: `1px solid ${C.line}` }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-11 w-11 items-center justify-center text-[12px] font-semibold"
              style={{ ...serif, background: C.green, color: C.ivory }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
        <MicroBorder text="geverifieerd zzp-platform" />
      </header>

      {/* Scherm-switcher — gegraveerde tabbladen */}
      <nav
        className="relative z-10 mx-auto flex max-w-6xl items-center gap-0 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {tabs.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? {
                      ...mono,
                      color: C.ivory,
                      background: C.green,
                      ["--tw-ring-color" as string]: C.gold,
                    }
                  : { ...mono, color: C.inkSoft, ["--tw-ring-color" as string]: C.green }
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
        {screen === "berichten" && <Berichten />}
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
    <div className="space-y-6">
      {/* Hero — waardepapier-certificaat */}
      <Card ornate className="p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={guillocheBg("rgba(31,92,70,1)", 0.04)}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span
              className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.gold, border: `1px solid ${C.gold}66` }}
            >
              Bulletin · {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[36px]"
              style={{ ...serif, color: C.greenDeep }}
            >
              Drie matches boven 85%. Uw omzet stijgt.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ ...serif, color: C.inkSoft }}>
              Eén taak vraagt aandacht: uw VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar — vertrouwen is uw waardepapier.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  color: C.ivory,
                  background: C.green,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[rgba(31,92,70,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  color: C.green,
                  border: `1px solid ${C.green}`,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Seal label="Geverifieerd" size={96} />
          </div>
        </div>
      </Card>

      {/* KPI-grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkSoft }}
              >
                {k.label}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  color: k.up ? C.green : C.gold,
                  border: `1px solid ${k.up ? C.green : C.gold}55`,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...serif, color: C.greenDeep }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <EngravedMeter
                pct={Math.round(((k.spark[k.spark.length - 1] ?? 0) / Math.max(...k.spark)) * 100)}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionHead>Aanbevolen matches</SectionHead>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left focus-visible:outline-none"
                >
                  <span
                    className="flex w-16 shrink-0 flex-col items-center justify-center"
                    style={{
                      background: matchColor(o.match),
                      color: C.ivory,
                      borderRight: `1px solid ${C.green}`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="text-[20px] font-semibold leading-none" style={serif}>
                      {o.match}
                    </span>
                    <span className="mt-0.5 text-[8px] uppercase tracking-[0.08em]" style={mono}>
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold"
                          style={{ ...serif, color: C.greenDeep }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...mono, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ArrowRight
                        size={17}
                        className="mt-1 shrink-0"
                        style={{ color: C.gold }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                          style={{ ...mono, color: C.green, background: "rgba(31,92,70,0.08)" }}
                        >
                          <Check size={10} strokeWidth={3} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHead>Status</SectionHead>
          <Card ornate className="p-5">
            <div className="relative flex items-end justify-between">
              <div
                className="text-[48px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...serif, color: C.greenDeep }}
              >
                {dek}
                <span className="text-[20px]">%</span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px]" style={{ ...serif, color: C.inkSoft }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <div className="mt-3">
              <EngravedMeter pct={dek} />
            </div>
          </Card>

          <Card className="overflow-hidden p-5">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: "#9a7016", background: "rgba(176,141,60,0.14)" }}
            >
              <AlertTriangle size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[17px] font-semibold leading-tight"
              style={{ ...serif, color: C.greenDeep }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...serif, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: C.ivory,
                background: C.green,
                ["--tw-ring-color" as string]: C.gold,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2
        className="text-[16px] font-semibold tracking-[-0.01em]"
        style={{ ...serif, color: C.greenDeep }}
      >
        {children}
      </h2>
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead>Marktplaats · open opdrachten</SectionHead>
        <Card className="flex items-center gap-2 px-3 py-1.5">
          <Search size={15} style={{ color: C.inkSoft }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek…"
            aria-label="Opdrachten zoeken"
            className="w-40 bg-transparent py-1 text-[12px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card ornate className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Rosette size={72} color={C.green} opacity={0.5} />
          <p className="text-[18px] font-semibold" style={{ ...serif, color: C.greenDeep }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...serif, color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas uw zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              color: C.ivory,
              background: C.green,
              ["--tw-ring-color" as string]: C.gold,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div className="flex items-stretch">
                <span
                  className="flex w-14 shrink-0 flex-col items-center justify-center"
                  style={{ background: matchColor(o.match), color: C.ivory }}
                  aria-hidden="true"
                >
                  <span className="text-[17px] font-semibold leading-none" style={serif}>
                    {o.match}
                  </span>
                  <span className="text-[8px] uppercase" style={mono}>
                    match
                  </span>
                </span>
                <div className="min-w-0 flex-1 p-4" style={{ borderLeft: `1px solid ${C.line}` }}>
                  <div
                    className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.gold }}
                  >
                    {o.id}
                  </div>
                  <h3
                    className="mt-0.5 text-[16px] font-semibold leading-tight"
                    style={{ ...serif, color: C.greenDeep }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="p-4" style={{ borderTop: `1px solid ${C.lineFaint}` }}>
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
                      style={{ ...mono, color: C.inkSoft, border: `1px solid ${C.lineFaint}` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...mono,
                  color: C.ivory,
                  background: C.green,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ ...mono, color: C.inkSoft }}>
      <Icon size={12.5} strokeWidth={2.2} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[rgba(31,92,70,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          color: C.green,
          border: `1px solid ${C.green}`,
          ["--tw-ring-color" as string]: C.gold,
        }}
      >
        <ChevronLeft size={14} aria-hidden="true" /> Terug
      </button>

      <Card ornate className="p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={guillocheBg("rgba(31,92,70,1)", 0.04)}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="inline-block px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.gold, border: `1px solid ${C.gold}66` }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[36px]"
              style={{ ...serif, color: C.greenDeep }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...serif, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center px-4"
            style={{ borderLeft: `2px solid ${C.gold}` }}
          >
            <span
              className="text-[52px] font-semibold leading-none"
              style={{ ...serif, color: C.greenDeep }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.gold }}
            >
              % match
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[17px] font-semibold leading-none"
              style={{ ...serif, color: C.greenDeep }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="p-5">
          <SectionHead>Waarom dit past</SectionHead>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px] leading-snug"
                style={{ ...serif, color: C.ink }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ background: C.green, color: C.ivory }}
                  aria-hidden="true"
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionHead>Om te overwegen</SectionHead>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px] leading-snug"
                style={{ ...serif, color: C.ink }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ background: C.gold, color: C.ivory }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={11} strokeWidth={3} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.ivory,
            background: C.green,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-[rgba(31,92,70,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.green,
            border: `1px solid ${C.green}`,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          Bewaar
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead>Verificatie &amp; certificaten</SectionHead>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.ivory,
            background: C.green,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card ornate className="flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-5">
          <Seal label="Geverifieerd" size={104} />
          <div className="max-w-xs">
            <div
              className="text-[40px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...serif, color: C.greenDeep }}
            >
              {dek}
              <span className="text-[18px]">%</span>
            </div>
            <div className="mt-1 text-[14px] font-semibold" style={{ ...serif, color: C.green }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ ...serif, color: C.inkSoft }}>
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em]"
          style={{ ...mono, color: C.green, border: `1px solid ${C.green}` }}
        >
          <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch">
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRight: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.color }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...serif, color: C.greenDeep }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...mono,
                        color: C.ivory,
                        background: C.green,
                        ["--tw-ring-color" as string]: C.gold,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div>
        <SectionHead>Volgende beste acties</SectionHead>
        <p className="mt-2 text-[13px]" style={{ ...serif, color: C.inkSoft }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[30px] font-semibold"
                  style={{ ...serif, background: warn ? C.gold : C.green, color: C.ivory }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        color: warn ? "#9a7016" : C.green,
                        background: warn ? "rgba(176,141,60,0.14)" : "rgba(31,92,70,0.08)",
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <BadgeCheck size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-semibold"
                      style={{ ...serif, color: C.greenDeep }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...serif, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      ...mono,
                      color: C.ivory,
                      background: warn ? "#9a7016" : C.green,
                      ["--tw-ring-color" as string]: C.gold,
                    }}
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; color: string; bg: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, color: C.green, bg: "rgba(31,92,70,0.10)" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, color: "#9a7016", bg: "rgba(176,141,60,0.14)" };
    return { label: "Concept", Icon: FileText, color: C.inkSoft, bg: "rgba(42,42,34,0.06)" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead>Facturen</SectionHead>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[#163f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.ivory,
            background: C.green,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...serif, color: C.greenDeep }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[rgba(31,92,70,0.04)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineFaint}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: m.bg, border: `1px solid ${m.color}55` }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.2} style={{ color: m.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14px] font-semibold"
                    style={{ ...serif, color: C.greenDeep }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    ...mono,
                    color: m.color,
                    background: m.bg,
                    border: `1px solid ${m.color}55`,
                  }}
                >
                  <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.greenDeep }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.green, color: C.ivory }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={mono}>
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-semibold tabular-nums"
            style={{ ...serif, color: C.goldSoft }}
          >
            {betaald}
          </span>
        </div>
      </Card>
    </div>
  );
}

// ── Berichten ────────────────────────────────────────────────────────────────────
function Berichten() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead>Berichten</SectionHead>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ ...mono, color: C.green, border: `1px solid ${C.line}` }}
        >
          <Mail size={13} strokeWidth={2.2} aria-hidden="true" /> {ongelezen} ongelezen
        </span>
      </div>
      <Card className="overflow-hidden">
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-start gap-3.5 p-4 transition-colors hover:bg-[rgba(31,92,70,0.04)]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineFaint}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{ ...serif, background: C.green, color: C.ivory }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold"
                    style={{ ...serif, color: C.greenDeep }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...mono, color: C.gold, border: `1px solid ${C.gold}66` }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ ...serif, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkSoft }}
              >
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
