"use client";

// Concept 362 — "Lagen" · Spatiale diepte / ruimtelijk (spatial computing).
// Doorschijnende frosted-glass panelen die op echte z-diepte boven een zacht licht verloop zweven:
// gelaagde backdrop-blur, subtiele witte binnenrand (ring-white/40), gestapelde diffuse schaduwen,
// vibrancy. Palet: zachte lucht-gradient (indigo→lila→wit), violet accent (#7c6cff). Ruime rounded
// glaskaarten die bij hover licht naar voren komen. Fonts: Geist + Inter.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck,
  Sparkle,
  TrendingUp,
  FileText,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: lucht-gradient, violet accent —
const C = {
  ink: "#1c1b2e",
  inkSoft: "#413f5e",
  muted: "#6c6a86",
  faint: "#9391ad",
  accent: "#7c6cff",
  accentDeep: "#5b4bd6",
  amber: "#d97706",
  glass: "rgba(255,255,255,0.55)",
  glassSoft: "rgba(255,255,255,0.38)",
  glassStrong: "rgba(255,255,255,0.72)",
  ring: "rgba(255,255,255,0.55)",
  hair: "rgba(28,27,46,0.08)",
};

const display = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const bodyFont = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

const PAGE_BG =
  "radial-gradient(120% 90% at 12% 0%, #eef0ff 0%, rgba(238,240,255,0) 55%)," +
  "radial-gradient(120% 100% at 88% 8%, #f7ecff 0%, rgba(247,236,255,0) 50%)," +
  "radial-gradient(140% 120% at 50% 120%, #e7eeff 0%, rgba(231,238,255,0) 60%)," +
  "linear-gradient(180deg, #f3f2ff 0%, #f6f4fb 40%, #fbfaff 100%)";

// Gestapelde diffuse schaduw die diepte suggereert.
const FLOAT_SHADOW =
  "0 1px 1px rgba(28,27,46,0.04), 0 8px 20px rgba(80,70,180,0.10), 0 24px 60px rgba(80,70,180,0.12)";
const LIFT_SHADOW =
  "0 2px 3px rgba(28,27,46,0.05), 0 14px 34px rgba(80,70,180,0.16), 0 34px 80px rgba(80,70,180,0.18)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: "ok" | "wait" | "warn";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: "ok" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: "wait" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, tone: "warn" };
  }
}

function toneColor(tone: "ok" | "wait" | "warn"): string {
  return tone === "warn" ? C.amber : tone === "wait" ? C.accentDeep : "#0f9d6b";
}

