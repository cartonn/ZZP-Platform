"use client";

// Concept 460 — "Gips" · Sculpturaal museum-wit reliëf.
// Monochroom museaal wit/albast: alles als gegoten gips-sculptuur — zacht embossed/deboss reliëf
// (dubbele schaduw, licht boven-links + donker onder-rechts) voor uitstekende en ingedrukte vlakken,
// sculpturale typografie en één diepe schaduw. Rustig, tijdloos, galerij-achtig. Bijna geen kleur —
// wit-op-wit reliëf met een minimaal steen-grijs accent. Tactiel en verfijnd. Animaties respecteren
// prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
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

// — Palet: albast/gips-wit, één diepe schaduw, minimaal steen-grijs accent —
const C = {
  // gips-oppervlak
  plaster: "#e8e4db",
  plasterDeep: "#e2ddd2",
  plasterLight: "#efece4",
  chalk: "#f3f0e9",
  // reliëf-schaduwen
  glow: "#fbf9f3", // licht (boven-links)
  shade: "rgba(150,142,126,0.55)", // donker (onder-rechts)
  shadeSoft: "rgba(150,142,126,0.35)",
  // accent — steen-grijs
  stone: "#6c665b",
  stoneDeep: "#544f46",
  stoneInk: "#4a463e",
  stoneWash: "rgba(108,102,91,0.10)",
  // inkt
  ink: "#413d36",
  inkSoft: "#666055",
  inkMute: "#8a8377",
  inkFaint: "#a8a294",
  line: "rgba(120,112,98,0.20)",
  lineSoft: "rgba(120,112,98,0.11)",
  // status (gedempt, museaal getint)
  ok: "#6f8461",
  okInk: "#4d5f41",
  okWash: "rgba(111,132,97,0.14)",
  warn: "#b1863f",
  warnInk: "#7f5c22",
  warnWash: "rgba(177,134,63,0.16)",
  info: "#5b7488",
  infoInk: "#3f556a",
  infoWash: "rgba(91,116,136,0.14)",
  bad: "#a2584d",
  badInk: "#7c3d32",
  badWash: "rgba(162,88,77,0.14)",
};

const display = {
  fontFamily: "'Cormorant Garamond', 'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, serif",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Reliëf-schaduwen — uitstekend (raised) en ingedrukt (deboss).
const RAISE = "-6px -6px 13px " + C.glow + ", 7px 7px 16px " + C.shade;
const RAISE_SM = "-3px -3px 7px " + C.glow + ", 4px 4px 9px " + C.shadeSoft;
const DEBOSS = "inset -3px -3px 7px " + C.glow + ", inset 4px 4px 9px " + C.shade;
const DEBOSS_SM = "inset -2px -2px 5px " + C.glow + ", inset 3px 3px 6px " + C.shadeSoft;

function plasterBg(): React.CSSProperties {
  return {
    backgroundColor: C.plaster,
    backgroundImage:
      "radial-gradient(120% 80% at 50% -20%, rgba(251,249,243,0.7), transparent 60%)," +
      "radial-gradient(90% 60% at 100% 110%, rgba(150,142,126,0.06), transparent 55%)",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Reliëf-paneel: uitstekend gips-vlak met dubbele schaduw —
function Relief({
  children,
  className = "",
  as: Tag = "div",
  variant = "raise",
  radius = 20,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  variant?: "raise" | "flat" | "deboss";
  radius?: number;
}) {
  const shadow = variant === "raise" ? RAISE : variant === "deboss" ? DEBOSS : "none";
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: variant === "deboss" ? C.plasterDeep : C.plasterLight,
        borderRadius: radius,
        boxShadow: shadow,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color: C.inkMute, ...bodyFont }}
    >
      <span
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ background: C.stone, boxShadow: DEBOSS_SM }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function Chip({
  children,
  ink,
  alarm = false,
}: {
  children: React.ReactNode;
  ink: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: C.plasterDeep, boxShadow: DEBOSS_SM, ...bodyFont }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4db] active:shadow-[inset_-2px_-2px_5px_#fbf9f3,inset_3px_3px_6px_rgba(150,142,126,0.55)] motion-reduce:transition-none ${className}`}
      style={{
        color: C.chalk,
        background: `linear-gradient(145deg, ${C.stone}, ${C.stoneDeep})`,
        boxShadow: RAISE_SM,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4db] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.stoneInk : C.inkSoft,
        background: C.plasterLight,
        boxShadow: active ? DEBOSS_SM : RAISE_SM,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Gegoten medaillon: een uitstekende gips-schijf met ingedrukte cijferring —
function Medallion({ size = 128, value, label }: { size?: number; value: string; label: string }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: C.plasterLight, boxShadow: RAISE }}
      aria-hidden="true"
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: size * 0.74,
          height: size * 0.74,
          background: C.plasterDeep,
          boxShadow: DEBOSS,
        }}
      >
        <span className="flex flex-col items-center">
          <span
            className="leading-none"
            style={{ color: C.stoneInk, fontSize: size * 0.24, fontWeight: 600, ...display }}
          >
            {value}
          </span>
          <span
            className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            {label}
          </span>
        </span>
      </span>
    </span>
  );
}

