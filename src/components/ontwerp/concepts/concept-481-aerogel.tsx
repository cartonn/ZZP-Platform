"use client";

// Concept 481 — "Aerogel" · Ultra-light frosted glass. A near-white canvas with layered,
// semi-transparent matte-glass panels (backdrop-blur), soft pastel light leaks glowing behind the
// content, hairline white edges and depth from gently stacked translucent layers instead of hard
// shadows. The lightest, airiest concept — like frozen light. Restraint and elegance.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
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

// — Bevroren-licht palet: bijna-wit canvas, pastel lichtlekken, haarfijne witte randen —
const C = {
  ink: "#2b2f38",
  inkSoft: "#565d69",
  inkMute: "#828a97",
  inkFaint: "#a8afbb",
  line: "rgba(255,255,255,0.7)",
  hair: "rgba(43,47,56,0.08)",
  glass: "rgba(255,255,255,0.55)",
  glassStrong: "rgba(255,255,255,0.78)",
  glassSoft: "rgba(255,255,255,0.4)",

  sky: "#5b9dd9",
  skyText: "#2f6ba3",
  rose: "#e08aa8",
  roseText: "#b65a7c",
  mint: "#5fb89a",
  mintText: "#2f8a6c",
  lilac: "#9a8cd4",
  lilacText: "#6a5aae",
  amber: "#d6a35c",
  amberText: "#a06f24",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};

type Tone = { base: string; text: string };
const T = {
  sky: { base: C.sky, text: C.skyText } as Tone,
  rose: { base: C.rose, text: C.roseText } as Tone,
  mint: { base: C.mint, text: C.mintText } as Tone,
  lilac: { base: C.lilac, text: C.lilacText } as Tone,
  amber: { base: C.amber, text: C.amberText } as Tone,
};

