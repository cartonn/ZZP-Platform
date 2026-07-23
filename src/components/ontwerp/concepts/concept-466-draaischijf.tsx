"use client";

// Concept 466 — "Draaischijf" · Kiesschijf / draaitafel-esthetiek. Premium warm-grijs #e8e4dd met een tactiele
// amber-wijzer #d17b34 over ronde bedieningselementen: arc-dials voor match en vertrouwen, knop-ringen met
// tick-markeringen, een radiaal command-element. Rond en gecentreerd i.p.v. rechthoekig, mechanisch en warm.
// Sans-serif zetwerk, monospace voor getallen. Alle beweging respecteert prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  RotateCw,
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

// — Palet: premium warm-grijs + amber-wijzer —
const C = {
  bg: "#e8e4dd",
  bgDeep: "#ded9d0",
  panel: "#f4f1ec",
  panelSoft: "#ece8e1",
  dial: "#332e28",
  dialSoft: "#413b33",
  ink: "#2b2724",
  inkSoft: "#5a544d",
  inkMute: "#8a8279",
  inkFaint: "#b0a89d",
  line: "#d6cfc4",
  lineSoft: "#e2ddd3",
  amber: "#d17b34",
  amberHi: "#e0913f",
  amberSoft: "#f3e2cf",
  ok: "#4f7a52",
  okSoft: "#dde9dc",
  warn: "#b5761f",
  warnSoft: "#f0e6cf",
  bad: "#c0554a",
  badSoft: "#f2dcd8",
  info: "#5b7a8c",
  infoSoft: "#dde7ec",
};