// — Sculpturale sparkline (gegraveerde lijn) —
function ChiselLine({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
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
      {/* onderste lichte lijn geeft gegraveerd reliëf-effect */}
      <polyline
        points={pts.map(([x, y]) => `${x.toFixed(1)},${(y + 1.2).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={C.glow}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={line}
        fill="none"
        stroke={C.stone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.4"
        fill={C.plasterLight}
        stroke={C.stone}
        strokeWidth="1.6"
      />
    </svg>
  );
}

// — Ingedrukte reliëf-meter —
function ReliefMeter({ value }: { value: number }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.stone}, ${C.stoneDeep})`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: C.stoneInk, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept460() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...plasterBg() }}
    >
      <style>{`
        @keyframes gipsRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .gips-rise { animation: gipsRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes gipsPress { 0%,100% { box-shadow: -6px -6px 13px ${C.glow}, 7px 7px 16px ${C.shade}; } 50% { box-shadow: -3px -3px 7px ${C.glow}, 4px 4px 9px ${C.shadeSoft}; } }
        .gips-breathe { animation: gipsPress 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gips-rise { animation: none !important; }
          .gips-breathe { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="gips-rise pt-7">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: C.plasterLight, boxShadow: RAISE_SM, color: C.stone }}
          aria-hidden="true"
        >
          <span
            className="h-4 w-4 rounded-full"
            style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
          />
        </span>
        <div>
          <p
            className="text-[22px] font-semibold leading-none"
            style={{ color: C.stoneInk, ...display }}
          >
            Gips
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · reliëf van rust
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, background: C.plasterDeep, boxShadow: DEBOSS_SM, ...bodyFont }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.plasterLight, boxShadow: RAISE_SM, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.stone, color: C.chalk, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{
            background: C.plasterLight,
            boxShadow: RAISE_SM,
            color: C.stoneInk,
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
        className="flex items-center gap-1.5 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.plasterDeep, boxShadow: DEBOSS }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e2ddd2] motion-reduce:transition-none"
              style={{
                color: on ? C.stoneInk : C.inkMute,
                background: on ? C.plasterLight : "transparent",
                boxShadow: on ? RAISE_SM : "none",
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
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Relief className="p-7 md:p-9" variant="raise" radius={26}>
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <Eyebrow>Vandaag · in reliëf</Eyebrow>
              <h1
                className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.01em] md:text-[46px]"
                style={{ color: C.stoneInk, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Als een gegoten reliëf: alleen wat telt komt naar voren, de rest zinkt rustig weg.
                Jouw volgende stap staat in het licht.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <PrimaryButton onClick={onActies}>
                  Volgende actie
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PrimaryButton>
                <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
              </div>
            </div>
            <span className="gips-breathe rounded-full">
              <Medallion size={148} value={`${ratio}%`} label="op orde" />
            </span>
          </div>
        </Relief>

        <Relief className="p-7" variant="raise" radius={22}>
          <div className="flex items-center justify-between">
            <Eyebrow>Vraagt aandacht</Eyebrow>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.warnWash, color: C.warnInk, boxShadow: DEBOSS_SM }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2
            className="mt-4 text-[22px] font-semibold leading-snug"
            style={{ color: C.stoneInk, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Relief>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <Eyebrow>Baan · deze maand</Eyebrow>
          <span className="h-px flex-1" style={{ background: C.lineSoft }} aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Relief key={k.label} className="p-5" variant="raise" radius={18}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: C.plasterDeep,
                    boxShadow: DEBOSS_SM,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.stoneInk, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <ChiselLine data={k.spark} />
              </div>
            </Relief>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4db]"
              style={{ color: C.stone, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Relief className="overflow-hidden" variant="raise" radius={20}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#efece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6c665b] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                    >
                      <span
                        className="text-[13px] font-semibold leading-none"
                        style={{ color: o.match >= 90 ? C.stoneInk : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
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
                      <ReliefMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Relief>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Relief className="p-5" variant="raise" radius={20}>
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: st.wash, color: st.ink, boxShadow: DEBOSS_SM }}
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
          </Relief>
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
          className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.stoneInk, ...display }}
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
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.plasterDeep, boxShadow: DEBOSS }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a8a294]"
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
              <Relief className="p-6" variant="raise" radius={20}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div
                    className="h-3 w-24 rounded-full"
                    style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                  />
                  <div
                    className="h-5 w-2/3 rounded-full"
                    style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                  />
                  <div
                    className="h-3 w-1/2 rounded-full"
                    style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                  />
                  <div
                    className="h-2.5 w-full rounded-full"
                    style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                  />
                </div>
              </Relief>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Relief className="p-6" variant="raise" radius={22}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.plasterDeep, color: C.stone, boxShadow: DEBOSS }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[24px] font-semibold" style={{ color: C.stoneInk, ...display }}>
              Een lege sokkel
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en de galerij
              vult zich weer.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Relief>
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
  return (
    <Relief className="p-6" variant="raise" radius={22}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, background: C.plasterDeep, boxShadow: DEBOSS_SM, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[21px] font-semibold leading-snug"
            style={{ color: C.stoneInk, ...display }}
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
                  background: C.plasterLight,
                  boxShadow: RAISE_SM,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Medallion size={78} value={`${opdracht.match}`} label="match" />
          <span className="text-[13px] font-bold" style={{ color: C.stoneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efece4]"
          style={{
            color: C.stoneInk,
            background: C.plasterLight,
            boxShadow: open ? DEBOSS_SM : RAISE_SM,
            ...bodyFont,
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
      {strong && <span className="sr-only">Sterke match</span>}
    </Relief>
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
    <div className="rounded-[16px] p-4" style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyFont }}
      >
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
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c665b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4db]"
        style={{ color: C.inkSoft, background: C.plasterLight, boxShadow: RAISE_SM, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Relief className="p-7 md:p-9" variant="raise" radius={26}>
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkMute,
                  background: C.plasterDeep,
                  boxShadow: DEBOSS_SM,
                  ...num,
                }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{
                  color: C.stoneInk,
                  background: C.plasterDeep,
                  boxShadow: DEBOSS_SM,
                  ...bodyFont,
                }}
              >
                <span
                  className="inline-block h-[7px] w-[7px] rounded-full"
                  style={{ background: C.stone }}
                  aria-hidden="true"
                />
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
              style={{ color: C.stoneInk, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <Medallion size={132} value={`${opdracht.match}%`} label="match" />
        </div>
      </Relief>

      <Relief className="overflow-hidden" variant="raise" radius={22}>
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
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.stoneInk, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Relief>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Relief className="p-6" variant="raise" radius={20}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.okInk, background: C.okWash, boxShadow: DEBOSS_SM }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...bodyFont }}
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
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Relief>
          <Relief className="p-6" variant="deboss" radius={20}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.warnInk, background: C.warnWash, boxShadow: DEBOSS_SM }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...bodyFont }}
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
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Relief>
        </div>
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: C.stone, ...bodyFont }}>
            Match {opdracht.match}% —{" "}
            {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
          </span>
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
      <Relief className="p-7 md:p-9" variant="raise" radius={26}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.stoneInk, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.stoneInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <ReliefMeter value={ratio} />
            </div>
          </div>
          <Medallion size={108} value={`${ratio}%`} label="op orde" />
        </div>
      </Relief>

      <Relief className="overflow-hidden" variant="raise" radius={22}>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...bodyFont }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#efece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6c665b] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: st.wash, color: st.ink, boxShadow: DEBOSS_SM }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
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
                    <Chip ink={st.ink} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
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
                        className="rounded-[16px] p-4"
                        style={{ background: C.plasterDeep, boxShadow: DEBOSS_SM }}
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
      </Relief>

      <div>
        <div className="mb-4">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Relief
                key={d.naam}
                className="flex items-center gap-3 p-4"
                variant="raise"
                radius={16}
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: C.plasterDeep, color: C.inkSoft, boxShadow: DEBOSS_SM }}
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
                  style={{ color: st.ink, background: C.plasterDeep, boxShadow: DEBOSS_SM }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Relief>
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
          className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.stoneInk, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Reliëf na reliëf van boven naar beneden — zo blijf je verifieerbaar en betaald, op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const ink = warn ? C.warnInk : C.stoneInk;
          const wash = warn ? C.warnWash : C.stoneWash;
          const focus = i === 0;
          return (
            <li key={a.titel}>
              <Relief className="p-6" variant={focus ? "raise" : "flat"} radius={20}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{ background: wash, color: ink, boxShadow: DEBOSS_SM, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, boxShadow: DEBOSS_SM, ...bodyFont }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <span
                          className="inline-block h-[7px] w-[7px] rounded-full"
                          style={{ background: ink }}
                          aria-hidden="true"
                        />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[21px] font-semibold leading-snug"
                      style={{ color: C.stoneInk, ...display }}
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
              </Relief>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurStatus(status: string): { ink: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.warnInk, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, Icon: Check };
  return { ink: C.inkMute, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.stoneInk, ...display }}
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Relief key={s.l} className="p-6" variant={s.alarm ? "deboss" : "raise"} radius={20}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk, boxShadow: DEBOSS_SM }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.stoneInk, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Relief>
        ))}
      </section>

      <Relief className="overflow-hidden" variant="raise" radius={22}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyFont }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurStatus(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#efece4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                  style={{ color: C.ink, ...bodyFont }}
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
                    style={{
                      color: ft.ink,
                      background: C.plasterDeep,
                      boxShadow: DEBOSS_SM,
                      ...bodyFont,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.stoneInk, ...num }}
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
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.stoneInk, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Relief>
    </div>
  );
}
