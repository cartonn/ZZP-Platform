"use client";

// Concept 157 — "Karmijn" · monochroom-tonaal. De HELE interface leeft in gradaties van één rijke
// tint: diep karmijn (#2a0a10) tot zacht rozewit (#fbeef0), met één accentwaarde (#c81e3c). Geen
// concurrerende kleuren — hiërarchie, diepte en status ontstaan uit TOONWAARDE (donker↔licht),
// vulpatroon en iconografie, nooit uit kleur-alleen. Elegant, immersief, tonaal; het tegendeel van
// spectrum-/palet-concepten. Deterministisch — geen random/Date. Fonts: Manrope + JetBrains Mono.

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  Send,
  ChevronRight,
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

// ── Tonaal karmijn-palet — één tint, van diep naar licht ─────────────────────────
const C = {
  ink: "#2a0a10", // diepste karmijn — primaire inkt
  ink800: "#3d0f18",
  ink700: "#511522",
  ink600: "#6b1c2e",
  ink500: "#88243b",
  accent: "#c81e3c", // enige accentwaarde
  rose500: "#cf5a6f",
  rose400: "#dd8494",
  rose300: "#eab0bb",
  rose200: "#f3d0d7",
  rose100: "#f8e2e7",
  paper: "#fbeef0", // lichtste toon — achtergrond
  surface: "#fdf6f7",
  white: "#ffffff",
};

const sans = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Zachte tonale schaduw (alles blijft binnen de tint).
const softShadow = { boxShadow: "0 1px 2px rgba(42,10,16,0.06), 0 12px 30px rgba(42,10,16,0.08)" };
const softShadowSm = { boxShadow: "0 1px 2px rgba(42,10,16,0.05), 0 6px 16px rgba(42,10,16,0.07)" };

// ── Status-model — nooit kleur-alleen. Onderscheid via TOONWAARDE + vulpatroon + icoon ──
// Karmijn is monochroom, dus elke status krijgt een eigen toondiepte én vulpatroon (solid /
// outline / accent / dashed) zodat ze ook zonder kleurperceptie leesbaar zijn.
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
  border: string;
  pattern: "solid" | "outline" | "accent" | "dashed";
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Diepste toon, volledig gevuld — hoogste tonale gewicht.
      return {
        label: "Geverifieerd",
        Icon: Check,
        bg: C.ink,
        fg: C.paper,
        border: C.ink,
        pattern: "solid",
      };
    case "SUBMITTED":
      // Middentoon, alleen omlijnd — neutraal, in behandeling.
      return {
        label: "In beoordeling",
        Icon: Clock,
        bg: C.surface,
        fg: C.ink600,
        border: C.rose300,
        pattern: "outline",
      };
    case "EXPIRING":
      // De enige accentwaarde — vraagt aandacht.
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        bg: C.accent,
        fg: C.white,
        border: C.accent,
        pattern: "accent",
      };
    case "REJECTED":
      // Lichte toon met streeppatroon — afwijkend, hersteltaak.
      return {
        label: "Afgewezen",
        Icon: XCircle,
        bg: C.rose100,
        fg: C.ink,
        border: C.ink500,
        pattern: "dashed",
      };
  }
}

function StatusTag({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const m = credMeta(status);
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.06em] ${pad}`}
      style={{
        ...mono,
        background: m.bg,
        color: m.fg,
        border: `1.5px ${m.pattern === "dashed" ? "dashed" : "solid"} ${m.border}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Tonale kaart — bleke tint-oppervlak met haarfijne karmijn-rand.
function Card({
  children,
  className = "",
  bg = C.surface,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  interactive?: boolean;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-2xl ${interactive ? "transition-all duration-200 hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.rose200}`,
        ...(interactive ? softShadowSm : { boxShadow: "0 1px 2px rgba(42,10,16,0.05)" }),
      }}
    >
      {children}
    </Tag>
  );
}

