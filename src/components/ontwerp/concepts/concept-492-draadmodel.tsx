"use client";

// Concept 492 — "Draadmodel" · Blueprint/wireframe. Cyaan draadlijnen op diep marineblauw, een
// stippelraster als millimeterpapier, hairline-lijnen, maatvoering-labels in mono en subtiele
// hoek-ticks. Alles als dunne omtrek, bijna geen vlakvulling — een technische bouwtekening van het
// platform. Koel, exact, engineering-precisie.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Ruler,
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

// — Palet: diep marineblauw met cyaan draadlijnen en wit —
const C = {
  bg: "#071426",
  bgDeep: "#050f1d",
  panel: "rgba(79,209,224,0.035)",
  line: "#1f4a63", // hairline
  lineSoft: "#173a50",
  cyan: "#59e0f0",
  cyanDim: "#3aa9bd",
  white: "#e8f6fb",
  mute: "#7fa6b8",
  faint: "#4f7488",
  amber: "#f2b45a", // waarschuwing (behoudt cyaan-familie contrast)
  red: "#ff6d7d", // afgewezen
};

const mono = {
  fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
};
const num = { ...mono, fontVariantNumeric: "tabular-nums" as const };

type Tone = { label: string; Icon: LucideIcon; color: string; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, color: C.cyan, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.mute, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, color: C.amber, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, color: C.red, alarm: true };
  }
}

