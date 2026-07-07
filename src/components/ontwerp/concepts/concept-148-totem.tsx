"use client";

// Concept 148 — "Totem" · gestapelde, chunky afgeronde blokken. Kaarten zijn dikke, afgeronde
// bouwblokken die als een toren op elkaar staan (denk speelgoedblokken). Stevige, frisse primaire
// kleuren met een zachte offset-schaduw onderaan elk blok voor een lichte 3D/diepte-illusie.
// Vrolijk maar georganiseerd; alles is verticaal opgebouwd. Status via label + icoon + eigen
// bloktint (nooit kleur-alleen). Onderscheidend van "memphis" (losse postmoderne vormen) en "klei"
// (claymorphism): dit is STAPELING — verticale blok-torens met harde onderrand-schaduw.
// Deterministisch — geen random, geen Date. Fonts: Bricolage Grotesque (display) + IBM Plex Mono.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
  Plus,
  Blocks,
  Sparkles,
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

// ── Palet — fris, primair, speels ────────────────────────────────────────────────
const C = {
  bg: "#f3f1ea",
  ink: "#1f2430",
  inkSoft: "#5b6474",
  inkFaint: "#8b93a3",
  paper: "#ffffff",
  line: "#e4e0d6",
  // Blok-tinten (fris, stevig)
  blue: "#3b6fe0",
  blueDeep: "#2a52ab",
  amber: "#f2a63c",
  amberDeep: "#c67e1e",
  green: "#3fae6b",
  greenDeep: "#2c8551",
  coral: "#ef6a5b",
  coralDeep: "#c74a3d",
  violet: "#7c6be0",
  violetDeep: "#5b4bb8",
  ink2: "#2b3140",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Een blok met harde offset-onderrand-schaduw (de kern van de stapel-illusie).
function Block({
  children,
  className = "",
  tint = C.paper,
  edge = C.line,
  lift = 6,
  onClick,
  as = "div",
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: string;
  edge?: string;
  lift?: number;
  onClick?: () => void;
  as?: "div" | "button";
  ariaLabel?: string;
}) {
  const style = {
    background: tint,
    borderRadius: 20,
    border: `2px solid ${edge}`,
    boxShadow: `0 ${lift}px 0 0 ${edge}`,
  } as const;
  if (as === "button") {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`block w-full text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5 ${className}`}
        style={style}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// ── Status-model — bloktint + icoon + label ──────────────────────────────────────
function credMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tint: string;
  edge: string;
  on: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        tint: "#e7f5ec",
        edge: C.greenDeep,
        on: C.greenDeep,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        tint: "#e7eefb",
        edge: C.blueDeep,
        on: C.blueDeep,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tint: "#fdf0dc",
        edge: C.amberDeep,
        on: C.amberDeep,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        tint: "#fce7e4",
        edge: C.coralDeep,
        on: C.coralDeep,
      };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ ...mono, background: m.tint, color: m.on, border: `1.5px solid ${m.edge}` }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Match-score als gestapelde mini-blokjes (visuele "toren").
function ScoreStack({ value }: { value: number }) {
  const total = 5;
  const filled = Math.round((value / 100) * total);
  return (
    <div className="flex flex-col-reverse gap-0.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="rounded-[3px]"
          style={{
            width: 22,
            height: 6,
            background: i < filled ? C.blue : C.line,
            border: `1px solid ${i < filled ? C.blueDeep : C.inkFaint}33`,
          }}
        />
      ))}
    </div>
  );
}