// — Zwevende glaskaart met binnenrand + diepte-schaduw —
function Glass({
  children,
  className = "",
  lift,
  as = "div",
  tint = "glass",
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
  as?: "div" | "section";
  tint?: "glass" | "soft" | "strong";
}) {
  const bg = tint === "strong" ? C.glassStrong : tint === "soft" ? C.glassSoft : C.glass;
  const Tag = as;
  return (
    <Tag
      className={`rounded-3xl backdrop-blur-xl transition-all duration-300 motion-reduce:transition-none ${
        lift ? "hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: bg,
        boxShadow: FLOAT_SHADOW,
        border: "1px solid rgba(255,255,255,0.6)",
        ...bodyFont,
      }}
    >
      {children}
    </Tag>
  );
}

function Overline({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: accent ? C.accentDeep : C.faint, ...display }}
    >
      {children}
    </p>
  );
}

function Pill({
  children,
  tone = "neutral",
  Icon,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "wait" | "warn" | "accent";
  Icon?: LucideIcon;
}) {
  const color =
    tone === "warn"
      ? C.amber
      : tone === "wait"
        ? C.accentDeep
        : tone === "ok"
          ? "#0f9d6b"
          : tone === "accent"
            ? C.accentDeep
            : C.inkSoft;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{
        background: "rgba(255,255,255,0.6)",
        color,
        border: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

// — Zachte gebogen sparkline —
function GlowSpark({ data, up }: { data: number[]; up: boolean }) {
  const w = 120;
  const h = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const stroke = up ? C.accent : C.amber;
  const id = `lg-${up ? "u" : "d"}-${data.join("-").replace(/\D/g, "").slice(0, 6)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1]?.[0] ?? 0}
        cy={pts[pts.length - 1]?.[1] ?? 0}
        r="2.6"
        fill={stroke}
      />
    </svg>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const strong = value >= 90;
  return (
    <span className="relative inline-flex h-11 w-11 items-center justify-center" aria-hidden="true">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="rgba(124,108,255,0.16)"
          strokeWidth="3.5"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={strong ? C.accent : C.accentDeep}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ color: C.ink, ...display }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept362() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, background: PAGE_BG, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="mt-6">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <Glass className="flex items-center justify-between px-4 py-3" tint="strong">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: "0 6px 16px rgba(124,108,255,0.4)",
          }}
          aria-hidden="true"
        >
          <Sparkle size={17} color="#fff" />
        </span>
        <div className="leading-none">
          <p className="text-[16px] font-semibold tracking-[-0.01em]" style={display}>
            Lagen
          </p>
          <p className="mt-1 text-[11px]" style={{ color: C.faint }}>
            Ruimte om te werken
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Pill tone="accent" Icon={ShieldCheck}>
          {PROFIEL.trust}
        </Pill>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl text-[12px] font-semibold text-white"
          style={{
            background: `linear-gradient(140deg, ${C.accentDeep}, ${C.ink})`,
            boxShadow: "0 4px 12px rgba(28,27,46,0.28)",
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </Glass>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <Glass className="mt-3 p-1.5" tint="soft">
      <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Hoofdnavigatie">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-2xl px-4 py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={
                on
                  ? {
                      background: "rgba(255,255,255,0.85)",
                      color: C.ink,
                      boxShadow: "0 4px 12px rgba(80,70,180,0.14)",
                      ...display,
                    }
                  : { color: C.muted, ...display }
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>
    </Glass>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Hero-laag */}
        <Glass className="relative overflow-hidden p-7" tint="strong" lift>
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70"
            style={{
              background: "radial-gradient(circle, rgba(124,108,255,0.35), transparent 65%)",
            }}
            aria-hidden="true"
          />
          <Overline accent>Vandaag</Overline>
          <h1
            className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[40px]"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Je overzicht zweeft rustig boven de ruis. Eén laag vraagt vandaag om aandacht — de rest
            staat klaar wanneer jij dat wil.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Pill tone="ok" Icon={ShieldCheck}>
              {CREDENTIALS.filter((c) => c.status === "VERIFIED").length} geverifieerd
            </Pill>
            <Pill tone="accent" Icon={TrendingUp}>
              3 nieuwe matches
            </Pill>
            <Pill tone="warn" Icon={AlertTriangle}>
              VOG verloopt
            </Pill>
          </div>
        </Glass>

        {/* Zwevende actie-kaart, hoogste laag */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none"
          style={{
            background: `linear-gradient(150deg, ${C.accent} 0%, ${C.accentDeep} 100%)`,
            boxShadow: LIFT_SHADOW,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(90% 60% at 80% 0%, rgba(255,255,255,0.5), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
                style={display}
              >
                Volgende beste actie
              </p>
              <h2 className="mt-3 text-[20px] font-semibold leading-snug" style={display}>
                {primair.titel}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">{primair.detail}</p>
            </div>
            <button
              onClick={onOpen}
              className="group mt-6 inline-flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-[14px] font-semibold text-[#3a2fb0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ background: "rgba(255,255,255,0.92)", ...display }}
            >
              {primair.cta}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </div>
      </div>

      {/* KPI-laag */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} className="p-5" lift>
            <p className="text-[12.5px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p
                className="text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={display}
              >
                {k.value}
              </p>
              <span
                className="text-[12px] font-semibold tabular-nums"
                style={{ color: k.up ? "#0f9d6b" : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
              </span>
            </div>
            <div className="mt-3">
              <GlowSpark data={k.spark} up={k.up} />
            </div>
          </Glass>
        ))}
      </div>

      {/* Opdrachten-laag */}
      <Glass className="p-6" tint="soft">
        <div className="mb-4 flex items-center justify-between">
          <Overline>Opdrachten voor jou</Overline>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.accentDeep, ...display }}
          >
            Naar marktplaats <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.65)",
                }}
              >
                <MatchRing value={o.match} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold" style={display}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  style={{ color: C.accentDeep }}
                />
              </button>
            </li>
          ))}
        </ul>
      </Glass>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <Glass className="p-6" tint="soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Overline>Marktplaats</Overline>
            <h1
              className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em]"
              style={display}
            >
              Open opdrachten
            </h1>
          </div>
          <span className="text-[12.5px] font-medium tabular-nums" style={{ color: C.muted }}>
            {filtered.length} van {OPDRACHTEN.length}
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9391ad]"
              style={{ color: C.ink }}
            />
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
            {(["match", "tarief"] as const).map((s) => {
              const on = sort === s;
              return (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  aria-pressed={on}
                  className="rounded-2xl px-3.5 py-2.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          background: C.accentDeep,
                          color: "#fff",
                          boxShadow: "0 6px 16px rgba(91,75,214,0.35)",
                          ...display,
                        }
                      : { background: "rgba(255,255,255,0.6)", color: C.muted, ...display }
                  }
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        </div>
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-3xl"
            style={{ background: "rgba(124,108,255,0.14)" }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.accentDeep }} />
          </span>
          <p className="mt-4 text-[19px] font-semibold" style={display}>
            Nog geen resultaat
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om meer
            lagen te zien.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accentDeep, ...display }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Glass>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <OpdrachtKaart key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Glass className="p-6" lift tint="strong">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <MatchRing value={opdracht.match} />
            <div className="min-w-0">
              <h3 className="truncate text-[18px] font-semibold leading-snug" style={display}>
                {opdracht.titel}
              </h3>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        </div>
        <span
          className="text-[17px] font-semibold tabular-nums"
          style={{ color: C.accentDeep, ...display }}
        >
          {opdracht.tarief}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#0f9d6b", ...display }}
          >
            Wat past
          </p>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: "#0f9d6b" }}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.amber, ...display }}
          >
            Aandacht
          </p>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.muted }}>
                <AlertTriangle
                  size={13}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onOpen}
          className="group inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
            ...display,
          }}
        >
          Bekijk opdracht
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </button>
      </div>
    </Glass>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ background: "rgba(255,255,255,0.55)", color: C.inkSoft }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Glass className="relative overflow-hidden p-7" tint="strong">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(124,108,255,0.35), transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone="accent">{opdracht.id}</Pill>
            <Pill tone="accent" Icon={Sparkle}>
              {opdracht.match}% match
            </Pill>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[38px]"
            style={display}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
                ...display,
              }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "rgba(255,255,255,0.7)", color: C.inkSoft }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Glass key={m.l} className="p-5" lift>
            <p
              className="text-[11.5px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </Glass>
        ))}
      </div>

      <Glass className="p-6" tint="soft">
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#0f9d6b", ...display }}
            >
              Wat past
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-[14px]"
                  style={{ background: "rgba(255,255,255,0.55)", color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: "#0f9d6b" }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber, ...display }}
            >
              Aandacht
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-[14px]"
                  style={{ background: "rgba(255,255,255,0.55)", color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Glass>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <Glass className="relative overflow-hidden p-7" tint="strong">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(124,108,255,0.32), transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <Overline accent>Vertrouwen</Overline>
            <h1
              className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em]"
              style={display}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p
                className="text-[40px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={display}
              >
                {ratio}
                <span className="text-[20px]" style={{ color: C.muted }}>
                  %
                </span>
              </p>
              <p
                className="mt-1 text-[11.5px] font-medium uppercase tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                compleet
              </p>
            </div>
          </div>
        </div>
      </Glass>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const tc = toneColor(st.tone);
          return (
            <Glass key={c.naam} className="p-5" lift>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `${tc}1f` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} style={{ color: tc }} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug" style={display}>
                      {c.naam}
                    </h3>
                    <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{ background: `${tc}18`, color: tc }}
                >
                  <st.Icon size={12} aria-hidden="true" />
                  {st.label}
                </span>
                <button
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ color: C.accentDeep, ...display }}
                >
                  {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Glass>
          );
        })}
      </div>
      <p className="px-2 text-[12.5px] leading-relaxed" style={{ color: C.faint }}>
        Documenten worden versleuteld bewaard en alleen na jouw expliciete toestemming gedeeld met
        een opdrachtgever.
      </p>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5">
      <Glass className="p-6" tint="soft">
        <Overline accent>Aandacht</Overline>
        <h1
          className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em]"
          style={display}
        >
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Gerangschikt naar urgentie — de bovenste laag eerst.
        </p>
      </Glass>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tc = warn ? C.amber : C.accentDeep;
          return (
            <Glass key={a.titel} className="p-5" lift tint="strong">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold text-white"
                  style={{
                    background: warn
                      ? `linear-gradient(140deg, #f59e0b, ${C.amber})`
                      : `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
                    ...display,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: tc }} />
                    ) : (
                      <Sparkle size={15} aria-hidden="true" style={{ color: tc }} />
                    )}
                    <h2 className="text-[16px] font-semibold leading-snug" style={display}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-2xl px-5 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: warn
                      ? `linear-gradient(140deg, #f59e0b, ${C.amber})`
                      : `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
                    ...display,
                  }}
                >
                  {a.cta}
                </button>
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

function factuurTone(status: string): "ok" | "warn" | "neutral" {
  if (status === "Betaald") return "ok";
  if (status === "Openstaand") return "warn";
  return "neutral";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <Glass className="flex flex-wrap items-end justify-between gap-4 p-6" tint="soft">
        <div>
          <Overline>Omzet</Overline>
          <h1
            className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[13.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(140deg, ${C.accent}, ${C.accentDeep})`,
            ...display,
          }}
        >
          <FileText size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </Glass>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", warn: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", warn: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", warn: false },
        ].map((s) => (
          <Glass key={s.l} className="p-5" lift>
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.warn ? C.amber : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </div>

      <Glass className="overflow-hidden" tint="strong">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 px-6 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.hair}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const tone = factuurTone(f.status);
            const tc = tone === "ok" ? "#0f9d6b" : tone === "warn" ? C.amber : C.muted;
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-white/40 sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderTop: `1px solid ${C.hair}` }}
              >
                <span className="order-1 text-[12.5px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{ background: `${tc}18`, color: tc }}
                  >
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: C.ink, ...display }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.hair}` }}
        >
          <span
            className="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[22px] font-semibold tabular-nums" style={display}>
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
