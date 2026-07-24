"use client";

// Concept 453 — "Aquarel" · Natte-in-natte waterverf-verlopen.
// Zachte waterverf-wassingen als achtergrondvlakken, organische bleed-randen (radial-gradients met
// onregelmatige zachte randen), pigment-vlekken achter KPI's. Kalm, luchtig, licht. Palet: koel
// water-blauw/turquoise/zacht perzik wassingen op warm-wit papier. Kaartranden ogen zacht en
// onregelmatig; geen harde lijnen — alles vloeit. Tekst staat altijd op heldere zones, contrast blijft.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Droplet,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: warm-wit papier + koele water-wassingen (blauw/turquoise/perzik) —
const C = {
  paper: "#fcfbf7",
  paperWarm: "#faf7f0",
  card: "#ffffff",
  ink: "#26333f",
  inkSoft: "#4c5b68",
  inkMute: "#7d8b96",
  inkFaint: "#a8b3bc",
  line: "rgba(120,160,180,0.22)",
  lineSoft: "rgba(120,160,180,0.14)",
  // wassingen
  aqua: "#2f8fb0",
  aquaDeep: "#1f6f8c",
  aquaHi: "#4fb0cc",
  aquaWash: "rgba(79,176,204,0.14)",
  teal: "#2fa89a",
  tealDeep: "#1c7c70",
  tealWash: "rgba(47,168,154,0.13)",
  peach: "#e79a72",
  peachDeep: "#c56f45",
  peachWash: "rgba(231,154,114,0.16)",
  // status
  ok: "#2f9e73",
  okInk: "#1c6b4d",
  okWash: "rgba(47,158,115,0.14)",
  warn: "#d79338",
  warnInk: "#9a6412",
  warnWash: "rgba(215,147,56,0.15)",
  bad: "#cf5f52",
  badInk: "#9a3b30",
  badWash: "rgba(207,95,82,0.14)",
};

const display = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Waterverf-grond: meerdere zachte radiale wassingen die in elkaar bloeden.
function washField(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage:
      "radial-gradient(60% 45% at 12% 8%, rgba(79,176,204,0.16) 0%, transparent 60%)," +
      "radial-gradient(55% 40% at 88% 12%, rgba(47,168,154,0.13) 0%, transparent 62%)," +
      "radial-gradient(70% 50% at 78% 92%, rgba(231,154,114,0.12) 0%, transparent 60%)," +
      "radial-gradient(50% 45% at 25% 88%, rgba(79,176,204,0.10) 0%, transparent 60%)",
  };
}

// Onregelmatige, zachte "bleed"-rand voor kaarten (border-radius met wisselende hoeken).
const bleedRadius = "22px 18px 24px 16px / 18px 24px 16px 22px";
const bleedRadiusAlt = "18px 24px 16px 22px / 24px 16px 22px 18px";

// — Pigment-vlek: een organische waterverf-blob achter KPI's / iconen —
function Pigment({
  tone,
  className = "",
  opacity = 1,
}: {
  tone: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        background: `radial-gradient(closest-side, ${tone} 0%, ${tone} 40%, transparent 78%)`,
        borderRadius: "42% 58% 63% 37% / 45% 38% 62% 55%",
        filter: "blur(3px)",
        opacity,
      }}
    />
  );
}

// — Aquarel-kaart: witte kaart met zachte bleed-rand en gewassen highlight —
function Wash({
  children,
  className = "",
  as: Tag = "div",
  tone,
  alt = false,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tone?: string;
  alt?: boolean;
  glow?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: glow
          ? `radial-gradient(120% 120% at 0% 0%, ${C.aquaWash} 0%, ${C.card} 55%)`
          : C.card,
        border: `1px solid ${C.line}`,
        borderRadius: alt ? bleedRadiusAlt : bleedRadius,
        boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 14px 32px -22px rgba(38,51,63,0.4)${tone ? `, 0 0 0 4px ${tone}` : ""}`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.aquaDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Droplet size={12} aria-hidden="true" />
      {children}
    </p>
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
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfbf7] active:translate-y-px ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${C.aquaHi}, ${C.aqua} 55%, ${C.aquaDeep})`,
        borderRadius: "14px 11px 13px 10px / 11px 13px 10px 14px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 8px 18px -8px rgba(47,143,176,0.6)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfbf7] ${className}`}
      style={{
        color: active ? C.aquaDeep : C.inkSoft,
        background: active ? C.aquaWash : C.card,
        border: `1px solid ${active ? C.aquaHi : C.line}`,
        borderRadius: "13px 10px 12px 11px / 10px 12px 11px 13px",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.okInk,
        wash: C.okWash,
        tone: C.ok,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: C.aquaDeep,
        wash: C.aquaWash,
        tone: C.aqua,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warnInk,
        wash: C.warnWash,
        tone: C.warn,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.badInk,
        wash: C.badWash,
        tone: C.bad,
      };
  }
}

// — Aquarel-sparkline: zachte lijn met gewassen pigment-vulling —
function WashLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
    return [x, y] as const;
  });
  let dPath = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    const [px, py] = pts[i - 1]!;
    const cx = (px + x) / 2;
    dPath += ` C ${cx.toFixed(1)} ${py.toFixed(1)} ${cx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
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
        <linearGradient id={`aq-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.3" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${dPath} L ${w} ${h} L 0 ${h} Z`} fill={`url(#aq-${id})`} stroke="none" />
      <path
        d={dPath}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.card} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