// — Maatlabel: kleine mono-tag zoals op een technische tekening —
function Dim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.24em] ${className}`}
      style={{ color: C.faint, ...mono }}
    >
      {children}
    </span>
  );
}

// — Draad-paneel: hairline-rand + hoek-ticks (fabricage-markeringen) —
function Frame({
  children,
  className = "",
  label,
  as: Tag = "div",
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  as?: "div" | "section" | "article" | "li";
  active?: boolean;
}) {
  const edge = active ? C.cyan : C.line;
  return (
    <Tag
      className={`relative rounded-none ${className}`}
      style={{ border: `1px solid ${edge}`, background: C.panel }}
    >
      {/* hoek-ticks */}
      {(
        [
          "-top-px -left-px",
          "-top-px -right-px",
          "-bottom-px -left-px",
          "-bottom-px -right-px",
        ] as const
      ).map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`pointer-events-none absolute h-2 w-2 ${pos}`}
          style={{
            borderTop: pos.includes("top") ? `1px solid ${C.cyan}` : "none",
            borderBottom: pos.includes("bottom") ? `1px solid ${C.cyan}` : "none",
            borderLeft: pos.includes("left") ? `1px solid ${C.cyan}` : "none",
            borderRight: pos.includes("right") ? `1px solid ${C.cyan}` : "none",
          }}
        />
      ))}
      {label && (
        <span
          className="absolute -top-2 left-3 px-1.5 text-[9px] uppercase tracking-[0.2em]"
          style={{ background: C.bg, color: C.cyanDim, ...mono }}
        >
          {label}
        </span>
      )}
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "line",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "line" | "fill" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2.5 text-[12px]";
  const style: React.CSSProperties =
    variant === "fill"
      ? { background: C.cyan, color: C.bgDeep, border: `1px solid ${C.cyan}` }
      : variant === "ghost"
        ? { background: "transparent", color: C.mute, border: `1px solid ${C.line}` }
        : { background: "transparent", color: C.cyan, border: `1px solid ${C.cyan}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-none font-semibold uppercase tracking-[0.1em] transition-all duration-150 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e0f0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071426] ${pad} ${className}`}
      style={{ ...style, ...mono }}
    >
      {children}
    </button>
  );
}

function StatusChip({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: tone.color, border: `1px solid ${tone.color}`, ...mono }}
    >
      <tone.Icon size={11} aria-hidden="true" />
      {tone.label}
      {tone.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Spark als draad-polylijn met knooppunten —
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 24;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <rect key={i} x={p[0] - 1} y={p[1] - 1} width="2" height="2" fill={color} />
      ))}
    </svg>
  );
}

// — Match als draad-meter (boog) —
function MatchGauge({ value, size = 64 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.cyan : C.cyanDim;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth="1" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="text-[15px] font-semibold leading-none" style={{ color, ...num }}>
          {value}
        </span>
        <span
          className="text-[7px] uppercase tracking-[0.16em]"
          style={{ color: C.faint, ...mono }}
        >
          match
        </span>
      </span>
    </span>
  );
}

export function Concept492() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...mono,
        color: C.white,
        background: C.bg,
        backgroundImage: [
          `linear-gradient(${C.lineSoft} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
          `radial-gradient(${C.line} 0.7px, transparent 0.9px)`,
        ].join(","),
        backgroundSize: "88px 88px, 88px 88px, 22px 22px",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="wf-fade pt-6">
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
        @keyframes wfFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .wf-fade { animation: wfFade 0.32s ease both; }
        @media (prefers-reduced-motion: reduce) { .wf-fade { animation: none !important; } }
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
          className="flex h-11 w-11 items-center justify-center"
          style={{ border: `1px solid ${C.cyan}` }}
          aria-hidden="true"
        >
          <span className="h-5 w-5 rotate-45" style={{ border: `1px solid ${C.cyan}` }} />
        </span>
        <div>
          <p
            className="text-[17px] font-semibold uppercase leading-none tracking-[0.16em]"
            style={{ color: C.white }}
          >
            Draad<span style={{ color: C.cyan }}>·</span>model
          </p>
          <Dim className="mt-1.5 block">register · rev. 2026</Dim>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.cyan, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[11px] font-semibold"
          style={{ color: C.white, border: `1px solid ${C.line}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          MSG<span style={{ color: C.cyan }}>{String(ongelezen).padStart(2, "0")}</span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-semibold"
          style={{ color: C.cyan, border: `1px solid ${C.cyan}` }}
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
      className="mt-4 flex flex-wrap gap-2 py-2"
      style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative flex items-center gap-1.5 rounded-none px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e0f0]"
            style={{
              color: on ? C.bgDeep : C.mute,
              background: on ? C.cyan : "transparent",
              border: `1px solid ${on ? C.cyan : C.line}`,
            }}
          >
            <span className="text-[8px]" style={{ opacity: 0.7 }} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
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
        <Frame label="overzicht" className="p-5 sm:p-7">
          <Dim>plan · 01</Dim>
          <h1
            className="mt-2 text-[28px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[36px]"
            style={{ color: C.white }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed" style={{ color: C.mute }}>
            Je register is geverifieerd en op orde. Er staan verse opdrachten klaar die aansluiten
            op je profiel; één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="fill" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <div
            className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
            style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18 }}
          >
            {KPIS.map((k) => (
              <div key={k.label}>
                <Dim>{k.label}</Dim>
                <p
                  className="mt-1 text-[20px] font-semibold leading-none"
                  style={{ color: C.white, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2 flex items-end justify-between gap-1">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: k.up ? C.cyan : C.amber, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} color={k.up ? C.cyanDim : C.amber} />
                </div>
              </div>
            ))}
          </div>
        </Frame>

        <Frame label="attentie" className="flex flex-col p-5">
          <div className="flex items-center gap-2" style={{ color: C.amber }}>
            <AlertTriangle size={14} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              Termijn nadert
            </span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.white }}>
            {primair.titel}
          </h3>
          <p className="mt-1.5 flex-1 text-[12px] leading-relaxed" style={{ color: C.mute }}>
            {primair.detail}
          </p>
          <Btn variant="line" size="sm" className="mt-4 w-full" onClick={onActies}>
            {primair.cta} <ArrowRight size={12} aria-hidden="true" />
          </Btn>
          <div className="mt-4" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            <div className="flex items-baseline justify-between">
              <Dim>Dossier</Dim>
              <span
                className="text-[18px] font-semibold leading-none"
                style={{ color: C.cyan, ...num }}
              >
                {ratio}%
              </span>
            </div>
            <div
              className="mt-2 h-1.5 w-full"
              style={{ border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <span
                className="block h-full"
                style={{
                  width: `${ratio}%`,
                  background: C.cyan,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px]" style={{ color: C.faint }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </p>
          </div>
        </Frame>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Dim>plan · 02</Dim>
            <h2
              className="mt-1 text-[18px] font-semibold tracking-[-0.01em]"
              style={{ color: C.white }}
            >
              Opdrachten voor jou
            </h2>
          </div>
          <button
            type="button"
            onClick={onMarkt}
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e0f0]"
            style={{ color: C.cyan }}
          >
            Volledige lijst →
          </button>
        </div>
        <Frame className="divide-y">
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id} style={{ borderColor: C.line }}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </Frame>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[rgba(89,224,240,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#59e0f0]"
    >
      <span className="shrink-0">
        <MatchGauge value={opdracht.match} size={52} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold" style={{ color: C.white }}>
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]"
          style={{ color: C.mute }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[13px] font-semibold" style={{ color: C.cyan, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <Dim>per uur</Dim>
      </span>
      <ArrowRight
        size={15}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: C.cyanDim }}
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
        <Dim>sectie · marktplaats</Dim>
        <h1
          className="mt-1 text-[24px] font-semibold tracking-[-0.01em]"
          style={{ color: C.white }}
        >
          Opdrachten die passen
        </h1>
        <p className="mt-1 text-[11.5px]" style={{ color: C.mute }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          treffers op je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[#4f7488]"
            style={{ color: C.white, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:text-[#59e0f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e0f0]"
              style={{ color: C.mute }}
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
              variant={sort === s ? "fill" : "ghost"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={11} aria-hidden="true" />
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Frame className="flex flex-col items-center px-6 py-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.cyanDim }} />
          </span>
          <p className="mt-4 text-[17px] font-semibold" style={{ color: C.white }}>
            Geen treffers
          </p>
          <p className="mt-1.5 max-w-sm text-[12px]" style={{ color: C.mute }}>
            {q ? `“${q}” levert niets op.` : "Je zoekterm levert niets op."} Verruim je
            zoekopdracht.
          </p>
          <Btn variant="line" size="sm" className="mt-4" onClick={() => setQ("")}>
            Zoekterm wissen
          </Btn>
        </Frame>
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
    <Frame as="article" label={`opd · ${String(index + 1).padStart(2, "0")}`}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <span className="shrink-0 self-center sm:self-start">
          <MatchGauge value={opdracht.match} size={68} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
              style={{
                color: strong ? C.cyan : C.cyanDim,
                border: `1px solid ${strong ? C.cyan : C.line}`,
              }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <Dim>{opdracht.id}</Dim>
          </div>
          <h3 className="mt-2 text-[16px] font-semibold leading-snug" style={{ color: C.white }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[11.5px]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: C.mute, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-left sm:text-right">
          <span className="block text-[15px] font-semibold" style={{ color: C.cyan, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <Dim>per uur</Dim>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e0f0]"
          style={{ color: C.cyan }}
        >
          <Ruler size={12} aria-hidden="true" />
          {open ? "Verberg redenen" : "Waarom deze match"}
        </button>
        <div className="ml-auto">
          <Btn variant="fill" size="sm" onClick={onOpen}>
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
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              Icon={Check}
              color={C.cyan}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              Icon={AlertTriangle}
              color={C.amber}
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
  Icon,
  color,
  items,
}: {
  titel: string;
  Icon: LucideIcon;
  color: string;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12px] leading-snug"
            style={{ color: C.mute }}
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rotate-45"
              style={{ background: color }}
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
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowRight size={12} aria-hidden="true" className="rotate-180" /> Terug
      </Btn>

      <Frame label="detail" className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <MatchGauge value={opdracht.match} size={56} />
          <div>
            <Dim>{opdracht.id}</Dim>
            <span
              className="mt-1 block px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
              style={{
                color: strong ? C.cyan : C.cyanDim,
                border: `1px solid ${strong ? C.cyan : C.line}`,
                width: "fit-content",
              }}
            >
              {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
            </span>
          </div>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[25px] font-semibold leading-[1.12] tracking-[-0.01em] md:text-[32px]"
          style={{ color: C.white }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px]" style={{ color: C.mute }}>
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn variant="fill">
            Reageren op opdracht <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </Frame>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Frame key={m.l} className="p-3.5">
            <Dim>{m.l}</Dim>
            <p className="mt-1.5 text-[16px] font-semibold" style={{ color: C.white, ...num }}>
              {m.v}
            </p>
          </Frame>
        ))}
      </div>

      <section>
        <Dim>motivering</Dim>
        <h2
          className="mt-1 text-[18px] font-semibold tracking-[-0.01em]"
          style={{ color: C.white }}
        >
          Waarom deze match past
        </h2>
        <p className="mb-4 mt-1.5 max-w-xl text-[12.5px] leading-relaxed" style={{ color: C.mute }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Frame label="voordeel" className="p-4">
            <ul className="space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px] leading-snug"
                  style={{ color: C.mute }}
                >
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.cyan }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame label="let-op" className="p-4">
            <ul className="space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px] leading-snug"
                  style={{ color: C.mute }}
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Dim>vertrouwensregister</Dim>
          <h1
            className="mt-1 text-[24px] font-semibold tracking-[-0.01em]"
            style={{ color: C.white }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed" style={{ color: C.mute }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Documenten worden versleuteld
            bewaard en enkel met jouw toestemming gedeeld.
          </p>
        </div>
        <Frame label="dossier" className="p-4">
          <div className="flex items-baseline justify-between">
            <span
              className="text-[38px] font-semibold leading-none"
              style={{ color: C.cyan, ...num }}
            >
              {ratio}%
            </span>
            <Dim>op orde</Dim>
          </div>
          <div
            className="mt-3 h-2 w-full"
            style={{ border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <span
              className="block h-full"
              style={{
                width: `${ratio}%`,
                background: C.cyan,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Frame>
      </section>

      <section>
        <Dim>certificaten</Dim>
        <h2
          className="mb-3 mt-1 text-[18px] font-semibold tracking-[-0.01em]"
          style={{ color: C.white }}
        >
          Documentregister
        </h2>
        <Frame>
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[rgba(89,224,240,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#59e0f0]"
                  >
                    <t.Icon size={16} aria-hidden="true" style={{ color: t.color }} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.white }}
                      >
                        {c.naam}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px]" style={{ color: C.mute }}>
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusChip tone={t} />
                    </span>
                    <span
                      className="text-[14px] font-semibold transition-transform motion-reduce:transition-none"
                      style={{ color: C.cyanDim, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                          className="max-w-xl text-[12px] leading-relaxed"
                          style={{ color: C.mute }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="fill">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="ghost">
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
        <Dim>documentenkast</Dim>
        <h2
          className="mb-3 mt-1 text-[18px] font-semibold tracking-[-0.01em]"
          style={{ color: C.white }}
        >
          Dossier
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Frame key={d.naam} className="flex items-center gap-3 p-3">
                <FileText size={16} aria-hidden="true" style={{ color: C.cyanDim }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[12.5px] font-semibold"
                    style={{ color: C.white }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10px]" style={{ color: C.faint }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusChip tone={t} />
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
    <div className="space-y-5">
      <div>
        <Dim>takenlijst</Dim>
        <h1
          className="mt-1 text-[24px] font-semibold tracking-[-0.01em]"
          style={{ color: C.white }}
        >
          Wat je aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[12px]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.amber : C.cyan;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Frame className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start" active={warn}>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-[13px] font-semibold"
                  style={{ color, border: `1px solid ${color}`, ...num }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1 text-[15px] font-semibold leading-snug"
                    style={{ color: C.white }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[12px] leading-relaxed"
                    style={{ color: C.mute }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "fill" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={12} aria-hidden="true" />
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
function factuurColor(status: string): string {
  if (status === "Betaald") return C.cyan;
  if (status === "Openstaand") return C.amber;
  return C.mute;
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
          <Dim>grootboek</Dim>
          <h1
            className="mt-1 text-[24px] font-semibold tracking-[-0.01em]"
            style={{ color: C.white }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="fill">+ Nieuwe factuur</Btn>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", c: C.cyan },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", c: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", c: C.mute },
        ].map((s) => (
          <Frame key={s.l} className="p-4">
            <Dim>{s.l}</Dim>
            <p className="mt-1 text-[20px] font-semibold" style={{ color: s.c, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[10.5px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Frame>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn key={s} size="sm" variant={sort === s ? "fill" : "ghost"} onClick={() => setSort(s)}>
            <ArrowUpDown size={11} aria-hidden="true" />
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
                  className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const color = factuurColor(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(89,224,240,0.05)]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3 text-[11.5px]" style={{ color: C.mute, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] font-semibold" style={{ color: C.white }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[11.5px]" style={{ color: C.faint, ...num }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-[12.5px] font-semibold"
                    style={{ color: C.white, ...num }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color, border: `1px solid ${color}` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rotate-45"
                        style={{ background: color }}
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
      </Frame>
    </div>
  );
}
