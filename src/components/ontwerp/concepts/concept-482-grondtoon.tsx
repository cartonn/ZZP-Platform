"use client";

// Concept 482 — "Grondtoon" · Refined neo-brutalism. A heavy oatmeal / unbleached-paper canvas,
// thick true-black hairline rules and frames (1.5–2px), oversized tabular numerals as imagery,
// monospace labels in caps with letter-spacing, and one warm ochre accent. Brutalist but strict and
// legible — no chaos, plenty of character. A grid with hard dividing lines.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Square,
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

// — Ongebleekt papier + echt zwart + één warme oker-accent —
const C = {
  paper: "#e9e3d5",
  paperDeep: "#e2dbc9",
  card: "#f4efe4",
  ink: "#161512",
  inkSoft: "#3b382f",
  inkMute: "#6b6656",
  line: "#161512",
  hair: "rgba(22,21,18,0.16)",

  ochre: "#c6771f",
  ochreDeep: "#a35e12",
  ochreSoft: "#f0d9b8",

  moss: "#4f6b2f",
  mossSoft: "#dce4c8",
  clay: "#a63a1e",
  claySoft: "#f0cfc2",
  slate: "#3f4a52",
  slateSoft: "#d5dce0",
};

const bodyFont = {
  fontFamily: "'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif",
};
const mono = {
  fontFamily: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
};
const num = {
  fontFamily: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

type Tone = { base: string; soft: string };
const T = {
  ochre: { base: C.ochre, soft: C.ochreSoft } as Tone,
  moss: { base: C.moss, soft: C.mossSoft } as Tone,
  clay: { base: C.clay, soft: C.claySoft } as Tone,
  slate: { base: C.slate, soft: C.slateSoft } as Tone,
};

function statusMeta(s: CredStatus): {
  tone: Tone;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { tone: T.moss, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { tone: T.slate, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { tone: T.ochre, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { tone: T.clay, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Brutalist frame: dik zwart kader, geen radius, harde platte schaduw —
function Frame({
  children,
  className = "",
  as: Comp = "div",
  hard = false,
  bg = C.card,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "aside";
  hard?: boolean;
  bg?: string;
}) {
  return (
    <Comp
      className={className}
      style={{
        background: bg,
        border: `2px solid ${C.line}`,
        boxShadow: hard ? `5px 5px 0 ${C.line}` : "none",
        color: C.ink,
      }}
    >
      {children}
    </Comp>
  );
}

// — Monospace kapitaal-label met letter-spacing —
function Label({
  children,
  className = "",
  color = C.inkMute,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={`text-[10.5px] font-semibold uppercase ${className}`}
      style={{ ...mono, letterSpacing: "0.16em", color }}
    >
      {children}
    </span>
  );
}

function Tag({
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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase"
      style={{
        background: tone.soft,
        color: C.ink,
        border: `1.5px solid ${C.line}`,
        ...mono,
        letterSpacing: "0.1em",
      }}
    >
      {Icon && <Icon size={11} aria-hidden="true" strokeWidth={2.4} />}
      {children}
    </span>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[11.5px]" : "px-4 py-2.5 text-[12.5px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: C.ink, color: C.paper, border: `2px solid ${C.line}` }
      : { background: C.card, color: C.ink, border: `2px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`inline-flex items-center justify-center gap-2 font-semibold uppercase transition-all duration-100 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#161512] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6771f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e3d5] ${pad} ${className}`}
      style={{ ...styles, ...mono, letterSpacing: "0.06em" }}
    >
      {children}
    </button>
  );
}

// — Sparkline als harde staafjes (brutalist bar chart) —
function Bars({ data, active }: { data: number[]; active: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 20 + ((d - min) / span) * 12;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            style={{
              height: `${h}px`,
              width: "6px",
              background: last ? active : C.ink,
              border: `1px solid ${C.line}`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Concept482() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...bodyFont,
        color: C.ink,
        backgroundColor: C.paper,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(22,21,18,0.05) 31px, rgba(22,21,18,0.05) 32px)",
      }}
    >
      <style>{`
        @keyframes gtIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .gt-in { animation: gtIn 0.32s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .gt-in { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="gt-in pt-6">
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
    <header
      className="flex items-center justify-between gap-4 border-b-2 py-5"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{ background: C.ink, color: C.paper, border: `2px solid ${C.line}` }}
          aria-hidden="true"
        >
          <span className="text-[18px] font-bold" style={{ ...mono }}>
            G
          </span>
        </span>
        <div>
          <p
            className="text-[18px] font-bold uppercase leading-none tracking-[0.04em]"
            style={{ ...mono, color: C.ink }}
          >
            Grondtoon
          </p>
          <p className="mt-1.5" style={{ ...mono, letterSpacing: "0.12em" }}>
            <Label>
              {PROFIEL.rol} · {PROFIEL.plaats}
            </Label>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 sm:inline-flex"
          style={{ background: C.mossSoft, border: `1.5px solid ${C.line}` }}
        >
          <ShieldCheck size={12} aria-hidden="true" strokeWidth={2.4} />
          <Label color={C.ink}>{PROFIEL.trust}</Label>
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ background: C.card, border: `2px solid ${C.line}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Search size={16} aria-hidden="true" strokeWidth={2.2} />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-bold"
              style={{ background: C.ochre, color: C.ink, border: `1.5px solid ${C.line}`, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
          style={{ background: C.ochreSoft, color: C.ink, border: `2px solid ${C.line}`, ...num }}
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
    <nav aria-label="Hoofdnavigatie" className="border-b-2 py-3" style={{ borderColor: C.line }}>
      <div className="flex items-stretch gap-0 overflow-x-auto">
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[11.5px] font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6771f]"
              style={{
                ...mono,
                letterSpacing: "0.08em",
                background: on ? C.ink : "transparent",
                color: on ? C.paper : C.inkSoft,
                borderLeft: i === 0 ? `2px solid ${C.line}` : "none",
                borderRight: `2px solid ${C.line}`,
                borderTop: `2px solid ${C.line}`,
                borderBottom: `2px solid ${C.line}`,
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
        <Frame hard className="relative overflow-hidden p-7 md:p-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-8 select-none text-[150px] font-bold leading-none"
            style={{ ...num, color: C.ochreSoft }}
          >
            {ratio}
          </span>
          <Label>Goedemorgen · {PROFIEL.plaats}</Label>
          <h1
            className="mt-3 max-w-md text-[30px] font-bold leading-[1.05] tracking-[-0.01em] md:text-[38px]"
            style={{ color: C.ink }}
          >
            Overzicht, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Certificaten in orde, verse matches klaar, één punt vraagt vandaag actie. Geen ruis —
            alleen wat telt.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Btn onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" strokeWidth={2.4} />
            </Btn>
            <Btn variant="outline" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>
          <div
            className="mt-6 flex items-center gap-2 border-t-2 pt-4"
            style={{ borderColor: C.hair }}
          >
            <ShieldCheck size={14} aria-hidden="true" strokeWidth={2.4} style={{ color: C.moss }} />
            <Label color={C.inkSoft}>
              {verified}/{CREDENTIALS.length} geverifieerd — {ratio}% compleet
            </Label>
          </div>
        </Frame>

        <Frame className="flex flex-col p-6" bg={C.ochreSoft}>
          <Tag tone={T.ochre} Icon={AlertTriangle}>
            Vraagt aandacht
          </Tag>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <Btn onClick={onActies} className="w-full">
              {primair.cta} <ArrowRight size={14} aria-hidden="true" strokeWidth={2.4} />
            </Btn>
          </div>
        </Frame>
      </section>

      <section>
        <SectionHead nr="01">Cijfers · deze maand</SectionHead>
        <Frame className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [T.ochre, T.moss, T.slate, T.clay][i % 4] as Tone;
            return (
              <div
                key={k.label}
                className="p-5"
                style={{
                  borderRight: i < KPIS.length - 1 ? `2px solid ${C.line}` : "none",
                  borderBottom: `2px solid ${C.line}`,
                }}
              >
                <Label>{k.label}</Label>
                <p
                  className="mt-2 text-[30px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <Bars data={k.spark} active={tone.base} />
                  <span
                    className="px-1.5 py-0.5 text-[10.5px] font-bold"
                    style={{ background: tone.soft, border: `1.5px solid ${C.line}`, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
              </div>
            );
          })}
        </Frame>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead nr="02">Matches</SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="text-[11px] font-semibold uppercase underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6771f]"
              style={{ ...mono, letterSpacing: "0.08em", color: C.ochreDeep }}
            >
              Alles →
            </button>
          </div>
          <Frame className="overflow-hidden">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `2px solid ${C.line}` }}>
                  <OpdrachtRow opdracht={o} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          </Frame>
        </div>

        <div>
          <SectionHead nr="03">Certificaten</SectionHead>
          <Frame className="overflow-hidden">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 p-3.5"
                    style={{ borderTop: i === 0 ? "none" : `2px solid ${C.line}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center"
                      style={{ background: m.tone.soft, border: `1.5px solid ${C.line}` }}
                      aria-hidden="true"
                    >
                      <m.Icon size={15} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <Label color={m.alarm ? C.ochreDeep : C.inkMute}>{m.label}</Label>
                    </span>
                    {m.alarm && (
                      <AlertTriangle
                        size={14}
                        aria-hidden="true"
                        strokeWidth={2.4}
                        style={{ color: C.ochreDeep }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Frame>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ children, nr }: { children: React.ReactNode; nr: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5">
      <span
        className="px-1.5 py-0.5 text-[11px] font-bold"
        style={{ background: C.ink, color: C.paper, ...num }}
      >
        {nr}
      </span>
      <span
        className="text-[13px] font-bold uppercase"
        style={{ ...mono, letterSpacing: "0.1em", color: C.ink }}
      >
        {children}
      </span>
    </h2>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#ece6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6771f]"
    >
      <span
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center"
        style={{ background: strong ? C.mossSoft : C.slateSoft, border: `2px solid ${C.line}` }}
        aria-hidden="true"
      >
        <span className="text-[18px] font-bold leading-none" style={{ ...num, color: C.ink }}>
          {opdracht.match}
        </span>
        <span
          className="text-[8px] font-bold uppercase"
          style={{ ...mono, letterSpacing: "0.1em", color: C.inkMute }}
        >
          match
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold" style={{ color: C.ink }}>
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
          style={{ color: C.inkMute }}
        >
          <MapPin size={12} aria-hidden="true" strokeWidth={2.2} /> {opdracht.opdrachtgever} ·{" "}
          {opdracht.plaats}
        </span>
        <span
          className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
          style={{ color: C.moss }}
        >
          <Check size={13} aria-hidden="true" strokeWidth={2.6} /> {opdracht.redenen.plus[0]}
        </span>
      </span>
      <span className="shrink-0 text-[14px] font-bold" style={{ color: C.ink, ...num }}>
        {opdracht.tarief.replace(" / uur", "")}
      </span>
    </button>
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
      <div
        className="flex flex-wrap items-end justify-between gap-3 border-b-2 pb-4"
        style={{ borderColor: C.line }}
      >
        <div>
          <h1
            className="text-[28px] font-bold uppercase leading-none tracking-[0.02em]"
            style={{ ...mono, color: C.ink }}
          >
            Marktplaats
          </h1>
          <p className="mt-2">
            <Label>
              {filtered.length} / {OPDRACHTEN.length} opdrachten passen bij je profiel
            </Label>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: C.card, border: `2px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" strokeWidth={2.2} style={{ color: C.inkMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK OP TITEL, PLAATS, OPDRACHTGEVER…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12px] uppercase outline-none placeholder:text-[#8a8574]"
            style={{ ...mono, letterSpacing: "0.06em", color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#e2dbc9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6771f]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" strokeWidth={2.4} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-0" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6771f]"
              style={{
                ...mono,
                letterSpacing: "0.06em",
                background: sort === s ? C.ink : C.card,
                color: sort === s ? C.paper : C.ink,
                border: `2px solid ${C.line}`,
                borderLeft: i === 0 ? `2px solid ${C.line}` : "none",
              }}
            >
              <ArrowUpDown size={12} aria-hidden="true" strokeWidth={2.4} />
              {s === "match" ? "Match" : "Tarief"}
            </button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Frame className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 shrink-0 animate-pulse motion-reduce:animate-none"
                    style={{ background: C.paperDeep, border: `2px solid ${C.line}` }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse motion-reduce:animate-none"
                      style={{ background: C.paperDeep }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                      style={{ background: C.paperDeep }}
                    />
                  </div>
                </div>
              </Frame>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="Kon opdrachten niet laden"
          tekst="Er ging iets mis bij het ophalen. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `"${q}"` : "je zoekterm"}. Probeer een ander woord.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
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
            className="text-[10px] font-semibold uppercase underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6771f]"
            style={{ ...mono, letterSpacing: "0.1em", color: C.inkMute }}
          >
            {m === "loading" ? "Laadstaat" : "Foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Frame hard className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{ background: C.ochreSoft, border: `2px solid ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={26} strokeWidth={2.2} />
      </span>
      <p className="mt-5 text-[20px] font-bold uppercase" style={{ ...mono, color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn onClick={onCta} className="mt-6">
        {cta} <ArrowRight size={14} aria-hidden="true" strokeWidth={2.4} />
      </Btn>
    </Frame>
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
    <Frame as="article" hard>
      <div className="flex items-stretch">
        <div
          className="flex w-20 shrink-0 flex-col items-center justify-center"
          style={{
            background: strong ? C.mossSoft : C.slateSoft,
            borderRight: `2px solid ${C.line}`,
          }}
          aria-hidden="true"
        >
          <span className="text-[26px] font-bold leading-none" style={{ ...num, color: C.ink }}>
            {opdracht.match}
          </span>
          <span
            className="mt-0.5 text-[8px] font-bold uppercase"
            style={{ ...mono, letterSpacing: "0.1em", color: C.inkMute }}
          >
            match
          </span>
        </div>
        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={strong ? T.moss : T.slate} Icon={strong ? ShieldCheck : Square}>
              {strong ? "Sterke match" : "Goede match"}
            </Tag>
            <Label>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </Label>
          </div>
          <h3 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10.5px] font-semibold uppercase"
                style={{
                  background: C.paperDeep,
                  color: C.inkSoft,
                  border: `1.5px solid ${C.line}`,
                  ...mono,
                  letterSpacing: "0.06em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden w-24 shrink-0 flex-col items-end justify-center pr-5 sm:flex">
          <span className="text-[16px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-2.5 border-t-2 p-4"
        style={{ borderColor: C.line }}
      >
        <Btn variant="outline" size="sm" onClick={() => setOpen((v) => !v)} ariaExpanded={open}>
          {open ? (
            <X size={12} aria-hidden="true" strokeWidth={2.4} />
          ) : (
            <Plus size={12} aria-hidden="true" strokeWidth={2.4} />
          )}
          Waarom deze match
        </Btn>
        <div className="ml-auto">
          <Btn size="sm" onClick={onOpen}>
            Reageer <ArrowRight size={12} aria-hidden="true" strokeWidth={2.4} />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-200 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 border-t-2 sm:grid-cols-2"
            style={{ borderColor: C.line }}
          >
            <RedenBlok
              titel="In jouw voordeel"
              tone={T.moss}
              Icon={Check}
              items={opdracht.redenen.plus}
              first
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={T.ochre}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Frame>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
  first = false,
}: {
  titel: string;
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
  first?: boolean;
}) {
  return (
    <div
      className={`p-4 ${first ? "border-b-2 sm:border-b-0 sm:border-r-2" : ""}`}
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-5 w-5 items-center justify-center"
          style={{ background: tone.soft, border: `1.5px solid ${C.line}` }}
          aria-hidden="true"
        >
          <Icon size={11} strokeWidth={2.6} />
        </span>
        <Label color={C.ink}>{titel}</Label>
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1.5 h-2 w-2 shrink-0"
              style={{ background: tone.base, border: `1px solid ${C.line}` }}
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
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="space-y-5">
      <Btn variant="outline" size="sm" onClick={onBack}>
        <ArrowRight size={12} aria-hidden="true" strokeWidth={2.4} className="rotate-180" /> Terug
      </Btn>

      <Frame hard className="relative overflow-hidden p-7 md:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-10 select-none text-[150px] font-bold leading-none"
          style={{ ...num, color: strong ? C.mossSoft : C.slateSoft }}
        >
          {opdracht.match}
        </span>
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10.5px] font-bold uppercase"
            style={{ background: C.ink, color: C.paper, ...mono, letterSpacing: "0.1em" }}
          >
            {opdracht.id}
          </span>
          <Tag tone={strong ? T.moss : T.slate} Icon={ShieldCheck}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Tag>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[27px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: C.inkSoft }}
        >
          <MapPin size={14} aria-hidden="true" strokeWidth={2.2} /> {opdracht.opdrachtgever} ·{" "}
          {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <Btn>Reageer op opdracht</Btn>
          <Btn variant="outline">Bewaren</Btn>
        </div>
      </Frame>

      <Frame className="grid grid-cols-2 md:grid-cols-4">
        {feiten.map((m, i) => (
          <div
            key={m.l}
            className="p-5"
            style={{
              borderRight: i % 4 !== 3 ? `2px solid ${C.line}` : "none",
              borderTop: i >= 2 ? `2px solid ${C.line}` : "none",
            }}
          >
            <Label>{m.l}</Label>
            <p
              className="mt-1.5 text-[20px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </Frame>

      <section>
        <SectionHead nr="01">Waarom deze match</SectionHead>
        <p className="mb-4 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Open en eerlijk afgezet tegen je geverifieerde profiel — geen verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Frame className="p-6">
            <div
              className="flex items-center gap-2 border-b-2 pb-3"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center"
                style={{ background: C.mossSoft, border: `1.5px solid ${C.line}` }}
                aria-hidden="true"
              >
                <Check size={13} strokeWidth={2.6} />
              </span>
              <Label color={C.ink}>In jouw voordeel</Label>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0"
                    style={{ background: C.moss, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame className="p-6">
            <div
              className="flex items-center gap-2 border-b-2 pb-3"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center"
                style={{ background: C.ochreSoft, border: `1.5px solid ${C.line}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={13} strokeWidth={2.6} />
              </span>
              <Label color={C.ink}>Goed om te weten</Label>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0"
                    style={{ background: C.ochre, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
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
      <Frame hard className="relative overflow-hidden p-7 md:p-8">
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label>Vertrouwensniveau</Label>
            <h1
              className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van de {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt bijna —
              op tijd te vernieuwen. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center"
            style={{ background: C.mossSoft, border: `2px solid ${C.line}` }}
            aria-hidden="true"
          >
            <span className="text-[32px] font-bold leading-none" style={{ color: C.ink, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-0.5 text-[8px] font-bold uppercase"
              style={{ ...mono, letterSpacing: "0.12em", color: C.inkMute }}
            >
              % in orde
            </span>
          </span>
        </div>
        <div
          className="relative mt-5 flex h-3 w-full overflow-hidden"
          style={{ border: `2px solid ${C.line}` }}
          aria-hidden="true"
        >
          <span
            className="block h-full"
            style={{ width: `${ratio}%`, background: C.moss, transition: "width 0.7s ease-out" }}
          />
        </div>
      </Frame>

      <div>
        <SectionHead nr="01">Certificaten</SectionHead>
        <Frame className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = statusMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `2px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#ece6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6771f]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                      style={{ background: m.tone.soft, border: `2px solid ${C.line}` }}
                      aria-hidden="true"
                    >
                      <m.Icon size={18} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-bold"
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
                        <Tag tone={m.tone} Icon={m.Icon}>
                          {m.label}
                          {m.alarm && <span className="sr-only"> (let op)</span>}
                        </Tag>
                      </span>
                      <span
                        className="flex h-6 w-6 items-center justify-center text-[14px] font-bold"
                        style={{ border: `1.5px solid ${C.line}`, color: C.ink }}
                        aria-hidden="true"
                      >
                        {isOpen ? "–" : "+"}
                      </span>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-200 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t-2 p-4 sm:pl-[76px]" style={{ borderColor: C.hair }}>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="outline">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Frame>
      </div>

      <div>
        <SectionHead nr="02">Documentenkast</SectionHead>
        <Frame className="grid grid-cols-1 sm:grid-cols-2">
          {DOCUMENTEN.map((d, i) => {
            const m = statusMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={{
                  borderRight: i % 2 === 0 ? `2px solid ${C.line}` : "none",
                  borderTop: i >= 2 ? `2px solid ${C.line}` : "none",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ background: C.paperDeep, border: `2px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Tag tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Tag>
              </div>
            );
          })}
        </Frame>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div className="border-b-2 pb-4" style={{ borderColor: C.line }}>
        <h1
          className="text-[28px] font-bold uppercase leading-none tracking-[0.02em]"
          style={{ ...mono, color: C.ink }}
        >
          Acties
        </h1>
        <p className="mt-2">
          <Label>Op volgorde van urgentie · één ding tegelijk</Label>
        </p>
      </div>

      <Frame className="overflow-hidden">
        <ol>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const goMarkt = a.cta.toLowerCase().includes("match");
            return (
              <li
                key={a.titel}
                className="grid grid-cols-[auto_1fr] items-start gap-4 p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.line}` }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center text-[18px] font-bold"
                  style={{
                    background: warn ? C.ochreSoft : C.slateSoft,
                    border: `2px solid ${C.line}`,
                    color: C.ink,
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <Tag tone={warn ? T.ochre : T.slate} Icon={warn ? AlertTriangle : Square}>
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Tag>
                  <h2 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: C.ink }}>
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
                  <Btn onClick={goMarkt ? onMarkt : undefined}>
                    {a.cta} <ArrowRight size={14} aria-hidden="true" strokeWidth={2.4} />
                  </Btn>
                </div>
              </li>
            );
          })}
        </ol>
      </Frame>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): Tone {
  if (status === "Betaald") return T.moss;
  if (status === "Openstaand") return T.ochre;
  return T.slate;
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
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4"
        style={{ borderColor: C.line }}
      >
        <div>
          <h1
            className="text-[28px] font-bold uppercase leading-none tracking-[0.02em]"
            style={{ ...mono, color: C.ink }}
          >
            Facturen
          </h1>
          <p className="mt-2">
            <Label>Verzonden en concept-facturen</Label>
          </p>
        </div>
        <Btn>
          <Plus size={14} aria-hidden="true" strokeWidth={2.4} /> Nieuwe factuur
        </Btn>
      </div>

      <Frame className="grid grid-cols-1 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.moss },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.ochre },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.slate },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-5"
            style={{
              borderRight: i < 2 ? `2px solid ${C.line}` : "none",
              background: s.tone.soft,
            }}
          >
            <Label color={C.ink}>{s.l}</Label>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkSoft }}>
              {s.sub}
            </p>
          </div>
        ))}
      </Frame>

      <div className="flex items-center gap-0" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            aria-pressed={sort === s}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6771f]"
            style={{
              ...mono,
              letterSpacing: "0.06em",
              background: sort === s ? C.ink : C.card,
              color: sort === s ? C.paper : C.ink,
              border: `2px solid ${C.line}`,
              borderLeft: i === 0 ? `2px solid ${C.line}` : "none",
            }}
          >
            <ArrowUpDown size={12} aria-hidden="true" strokeWidth={2.4} />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </button>
        ))}
      </div>

      <Frame className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 sm:grid"
          style={{ background: C.paperDeep, borderBottom: `2px solid ${C.line}` }}
        >
          <Label>Klant / nummer</Label>
          <Label>Bedrag</Label>
          <Label>Status</Label>
        </div>
        <ul>
          {rows.map((f, i) => {
            const tone = factuurTone(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 sm:grid-cols-[1fr_auto_auto]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.hair}` }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                    {f.klant}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr} · {f.datum}
                  </span>
                </span>
                <span className="text-right text-[15px] font-bold" style={{ color: C.ink, ...num }}>
                  {f.bedrag}
                </span>
                <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
                  <Tag tone={tone}>{f.status}</Tag>
                </span>
              </li>
            );
          })}
        </ul>
      </Frame>
    </div>
  );
}
