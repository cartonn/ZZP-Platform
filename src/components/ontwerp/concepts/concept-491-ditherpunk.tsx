"use client";

// Concept 491 — "Ditherpunk" · 1-bit gedithered/halftone monochroom. Bijna-zwarte inkt op papierwit
// met één scherp vermiljoen-accent. Floyd-Steinberg-achtige dot-patronen via CSS (radial-gradient),
// harde 1px randen, pixel-precieze modulaire grid. Retro-technisch maar strak en premium — het
// pixel-as-systeem concept. Mono + grotesk, geen ronde hoeken, geen zachte schaduwen.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  Square,
  Terminal,
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

// — Palet: 1-bit. Bijna-zwarte inkt op papierwit + één scherp vermiljoen-accent —
const C = {
  paper: "#ecebe3",
  panel: "#f4f3ec",
  ink: "#141210",
  inkSoft: "#3c3833",
  inkMute: "#6f6a61",
  inkFaint: "#9a948a",
  line: "#141210",
  accent: "#e5341a", // scherp vermiljoen
  accentInk: "#f4f3ec",
};

const mono = {
  fontFamily:
    "'JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', ui-monospace, 'Menlo', monospace",
};
const grotesk = {
  fontFamily: "'Inter', 'Helvetica Neue', 'Arial Narrow', system-ui, sans-serif",
};
const num = { ...mono, fontVariantNumeric: "tabular-nums" as const };

