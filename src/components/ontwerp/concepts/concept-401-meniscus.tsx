"use client";

// Concept 401 — "Meniscus" · Liquid Glass — dynamische specular refractie (licht).
// Apple's Liquid-Glass-taal (2026), smaakvol toegepast: heldere glaspanelen met een
// specular highlight-rand langs de bovenrand, zachte lensvervorming-accenten en
// licht-op-licht diepte. Leesbaarheid gaat ALTIJD vóór het effect — content staat op
// solide leesvlakken binnen het glas. Palet: bg #eef2f8, fg #0f1a2e, accent #3b82f6,
// glas = witte semi-transparante lagen + backdrop-blur, koele highlights.
// Fonts-gevoel: Geist + Geist Mono (systeem-fallback, geen import nodig).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
  Sparkles,
  Layers,
  Compass,
  FileText,
  Receipt,
  Droplets,
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

// — Palet: koel licht, blauw accent, glas via witte semi-transparante lagen —
const C = {
  bg: "#eef2f8",
  bgDeep: "#e2e9f5",
  bgHi: "#f6f9fe",
  fg: "#0f1a2e",
  fgSoft: "#33415c",
  fgMute: "#64748b",
  fgFaint: "#94a3b8",
  accent: "#3b82f6",
  accentDeep: "#2563eb",
  accentSoft: "#dbeafe",
  accentEdge: "rgba(37,99,235,0.35)",
  glass: "rgba(255,255,255,0.62)",
  glassSolid: "rgba(255,255,255,0.9)",
  glassEdge: "rgba(255,255,255,0.9)",
  glassLine: "rgba(15,26,46,0.08)",
  glassLineSoft: "rgba(15,26,46,0.05)",
  specular: "rgba(255,255,255,0.95)",
  ok: "#16a34a",
  okBg: "rgba(22,163,74,0.12)",
  okEdge: "rgba(22,163,74,0.4)",
  warn: "#d97706",
  warnBg: "rgba(217,119,6,0.13)",
  warnEdge: "rgba(217,119,6,0.42)",
  info: "#2563eb",
  infoBg: "rgba(37,99,235,0.12)",
  infoEdge: "rgba(37,99,235,0.38)",
  bad: "#dc2626",
  badBg: "rgba(220,38,38,0.12)",
  badEdge: "rgba(220,38,38,0.4)",
};

const sans = {
  fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const mono = {
  fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  bg: string;
  edge: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        bg: C.okBg,
        edge: C.okEdge,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        bg: C.infoBg,
        edge: C.infoEdge,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        bg: C.warnBg,
        edge: C.warnEdge,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        bg: C.badBg,
        edge: C.badEdge,
      };
  }
}

// — Glaspaneel: helder, backdrop-blur, specular highlight-rand langs de bovenrand —
function Glass({
  children,
  className = "",
  solid = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: solid ? C.glassSolid : C.glass,
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: `1px solid ${C.glassLine}`,
        boxShadow:
          "0 1px 0 0 rgba(255,255,255,0.85) inset, 0 12px 34px -14px rgba(15,26,46,0.28), 0 2px 8px -4px rgba(15,26,46,0.14)",
      }}
    >
      {/* specular highlight-rand langs de bovenrand */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${C.specular} 20%, ${C.specular} 80%, transparent)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 -top-10 h-24 w-40 rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.7), transparent 70%)",
          filter: "blur(6px)",
        }}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}

// — Zachte lens-glow achtergrondaccent, puur decoratief —
function LensGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="absolute -right-16 top-32 h-80 w-80 rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(129,140,248,0.14), transparent 65%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.12), transparent 65%)",
          filter: "blur(24px)",
        }}
      />
    </div>
  );
}