function statusMeta(s: CredStatus): {
  tone: Tone;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { tone: T.mint, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { tone: T.sky, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { tone: T.amber, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { tone: T.rose, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Frosted-glass paneel: semi-transparant, backdrop-blur, haarfijne witte rand + zachte gloed —
function Glass({
  children,
  className = "",
  as: Tag = "div",
  level = 1,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "aside";
  level?: 0 | 1 | 2;
}) {
  const bg = level === 2 ? C.glassStrong : level === 1 ? C.glass : C.glassSoft;
  return (
    <Tag
      className={`rounded-3xl ${className}`}
      style={{
        background: bg,
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: `1px solid ${C.line}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -28px rgba(43,47,56,0.35), 0 2px 8px -4px rgba(43,47,56,0.08)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Chip({
  children,
  tone,
  Icon,
}: {
  children: React.ReactNode;
  tone: Tone;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: tone.text,
        background: "rgba(255,255,255,0.6)",
        border: `1px solid ${tone.base}33`,
        ...bodyFont,
      }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

function GhostButton({
  children,
  onClick,
  tone = T.sky,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: Tone;
  variant?: "solid" | "glass";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${tone.base} 0%, ${tone.text} 130%)`,
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: `0 8px 20px -10px ${tone.base}, 0 1px 0 rgba(255,255,255,0.4) inset`,
        }
      : {
          background: "rgba(255,255,255,0.55)",
          color: C.ink,
          border: `1px solid ${C.line}`,
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset",
        };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${pad} ${className}`}
      style={{
        ...styles,
        ...bodyFont,
        ["--tw-ring-color" as string]: `${tone.base}88`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const id = useMemo(() => `ag-${Math.random().toString(36).slice(2, 8)}`, []);
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.35" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="#fff" stroke={tone} strokeWidth="1.8" />
    </svg>
  );
}

// — Match-meter als dunne translucente donut —
function MatchDonut({ value, tone, size = 52 }: { value: number; tone: Tone; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(43,47,56,0.08)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.base}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute text-[12.5px] font-bold" style={{ color: tone.text, ...num }}>
        {value}
      </span>
    </span>
  );
}

function SectionHead({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[13px] font-bold tracking-[0.02em]" style={{ color: C.ink }}>
        {children}
      </h2>
      {sub && (
        <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Concept481() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...bodyFont,
        color: C.ink,
        backgroundColor: "#f4f7fb",
      }}
    >
      {/* Pastel lichtlekken achter het glas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(46% 40% at 12% 6%, rgba(154,140,212,0.30) 0%, rgba(154,140,212,0) 70%)",
            "radial-gradient(40% 36% at 92% 2%, rgba(91,157,217,0.28) 0%, rgba(91,157,217,0) 70%)",
            "radial-gradient(50% 44% at 80% 92%, rgba(224,138,168,0.22) 0%, rgba(224,138,168,0) 72%)",
            "radial-gradient(44% 40% at 4% 88%, rgba(95,184,154,0.22) 0%, rgba(95,184,154,0) 72%)",
          ].join(","),
        }}
      />
      <style>{`
        @keyframes agFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ag-fade { animation: agFade 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .ag-fade { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ag-fade pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: `1px solid ${C.line}`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 16px -8px rgba(91,157,217,0.5)",
            color: C.skyText,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          aria-hidden="true"
        >
          <Layers size={19} strokeWidth={1.9} />
        </span>
        <div>
          <p
            className="text-[17px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Aerogel
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.mintText,
            background: "rgba(255,255,255,0.6)",
            border: `1px solid ${C.mint}33`,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: `1px solid ${C.line}`,
            color: C.inkMute,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Search size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8.5px] font-bold text-white"
              style={{ background: C.rose, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: `1px solid ${C.line}`,
            color: C.lilacText,
            ...num,
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
    <nav aria-label="Hoofdnavigatie">
      <div
        className="flex items-stretch gap-1 overflow-x-auto rounded-2xl p-1.5"
        style={{
          background: "rgba(255,255,255,0.45)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset",
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
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              style={
                on
                  ? {
                      background: "rgba(255,255,255,0.9)",
                      color: C.skyText,
                      border: "1px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 4px 14px -8px rgba(43,47,56,0.4)",
                      ["--tw-ring-color" as string]: `${C.sky}88`,
                    }
                  : { color: C.inkSoft, ["--tw-ring-color" as string]: `${C.sky}88` }
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Glass level={2} className="relative overflow-hidden p-7 md:p-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(91,157,217,0.28) 0%, rgba(91,157,217,0) 70%)",
            }}
          />
          <p
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.skyText }}
          >
            <Sparkles size={13} aria-hidden="true" /> Goedemorgen
          </p>
          <h1
            className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[34px]"
            style={{ color: C.ink }}
          >
            Helder overzicht, {PROFIEL.naam.split(" ")[0]}
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je certificaten zijn in orde, er staan verse matches klaar en één ding vraagt vandaag je
            aandacht. Alles rustig en op een rij.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <GhostButton tone={T.sky} onClick={onActies}>
              Volgende actie <ArrowRight size={15} aria-hidden="true" />
            </GhostButton>
            <GhostButton variant="glass" onClick={onMarkt}>
              Naar marktplaats
            </GhostButton>
          </div>
          <div
            className="mt-6 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ borderColor: C.hair, color: C.inkMute }}
          >
            <BadgeCheck size={14} aria-hidden="true" style={{ color: C.mintText }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · {ratio}% compleet
          </div>
        </Glass>

        <Glass className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <Chip tone={T.amber} Icon={AlertTriangle}>
              Vraagt aandacht
            </Chip>
          </div>
          <h2 className="mt-3 text-[17px] font-semibold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <GhostButton tone={T.amber} onClick={onActies} className="w-full">
              {primair.cta} <ArrowRight size={15} aria-hidden="true" />
            </GhostButton>
          </div>
        </Glass>
      </section>

      <section>
        <SectionHead sub="Deze maand, live bijgewerkt">Jouw cijfers</SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [T.sky, T.mint, T.lilac, T.amber][i % 4] as Tone;
            return (
              <Glass key={k.label} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      color: k.up ? C.mintText : C.amberText,
                      background: "rgba(255,255,255,0.6)",
                      ...num,
                    }}
                  >
                    {k.up ? (
                      <TrendingUp size={11} aria-hidden="true" />
                    ) : (
                      <TrendingDown size={11} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5">
                  <Spark data={k.spark} tone={tone.base} />
                </div>
              </Glass>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead sub="Op basis van je geverifieerde profiel">Matches voor jou</SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.skyText, ["--tw-ring-color" as string]: `${C.sky}88` }}
            >
              Alles bekijken →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead sub="Veilig en privé bewaard">Certificaten</SectionHead>
          <Glass className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.65)",
                        color: m.tone.text,
                        border: `1px solid ${m.tone.base}33`,
                      }}
                      aria-hidden="true"
                    >
                      <m.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: m.alarm ? m.tone.text : C.inkMute }}
                      >
                        {m.label}
                      </span>
                    </span>
                    {m.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: m.tone.text }} />
                    )}
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

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const tone = opdracht.match >= 90 ? T.mint : T.sky;
  return (
    <Glass as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ ["--tw-ring-color" as string]: `${tone.base}88` }}
      >
        <MatchDonut value={opdracht.match} tone={tone} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold" style={{ color: C.ink }}>
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
            style={{ color: C.mintText }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Glass>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-[26px] font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          Marktplaats
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: `1px solid ${C.line}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink, ...bodyFont }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.inkMute, ["--tw-ring-color" as string]: `${C.sky}88` }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "glass"}
              tone={T.sky}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Glass className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/60 motion-reduce:animate-none" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/60 motion-reduce:animate-none" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/60 motion-reduce:animate-none" />
                  </div>
                </div>
              </Glass>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          tone={T.rose}
          Icon={AlertTriangle}
          titel="Kon opdrachten niet laden"
          tekst="Er ging iets mis bij het ophalen. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          tone={T.lilac}
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `"${q}"` : "je zoekterm"}. Probeer een ander woord.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.inkFaint, ["--tw-ring-color" as string]: `${C.sky}88` }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  tone,
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  tone: Tone;
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Glass className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.65)",
          color: tone.text,
          border: `1px solid ${tone.base}33`,
        }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <GhostButton tone={tone} onClick={onCta} className="mt-6">
        {cta} <ArrowRight size={15} aria-hidden="true" />
      </GhostButton>
    </Glass>
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
  const tone = strong ? T.mint : T.sky;
  return (
    <Glass as="article" className="p-5">
      <div className="flex items-start gap-4">
        <MatchDonut value={opdracht.match} tone={tone} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={tone} Icon={strong ? BadgeCheck : Sparkles}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[16.5px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.lilacText,
            background: "rgba(255,255,255,0.55)",
            border: `1px solid ${C.lilac}33`,
            ["--tw-ring-color" as string]: `${C.lilac}88`,
          }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <GhostButton tone={tone} onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </GhostButton>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={T.mint}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={T.amber}
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
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.5)", border: `1px solid ${tone.base}22` }}
    >
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: tone.text }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone.base }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? T.mint : T.sky;
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: Sparkles },
    { l: "Match", v: `${opdracht.match}%`, Icon: BadgeCheck },
  ];
  return (
    <div className="space-y-5">
      <GhostButton variant="glass" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </GhostButton>

      <Glass level={2} className="relative overflow-hidden p-7 md:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(circle, ${tone.base}44 0%, ${tone.base}00 70%)` }}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,0.6)", color: C.inkSoft, ...num }}
          >
            {opdracht.id}
          </span>
          <Chip tone={tone} Icon={BadgeCheck}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Chip>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[32px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: C.inkSoft }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <GhostButton tone={tone}>Reageer op opdracht</GhostButton>
          <GhostButton variant="glass">Bewaren</GhostButton>
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {feiten.map((m) => (
          <Glass key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "rgba(255,255,255,0.6)",
                color: tone.text,
                border: `1px solid ${tone.base}33`,
              }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[18px] font-semibold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </p>
          </Glass>
        ))}
      </div>

      <section>
        <SectionHead sub="Open en eerlijk afgezet tegen je geverifieerde profiel">
          Waarom deze match past
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.mintText }}
            >
              <Check size={14} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: C.mint }}
                    aria-hidden="true"
                  >
                    <Check size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
          <Glass className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.amberText }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: C.amber }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={12} />
                  </span>
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

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Glass level={2} className="relative overflow-hidden p-7 md:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(95,184,154,0.3) 0%, rgba(95,184,154,0) 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.mintText }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
            </p>
            <h1
              className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — op tijd te vernieuwen. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <span
              className="text-[28px] font-semibold leading-none"
              style={{ color: C.mintText, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute }}
            >
              % in orde
            </span>
          </span>
        </div>
        <div
          className="relative mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(43,47,56,0.08)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: C.mint,
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </Glass>

      <div>
        <SectionHead sub="Klik om details te tonen">Certificaten</SectionHead>
        <Glass className="overflow-hidden p-1.5">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = statusMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: `${C.mint}88` }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background: "rgba(255,255,255,0.65)",
                        color: m.tone.text,
                        border: `1px solid ${m.tone.base}33`,
                      }}
                      aria-hidden="true"
                    >
                      <m.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip tone={m.tone} Icon={m.Icon}>
                          {m.label}
                          {m.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 sm:pl-[72px]">
                        <div
                          className="rounded-2xl p-4"
                          style={{
                            background: "rgba(255,255,255,0.5)",
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <GhostButton
                              size="sm"
                              tone={
                                c.status === "EXPIRING"
                                  ? T.amber
                                  : c.status === "REJECTED"
                                    ? T.rose
                                    : T.mint
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </GhostButton>
                            <GhostButton size="sm" variant="glass">
                              Historie
                            </GhostButton>
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

      <div>
        <SectionHead sub="Standaard privé — jij bepaalt wie meekijkt">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const m = statusMeta(d.status);
            return (
              <Glass key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    color: C.inkSoft,
                    border: `1px solid ${C.line}`,
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
                <Chip tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Chip>
              </Glass>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-[26px] font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          Acties
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie. Één ding tegelijk — rustig van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? T.amber : T.sky;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Glass className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-[14px] font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.65)",
                      color: tone.text,
                      border: `1px solid ${tone.base}33`,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} Icon={warn ? AlertTriangle : Sparkles}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <GhostButton tone={tone} onClick={goMarkt ? onMarkt : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </GhostButton>
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

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): Tone {
  if (status === "Betaald") return T.mint;
  if (status === "Openstaand") return T.amber;
  return T.lilac;
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-[26px] font-semibold leading-tight tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Facturen
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            Overzicht van je verzonden en concept-facturen
          </p>
        </div>
        <GhostButton tone={T.sky}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </GhostButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.mint, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.amber, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.lilac, Icon: FileText },
        ].map((s) => (
          <Glass key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  color: s.tone.text,
                  border: `1px solid ${s.tone.base}33`,
                }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip tone={s.tone}>{s.l}</Chip>
            </div>
            <p
              className="mt-3 text-[24px] font-semibold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <GhostButton
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "glass"}
            tone={T.sky}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
        ))}
      </div>

      <Glass className="overflow-hidden">
        <ul>
          {rows.map((f, i) => {
            const tone = factuurTone(f.status);
            return (
              <li
                key={f.nr}
                className="flex items-center gap-4 p-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    color: tone.text,
                    border: `1px solid ${tone.base}33`,
                  }}
                  aria-hidden="true"
                >
                  <Wallet size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr} · {f.datum}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
                    {f.bedrag}
                  </span>
                  <Chip tone={tone}>{f.status}</Chip>
                </span>
              </li>
            );
          })}
        </ul>
      </Glass>
    </div>
  );
}