const sans = {
  fontFamily: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, 'SFMono-Regular', Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// — Arc-dial: cirkelvormige meter met wijzer en tick-markeringen —
function DialGauge({
  value,
  size = 92,
  tone = C.amber,
  label,
}: {
  value: number;
  size?: number;
  tone?: string;
  label?: string;
}) {
  const c = size / 2;
  const r = c - size * 0.11;
  const start = 135;
  const sweep = 270;
  const frac = Math.max(0, Math.min(100, value)) / 100;
  const toXY = (deg: number, rad: number) => {
    const a = (Math.PI / 180) * deg;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)] as const;
  };
  const arcPath = (fromDeg: number, toDeg: number, rad: number) => {
    const [x1, y1] = toXY(fromDeg, rad);
    const [x2, y2] = toXY(toDeg, rad);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rad} ${rad} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const ticks = Array.from({ length: 11 }).map((_, i) => start + (sweep / 10) * i);
  const pointerDeg = start + sweep * frac;
  const [px, py] = toXY(pointerDeg, r - size * 0.08);
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={c - 1} fill={C.dial} />
        <circle cx={c} cy={c} r={r + size * 0.05} fill="none" stroke={C.dialSoft} strokeWidth="1" />
        {ticks.map((t, i) => {
          const [ox, oy] = toXY(t, r + size * 0.02);
          const [ix, iy] = toXY(t, r - size * 0.03);
          return (
            <line
              key={i}
              x1={ix}
              y1={iy}
              x2={ox}
              y2={oy}
              stroke={i % 5 === 0 ? tone : "#6a6259"}
              strokeWidth={i % 5 === 0 ? 1.6 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <path
          d={arcPath(start, start + sweep, r)}
          fill="none"
          stroke="#524a41"
          strokeWidth={size * 0.05}
          strokeLinecap="round"
        />
        <path
          d={arcPath(start, pointerDeg, r)}
          fill="none"
          stroke={tone}
          strokeWidth={size * 0.05}
          strokeLinecap="round"
        />
        <line
          x1={c}
          y1={c}
          x2={px}
          y2={py}
          stroke={tone}
          strokeWidth={size * 0.035}
          strokeLinecap="round"
        />
        <circle cx={c} cy={c} r={size * 0.07} fill={tone} />
        <circle cx={c} cy={c} r={size * 0.03} fill={C.dial} />
      </svg>
      <span
        className="absolute flex flex-col items-center"
        style={{ transform: `translateY(${size * 0.13}px)` }}
      >
        <span
          className="font-bold leading-none text-white"
          style={{ fontSize: size * 0.24, ...num }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 font-semibold uppercase tracking-[0.14em]"
            style={{ fontSize: size * 0.08, color: C.inkFaint, ...sans }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.ok, soft: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.info, soft: C.infoSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warn,
        soft: C.warnSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.bad, soft: C.badSoft };
  }
}

// — Paneel: zacht afgerond, warme grond —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone = "panel",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tone?: "panel" | "dial";
}) {
  const dark = tone === "dial";
  return (
    <Tag
      className={`relative rounded-3xl ${className}`}
      style={{
        background: dark ? "linear-gradient(160deg, #413b33, #2b2724)" : C.panel,
        border: `1px solid ${dark ? "#4a433a" : C.line}`,
        boxShadow: dark
          ? "0 10px 30px rgba(43,39,36,0.28)"
          : "0 1px 2px rgba(43,39,36,0.03), 0 8px 22px rgba(43,39,36,0.06)",
        color: dark ? "#f4f1ec" : C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...sans }}
    >
      <RotateCw size={12} aria-hidden="true" />
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
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4dd] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${C.amberHi}, ${C.amber})`,
        boxShadow: "0 2px 8px rgba(209,123,52,0.32)",
        ...sans,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8e4dd] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.ink,
        background: active ? C.ink : C.panelSoft,
        border: `1px solid ${active ? C.ink : C.line}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline in dial-stijl —
function DialLine({ data, tone = C.amber, id }: { data: number[]; tone?: string; id: string }) {
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
        <linearGradient id={`dl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#dl-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={C.panel} stroke={tone} strokeWidth="1.8" />
    </svg>
  );
}

export function Concept466() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ background: C.bg, color: C.ink, ...sans }}
    >
      <style>{`
        @keyframes dialRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .dial-rise { animation: dialRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes dialSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .dial-spin { animation: dialSpin 24s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dial-rise { animation: none !important; }
          .dial-spin { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="dial-rise pt-7">
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
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(160deg, #413b33, #2b2724)",
            border: `1px solid ${C.amber}`,
          }}
          aria-hidden="true"
        >
          <span className="dial-spin">
            <RotateCw size={22} style={{ color: C.amberHi }} />
          </span>
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none" style={{ color: C.ink }}>
            Draaischijf
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · afgestemd
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.ok, border: `1px solid ${C.ok}`, background: C.okSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.amber, ...num }}
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, color: C.amber }}
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
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.dial, border: `1px solid ${C.dialSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34] focus-visible:ring-offset-2 focus-visible:ring-offset-[#332e28] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.inkFaint,
                backgroundImage: on ? `linear-gradient(135deg, ${C.amberHi}, ${C.amber})` : "none",
              }}
            >
              {on && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-white"
                  aria-hidden="true"
                />
              )}
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
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="relative overflow-hidden p-7 md:p-9" tone="dial">
          <span
            className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]"
            aria-hidden="true"
          >
            <span className="dial-spin block">
              <DialGauge value={matchAvg} size={190} tone={C.amberHi} />
            </span>
          </span>
          <div className="relative">
            <Kicker tone={C.amberHi}>Vandaag · afgestemd</Kicker>
            <h1 className="mt-4 text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] text-white md:text-[44px]">
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: "#d3ccc0" }}>
              Draai naar wat telt. Je praktijk als een fijngestelde schijf: match, verificatie en
              facturen staan precies op de juiste stand.
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
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34] focus-visible:ring-offset-2 focus-visible:ring-offset-[#332e28]"
                style={{ border: "1px solid #4a433a" }}
              >
                Marktplaats
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="p-7">
          <div className="flex items-center justify-between">
            <Kicker tone={C.warn}>Vraagt aandacht</Kicker>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2 className="mt-4 text-[20px] font-semibold leading-snug" style={{ color: C.ink }}>
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
          <div
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ borderColor: C.lineSoft, color: C.inkMute, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </div>
        </Panel>
      </section>

      <section>
        <Kicker>Kengetallen · deze maand</Kicker>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? C.okSoft : C.warnSoft,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <DialLine data={k.spark} tone={k.up ? C.amber : C.warn} id={`k456-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Kicker>Open opdrachten</Kicker>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#b56420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34]"
              style={{ color: C.amber }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#ece8e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d17b34] motion-reduce:transition-none"
                  >
                    <DialGauge value={o.match} size={48} tone={o.match >= 90 ? C.amber : C.info} />
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
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <Kicker>Certificaten</Kicker>
          <Panel className="mt-4 p-5">
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
                      style={{ background: st.soft, color: st.ink }}
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
          </Panel>
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
        <Kicker>Marktplaats</Kicker>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
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
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b0a89d]"
            style={{ color: C.ink, ...sans }}
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
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.lineSoft }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.line }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.lineSoft }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <DialGauge value={0} size={72} tone={C.inkFaint} />
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink }}>
              Schijf op nul
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en draai
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Panel className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-semibold leading-snug" style={{ color: C.ink }}>
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
                style={{ color: C.inkSoft, background: C.panelSoft, ...sans }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <DialGauge
            value={opdracht.match}
            size={62}
            tone={strong ? C.amber : C.info}
            label="match"
          />
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34]"
          style={{ color: C.amber, border: `1px solid ${C.line}`, ...sans }}
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
            <RedenBlok
              titel="Voor jou"
              tone={C.ok}
              soft={C.okSoft}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warn}
              soft={C.warnSoft}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  tone,
  soft,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  soft: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: soft }}>
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
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#ece8e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34]"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.panel, ...sans }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="relative overflow-hidden p-7 md:p-9" tone="dial">
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkFaint, border: "1px solid #4a433a", ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${C.amberHi}, ${C.amber})`,
                  ...sans,
                }}
              >
                <RotateCw size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"}
              </span>
            </div>
            <h1 className="mt-4 max-w-xl text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] text-white md:text-[40px]">
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: "#d3ccc0" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17b34] focus-visible:ring-offset-2 focus-visible:ring-offset-[#332e28]"
                style={{ border: "1px solid #4a433a" }}
              >
                Bewaren
              </button>
            </div>
          </div>
          <DialGauge value={opdracht.match} size={110} tone={C.amberHi} label="match" />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
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
      </Panel>

      <section>
        <Kicker>Verklaarbare matching</Kicker>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <RedenPaneel
            titel="Voor jou"
            tone={C.ok}
            soft={C.okSoft}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenPaneel
            titel="Let op"
            tone={C.warn}
            soft={C.warnSoft}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </section>
    </div>
  );
}

function RedenPaneel({
  titel,
  tone,
  soft,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  soft: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <Panel className="p-6">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
          style={{ color: tone, background: soft }}
          aria-hidden="true"
        >
          <Icon size={15} />
        </span>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: tone }}
        >
          {titel}
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-3 text-[13.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="relative overflow-hidden p-7 md:p-9" tone="dial">
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Kicker tone={C.amberHi}>Verificatie · veilig bewaard</Kicker>
            <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em] text-white">
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: "#d3ccc0" }}>
              <span className="font-semibold" style={{ color: C.amberHi }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <DialGauge value={ratio} size={112} tone={C.amberHi} label="op orde" />
        </div>
      </Panel>

      <Panel>
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#ece8e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d17b34] motion-reduce:transition-none sm:grid-cols-[1fr_12rem_2rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: st.soft, color: st.ink }}
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
                      style={{ color: st.ink, background: st.soft, ...sans }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
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
                        className="rounded-2xl p-4"
                        style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
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
      </Panel>

      <div>
        <Kicker>Documentenkast</Kicker>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: C.panelSoft, color: C.inkSoft }}
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
                  style={{ color: st.ink, background: st.soft }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Panel>
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
        <Kicker>Acties · op volgorde van urgentie</Kicker>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, precies afgestemd.
        </p>
      </div>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.amber;
          const soft = warn ? C.warnSoft : C.amberSoft;
          return (
            <li key={a.titel}>
              <Panel className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{ background: soft, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: tone, background: soft, ...sans }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <RotateCw size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink }}
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
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; soft: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.ok, soft: C.okSoft, Icon: Check };
  return { ink: C.inkMute, soft: C.panelSoft, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Facturen</Kicker>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
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
          <Panel key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnSoft, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#ece8e1] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                    style={{ color: ft.ink, background: ft.soft, ...sans }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warn : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.line}` }}
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
      </Panel>
    </div>
  );
}