function Eyebrow({ children, tone = C.accentDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: tone, ...sans }}
    >
      <Droplets size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Pill({
  children,
  tone,
  bg,
  edge,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  bg: string;
  edge: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: tone, background: bg, border: `1px solid ${edge}`, ...sans }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f8] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 18px -8px rgba(37,99,235,0.7)",
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function GlassButton({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-semibold transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f8] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.accentDeep : C.fgSoft,
        background: active ? C.accentSoft : C.glassSolid,
        border: `1px solid ${active ? C.accentEdge : C.glassLine}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline met vloeiende curve en glas-vulling —
function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#sp-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="#fff" stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.accent : C.info;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.bgDeep }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12px] font-bold tabular-nums" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

const NAV_META: Record<ScreenKey, LucideIcon> = {
  dashboard: Layers,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: Bell,
  acties: Sparkles,
};

export function Concept401() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      <LensGlow />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 8px 18px -8px rgba(37,99,235,0.7)",
          }}
          aria-hidden="true"
        >
          <Droplets size={20} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.fg }}
          >
            Meniscus
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.fgMute, ...mono }}>
            {PROFIEL.plaats} · liquid workspace
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.ok, background: C.okBg, border: `1px solid ${C.okEdge}` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: C.glassSolid, border: `1px solid ${C.glassLine}`, color: C.fgMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.accent, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.fg }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.fgMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[12.5px] font-semibold"
          style={{
            background: C.glassSolid,
            border: `1px solid ${C.glassLine}`,
            color: C.accentDeep,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <Glass className="p-1.5" solid>
        <div className="flex items-center gap-1 overflow-x-auto">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_META[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-1 focus-visible:ring-offset-white motion-reduce:transition-none"
                style={{
                  color: on ? "#fff" : C.fgSoft,
                  background: on
                    ? `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`
                    : "transparent",
                  boxShadow: on
                    ? "0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 14px -8px rgba(37,99,235,0.7)"
                    : "none",
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </div>
      </Glass>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Glass className="p-6 md:p-7">
          <Eyebrow>Overzicht · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[38px]"
            style={{ color: C.fg }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            Alles wat aandacht vraagt drijft rustig naar boven; de rest blijft helder op de
            achtergrond. Doorzichtig, kalm, en altijd leesbaar.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GlassButton onClick={onOpen}>Marktplaats</GlassButton>
          </div>
        </Glass>

        <Glass className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warn}>Vraagt aandacht</Eyebrow>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.warnBg, color: C.warn }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2 className="mt-4 text-[19px] font-semibold leading-snug" style={{ color: C.fg }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <p
            className="mt-4 border-t pt-3 text-[11.5px]"
            style={{ borderColor: C.glassLine, color: C.fgMute, ...mono }}
          >
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Glass>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>Kerncijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Glass key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.fgMute }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? C.okBg : C.warnBg,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ color: C.fg }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
              </div>
            </Glass>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Beste matches</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f8]"
              style={{ color: C.accentDeep }}
            >
              Alles →
            </button>
          </div>
          <Glass>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li
                  key={o.id}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glassLineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563eb] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-[12px] font-bold tabular-nums"
                      style={{
                        background: i === 0 ? C.accentSoft : C.bgDeep,
                        color: i === 0 ? C.accentDeep : C.info,
                        border: `1px solid ${i === 0 ? C.accentEdge : C.glassLine}`,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.fgMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.fgFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Glass>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Glass className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glassLineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: st.tone, background: st.bg, border: `1px solid ${st.edge}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.fgMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && <span className="sr-only">let op</span>}
                  </li>
                );
              })}
            </ul>
          </Glass>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.fg }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.fgMute, ...mono }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} zichtbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Glass className="flex-1" solid>
          <div className="flex items-center gap-2.5 px-3.5 py-3">
            <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#94a3b8]"
              style={{ color: C.fg }}
            />
          </div>
        </Glass>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GlassButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </GlassButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Glass>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: C.accentSoft,
                color: C.accentDeep,
                border: `1px solid ${C.accentEdge}`,
              }}
              aria-hidden="true"
            >
              <Compass size={26} />
            </span>
            <p className="mt-5 text-[18px] font-semibold" style={{ color: C.fg }}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer te
              ontdekken.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Glass>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.accent : C.info;
  return (
    <Glass className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.fgMute, background: C.bgDeep, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.fgMute, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-semibold leading-snug" style={{ color: C.fg }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.fgSoft,
                  background: C.glassSolid,
                  border: `1px solid ${C.glassLine}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft, border: `1px solid ${C.accentEdge}` }}
          >
            <span
              className="text-[16px] font-bold tabular-nums leading-none"
              style={{ color: tone, ...mono }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.1em]"
              style={{ color: C.fgMute }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: C.fg, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-semibold transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f8]"
          style={{ color: C.accentDeep, border: `1px solid ${C.glassLine}` }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Sterke punten"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.glassSolid, border: `1px solid ${C.glassLineSoft}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: tone }}>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.fgSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.accent : C.info;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12px] font-semibold transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f8]"
        style={{ color: C.fgSoft, background: C.glassSolid, border: `1px solid ${C.glassLine}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.fgMute, background: C.bgDeep, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ color: tone, background: C.accentSoft, border: `1px solid ${C.accentEdge}` }}
          >
            <Sparkles size={11} aria-hidden="true" /> {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]"
          style={{ color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.fgMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GlassButton>Bewaren</GlassButton>
        </div>
      </Glass>

      <Glass>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.glassLineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.glassLineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.fgMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tabular-nums tracking-[-0.01em]"
                style={{ color: C.fg, ...mono }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Transparant afgeleid van je geverifieerde profiel — wat sterk staat én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.ok, background: C.okBg, border: `1px solid ${C.okEdge}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.ok }}
              >
                Sterke punten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
          <Glass className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.warn, background: C.warnBg, border: `1px solid ${C.warnEdge}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.warn }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Glass className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: C.fg }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-semibold" style={{ color: C.fg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.accentSoft, border: `1px solid ${C.accentEdge}` }}
          >
            <span
              className="text-[26px] font-bold tabular-nums leading-none"
              style={{ color: C.accentDeep, ...mono }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.fgMute }}
            >
              % gereed
            </span>
          </span>
        </div>
      </Glass>

      <Glass>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.glassLineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.fgMute }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.glassLineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563eb] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
                      style={{ color: st.tone, background: st.bg, border: `1px solid ${st.edge}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.fgMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Pill tone={st.tone} bg={st.bg} edge={st.edge} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Pill>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.fgFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="rounded-2xl p-4"
                        style={{ background: C.glassSolid, border: `1px solid ${C.glassLineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GlassButton>Historie</GlassButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Glass>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Volgende acties</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.fg }}
        >
          Wat nu telt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.fgSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const bg = warn ? C.warnBg : C.infoBg;
          const edge = warn ? C.warnEdge : C.infoEdge;
          return (
            <li key={a.titel}>
              <Glass className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums"
                    style={{ background: bg, border: `1px solid ${edge}`, color: tone, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Pill tone={tone} bg={bg} edge={edge} alarm={warn}>
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkles size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </Pill>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
                      style={{ color: C.fg }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  tone: string;
  bg: string;
  edge: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { tone: C.warn, bg: C.warnBg, edge: C.warnEdge, Icon: AlertTriangle };
  if (status === "Betaald") return { tone: C.ok, bg: C.okBg, edge: C.okEdge, Icon: Check };
  return { tone: C.fgMute, bg: C.bgDeep, edge: C.glassLine, Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Grootboek</Eyebrow>
          <h1
            className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.fg }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.info, alarm: false },
        ].map((s) => (
          <Glass key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.fgMute }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnBg, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.fg, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.glassLineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.fgMute }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/70 sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glassLineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold tabular-nums"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-semibold sm:order-2"
                  style={{ color: C.fg }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Pill tone={ft.tone} bg={ft.bg} edge={ft.edge} alarm={acc}>
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </Pill>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.fg, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.glassLineSoft}` }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.fgMute }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-semibold tabular-nums" style={{ color: C.fg, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
