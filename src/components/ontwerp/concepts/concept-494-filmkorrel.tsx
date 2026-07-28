"use client";

// Concept 494 — "Filmkorrel" · Warme redactioneel-fotografische diepte met analoge filmkorrel.
// Een SVG feTurbulence-grain ligt als subtiele textuur over espresso/sepia tinten; koppen in een
// klassieke serif, metadata in mono als kadernummers op een contactvel. Tastbaar, warm, editorial —
// textuur-over-3D (2026). Geen zware schaduwen, wel korrel, houtskool en amber inkt.

import { useMemo, useState, type ReactNode, type CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Aperture,
  Check,
  Clock,
  FileText,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
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

// — Palet: espresso/houtskool met warme amber-inkt en sepia sier —
const C = {
  bg: "#17120c",
  bgSoft: "#1f1810",
  panel: "#241c13",
  panelHi: "#2c2318",
  line: "#3b2f20",
  lineSoft: "#2d2417",
  text: "#f1e7d6",
  textSoft: "#cbbaa0",
  textMute: "#9a8a70",
  textFaint: "#6e6250",

  amber: "#d8973c",
  amberDeep: "#b6772a",
  amberSoft: "#37291a",

  // warme status-tinten (film-emulsie)
  olive: "#a2b268",
  oliveSoft: "#2a2c18",
  dust: "#89a7bd",
  dustSoft: "#1e2830",
  clay: "#d07354",
  claySoft: "#331d17",
};

const serif: CSSProperties = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const mono: CSSProperties = {
  fontFamily: "'SFMono-Regular', ui-monospace, 'JetBrains Mono', 'Roboto Mono', Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
};

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.olive,
        soft: C.oliveSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.dust, soft: C.dustSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.clay, soft: C.claySoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Filmkorrel-overlay: twee feTurbulence-lagen als tastbare textuur (decoratief) —
function Grain() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.16] mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="fk-grain-a">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fk-grain-a)" />
      </svg>
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="fk-grain-b">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.35"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fk-grain-b)" />
      </svg>
    </div>
  );
}

// — Kaderhoeken: fotografische frame-ticks in de hoeken van een paneel —
function Corners() {
  const base = "absolute h-3 w-3 border-[#d8973c]";
  return (
    <span aria-hidden="true">
      <span className={`${base} left-2 top-2 border-l border-t`} />
      <span className={`${base} right-2 top-2 border-r border-t`} />
      <span className={`${base} bottom-2 left-2 border-b border-l`} />
      <span className={`${base} bottom-2 right-2 border-b border-r`} />
    </span>
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.3em]"
      style={{ color: C.amber, ...mono }}
    >
      {children}
    </span>
  );
}

function Frame({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`relative rounded-[3px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </Tag>
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
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "quiet";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12px]" : "px-5 py-2.5 text-[13px]";
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.amber, color: C.bg, border: `1px solid ${C.amberDeep}` }
      : variant === "line"
        ? { background: "transparent", color: C.amber, border: `1px solid ${C.amberDeep}` }
        : { background: "transparent", color: C.textSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold uppercase tracking-[0.08em] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17120c] ${pad} ${className}`}
      style={{ ...style, ...mono }}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: base, background: soft, border: `1px solid ${base}55`, ...mono }}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 24;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="1.8" fill={tone} />
    </svg>
  );
}

