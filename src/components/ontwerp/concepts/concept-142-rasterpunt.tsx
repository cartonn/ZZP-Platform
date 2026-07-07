"use client";

// Concept 142 — "Rasterpunt" · Ben-Day / halftone-punten als HÉT bouwmateriaal. Alles is opgebouwd
// uit drukkerspunten: meters, avatars, progressie, dichtheids-indicatoren en vlakken zijn stippen-
// rasters (CSS radial-gradient dot-patterns + SVG-cirkels). Pop-art/newsprint, maar strak en modern:
// twee-tint (inkt op papier) met één knalaccent. Onderscheidend van riso (offset-misregistratie) en
// strip (comic-panelen): hier is de STIP zélf de bouwsteen — een match-score is een puntenraster, geen
// balk. Licht papier (#f6f3ea) + inkt-accent (#e5322d). Deterministisch — geen random, geen Date.
// Fonts: Space Grotesk (display) + JetBrains Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Coins,
  CalendarDays,
  ShieldCheck,
  Receipt,
  CircleDot,
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

// ── Palet — inkt op papier, één knalaccent ──────────────────────────────────────
const C = {
  paper: "#f6f3ea",
  paperSoft: "#efe9db",
  card: "#fbf9f3",
  ink: "#171512", // hoofd-inkt (bijna zwart)
  inkSoft: "#4c463d",
  inkFaint: "#8a8272",
  line: "#171512",
  lineSoft: "#d9d1bf",
  accent: "#e5322d", // knal-inkt (rood)
  accentDeep: "#b71f1c",
  ok: "#0f7a4d", // tweede inkt voor "geverifieerd"
  paperDot: "rgba(23,21,18,0.10)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Halftone dot-raster als achtergrond-vlak (CSS radial-gradient).
function dotField(color: string, size = 10, dot = 1.6): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

// ── Status-model — nooit kleur alleen ───────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.ink };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.accent };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.accent };
  }
}

function matchTone(m: number): string {
  return m >= 90 ? C.ok : m >= 80 ? C.ink : C.accent;
}

// ── Punten-meter — een score is een raster van gevulde/lege stippen (5×N) ───────
function DotMeter({
  value,
  tone,
  cols = 10,
  rows = 2,
  gap = 6,
  r = 3.4,
}: {
  value: number; // 0..100
  tone: string;
  cols?: number;
  rows?: number;
  gap?: number;
  r?: number;
}) {
  const total = cols * rows;
  const filled = Math.round((value / 100) * total);
  const w = cols * gap;
  const h = rows * gap;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ maxWidth: cols * 9 }}
      role="img"
      aria-label={`${value} procent`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const on = i < filled;
        return (
          <circle
            key={i}
            cx={col * gap + gap / 2}
            cy={row * gap + gap / 2}
            r={on ? r : r * 0.62}
            fill={on ? tone : "transparent"}
            stroke={on ? "none" : C.inkFaint}
            strokeWidth={0.8}
          />
        );
      })}
    </svg>
  );
}

// Ronde punten-badge (avatar) — initialen op een dot-veld.
function DotAvatar({ initials, tone = C.ink }: { initials: string; tone?: string }) {
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
      style={{ border: `1.5px solid ${C.ink}`, color: tone, ...dotField(C.paperDot, 6, 1.1) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// Halftone-schijf: dichtheid = waarde (grote punt in het midden, uitdovend). Voor match-score groot.
function HalftoneDisc({ value, tone }: { value: number; tone: string }) {
  // Ring van punten; aandeel gevuld ~ value.
  const dots = 24;
  const filled = Math.round((value / 100) * dots);
  const cx = 40;
  const cy = 40;
  const rad = 30;
  return (
    <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
      <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
        {Array.from({ length: dots }).map((_, i) => {
          const ang = (i / dots) * Math.PI * 2 - Math.PI / 2;
          const on = i < filled;
          return (
            <circle
              key={i}
              cx={cx + Math.cos(ang) * rad}
              cy={cy + Math.sin(ang) * rad}
              r={on ? 3.2 : 1.6}
              fill={on ? tone : C.inkFaint}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={17} fill="none" stroke={C.ink} strokeWidth={1.2} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[18px] font-bold tabular-nums leading-none"
          style={{ ...mono, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7.5px] font-bold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </div>
    </div>
  );
}

// Sparkline als punten-reeks.
function DotSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * 96 + 2;
        const y = 30 - ((v - min) / span) * 26;
        const last = i === data.length - 1;
        return <circle key={i} cx={x} cy={y} r={last ? 3.2 : 2.2} fill={last ? C.accent : tone} />;
      })}
    </svg>
  );
}

// ── Kaart met dun inkt-kader ────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${accent ? C.accent : C.ink}`,
        boxShadow: `3px 3px 0 ${accent ? `${C.accent}33` : "rgba(23,21,18,0.14)"}`,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ ...mono, color: C.inkFaint }}
    >
      {children}
    </span>
  );
}