// — Halftone/dither: radial-gradient dot-raster. density 0..1 stuurt hoe "gevuld" het is —
function dither(density: number, color = C.ink): React.CSSProperties {
  const size = density >= 0.75 ? 3 : density >= 0.5 ? 4 : density >= 0.25 ? 5 : 7;
  const r = density >= 0.75 ? 1.15 : density >= 0.5 ? 1 : 0.85;
  return {
    backgroundColor: C.panel,
    backgroundImage: `radial-gradient(${color} ${r}px, transparent ${r + 0.4}px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

type Tone = {
  label: string;
  Icon: LucideIcon;
  density: number;
  accent: boolean;
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, density: 1, accent: false, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, density: 0.35, accent: false, alarm: false };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        density: 0.6,
        accent: true,
        alarm: true,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, density: 0.85, accent: true, alarm: true };
  }
}

// — Label in kleinkapitaal mono (systeem-tag) —
function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${className}`}
      style={{ color: C.inkMute, ...mono }}
    >
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "accent";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[11.5px]" : "px-4 py-2.5 text-[12.5px]";
  const style: React.CSSProperties =
    variant === "accent"
      ? { background: C.accent, color: C.accentInk, border: `1px solid ${C.ink}` }
      : variant === "solid"
        ? { background: C.ink, color: C.panel, border: `1px solid ${C.ink}` }
        : { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-none font-semibold uppercase tracking-[0.08em] transition-transform duration-100 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5341a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ecebe3] ${pad} ${className}`}
      style={{ ...style, ...mono }}
    >
      {children}
    </button>
  );
}

// — Status als patroon-swatch + icoon + label (nooit kleur alleen) —
function StatusChip({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: tone.accent ? C.accent : C.ink,
        border: `1px solid ${tone.accent ? C.accent : C.ink}`,
        ...mono,
      }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0"
        style={{
          ...dither(tone.density, tone.accent ? C.accent : C.ink),
          border: `1px solid ${tone.accent ? C.accent : C.ink}`,
        }}
        aria-hidden="true"
      />
      <tone.Icon size={11} aria-hidden="true" />
      {tone.label}
      {tone.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Spark als 1-bit pixelkolommen —
function Spark({ data, accent = false }: { data: number[]; accent?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="inline-flex h-6 items-end gap-[2px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 4 + ((d - min) / span) * 18;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[3px]"
            style={{ height: h, background: last && accent ? C.accent : C.ink }}
          />
        );
      })}
    </span>
  );
}

// — Match als gedithered voortgangsbalk met percentage —
function MatchBar({ value, small = false }: { value: number; small?: boolean }) {
  const strong = value >= 90;
  return (
    <div aria-label={`Match ${value} procent`}>
      <div className="flex items-baseline justify-between">
        <span
          className={`font-semibold leading-none ${small ? "text-[18px]" : "text-[26px]"}`}
          style={{ color: strong ? C.accent : C.ink, ...num }}
        >
          {value}
          <span className="text-[0.5em]" style={{ color: C.inkMute }}>
            %
          </span>
        </span>
        <span
          className="text-[9px] uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint, ...mono }}
        >
          match
        </span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden"
        style={{ border: `1px solid ${C.ink}` }}
        aria-hidden="true"
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            ...dither(strong ? 1 : 0.6, strong ? C.accent : C.ink),
            transition: "width 0.7s steps(12)",
          }}
        />
      </div>
    </div>
  );
}

// — Paneel met harde 1px rand + optionele titelbalk als terminal-venster —
function Panel({
  children,
  title,
  className = "",
  as: Tag2 = "div",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag2
      className={`rounded-none ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.ink}` }}
    >
      {title && (
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ borderBottom: `1px solid ${C.ink}` }}
        >
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-2 w-2" style={{ border: `1px solid ${C.ink}` }} />
            <span className="h-2 w-2" style={{ ...dither(0.6), border: `1px solid ${C.ink}` }} />
            <span className="h-2 w-2" style={{ background: C.accent }} />
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.inkSoft, ...mono }}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </Tag2>
  );
}

export function Concept491() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...grotesk,
        color: C.ink,
        background: C.paper,
        backgroundImage: `radial-gradient(${C.inkFaint} 0.6px, transparent 0.9px)`,
        backgroundSize: "6px 6px",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="dp-fade pt-6">
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

      <style>{`
        @keyframes dpFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .dp-fade { animation: dpFade 0.28s steps(6) both; }
        @media (prefers-reduced-motion: reduce) { .dp-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Masthead() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center text-[16px] font-semibold"
          style={{ background: C.ink, color: C.accent, border: `1px solid ${C.ink}`, ...mono }}
          aria-hidden="true"
        >
          ▚▚
        </span>
        <div>
          <p
            className="text-[19px] font-semibold uppercase leading-none tracking-[0.14em]"
            style={{ ...mono }}
          >
            Dither<span style={{ color: C.accent }}>·</span>ZZP
          </p>
          <Tag className="mt-1.5 block">Register voor zelfstandigen</Tag>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[11px] font-semibold"
          style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Terminal size={13} aria-hidden="true" />
          <span style={{ color: C.accent }}>{ongelezen}</span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-semibold"
          style={{ background: C.panel, color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
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
    <nav
      aria-label="Hoofdnavigatie"
      className="mt-4 flex flex-wrap gap-0"
      style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e5341a]"
            style={{
              ...mono,
              color: on ? C.accentInk : C.inkSoft,
              background: on ? C.ink : "transparent",
            }}
          >
            {on && (
              <span aria-hidden="true" style={{ color: C.accent }}>
                ▸{" "}
              </span>
            )}
            {s.label}
          </button>
        );
      })}
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div style={{ border: `1px solid ${C.ink}`, ...dither(0.12) }} className="p-5 sm:p-7">
          <Tag>{"// voorpagina"}</Tag>
          <h1 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[38px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je register is geverifieerd en op orde. Er staan verse opdrachten klaar die aansluiten
            op je profiel; één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="accent" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>
        </div>

        <Panel title="attentie.log" className="flex flex-col">
          <div className="flex items-center gap-2 px-4 pt-4" style={{ color: C.accent }}>
            <AlertTriangle size={14} aria-hidden="true" />
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono }}
            >
              Termijn nadert
            </span>
          </div>
          <div className="flex-1 px-4 pb-4">
            <h3 className="mt-2 text-[16px] font-semibold leading-snug">{primair.titel}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={12} aria-hidden="true" />
            </Btn>
          </div>
          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 14 }}>
            <div className="flex items-baseline justify-between">
              <Tag>Dossier op orde</Tag>
              <span className="text-[20px] font-semibold leading-none" style={{ ...num }}>
                {ratio}%
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full"
              style={{ border: `1px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <span
                className="block h-full"
                style={{ width: `${ratio}%`, ...dither(1), transition: "width 0.7s steps(10)" }}
              />
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
        </Panel>
      </section>

      {/* KPI-raster */}
      <section
        className="grid grid-cols-2 gap-0 sm:grid-cols-4"
        style={{ border: `1px solid ${C.ink}` }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="p-4"
            style={{
              borderRight: i % 4 !== 3 ? `1px solid ${C.ink}` : "none",
              borderTop: i >= 2 ? `1px solid ${C.ink}` : "none",
              background: C.panel,
            }}
          >
            <Tag>{k.label}</Tag>
            <p className="mt-1.5 text-[22px] font-semibold leading-none" style={{ ...num }}>
              {k.value}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span
                className="text-[11px] font-semibold"
                style={{ color: k.up ? C.ink : C.accent, ...num }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <Spark data={k.spark} accent={!k.up} />
            </div>
          </div>
        ))}
      </section>

      {/* Aanbevolen opdrachten */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Tag>{"// aanbevolen"}</Tag>
            <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.01em]">
              Opdrachten voor jou
            </h2>
          </div>
          <button
            type="button"
            onClick={onMarkt}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5341a]"
            style={{ color: C.accent, ...mono }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="space-y-0" style={{ border: `1px solid ${C.ink}` }}>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ink}` }}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#e5341a] hover:text-[#f4f3ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e5341a]"
    >
      <span className="w-24 shrink-0">
        <MatchBar value={opdracht.match} small />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-snug">
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] group-hover:text-[#f4f3ec]"
          style={{ color: C.inkMute, ...mono }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[14px] font-semibold" style={{ ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span className="text-[9px] uppercase tracking-[0.14em]" style={{ ...mono }}>
          /uur
        </span>
      </span>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
        <Tag>{"// marktplaats"}</Tag>
        <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em]">Opdrachten die passen</h1>
        <p className="mt-1 text-[12px]" style={{ color: C.inkMute, ...mono }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          treffers op je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.ink}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="grep opdrachten…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a948a]"
            style={{ color: C.ink, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#141210] hover:text-[#f4f3ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5341a]"
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "line"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={11} aria-hidden="true" />
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ border: `1px solid ${C.ink}`, ...dither(0.35) }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="mt-4 text-[18px] font-semibold">Geen treffers</p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.inkSoft }}>
            {q ? `“${q}” levert niets op.` : "Je zoekterm levert niets op."} Verruim je
            zoekopdracht.
          </p>
          <Btn variant="line" size="sm" className="mt-4" onClick={() => setQ("")}>
            Zoekterm wissen
          </Btn>
        </Panel>
      ) : (
        <ul className="space-y-3">
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
    <Panel as="article">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <span className="w-full shrink-0 sm:w-40">
          <MatchBar value={opdracht.match} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{
                color: strong ? C.accent : C.ink,
                border: `1px solid ${strong ? C.accent : C.ink}`,
                ...mono,
              }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[10.5px]" style={{ color: C.inkFaint, ...mono }}>
              [{String(index + 1).padStart(2, "0")}] {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-semibold leading-snug">{opdracht.titel}</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkSoft, border: `1px solid ${C.inkFaint}`, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-left sm:text-right">
          <span className="block text-[16px] font-semibold" style={{ ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.12em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.ink}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5341a]"
          style={{ color: C.ink, ...mono }}
        >
          <Square size={11} aria-hidden="true" style={{ ...(open ? { fill: C.accent } : {}) }} />
          {open ? "Verberg redenen" : "Waarom deze match"}
        </button>
        <div className="ml-auto">
          <Btn variant="accent" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-200 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.ink}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              Icon={Check}
              items={opdracht.redenen.plus}
              accent={false}
            />
            <RedenKolom
              titel="Goed om te weten"
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              accent
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenKolom({
  titel,
  Icon,
  items,
  accent,
}: {
  titel: string;
  Icon: LucideIcon;
  items: string[];
  accent: boolean;
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: accent ? C.accent : C.ink, ...mono }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0"
              style={{
                ...dither(accent ? 0.6 : 1, accent ? C.accent : C.ink),
                border: `1px solid ${accent ? C.accent : C.ink}`,
              }}
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
  return (
    <div className="space-y-6">
      <Btn variant="line" size="sm" onClick={onBack}>
        <ArrowRight size={12} aria-hidden="true" className="rotate-180" /> Terug
      </Btn>

      <header style={{ border: `1px solid ${C.ink}`, ...dither(0.12) }} className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px]" style={{ color: C.inkMute, ...mono }}>
            {opdracht.id}
          </span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{
              color: strong ? C.accent : C.ink,
              border: `1px solid ${strong ? C.accent : C.ink}`,
              ...mono,
            }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-[27px] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[34px]">
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 flex items-center gap-1.5 text-[13px]"
          style={{ color: C.inkSoft, ...mono }}
        >
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn variant="accent">
            Reageren op opdracht <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div
        className="grid grid-cols-2 gap-0 sm:grid-cols-4"
        style={{ border: `1px solid ${C.ink}` }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="p-4"
            style={{
              background: C.panel,
              borderRight: i % 4 !== 3 ? `1px solid ${C.ink}` : "none",
              borderTop: i >= 2 ? `1px solid ${C.ink}` : "none",
            }}
          >
            <Tag>{m.l}</Tag>
            <p className="mt-1.5 text-[17px] font-semibold" style={{ ...num }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Tag>{"// motivering"}</Tag>
        <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.01em]">
          Waarom deze match past
        </h2>
        <p
          className="mb-4 mt-1.5 max-w-xl text-[13px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="voordeel" className="p-4">
            <ul className="space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="let-op" className="p-4">
            <ul className="space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.accent }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Tag>{"// vertrouwensregister"}</Tag>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em]">{PROFIEL.trust}</h1>
          <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Documenten worden versleuteld
            bewaard en enkel met jouw toestemming gedeeld.
          </p>
        </div>
        <Panel title="dossier.status" className="p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[40px] font-semibold leading-none" style={{ ...num }}>
              {ratio}%
            </span>
            <Tag>op orde</Tag>
          </div>
          <div
            className="mt-3 h-3 w-full"
            style={{ border: `1px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <span
              className="block h-full"
              style={{ width: `${ratio}%`, ...dither(1), transition: "width 0.7s steps(10)" }}
            />
          </div>
        </Panel>
      </section>

      <section>
        <Tag>{"// certificaten"}</Tag>
        <h2 className="mb-3 mt-1 text-[19px] font-semibold tracking-[-0.01em]">Documentregister</h2>
        <ul style={{ border: `1px solid ${C.ink}` }}>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ink}`, background: C.panel }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[#e9e8e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e5341a]"
                >
                  <t.Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: t.accent ? C.accent : C.ink }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.naam}</span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusChip tone={t} />
                  </span>
                  <span
                    className="text-[14px] font-semibold transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "none",
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-all duration-200 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:pl-[43px]">
                      <div className="mb-3 sm:hidden">
                        <StatusChip tone={t} />
                      </div>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant={t.accent ? "accent" : "solid"}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="line">
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
      </section>

      <section>
        <Tag>{"// documentenkast"}</Tag>
        <h2 className="mb-3 mt-1 text-[19px] font-semibold tracking-[-0.01em]">Dossier</h2>
        <div
          className="grid grid-cols-1 gap-0 sm:grid-cols-2"
          style={{ border: `1px solid ${C.ink}` }}
        >
          {DOCUMENTEN.map((d, i) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-3"
                style={{
                  background: C.panel,
                  borderTop: i >= 2 ? `1px solid ${C.ink}` : "none",
                  borderRight: i % 2 === 0 ? `1px solid ${C.ink}` : "none",
                }}
              >
                <FileText size={16} aria-hidden="true" style={{ color: C.inkMute }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{d.naam}</span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusChip tone={t} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Tag>{"// queue"}</Tag>
        <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em]">
          Wat je aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[12.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>
      <ol style={{ border: `1px solid ${C.ink}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li
              key={a.titel}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ink}`, background: C.panel }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[14px] font-semibold"
                style={{
                  color: warn ? C.accentInk : C.ink,
                  background: warn ? C.accent : "transparent",
                  border: `1px solid ${C.ink}`,
                  ...num,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: warn ? C.accent : C.inkMute, ...mono }}
                >
                  {warn ? (
                    <AlertTriangle size={12} aria-hidden="true" />
                  ) : (
                    <Clock size={12} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Aanbevolen"}
                </span>
                <h2 className="mt-1 text-[16px] font-semibold leading-snug">{a.titel}</h2>
                <p
                  className="mt-1 max-w-lg text-[12.5px] leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <div className="mt-3">
                  <Btn
                    variant={warn ? "accent" : "line"}
                    size="sm"
                    onClick={goMarkt ? onMarkt : undefined}
                  >
                    {a.cta} <ArrowRight size={12} aria-hidden="true" />
                  </Btn>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurDensity(status: string): { density: number; accent: boolean } {
  if (status === "Betaald") return { density: 1, accent: false };
  if (status === "Openstaand") return { density: 0.6, accent: true };
  return { density: 0.25, accent: false };
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Tag>{"// grootboek"}</Tag>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em]">Je facturen</h1>
        </div>
        <Btn variant="accent">+ Nieuwe factuur</Btn>
      </div>

      <section
        className="grid grid-cols-1 gap-0 sm:grid-cols-3"
        style={{ border: `1px solid ${C.ink}` }}
      >
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", d: 1, a: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", d: 0.6, a: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", d: 0.25, a: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-4"
            style={{
              background: C.panel,
              borderRight: i !== 2 ? `1px solid ${C.ink}` : "none",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0"
                style={{
                  ...dither(s.d, s.a ? C.accent : C.ink),
                  border: `1px solid ${s.a ? C.accent : C.ink}`,
                }}
                aria-hidden="true"
              />
              <Tag>{s.l}</Tag>
            </div>
            <p
              className="mt-1.5 text-[22px] font-semibold"
              style={{ color: s.a ? C.accent : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn key={s} size="sm" variant={sort === s ? "solid" : "line"} onClick={() => setSort(s)}>
            <ArrowUpDown size={11} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.ink}` }}>
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.panel, ...mono }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const t = factuurDensity(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#e9e8e0]"
                  style={{
                    background: C.panel,
                    borderTop: i === 0 ? "none" : `1px solid ${C.ink}`,
                  }}
                >
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkSoft, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold">{f.klant}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold" style={{ ...num }}>
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color: t.accent ? C.accent : C.ink,
                        border: `1px solid ${t.accent ? C.accent : C.ink}`,
                        ...mono,
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5"
                        style={{
                          ...dither(t.density, t.accent ? C.accent : C.ink),
                          border: `1px solid ${t.accent ? C.accent : C.ink}`,
                        }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