// — Match als kadernummer op een filmstrip —
function MatchFrame({ value, small = false }: { value: number; small?: boolean }) {
  const strong = value >= 90;
  const tone = strong ? C.olive : C.amber;
  return (
    <span
      className={`inline-flex flex-col items-center rounded-[3px] ${small ? "px-2 py-1" : "px-2.5 py-1.5"}`}
      style={{ background: C.bgSoft, border: `1px solid ${tone}55` }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-semibold leading-none ${small ? "text-[19px]" : "text-[26px]"}`}
        style={{ color: tone, ...mono }}
      >
        {value}
        <span className="align-super text-[0.5em]" style={{ color: C.textMute }}>
          %
        </span>
      </span>
      <span
        className="mt-1 text-[8px] uppercase tracking-[0.24em]"
        style={{ color: C.textMute, ...mono }}
      >
        match
      </span>
    </span>
  );
}

function SectionTitle({ over, children }: { over: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Overline>{over}</Overline>
      <h2
        className="mt-2 text-[21px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ color: C.text, ...serif }}
      >
        {children}
      </h2>
      <span className="mt-3 block h-px w-full" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

export function Concept494() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...serif,
        color: C.text,
        background: C.bg,
        backgroundImage: [
          "radial-gradient(70% 50% at 15% 0%, rgba(216,151,60,0.10) 0%, rgba(23,18,12,0) 60%)",
          "radial-gradient(60% 50% at 100% 100%, rgba(208,115,84,0.08) 0%, rgba(23,18,12,0) 60%)",
        ].join(","),
      }}
    >
      <Grain />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-20 sm:px-8 md:px-10">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="fk-fade pt-7">
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
        @keyframes fkFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fk-fade { animation: fkFade 0.4s ease both; }
        @media (prefers-reduced-motion: reduce) { .fk-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Masthead() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="pt-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px]"
            style={{ background: C.amber, color: C.bg }}
            aria-hidden="true"
          >
            <Aperture size={22} />
          </span>
          <div>
            <p
              className="text-[22px] font-semibold leading-none tracking-[0.01em]"
              style={{ color: C.text, ...serif }}
            >
              Filmkorrel
            </p>
            <p
              className="mt-1.5 text-[10px] uppercase tracking-[0.28em]"
              style={{ color: C.textMute, ...mono }}
            >
              Dossier voor zelfstandigen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
            style={{ color: C.olive, ...mono }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="hidden h-4 w-px sm:block"
            style={{ background: C.line }}
            aria-hidden="true"
          />
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-[3px] px-2.5 text-[11px] uppercase tracking-[0.08em]"
            style={{ color: C.textSoft, border: `1px solid ${C.line}`, ...mono }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            Post
            <span className="font-semibold" style={{ color: C.amber }}>
              {ongelezen}
            </span>
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.panelHi, color: C.text, border: `1px solid ${C.line}`, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-2 py-1.5"
        style={{ borderTop: `2px solid ${C.amber}`, borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: C.textMute, ...mono }}
        >
          {PROFIEL.naam} — {PROFIEL.rol}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: C.textMute, ...mono }}
        >
          {PROFIEL.plaats} · Rol {new Date().getFullYear()}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c]"
              style={{
                color: on ? C.bg : C.textSoft,
                background: on ? C.amber : "transparent",
                border: `1px solid ${on ? C.amberDeep : C.line}`,
                ...mono,
              }}
            >
              <span className="text-[9px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
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
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Overline>Contactvel · voorpagina</Overline>
          <h1
            className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[40px]"
            style={{ color: C.text, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: C.textSoft }}>
            Uw dossier is scherp en op orde. Er liggen verse opdrachten klaar die aansluiten bij uw
            profiel, en één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar de marktplaats
            </Btn>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2">
            {KPIS.map((k, i) => (
              <Frame key={k.label} className="p-4">
                <div className="flex items-start justify-between">
                  <p
                    className="text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: C.textMute, ...mono }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="text-[9px] uppercase tracking-[0.14em]"
                    style={{ color: C.textFaint, ...mono }}
                  >
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[24px] font-semibold leading-none"
                  style={{ color: C.text, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: k.up ? C.olive : C.amber, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={C.textFaint} />
                </div>
              </Frame>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <Overline>Vraagt aandacht</Overline>
            <Frame className="mt-2 p-5">
              <Corners />
              <div className="flex items-center gap-2" style={{ color: C.amber }}>
                <AlertTriangle size={15} aria-hidden="true" />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono }}
                >
                  Termijn nadert
                </span>
              </div>
              <h3
                className="mt-2.5 text-[17px] font-semibold leading-snug"
                style={{ color: C.text, ...serif }}
              >
                {primair.titel}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
                {primair.detail}
              </p>
              <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
                {primair.cta} <ArrowRight size={13} aria-hidden="true" />
              </Btn>
            </Frame>
          </div>

          <div>
            <Overline>Vertrouwen</Overline>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-semibold leading-none"
                style={{ color: C.text, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.textMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: C.bgSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: C.olive,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.textMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
        </aside>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <SectionTitle over="Selectie">Opdrachten voor u belicht</SectionTitle>
          <button
            type="button"
            onClick={onMarkt}
            className="mb-4 ml-4 shrink-0 rounded text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c]"
            style={{ color: C.amber, ...mono }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle over="Register">Uw certificaten</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Frame key={c.naam} className="flex items-center gap-3 p-3.5">
                <t.Icon size={16} aria-hidden="true" style={{ color: t.base }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.textMute }}
                  >
                    {c.detail}
                  </span>
                </span>
                <StatusTag {...t} />
              </Frame>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  return (
    <Frame as="article">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d8973c]"
      >
        <span
          className="hidden shrink-0 text-[10px] uppercase tracking-[0.14em] sm:block"
          style={{ color: C.textFaint, ...mono }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="shrink-0">
          <MatchFrame value={opdracht.match} small />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[16px] font-semibold leading-snug"
            style={{ color: C.text, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
            style={{ color: C.textMute, ...mono }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="hidden shrink-0 flex-col items-end sm:flex">
          <span className="text-[14px] font-semibold" style={{ color: C.text, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.14em]"
            style={{ color: C.textFaint, ...mono }}
          >
            per uur
          </span>
        </span>
        <ArrowRight
          size={17}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.amber }}
        />
      </button>
    </Frame>
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
    <div className="space-y-6">
      <div>
        <Overline>Marktplaats · contactvel</Overline>
        <h1
          className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text, ...serif }}
        >
          Opdrachten die bij u passen
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: C.textMute, ...mono }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op uw profiel.
        </p>
        <span
          className="mt-4 block h-px w-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6e6250]"
            style={{ color: C.text, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c]"
              style={{ color: C.textMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "quiet"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Frame className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.panelHi }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.panelHi }}
                  />
                </div>
              </Frame>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="De lijst kon niet worden geladen"
          tekst="We konden de opdrachten zojuist niet ophalen. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "uw zoekterm"}. Verruim uw zoekopdracht.`}
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

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[10px] uppercase tracking-[0.14em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c]"
            style={{ color: C.textFaint, ...mono }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
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
    <Frame className="flex flex-col items-center px-6 py-16 text-center">
      <Corners />
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ color: C.amber, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[20px] font-semibold" style={{ color: C.text, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
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
    <Frame as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-1">
          <MatchFrame value={opdracht.match} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: strong ? C.olive : C.amber, ...mono }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[10px]" style={{ color: C.textFaint, ...mono }}>
              KADER {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[19px] font-semibold leading-snug"
            style={{ color: C.text, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.textMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[2px] px-2 py-0.5 text-[11px]"
                style={{
                  background: C.bgSoft,
                  color: C.textSoft,
                  border: `1px solid ${C.line}`,
                  ...mono,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.text, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.14em]"
            style={{ color: C.textFaint, ...mono }}
          >
            per uur
          </span>
        </span>
      </div>

      <span className="block h-px w-full" style={{ background: C.line }} aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[3px] text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8973c]"
          style={{ color: C.amber, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <span className="block h-px w-full" style={{ background: C.line }} aria-hidden="true" />
          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
            <RedenKolom
              titel="In uw voordeel"
              tone={C.olive}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Frame>
  );
}

function RedenKolom({
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
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.textSoft }}
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: tone }}
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
    <div className="space-y-7">
      <Btn variant="quiet" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px]" style={{ color: C.textMute, ...mono }}>
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.olive : C.amber, ...mono }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-3 max-w-2xl text-[30px] font-semibold leading-[1.12] tracking-[-0.015em] md:text-[38px]"
          style={{ color: C.text, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: C.textMute, ...mono }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Frame key={m.l} className="p-4">
            <p
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: C.textMute, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.text, ...mono }}>
              {m.v}
            </p>
          </Frame>
        ))}
      </div>

      <section>
        <SectionTitle over="Motivering">Waarom deze match bij u past</SectionTitle>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
          Afgezet tegen uw geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in uw voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Frame className="p-5">
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.olive, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> In uw voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.textSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.olive }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame className="p-5">
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.amber, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.textSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
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
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Overline>Vertrouwensdossier</Overline>
          <h1
            className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text, ...serif }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt uw dossier compleet. Al uw documenten worden versleuteld
            bewaard en uitsluitend met uw toestemming gedeeld.
          </p>
        </div>
        <Frame className="p-5">
          <Corners />
          <div className="flex items-baseline gap-2">
            <span
              className="text-[44px] font-semibold leading-none"
              style={{ color: C.text, ...mono }}
            >
              {ratio}%
            </span>
          </div>
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.textMute, ...mono }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: C.bgSoft }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: C.olive,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Frame>
      </section>

      <section>
        <SectionTitle over="Certificaten">Documentregister</SectionTitle>
        <Frame className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d8973c]"
                  >
                    <t.Icon size={17} aria-hidden="true" style={{ color: t.base }} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.text, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.textMute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusTag {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.amber, transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 sm:pl-[52px]">
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.textSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na uw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="solid">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="quiet">
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
      </section>

      <section>
        <SectionTitle over="Dossier">Documentenkast</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Frame key={d.naam} className="flex items-center gap-3 p-3.5">
                <FileText size={16} aria-hidden="true" style={{ color: C.textMute }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.textMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusTag {...t} />
              </Frame>
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
    <div className="space-y-6">
      <div>
        <Overline>Agenda</Overline>
        <h1
          className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text, ...serif }}
        >
          Wat vandaag uw aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[13px]" style={{ color: C.textSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
        <span
          className="mt-4 block h-px w-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.dust;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Frame className="flex items-start gap-4 p-5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
                  style={{ color: C.text, border: `1px solid ${C.line}`, ...mono }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: tone, ...mono }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[18px] font-semibold leading-snug"
                    style={{ color: C.text, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.textSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Frame>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.olive, soft: C.oliveSoft };
  if (status === "Openstaand") return { base: C.amber, soft: C.amberSoft };
  if (status === "Concept") return { base: C.dust, soft: C.dustSoft };
  return { base: C.clay, soft: C.claySoft };
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text, ...serif }}
          >
            Uw facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.olive },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.dust },
        ].map((s) => (
          <Frame key={s.l} className="p-4">
            <p
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: C.textMute, ...mono }}
            >
              {s.l}
            </p>
            <p className="mt-1 text-[24px] font-semibold" style={{ color: s.tone, ...mono }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.textMute }}>
              {s.sub}
            </p>
          </Frame>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "quiet"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Frame className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.textMute, ...mono }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const t = factuurTone(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:brightness-110"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.textSoft, ...mono }}>
                    {f.nr}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[14px] font-semibold"
                    style={{ color: C.text, ...serif }}
                  >
                    {f.klant}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.textMute, ...mono }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[14px] font-semibold"
                    style={{ color: C.text, ...mono }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color: t.base,
                        background: t.soft,
                        border: `1px solid ${t.base}55`,
                        ...mono,
                      }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>
    </div>
  );
}