// Sectie-koptekst — tonale eyebrow met haarlijn.
function SectionHead({
  index,
  title,
  action,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <span
          className="text-[11px] font-semibold tabular-nums tracking-[0.14em]"
          style={{ ...mono, color: C.rose500 }}
          aria-hidden="true"
        >
          {index}
        </span>
        <h2
          className="text-[16px] font-extrabold tracking-[-0.01em]"
          style={{ ...sans, color: C.ink }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// Tonale voortgangsmeter — vult van middentoon naar accent.
function ToneMeter({ value }: { value: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.rose200 }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${C.ink600}, ${C.accent})`,
        }}
      />
    </div>
  );
}

// Mini staafgrafiek — tonale balken (laatste = accent).
function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.accent : C.rose300,
          }}
        />
      ))}
    </div>
  );
}

// Match-cijfer met tonaal gewicht: hoge match = diepere toon.
function matchTone(m: number): { bg: string; fg: string } {
  if (m >= 90) return { bg: C.ink, fg: C.paper };
  if (m >= 85) return { bg: C.ink600, fg: C.paper };
  return { bg: C.rose300, fg: C.ink };
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept157() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const tabs: { key: ScreenKey; label: string }[] = [
    ...SCREENS,
    { key: "berichten", label: "Berichten" },
  ];

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        // Immersieve tonale achtergrond — verticaal verloop binnen dezelfde tint.
        background: `linear-gradient(180deg, ${C.paper} 0%, ${C.surface} 40%, ${C.paper} 100%)`,
      }}
    >
      {/* Kop */}
      <header
        className="sticky top-0 z-20 backdrop-blur-sm"
        style={{
          background: "rgba(251,238,240,0.86)",
          borderBottom: `1px solid ${C.rose200}`,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[15px] font-extrabold"
              style={{ ...sans, background: C.ink, color: C.paper }}
              aria-hidden="true"
            >
              K
            </span>
            <div className="leading-none">
              <div
                className="text-[16px] font-extrabold tracking-[-0.01em]"
                style={{ color: C.ink }}
              >
                Karmijn
              </div>
              <div
                className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.rose500 }}
              >
                Werk · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] sm:inline-flex"
              style={{
                ...mono,
                background: C.rose100,
                color: C.ink700,
                border: `1px solid ${C.rose200}`,
              }}
            >
              <ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-extrabold"
              style={{
                ...sans,
                background: C.surface,
                color: C.ink,
                border: `1.5px solid ${C.accent}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — tonale pil-tabs */}
        <nav
          className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3 md:px-8"
          aria-label="Schermen"
        >
          {tabs.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        background: C.ink,
                        color: C.paper,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.paper,
                      }
                    : {
                        background: C.surface,
                        color: C.ink600,
                        border: `1px solid ${C.rose200}`,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.paper,
                      }
                }
              >
                <span className="mr-1.5 tabular-nums opacity-55" style={mono} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
    <div className="space-y-7">
      {/* Immersieve tonale hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 sm:p-9"
        style={{
          background: `radial-gradient(120% 140% at 12% 0%, ${C.ink600} 0%, ${C.ink} 55%, ${C.ink800} 100%)`,
          color: C.paper,
          ...softShadow,
        }}
      >
        {/* Tonale ringen (decoratief, tekstvrij, binnen de tint) */}
        <span
          className="pointer-events-none absolute -right-24 -top-24 hidden h-72 w-72 rounded-full sm:block"
          style={{ border: `1px solid rgba(248,226,231,0.14)` }}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -right-10 top-6 hidden h-52 w-52 rounded-full sm:block"
          style={{ border: `1px solid rgba(248,226,231,0.10)` }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, background: "rgba(248,226,231,0.12)", color: C.rose300 }}
          >
            Bulletin · {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[38px]"
            style={sans}
          >
            Drie matches boven 85%. De omzet stijgt.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed"
            style={{ color: C.rose200 }}
          >
            Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.paper,
                color: C.ink,
                ["--tw-ring-color" as string]: C.paper,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.accent,
                color: C.white,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              <AlertTriangle size={15} strokeWidth={2.6} aria-hidden="true" /> Los actie op
            </button>
          </div>
        </div>
      </div>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.rose500 }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  ...mono,
                  background: k.up ? C.ink : C.rose100,
                  color: k.up ? C.paper : C.ink600,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowRight size={11} className="rotate-90" aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...sans, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Bars data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <SectionHead index="A" title="Aanbevolen matches" />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const t = matchTone(o.match);
              return (
                <Card key={o.id} interactive className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.accent }}
                  >
                    <span
                      className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5"
                      style={{ background: t.bg, color: t.fg }}
                      aria-hidden="true"
                    >
                      <span className="text-[20px] font-extrabold leading-none" style={sans}>
                        {o.match}
                      </span>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                        style={mono}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15.5px] font-extrabold tracking-[-0.01em]"
                            style={{ color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px] font-medium"
                            style={{ color: C.ink500 }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.rose400 }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              ...mono,
                              background: C.rose100,
                              color: C.ink700,
                              border: `1px solid ${C.rose200}`,
                            }}
                          >
                            <Check size={11} strokeWidth={2.8} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom: dekking + prioriteit */}
        <div className="space-y-4">
          <SectionHead index="B" title="Status" />
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[48px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ ...sans, color: C.ink }}
              >
                {dek}
                <span className="text-[20px]">%</span>
              </div>
              <StatusTag status="VERIFIED" size="sm" />
            </div>
            <div className="mt-2 text-[12.5px] font-medium" style={{ color: C.ink500 }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <div className="mt-3">
              <ToneMeter value={dek} />
            </div>
          </Card>

          <div
            className="overflow-hidden rounded-2xl p-5"
            style={{
              background: `linear-gradient(180deg, ${C.ink} 0%, ${C.ink800} 100%)`,
              color: C.paper,
              ...softShadowSm,
            }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.accent, color: C.white }}
            >
              <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3 className="mt-3 text-[16px] font-extrabold leading-tight" style={sans}>
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] font-medium leading-relaxed"
              style={{ color: C.rose200 }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.accent,
                color: C.white,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
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
      <SectionHead
        index="01"
        title="Marktplaats · open opdrachten"
        action={
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: C.surface, border: `1px solid ${C.rose200}` }}
          >
            <Search size={15} style={{ color: C.rose500 }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent py-0.5 text-[12.5px] font-medium outline-none placeholder:opacity-50"
              style={{ color: C.ink }}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.rose100, color: C.ink }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[17px] font-extrabold" style={{ ...sans, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ color: C.ink500 }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const t = matchTone(o.match);
            return (
              <Card key={o.id} interactive className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 pb-3">
                  <div className="min-w-0">
                    <h3
                      className="text-[15.5px] font-extrabold leading-tight tracking-[-0.01em]"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-1 text-[12px] font-medium" style={{ color: C.ink500 }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ background: t.bg, color: t.fg }}
                    aria-hidden="true"
                  >
                    <span className="text-[16px] font-extrabold leading-none" style={sans}>
                      {o.match}
                    </span>
                    <span className="text-[8px] font-semibold uppercase" style={mono}>
                      match
                    </span>
                  </span>
                </div>
                <div className="px-4 pb-3" style={{ borderTop: `1px solid ${C.rose200}` }}>
                  <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.03em]"
                        style={{
                          ...mono,
                          background: C.rose100,
                          color: C.ink700,
                          border: `1px solid ${C.rose200}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...sans,
                    background: C.ink,
                    color: C.paper,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.ink500 }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.rose500 }} aria-hidden="true" />
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
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.ink600,
          background: C.surface,
          border: `1px solid ${C.rose200}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.paper,
        }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <div
        className="relative overflow-hidden rounded-3xl p-7 sm:p-8"
        style={{
          background: `radial-gradient(120% 160% at 90% 0%, ${C.ink600} 0%, ${C.ink} 60%, ${C.ink800} 100%)`,
          color: C.paper,
          ...softShadow,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, background: "rgba(248,226,231,0.12)", color: C.rose300 }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[34px]"
              style={sans}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px] font-medium" style={{ color: C.rose200 }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center rounded-2xl px-5 py-3"
            style={{
              background: "rgba(248,226,231,0.10)",
              border: `1px solid rgba(248,226,231,0.16)`,
            }}
          >
            <span className="text-[44px] font-extrabold leading-none" style={sans}>
              {opdracht.match}
            </span>
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.rose300 }}
            >
              % match
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2.4} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-extrabold leading-none"
              style={{ ...sans, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.rose500 }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      {/* Verklaarbare matching */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <SectionHead index="+" title="Waarom dit past" />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.ink, color: C.paper }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-3">
          <SectionHead index="!" title="Om te overwegen" />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.accent, color: C.white }}
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            color: C.paper,
            ...softShadowSm,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.surface,
            color: C.ink,
            border: `1.5px solid ${C.rose300}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          <Star size={15} strokeWidth={2.4} aria-hidden="true" /> Bewaar
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
      <SectionHead
        index="04"
        title="Verificatie & certificaten"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Toevoegen
          </button>
        }
      />

      <div
        className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl p-6"
        style={{
          background: `linear-gradient(135deg, ${C.ink} 0%, ${C.ink700} 100%)`,
          color: C.paper,
          ...softShadowSm,
        }}
      >
        <div className="flex items-center gap-5">
          <div className="text-[52px] font-extrabold leading-none tracking-[-0.03em]" style={sans}>
            {dek}
            <span className="text-[22px]">%</span>
          </div>
          <div className="max-w-xs">
            <div className="text-[15px] font-extrabold" style={sans}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] font-medium leading-snug" style={{ color: C.rose200 }}>
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em]"
          style={{ ...mono, background: C.paper, color: C.ink }}
        >
          <ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </div>

      {/* Tonale legenda — laat zien dat status via toon + patroon werkt, niet kleur */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.rose500 }}
        >
          Toonschaal
        </span>
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => (
          <StatusTag key={s} status={s} size="sm" />
        ))}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch overflow-hidden">
              <span
                className="flex w-14 shrink-0 items-center justify-center"
                style={{
                  background: m.bg,
                  borderRight: `1px ${m.pattern === "dashed" ? "dashed" : "solid"} ${m.border}`,
                }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[14.5px] font-extrabold tracking-[-0.01em]"
                  style={{ color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px] font-medium" style={{ color: C.ink500 }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} size="sm" />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        background: C.accent,
                        color: C.white,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.surface,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
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

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div>
        <SectionHead index="05" title="Volgende beste acties" />
        <p className="mt-2 text-[13px] font-medium" style={{ color: C.ink500 }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card
                interactive
                bg={warn ? C.ink : C.surface}
                className="flex items-stretch overflow-hidden"
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[26px] font-extrabold"
                  style={{
                    ...sans,
                    background: warn ? C.accent : C.rose100,
                    color: warn ? C.white : C.ink,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        background: warn ? C.accent : C.rose100,
                        color: warn ? C.white : C.ink600,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={3} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-extrabold tracking-[-0.01em]"
                      style={{ ...sans, color: warn ? C.paper : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] font-medium leading-relaxed"
                    style={{ color: warn ? C.rose200 : C.ink500 }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            background: C.paper,
                            color: C.ink,
                            ["--tw-ring-color" as string]: C.paper,
                            ["--tw-ring-offset-color" as string]: C.ink,
                          }
                        : {
                            background: C.ink,
                            color: C.paper,
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.surface,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
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
  ): {
    label: string;
    Icon: LucideIcon;
    bg: string;
    fg: string;
    border: string;
    dashed: boolean;
  } => {
    if (status === "Betaald")
      return {
        label: "Betaald",
        Icon: Check,
        bg: C.ink,
        fg: C.paper,
        border: C.ink,
        dashed: false,
      };
    if (status === "Openstaand")
      return {
        label: "Openstaand",
        Icon: Clock,
        bg: C.accent,
        fg: C.white,
        border: C.accent,
        dashed: false,
      };
    return {
      label: "Concept",
      Icon: FileText,
      bg: C.rose100,
      fg: C.ink600,
      border: C.ink500,
      dashed: true,
    };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <SectionHead
        index="06"
        title="Facturen"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.accent,
              color: C.white,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, tone: "deep" as const },
          { l: "Openstaand", v: `${open}`, tone: "accent" as const },
          { l: "Te factureren", v: "€ 1.350", tone: "light" as const },
        ].map((s) => {
          const bg = s.tone === "deep" ? C.ink : s.tone === "accent" ? C.accent : C.surface;
          const fg = s.tone === "light" ? C.ink : s.tone === "accent" ? C.white : C.paper;
          return (
            <Card key={s.l} interactive bg={bg} className="p-4">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: fg, opacity: 0.85 }}
              >
                {s.l}
              </div>
              <div
                className="mt-2 text-[25px] font-extrabold leading-none tracking-[-0.02em]"
                style={{ ...sans, color: fg }}
              >
                {s.v}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#fbeef0]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.rose200}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: m.bg,
                    border: `1.5px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.4} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-extrabold tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: C.ink500 }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{
                    ...mono,
                    background: m.bg,
                    color: m.fg,
                    border: `1.5px ${m.dashed ? "dashed" : "solid"} ${m.border}`,
                  }}
                >
                  <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.ink, color: C.paper }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.rose300 }}
          >
            Totaal betaald
          </span>
          <span className="text-[17px] font-extrabold tabular-nums" style={sans}>
            {betaald}
          </span>
        </div>
      </Card>
    </div>
  );
}