const tints = [
  { tint: C.blue, edge: C.blueDeep },
  { tint: C.amber, edge: C.amberDeep },
  { tint: C.green, edge: C.greenDeep },
  { tint: C.violet, edge: C.violetDeep },
];

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept148() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...mono, background: C.bg, color: C.ink }}
    >
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-8"
        style={{
          background: "rgba(243,241,234,0.92)",
          borderBottom: `2px solid ${C.line}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{
              background: C.blue,
              border: `2px solid ${C.blueDeep}`,
              boxShadow: `0 4px 0 0 ${C.blueDeep}`,
            }}
            aria-hidden="true"
          >
            <Blocks size={20} strokeWidth={2.4} color="#fff" />
          </span>
          <div className="leading-none">
            <div
              className="text-[19px] font-extrabold tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              Totem
            </div>
            <div className="mt-1 text-[11px] font-semibold" style={{ ...mono, color: C.inkSoft }}>
              {PROFIEL.naam} · {PROFIEL.plaats}
            </div>
          </div>
        </div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[13px] font-extrabold"
          style={{
            ...display,
            background: C.amber,
            color: "#fff",
            border: `2px solid ${C.amberDeep}`,
            boxShadow: `0 4px 0 0 ${C.amberDeep}`,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </header>

      <nav
        className="flex items-center gap-2 overflow-x-auto px-4 py-3.5 md:px-8"
        aria-label="Schermen"
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          const t = tints[i % tints.length]!;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...display,
                color: on ? "#fff" : C.inkSoft,
                background: on ? t.tint : C.paper,
                border: `2px solid ${on ? t.edge : C.line}`,
                boxShadow: on ? `0 4px 0 0 ${t.edge}` : `0 3px 0 0 ${C.line}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onQueue={() => setScreen("verificatie")}
          />
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

function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h2
        className="text-[24px] font-extrabold tracking-[-0.02em]"
        style={{ ...display, color: C.ink }}
      >
        {children}
      </h2>
      {sub && (
        <p className="mt-0.5 text-[13px] font-medium" style={{ ...mono, color: C.inkSoft }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Dashboard — de toren ─────────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  const lead = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0];
  return (
    <div className="space-y-5">
      {/* Top-blok: begroeting */}
      <Block tint={C.blue} edge={C.blueDeep} lift={7} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: "#cfe0ff" }}
            >
              Jouw stapel vandaag
            </p>
            <h1
              className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: "#fff" }}
            >
              Alles staat stevig. Bouw verder, Sanne.
            </h1>
          </div>
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-[24px] font-extrabold tabular-nums"
            style={{
              ...display,
              background: "#fff",
              color: C.blueDeep,
              border: `2px solid ${C.blueDeep}`,
              boxShadow: `0 5px 0 0 ${C.blueDeep}`,
            }}
            aria-hidden="true"
          >
            92
          </span>
        </div>
      </Block>

      {/* KPI-blokjes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const t = tints[i % tints.length]!;
          return (
            <Block key={k.label} className="p-4" lift={5}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold" style={{ ...mono, color: C.inkSoft }}>
                  {k.label}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: k.up ? "#e7f5ec" : "#fce7e4",
                    color: k.up ? C.greenDeep : C.coralDeep,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-extrabold tabular-nums tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div
                className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: C.line }}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${[92, 70, 82, 55][i % 4]}%`, background: t.tint }}
                />
              </div>
            </Block>
          );
        })}
      </div>

      {/* Lead-actie blok */}
      <Block tint={C.amber} edge={C.amberDeep} lift={7} className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: "#fff", border: `2px solid ${C.amberDeep}` }}
              aria-hidden="true"
            >
              <AlertTriangle size={18} strokeWidth={2.6} style={{ color: C.amberDeep }} />
            </span>
            <div className="min-w-0">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: "#7a4e12" }}
              >
                Nu regelen
              </span>
              <h3
                className="text-[17px] font-extrabold leading-snug"
                style={{ ...display, color: "#3d2a08" }}
              >
                {lead?.titel}
              </h3>
              <p
                className="mt-0.5 max-w-lg text-[13px] font-medium"
                style={{ ...mono, color: "#6b4a17" }}
              >
                {lead?.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onQueue}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5"
            style={{
              ...display,
              background: C.ink,
              color: "#fff",
              border: `2px solid ${C.ink}`,
              boxShadow: "0 4px 0 0 #0d1017",
            }}
          >
            {lead?.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Block>

      {/* Kansen-toren */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Heading sub="De hoogste match staat bovenop de stapel">Kansen</Heading>
          {OPDRACHTEN.map((o, i) => {
            const t = tints[i % tints.length]!;
            return (
              <Block
                key={o.id}
                as="button"
                onClick={onOpen}
                lift={5}
                ariaLabel={`Open ${o.titel}`}
                className="p-4"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[14px] text-[18px] font-extrabold tabular-nums"
                    style={{
                      ...display,
                      background: t.tint,
                      color: "#fff",
                      border: `2px solid ${t.edge}`,
                    }}
                    aria-hidden="true"
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-extrabold"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[12px] font-medium"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </div>
              </Block>
            );
          })}
        </div>

        {/* Dossier-blok */}
        <div className="space-y-4">
          <Heading sub="Je bewijs-stapel">Vertrouwen</Heading>
          <Block lift={5} className="p-4">
            <ul className="space-y-3">
              {CREDENTIALS.map((c) => (
                <li key={c.naam} className="flex items-start justify-between gap-2">
                  <span
                    className="min-w-0 truncate text-[13px] font-bold"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="mt-3 flex flex-wrap gap-2 border-t pt-3"
              style={{ borderColor: C.line }}
            >
              {CREDENTIALS.map((c) => (
                <StatusChip key={c.naam} status={c.status} />
              ))}
            </div>
          </Block>
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Heading sub="Blok voor blok — kies je volgende opdracht">Marktplaats</Heading>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{
            background: C.paper,
            border: `2px solid ${C.line}`,
            boxShadow: `0 3px 0 0 ${C.line}`,
          }}
        >
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] font-medium outline-none placeholder:opacity-60"
            style={{ ...mono, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Block
          lift={6}
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[16px]"
            style={{ background: C.bg, border: `2px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.inkFaint }} />
          </span>
          <p className="text-[17px] font-extrabold" style={{ ...display, color: C.ink }}>
            Geen blok gevonden
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ ...mono, color: C.inkSoft }}>
            Niets komt overeen met “{q}”.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[14px] px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...display,
              background: C.blue,
              color: "#fff",
              border: `2px solid ${C.blueDeep}`,
              boxShadow: `0 4px 0 0 ${C.blueDeep}`,
            }}
          >
            Zoekopdracht wissen
          </button>
        </Block>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, i) => {
            const t = tints[i % tints.length]!;
            return (
              <Block key={o.id} lift={6} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[16px]"
                    style={{ background: t.tint, color: "#fff", border: `2px solid ${t.edge}` }}
                    aria-hidden="true"
                  >
                    <span className="text-[20px] font-extrabold tabular-nums" style={display}>
                      {o.match}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={mono}>
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.12em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {o.id}
                    </span>
                    <h3
                      className="text-[18px] font-extrabold leading-snug"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p
                      className="mt-0.5 text-[12.5px] font-medium"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            ...mono,
                            background: C.bg,
                            color: C.inkSoft,
                            border: `1.5px solid ${C.line}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpen}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[14px] px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5"
                    style={{
                      ...display,
                      background: C.ink,
                      color: "#fff",
                      boxShadow: "0 4px 0 0 #0d1017",
                    }}
                  >
                    Openen <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Block>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon; t: (typeof tints)[number] }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, t: tints[0]! },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, t: tints[1]! },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, t: tints[2]! },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, t: tints[3]! },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-bold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...display, color: C.inkSoft }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Block tint={C.violet} edge={C.violetDeep} lift={7} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: "#ddd6fb" }}
            >
              {opdracht.id} · {opdracht.start}
            </span>
            <h1
              className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[32px]"
              style={{ ...display, color: "#fff" }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[14px] font-medium" style={{ ...mono, color: "#e6e1fc" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreStack value={opdracht.match} />
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-[22px] font-extrabold tabular-nums"
              style={{
                ...display,
                background: "#fff",
                color: C.violetDeep,
                border: `2px solid ${C.violetDeep}`,
                boxShadow: `0 5px 0 0 ${C.violetDeep}`,
              }}
              aria-hidden="true"
            >
              {opdracht.match}
            </span>
          </div>
        </div>
      </Block>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((m) => (
          <Block key={m.l} lift={5} className="p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: m.t.tint, border: `2px solid ${m.t.edge}` }}
              aria-hidden="true"
            >
              <m.Icon size={16} strokeWidth={2.4} color="#fff" />
            </span>
            <div
              className="mt-3 text-[16px] font-extrabold tabular-nums"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div className="mt-0.5 text-[12px] font-semibold" style={{ ...mono, color: C.inkSoft }}>
              {m.l}
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block tint="#e7f5ec" edge={C.greenDeep} lift={5} className="p-5">
          <h3
            className="flex items-center gap-2 text-[16px] font-extrabold"
            style={{ ...display, color: C.greenDeep }}
          >
            <Check size={17} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                style={{ ...mono, color: C.ink2 }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: C.greenDeep }}
                  aria-hidden="true"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Block>
        <Block tint="#fdf0dc" edge={C.amberDeep} lift={5} className="p-5">
          <h3
            className="flex items-center gap-2 text-[16px] font-extrabold"
            style={{ ...display, color: C.amberDeep }}
          >
            <AlertTriangle size={16} strokeWidth={2.6} aria-hidden="true" /> Let op
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                style={{ ...mono, color: C.ink2 }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: C.amberDeep }}
                  aria-hidden="true"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[16px] px-6 py-4 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5"
          style={{
            ...display,
            background: C.blue,
            color: "#fff",
            border: `2px solid ${C.blueDeep}`,
            boxShadow: `0 5px 0 0 ${C.blueDeep}`,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[16px] px-6 py-4 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5"
          style={{
            ...display,
            background: C.paper,
            color: C.ink,
            border: `2px solid ${C.line}`,
            boxShadow: `0 5px 0 0 ${C.line}`,
          }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Heading sub="Stapel je bewijs — hoe hoger, hoe meer vertrouwen">Verificatie</Heading>

      <Block tint={C.green} edge={C.greenDeep} lift={7} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: "#fff", border: `2px solid ${C.greenDeep}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2.4} style={{ color: C.greenDeep }} />
            </span>
            <div>
              <p
                className="text-[12px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: "#d3f0de" }}
              >
                Vertrouwensniveau · {PROFIEL.trust}
              </p>
              <p className="text-[22px] font-extrabold" style={{ ...display, color: "#fff" }}>
                {verified} van {CREDENTIALS.length} blokken op hun plek
              </p>
            </div>
          </div>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[18px] text-[20px] font-extrabold tabular-nums"
            style={{
              ...display,
              background: "#fff",
              color: C.greenDeep,
              border: `2px solid ${C.greenDeep}`,
              boxShadow: `0 5px 0 0 ${C.greenDeep}`,
            }}
            aria-hidden="true"
          >
            {pct}%
          </span>
        </div>
      </Block>

      <div className="space-y-4">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Block key={c.naam} lift={5} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ background: m.tint, border: `2px solid ${m.edge}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2.4} style={{ color: m.on }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-extrabold" style={{ ...display, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px] font-medium" style={{ ...mono, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
                <button
                  disabled={!actionable}
                  className="rounded-[12px] px-4 py-2.5 text-[12.5px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    ...display,
                    background: actionable ? C.ink : C.bg,
                    color: actionable ? "#fff" : C.inkFaint,
                    border: `2px solid ${actionable ? C.ink : C.line}`,
                    boxShadow: actionable ? "0 4px 0 0 #0d1017" : "none",
                  }}
                >
                  {actionable ? "Herstel" : "Klaar"}
                </button>
              </div>
            </Block>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <Heading sub="Bovenop de stapel eerst afhandelen">Volgende stappen</Heading>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const t = warn ? { tint: C.amber, edge: C.amberDeep } : { tint: C.paper, edge: C.line };
          return (
            <li key={a.titel}>
              <Block tint={t.tint} edge={t.edge} lift={6} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[18px] font-extrabold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? "#fff" : C.bg,
                      color: warn ? C.amberDeep : C.ink,
                      border: `2px solid ${warn ? C.amberDeep : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {warn ? (
                        <AlertTriangle
                          size={16}
                          strokeWidth={2.6}
                          style={{ color: warn ? "#3d2a08" : C.ink }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Sparkles
                          size={16}
                          strokeWidth={2.4}
                          style={{ color: C.violetDeep }}
                          aria-hidden="true"
                        />
                      )}
                      <h3
                        className="text-[16px] font-extrabold"
                        style={{ ...display, color: warn ? "#3d2a08" : C.ink }}
                      >
                        {a.titel}
                      </h3>
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ ...mono, color: warn ? "#7a4e12" : C.inkFaint }}
                      >
                        {warn ? "Belangrijk" : "Ter info"}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[13px] font-medium leading-relaxed"
                      style={{ ...mono, color: warn ? "#6b4a17" : C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="shrink-0 self-start rounded-[14px] px-5 py-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5 sm:self-center"
                    style={{
                      ...display,
                      background: C.ink,
                      color: "#fff",
                      border: `2px solid ${C.ink}`,
                      boxShadow: "0 4px 0 0 #0d1017",
                    }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Block>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tint: string; edge: string; on: string; Icon: LucideIcon } => {
    if (status === "Betaald")
      return { tint: "#e7f5ec", edge: C.greenDeep, on: C.greenDeep, Icon: Check };
    if (status === "Openstaand")
      return { tint: "#fdf0dc", edge: C.amberDeep, on: C.amberDeep, Icon: Clock };
    return { tint: C.bg, edge: C.line, on: C.inkSoft, Icon: CalendarDays };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Heading sub="Je omzet-stapel op een rij">Facturen</Heading>
        <button
          className="inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5"
          style={{
            ...display,
            background: C.blue,
            color: "#fff",
            border: `2px solid ${C.blueDeep}`,
            boxShadow: `0 4px 0 0 ${C.blueDeep}`,
          }}
        >
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: total, t: tints[2]! },
          { l: "Openstaand", v: `${open}`, t: tints[1]! },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            t: tints[3]!,
          },
        ].map((s) => (
          <Block key={s.l} lift={5} className="p-4">
            <div
              className="h-1.5 w-8 rounded-full"
              style={{ background: s.t.tint }}
              aria-hidden="true"
            />
            <span
              className="mt-3 block text-[12px] font-bold"
              style={{ ...mono, color: C.inkSoft }}
            >
              {s.l}
            </span>
            <div
              className="mt-1 text-[24px] font-extrabold tabular-nums"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Block>
        ))}
      </div>

      <div className="space-y-3">
        {FACTUREN.map((f) => {
          const m = meta(f.status);
          return (
            <Block key={f.nr} lift={4} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: m.tint, border: `2px solid ${m.edge}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={17} strokeWidth={2.4} style={{ color: m.on }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold" style={{ ...display, color: C.ink }}>
                    {f.klant}
                  </div>
                  <div
                    className="text-[12px] font-medium tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    ...mono,
                    background: m.tint,
                    color: m.on,
                    border: `1.5px solid ${m.edge}`,
                  }}
                >
                  <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  {f.status}
                </span>
                <span
                  className="text-[16px] font-extrabold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </div>
            </Block>
          );
        })}
      </div>

      <Block tint={C.ink} edge="#0d1017" lift={6} className="flex items-center justify-between p-5">
        <span
          className="text-[12px] font-bold uppercase tracking-[0.14em]"
          style={{ ...mono, color: "#9aa3b5" }}
        >
          Totaal betaald deze maand
        </span>
        <span
          className="text-[22px] font-extrabold tabular-nums"
          style={{ ...display, color: "#fff" }}
        >
          {total}
        </span>
      </Block>
    </div>
  );
}