function Meter({ value, tone = C.aqua }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.aquaWash }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundImage: `linear-gradient(90deg, ${C.aquaDeep}, ${tone}, ${C.tealDeep})`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-semibold" style={{ color: C.aquaDeep, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept453() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...washField(C.paper) }}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${C.aquaHi}, ${C.tealDeep})`,
            borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
          }}
          aria-hidden="true"
        >
          <Droplet size={22} className="text-white" />
        </span>
        <div>
          <p
            className="text-[20px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Aquarel
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · natte wassingen
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            color: C.inkMute,
            borderRadius: "14px 11px 13px 10px / 11px 13px 10px 14px",
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.aqua, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-semibold text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${C.aquaHi}, ${C.aquaDeep})`,
            borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
            ...bodyFont,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto p-1.5"
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: "18px 15px 17px 14px / 15px 17px 14px 18px",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
              style={{
                color: on ? "#fff" : C.inkMute,
                backgroundImage: on
                  ? `linear-gradient(135deg, ${C.aquaHi}, ${C.aquaDeep})`
                  : "none",
                borderRadius: on ? "13px 10px 12px 11px / 10px 12px 11px 13px" : 10,
                ...bodyFont,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Wash className="overflow-hidden p-7 md:p-9" glow>
          <Pigment tone="rgba(79,176,204,0.28)" className="-left-10 -top-10 h-48 w-48" />
          <Pigment tone="rgba(47,168,154,0.22)" className="-bottom-12 right-8 h-40 w-40" />
          <div className="relative">
            <Eyebrow>Vandaag · gewassen</Eyebrow>
            <h1
              className="mt-4 text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
              style={{ color: C.ink, ...display }}
            >
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je praktijk als aquarel: laag over laag, kalm en helder. Elk certificaat
              verifieerbaar, elke opdracht op zijn plek. Loop je acties langs — dan vloeit de dag
              vanzelf.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
            </div>
          </div>
        </Wash>

        <Wash className="overflow-hidden p-7" alt>
          <Pigment tone="rgba(215,147,56,0.22)" className="-right-10 -top-10 h-40 w-40" />
          <div className="relative flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="relative mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="relative mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="relative mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="relative my-4 h-px" style={{ background: C.lineSoft }} />
          <p
            className="relative flex items-center gap-2 text-[12px]"
            style={{ color: C.inkMute, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Wash>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow tone={C.inkMute}>Wassingen · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tones = [C.aqua, C.teal, C.peach, C.aquaHi];
            const tint = [C.aquaWash, C.tealWash, C.peachWash, C.aquaWash][i % 4]!;
            const tone = tones[i % 4]!;
            return (
              <Wash key={k.label} className="overflow-hidden p-5" alt={i % 2 === 1}>
                <Pigment tone={tint} className="-right-6 -top-6 h-24 w-24" opacity={1} />
                <div className="relative flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      color: k.up ? C.okInk : C.warnInk,
                      background: k.up ? C.okWash : C.warnWash,
                      ...num,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="relative mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="relative mt-3">
                  <WashLine data={k.spark} tone={tone} id={`k453-${i}`} />
                </div>
              </Wash>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#1f6f8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfbf7]"
              style={{ color: C.aqua }}
            >
              Alle →
            </button>
          </div>
          <Wash className="overflow-hidden">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f3fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f8fb0]"
                  >
                    <span
                      className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden"
                      style={{
                        background: i === 0 ? C.aquaWash : C.paperWarm,
                        border: `1px solid ${i === 0 ? C.aquaHi : C.line}`,
                        borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.aquaDeep : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Meter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Wash>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow tone={C.inkMute}>Certificaten</Eyebrow>
          </div>
          <Wash className="p-5" alt>
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        color: st.ink,
                        borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Wash>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-5 py-3"
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: "16px 13px 15px 12px / 13px 15px 12px 16px",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a8b3bc]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Wash className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.aquaWash }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.lineSoft }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.aquaWash }} />
                  <div className="h-2 w-full rounded-full" style={{ background: C.aquaWash }} />
                </div>
              </Wash>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Wash className="overflow-hidden p-6" glow>
          <Pigment tone="rgba(79,176,204,0.2)" className="-left-8 -top-8 h-40 w-40" />
          <div className="relative flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{
                background: C.aquaWash,
                border: `1px solid ${C.aquaHi}`,
                color: C.aquaDeep,
                borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Schoon gewassen doek
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Wash>
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
  const tone = strong ? C.aqua : C.teal;
  const toneDeep = strong ? C.aquaDeep : C.tealDeep;
  return (
    <Wash className="overflow-hidden p-6" alt={index % 2 === 1}>
      <Pigment
        tone={strong ? "rgba(79,176,204,0.18)" : "rgba(47,168,154,0.15)"}
        className="-right-10 -top-10 h-40 w-40"
      />
      <div className="relative grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.paperWarm,
                  border: `1px solid ${C.lineSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="relative inline-flex h-16 w-16 flex-col items-center justify-center overflow-hidden"
            style={{
              background: strong ? C.aquaWash : C.tealWash,
              border: `1.5px solid ${tone}`,
              borderRadius: "52% 48% 55% 45% / 48% 52% 45% 55%",
            }}
          >
            <span
              className="text-[16px] font-bold leading-none"
              style={{ color: toneDeep, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: toneDeep, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{
            color: toneDeep,
            border: `1px solid ${C.line}`,
            borderRadius: "12px 9px 11px 10px / 9px 11px 10px 12px",
          }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Wash>
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
      className="p-4"
      style={{
        background: C.paperWarm,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: "14px 11px 13px 10px / 11px 13px 10px 14px",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8fb0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfbf7]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.card,
          borderRadius: "12px 9px 11px 10px / 9px 11px 10px 12px",
        }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Wash className="overflow-hidden p-7 md:p-9" glow>
        <Pigment tone="rgba(79,176,204,0.24)" className="-left-10 -top-10 h-52 w-52" />
        <Pigment tone="rgba(47,168,154,0.18)" className="-bottom-12 right-6 h-44 w-44" />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundImage: `linear-gradient(135deg, ${C.aquaHi}, ${C.aquaDeep})` }}
          >
            <Droplet size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Wash>

      <Wash className="overflow-hidden" alt>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Wash>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Wash className="overflow-hidden p-6" tone={C.okWash}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{
                  color: C.okInk,
                  background: C.okWash,
                  border: `1px solid ${C.ok}`,
                  borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
                }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk }}
              >
                Voor jou
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
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
          </Wash>
          <Wash className="overflow-hidden p-6" tone={C.warnWash} alt>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}`,
                  borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
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
          </Wash>
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
      <Wash className="overflow-hidden p-7 md:p-9" glow>
        <Pigment tone="rgba(79,176,204,0.24)" className="-left-10 -top-12 h-52 w-52" />
        <Pigment tone="rgba(47,168,154,0.18)" className="-bottom-10 right-24 h-44 w-44" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.aquaDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 flex-col items-center justify-center overflow-hidden"
            style={{
              background: C.card,
              border: `1.5px solid ${C.aquaHi}`,
              borderRadius: "52% 48% 55% 45% / 48% 52% 45% 55%",
            }}
          >
            <Pigment tone="rgba(79,176,204,0.25)" className="inset-0" />
            <span
              className="relative text-[26px] font-semibold leading-none"
              style={{ color: C.aquaDeep, ...num }}
            >
              {ratio}
            </span>
            <span
              className="relative mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Wash>

      <Wash className="overflow-hidden" alt>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f3fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f8fb0] sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        color: st.ink,
                        borderRadius: "50% 42% 55% 45% / 45% 55% 42% 55%",
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="p-4"
                        style={{
                          background: C.paperWarm,
                          border: `1px solid ${C.lineSoft}`,
                          borderRadius: "14px 11px 13px 10px / 11px 13px 10px 14px",
                        }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Wash>

      <div>
        <div className="mb-4">
          <Eyebrow tone={C.inkMute}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d, i) => {
            const st = statusMeta(d.status);
            return (
              <Wash key={d.naam} className="flex items-center gap-3 p-4" alt={i % 2 === 1}>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{
                    background: C.paperWarm,
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                    borderRadius: "14px 11px 13px 10px / 11px 13px 10px 14px",
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Wash>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const ink = warn ? C.warnInk : C.aquaDeep;
          const wash = warn ? C.warnWash : C.aquaWash;
          const tone = warn ? C.warn : C.aqua;
          return (
            <li key={a.titel}>
              <Wash className="overflow-hidden p-6" alt={i % 2 === 1}>
                <Pigment
                  tone={warn ? "rgba(215,147,56,0.16)" : "rgba(79,176,204,0.15)"}
                  className="-right-8 -top-8 h-32 w-32"
                />
                <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px] font-bold"
                    style={{
                      background: wash,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      borderRadius: "52% 48% 55% 45% / 48% 52% 45% 55%",
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}` }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Droplet size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
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
              </Wash>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.paperWarm, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
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
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            alarm: false,
            pig: "rgba(47,158,115,0.15)",
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            pig: "rgba(215,147,56,0.16)",
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            alarm: false,
            pig: "rgba(79,176,204,0.15)",
          },
        ].map((s, i) => (
          <Wash key={s.l} className="overflow-hidden p-6" alt={i % 2 === 1}>
            <Pigment tone={s.pig} className="-right-8 -top-8 h-32 w-32" />
            <div className="relative flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="relative mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="relative mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Wash>
        ))}
      </section>

      <Wash className="overflow-hidden">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f3fafc] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{ color: ft.ink, background: ft.wash, border: `1px solid ${ft.tone}` }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Wash>
    </div>
  );
}