// ── Berichten (extra scherm) ──────────────────────────────────────────────────────
function Berichten() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-6">
      <SectionHead
        index="07"
        title="Berichten"
        action={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{
              ...mono,
              background: C.rose100,
              color: C.ink700,
              border: `1px solid ${C.rose200}`,
            }}
          >
            {ongelezen} ongelezen
          </span>
        }
      />
      <Card className="overflow-hidden">
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-[#fbeef0]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.rose200}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{
                  ...sans,
                  background: b.ongelezen ? C.ink : C.rose100,
                  color: b.ongelezen ? C.paper : C.ink600,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-extrabold" style={{ color: C.ink }}>
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                      style={{ ...mono, background: C.accent, color: C.white }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="truncate text-[12.5px] font-medium" style={{ color: C.ink500 }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: C.rose500 }}
              >
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex items-center gap-2 p-2.5">
        <input
          placeholder="Schrijf een bericht…"
          aria-label="Nieuw bericht"
          className="flex-1 rounded-xl bg-transparent px-3 py-2 text-[13px] font-medium outline-none placeholder:opacity-50 focus-visible:ring-2"
          style={{ color: C.ink, ["--tw-ring-color" as string]: C.accent }}
        />
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.surface,
          }}
        >
          <Send size={14} aria-hidden="true" /> Verstuur
        </button>
      </Card>
    </div>
  );
}