// Statuschip — label + icoon + vorm.
function Chip({
  tone,
  Icon,
  children,
}: {
  tone: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ border: `1.5px solid ${tone}`, color: tone, background: `${tone}12` }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {children}
    </span>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────
export function Concept142() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...display, background: C.paper, color: C.ink, ...dotField(C.paperDot, 22, 1.3) }}
    >
      <div className="mx-auto max-w-[1140px] px-4 py-5 md:px-8 md:py-8">
        {/* Kop — masthead met punten-avatar */}
        <header
          className="flex flex-wrap items-center justify-between gap-4 pb-5"
          style={{ borderBottom: `2px solid ${C.ink}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: C.accent, border: `1.5px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <CircleDot size={20} strokeWidth={2.4} style={{ color: C.paper }} />
            </span>
            <div className="leading-none">
              <div className="text-[18px] font-bold tracking-[-0.02em]">Rasterpunt</div>
              <div className="mt-1.5 text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                {PROFIEL.naam} · {PROFIEL.rol}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip tone={C.ok} Icon={ShieldCheck}>
              {PROFIEL.trust}
            </Chip>
            <DotAvatar initials={PROFIEL.initialen} />
          </div>
        </header>

        {/* Scherm-selector */}
        <nav className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Schermen">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-md px-3.5 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: on ? C.paper : C.ink,
                  background: on ? C.ink : "transparent",
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

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

// ── Dashboard ───────────────────────────────────────────────────────────────────
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const urgent = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-4">
      {/* Urgente actie — accent-kaart */}
      <Card
        accent
        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ background: C.accent, ...dotField("rgba(255,255,255,0.22)", 6, 1.1) }}
            aria-hidden="true"
          >
            <AlertTriangle size={22} strokeWidth={2.4} style={{ color: C.paper }} />
          </span>
          <div className="min-w-0">
            <Label>Volgende beste actie</Label>
            <h2 className="mt-1 text-[18px] font-bold leading-tight" style={{ color: C.ink }}>
              {urgent.titel}
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
              {urgent.detail}
            </p>
          </div>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.paper, border: `1.5px solid ${C.ink}` }}
        >
          {urgent.cta} <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Card>

      {/* KPI-raster */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <Label>{k.label}</Label>
            <div
              className="mt-1.5 text-[24px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <DotSpark data={k.spark} tone={C.ink} />
            </div>
            <div
              className="mt-1 text-[11px] font-bold tabular-nums"
              style={{ ...mono, color: k.up ? C.ok : C.accent }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top-match met halftone-schijf */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Label>Beste match voor jou</Label>
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 rounded text-[12px] font-bold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.accent }}
            >
              Bekijk <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-5">
            <HalftoneDisc value={top.match} tone={matchTone(top.match)} />
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold" style={{ color: C.ink }}>
                {top.titel}
              </h3>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {top.redenen.plus.slice(0, 3).map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={14}
                      strokeWidth={2.6}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ok }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Verificatie-dekking als punten-meter */}
        <Card className="p-5">
          <Label>Verificatie-dekking</Label>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-[34px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: dek >= 80 ? C.ok : C.accent }}
            >
              {dek}%
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint }}>
              {verified}/{CREDENTIALS.length}
            </span>
          </div>
          <div className="mt-3">
            <DotMeter value={dek} tone={dek >= 80 ? C.ok : C.accent} cols={12} rows={3} />
          </div>
          <ul className="mt-4 space-y-2">
            {CREDENTIALS.slice(0, 3).map((c) => {
              const m = credMeta(c.status);
              return (
                <li key={c.naam} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="truncate" style={{ color: C.inkSoft }}>
                    {c.naam}
                  </span>
                  <m.Icon
                    size={13}
                    strokeWidth={2.6}
                    style={{ color: m.tone }}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Marktplaats</h2>
          <Label>{filtered.length} opdrachten</Label>
        </div>
        <label
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{ background: C.card, border: `1.5px solid ${C.ink}` }}
        >
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <Search size={22} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[15px] font-bold">Geen opdrachten gevonden</p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Geen resultaat voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-md px-4 py-2 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.paper }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const tone = matchTone(o.match);
            return (
              <Card key={o.id} className="flex flex-col p-4">
                <div className="flex items-start gap-4">
                  <HalftoneDisc value={o.match} tone={tone} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15.5px] font-bold leading-tight" style={{ color: C.ink }}>
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ border: `1.5px solid ${C.lineSoft}`, color: C.inkSoft }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  className="mt-3 flex flex-wrap gap-x-3 gap-y-1"
                  style={{ borderTop: `1.5px dotted ${C.lineSoft}`, paddingTop: 10 }}
                >
                  {o.redenen.plus.slice(0, 2).map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 text-[11.5px]"
                      style={{ color: C.ok }}
                    >
                      <Check size={12} strokeWidth={2.8} aria-hidden="true" /> {r}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {o.tarief}
                  </span>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ background: C.ink, color: C.paper }}
                  >
                    Bekijk <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const tone = matchTone(opdracht.match);
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded text-[12px] font-bold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label>{opdracht.id}</Label>
              <Chip tone={tone} Icon={CircleDot}>
                Match {opdracht.match}%
              </Chip>
            </div>
            <h1 className="mt-2.5 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[30px]">
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13.5px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <DotMeter value={opdracht.match} tone={tone} cols={10} rows={4} r={3.6} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {opdracht.match}% match
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Card key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </div>
            <div className="mt-1.5">
              <Label>{m.l}</Label>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Check size={15} strokeWidth={2.8} style={{ color: C.ok }} aria-hidden="true" />
            <Label>Waarom dit past</Label>
          </div>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ok }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card accent className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={15}
              strokeWidth={2.8}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            <Label>Aandachtspunten</Label>
          </div>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13.5px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.paper, border: `1.5px solid ${C.ink}` }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-[13.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1.5px solid ${C.ink}`, color: C.ink, background: C.card }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: C.accent }} aria-hidden="true" />
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">Verificatie &amp; certificaten</h2>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>Vertrouwensniveau</Label>
            <div className="mt-1 text-[15px] font-bold" style={{ color: C.ok }}>
              {PROFIEL.trust} · {pct}% dekking
            </div>
            <div className="mt-2.5">
              <DotMeter value={pct} tone={pct >= 80 ? C.ok : C.accent} cols={16} rows={2} />
            </div>
          </div>
          <div className="flex gap-5">
            {(["VERIFIED", "SUBMITTED", "EXPIRING"] as CredStatus[]).map((st) => {
              const n = CREDENTIALS.filter((c) => c.status === st).length;
              const m = credMeta(st);
              return (
                <div key={st} className="text-center">
                  <div
                    className="text-[22px] font-bold tabular-nums"
                    style={{ ...mono, color: m.tone }}
                  >
                    {n}
                  </div>
                  <div className="text-[10px]" style={{ color: C.inkFaint }}>
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card
              key={c.naam}
              accent={c.status === "EXPIRING" || c.status === "REJECTED"}
              className="p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    border: `1.5px solid ${m.tone}`,
                    color: m.tone,
                    background: `${m.tone}12`,
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={18} strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Chip tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Chip>
                <button
                  disabled={!actionable}
                  className="rounded-md px-3.5 py-2 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    actionable
                      ? { background: C.accent, color: C.paper, border: `1.5px solid ${C.ink}` }
                      : {
                          background: "transparent",
                          color: C.inkFaint,
                          border: `1.5px solid ${C.lineSoft}`,
                        }
                  }
                >
                  {actionable ? "Behandelen" : "Compleet"}
                </button>
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CircleDot size={16} style={{ color: C.accent }} aria-hidden="true" />
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">Volgende beste acties</h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card accent={warn} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    border: `1.5px solid ${C.ink}`,
                    color: warn ? C.accent : C.ink,
                    background: C.card,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Chip tone={warn ? C.accent : C.ink} Icon={warn ? AlertTriangle : CircleDot}>
                      {warn ? "Urgent" : "Kans"}
                    </Chip>
                  </div>
                  <h3 className="mt-2 text-[15.5px] font-bold" style={{ color: C.ink }}>
                    {a.titel}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-md px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{
                    background: warn ? C.accent : C.ink,
                    color: C.paper,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  {a.cta}
                </button>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tone: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: C.ok, Icon: Check };
    if (status === "Openstaand") return { tone: C.accent, Icon: Clock };
    return { tone: C.inkFaint, Icon: Receipt };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={16} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.paper }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", tone: C.ok },
          { l: "Openstaand", v: `${open}`, tone: C.accent },
          { l: "Te factureren", v: "€ 1.350", tone: C.ink },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <Label>{s.l}</Label>
            <div
              className="mt-1.5 text-[22px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const m = meta(f.status);
              return (
                <tr key={f.nr} style={{ borderBottom: `1.5px dotted ${C.lineSoft}` }}>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={m.tone} Icon={m.Icon}>
                      {f.status}
                    </Chip>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[14px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
