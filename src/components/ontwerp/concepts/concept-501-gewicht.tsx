"use client";

// Concept 501 — "Gewicht" · Kinetische variabele typografie. Zwart-wit inkt op zuiver wit met
// één elektrisch signaal-accent. Displaykoppen schalen mee met de viewport (clamp + vw) en
// morphen in gewicht (font-variation-settings 'wght') en letterafstand op hover/interactie via
// CSS-transitions. Beweging draagt de hiërarchie: wat telt wordt zwaarder en breder. Status
// altijd met label + icoon — nooit enkel kleur. Alle motion respecteert prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
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

// — Palet: pure inkt op wit, één elektrisch signaal —
const C = {
  ink: "#08080a",
  ink2: "#2c2c31",
  mute: "#66666e",
  faint: "#9a9aa2",
  line: "#e7e7ea",
  lineSoft: "#f1f1f3",
  paper: "#ffffff",
  signal: "#1b13ff",
  signalInk: "#120bd6",
  signalSoft: "rgba(27,19,255,0.07)",
};

const sans = {
  fontFamily:
    "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = {
  fill: string;
  text: string;
  border: string;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
};

// Monochroom-eerst: onderscheid via vulling/rand/icoon, signaal alleen bij alarm.
function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        fill: C.ink,
        text: "#ffffff",
        border: C.ink,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        fill: "#ffffff",
        text: C.ink,
        border: C.ink,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        fill: C.signal,
        text: "#ffffff",
        border: C.signal,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        fill: "#ffffff",
        text: C.signal,
        border: C.signal,
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — Kinetische tekst: elk teken morpht in gewicht + breedte op hover, gestaggerd —
function Kinetic({
  text,
  className = "",
  wmin = 300,
  wmax = 860,
  style,
}: {
  text: string;
  className?: string;
  wmin?: number;
  wmax?: number;
  style?: React.CSSProperties;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  return (
    <span
      className={`k-word inline-block ${className}`}
      style={{ ["--wmin" as string]: wmin, ["--wmax" as string]: wmax, ...style }}
    >
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="k-char inline-block"
          style={{ transitionDelay: `${i * 16}ms` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
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
  variant?: "solid" | "line" | "signal" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-2 text-[12px]" : "px-6 py-3 text-[13.5px]";
  const base =
    "group/btn inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.08em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1b13ff] focus-visible:ring-offset-white";
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: C.ink, color: "#fff", border: `1px solid ${C.ink}` },
    signal: { background: C.signal, color: "#fff", border: `1px solid ${C.signal}` },
    line: { background: "#fff", color: C.ink, border: `1px solid ${C.ink}` },
    ghost: { background: "transparent", color: C.ink2, border: "1px solid transparent" },
  };
  const hover =
    variant === "ghost"
      ? "hover:tracking-[0.14em]"
      : "hover:tracking-[0.14em] hover:brightness-110";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={{ ...styles[variant], ...sans }}
    >
      {children}
    </button>
  );
}

function StatusPill({ fill, text, border, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
      style={{ background: fill, color: text, border: `1px solid ${border}` }}
    >
      <Icon size={12} aria-hidden="true" strokeWidth={2.5} />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Match als groot kinetisch cijfer met een vertical weight-balk —
function MatchWeight({ value, big = false }: { value: number; big?: boolean }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-end gap-2" aria-label={`Match ${value} procent`} style={num}>
      <span className="flex flex-col items-stretch justify-end" aria-hidden="true">
        <span
          className="w-[5px]"
          style={{
            height: big ? 46 : 34,
            background: `linear-gradient(180deg, ${strong ? C.signal : C.ink} ${value}%, ${C.line} ${value}%)`,
          }}
        />
      </span>
      <span className="leading-none">
        <span
          className="block font-bold leading-none"
          style={{
            fontSize: big ? 44 : 30,
            color: strong ? C.signal : C.ink,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </span>
        <span
          className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: C.faint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={line} fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={last[0] - 2} y={last[1] - 2} width="4" height="4" fill={C.signal} />
    </svg>
  );
}

function Rule({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: C.ink }}>
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept501() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      {/* Fijn achtergrondraster — meetkundig, rustig */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-10">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="k-fade pt-10">
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
        .k-word .k-char {
          font-variation-settings: 'wght' var(--wmin, 400);
          font-weight: 400;
          transition: font-variation-settings .55s cubic-bezier(.22,1,.36,1),
                      letter-spacing .5s cubic-bezier(.22,1,.36,1),
                      transform .5s cubic-bezier(.22,1,.36,1);
        }
        .k-word:hover .k-char, .k-word:focus-within .k-char {
          font-variation-settings: 'wght' var(--wmax, 800);
          letter-spacing: 0.01em;
          transform: translateY(-1px);
        }
        .k-row { transition: background .25s ease, padding-left .3s cubic-bezier(.22,1,.36,1); }
        .k-row:hover { background: ${C.lineSoft}; padding-left: 14px; }
        .k-under { background-image: linear-gradient(${C.signal},${C.signal}); background-size: 0% 2px; background-repeat: no-repeat; background-position: 0 100%; transition: background-size .35s cubic-bezier(.22,1,.36,1); }
        .group\\/btn:hover .k-arrow { transform: translateX(3px); }
        .k-arrow { transition: transform .3s cubic-bezier(.22,1,.36,1); }
        @keyframes kFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .k-fade { animation: kFade .45s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .k-word .k-char, .k-row, .k-under, .k-arrow, .k-fade { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex flex-wrap items-center gap-4 pt-8"
      style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 20 }}
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-[15px] font-bold uppercase leading-none tracking-[0.02em]"
          style={{ color: C.ink }}
        >
          <Kinetic text="GEWICHT" wmin={500} wmax={900} />
        </span>
        <span className="h-3.5 w-px" style={{ background: C.line }} aria-hidden="true" />
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.mute }}>
          Ontwerp-lab
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: "#fff", background: C.ink }}
        >
          <ShieldCheck size={13} aria-hidden="true" strokeWidth={2.5} /> {PROFIEL.trust}
        </span>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#f1f1f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
          style={{ border: `1px solid ${C.line}`, color: C.ink2 }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold text-white"
              style={{ background: C.signal }}
            >
              {ongelezen}
            </span>
          )}
        </button>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-bold"
          style={{ background: C.ink, color: "#fff" }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6 flex flex-wrap items-stretch gap-0">
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1b13ff]"
            style={{
              color: on ? C.ink : C.mute,
              borderLeft: i === 0 ? `1px solid ${C.line}` : "none",
              borderRight: `1px solid ${C.line}`,
              borderBottom: on ? `2px solid ${C.signal}` : `2px solid transparent`,
              background: on ? "#fff" : "transparent",
            }}
          >
            {s.label}
          </button>
        );
      })}
      <span
        className="hidden flex-1 self-stretch md:block"
        style={{ borderBottom: `1px solid ${C.line}` }}
        aria-hidden="true"
      />
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
  const voornaam = PROFIEL.naam.split(" ")[0];

  return (
    <div className="space-y-14">
      <section>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.signal }}
        >
          Overzicht — {PROFIEL.plaats}
        </p>
        <h1
          className="mt-4 leading-[0.92]"
          style={{
            color: C.ink,
            fontSize: "clamp(2.6rem, 9vw, 6.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          <Kinetic text="Goedemorgen," wmin={280} wmax={760} />
          <br />
          <Kinetic text={voornaam + "."} wmin={620} wmax={900} className="text-[var(--x)]" />
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed" style={{ color: C.ink2 }}>
          Je register is geverifieerd en op orde. Verse opdrachten sluiten aan op je profiel, en één
          document vraagt binnenkort om aandacht.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Btn variant="signal" onClick={onActies}>
            Volgende actie <ArrowRight size={14} aria-hidden="true" className="k-arrow" />
          </Btn>
          <Btn variant="line" onClick={onMarkt}>
            Naar marktplaats
          </Btn>
        </div>
      </section>

      <section>
        <Rule label="Kerncijfers" />
        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.line }}
        >
          {KPIS.map((k) => (
            <div key={k.label} className="k-row bg-white p-5">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.mute }}
              >
                {k.label}
              </p>
              <p
                className="mt-3 font-bold leading-none"
                style={{ color: C.ink, fontSize: 30, letterSpacing: "-0.03em", ...num }}
              >
                {k.value}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: k.up ? C.signal : C.ink2, ...num }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Spark data={k.spark} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Rule label="Aanbevolen opdrachten" />
          <ul style={{ borderTop: `1px solid ${C.line}` }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onMarkt}
            className="k-under mt-5 inline-flex items-center gap-1.5 pb-0.5 text-[12px] font-bold uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
            style={{ color: C.ink }}
          >
            Volledige lijst <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>

        <aside className="space-y-8">
          <div className="p-6" style={{ border: `1px solid ${C.ink}`, background: "#fff" }}>
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.signal }}
            >
              <AlertTriangle size={13} aria-hidden="true" strokeWidth={2.5} /> Termijn nadert
            </span>
            <h3
              className="mt-3 text-[19px] font-bold leading-tight"
              style={{ color: C.ink, letterSpacing: "-0.01em" }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
              {primair.detail}
            </p>
            <Btn variant="signal" size="sm" className="mt-5 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" className="k-arrow" />
            </Btn>
          </div>

          <div className="p-6" style={{ border: `1px solid ${C.line}` }}>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.mute }}
            >
              Dossier op orde
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="font-bold leading-none"
                style={{ color: C.ink, fontSize: 46, letterSpacing: "-0.04em", ...num }}
              >
                {ratio}
              </span>
              <span className="text-[22px] font-bold" style={{ color: C.faint }}>
                %
              </span>
            </div>
            <div className="mt-4 flex h-3 w-full gap-px" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="flex-1"
                  style={{ background: c.status === "VERIFIED" ? C.ink : C.line }}
                />
              ))}
            </div>
            <p className="mt-3 text-[12px]" style={{ color: C.mute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="k-row group/btn flex w-full items-center gap-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1b13ff]"
    >
      <MatchWeight value={opdracht.match} />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[17px] font-bold leading-snug"
          style={{ color: C.ink, letterSpacing: "-0.01em" }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-1 flex items-center gap-1.5 truncate text-[12.5px] uppercase tracking-[0.06em]"
          style={{ color: C.mute }}
        >
          <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[16px] font-bold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.faint }}
        >
          per uur
        </span>
      </span>
      <ChevronRight
        size={18}
        aria-hidden="true"
        className="k-arrow shrink-0"
        style={{ color: C.ink }}
      />
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
    <div className="space-y-8">
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.signal }}
        >
          Marktplaats
        </p>
        <h1
          className="mt-3 leading-[0.95]"
          style={{ color: C.ink, fontSize: "clamp(2rem, 6vw, 3.6rem)", letterSpacing: "-0.03em" }}
        >
          <Kinetic text="Opdrachten die passen" wmin={340} wmax={820} />
        </h1>
        <p className="mt-3 text-[13px] uppercase tracking-[0.08em]" style={{ color: C.mute }}>
          {filtered.length} van {OPDRACHTEN.length} sluiten aan op je profiel
        </p>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{
          borderTop: `1px solid ${C.ink}`,
          borderBottom: `1px solid ${C.line}`,
          paddingTop: 14,
          paddingBottom: 14,
        }}
      >
        <div className="flex flex-1 items-center gap-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a9aa2]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#f1f1f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
              style={{ color: C.mute }}
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
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-px" aria-hidden="true" style={{ background: C.line }}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="bg-white p-6">
              <div className="space-y-3">
                <div
                  className="h-5 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul style={{ borderTop: `1px solid ${C.line}` }}>
          {filtered.map((o, i) => (
            <li key={o.id} style={{ borderBottom: `1px solid ${C.line}` }}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-6 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="text-[10px] uppercase tracking-[0.14em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
            style={{ color: C.faint }}
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
    <div
      className="flex flex-col items-center px-6 py-20 text-center"
      style={{ border: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{ border: `1px solid ${C.ink}`, color: C.ink }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[22px] font-bold" style={{ color: C.ink, letterSpacing: "-0.02em" }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-6" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
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
    <article className="k-row bg-white">
      <div className="flex items-start gap-5 py-6">
        <span
          className="hidden shrink-0 pt-1 text-[13px] font-bold tabular-nums sm:block"
          style={{ color: C.faint }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <MatchWeight value={opdracht.match} big />
        <div className="min-w-0 flex-1">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: strong ? C.signal : C.mute }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.id}
          </span>
          <h3
            className="mt-1.5 text-[21px] font-bold leading-tight"
            style={{ color: C.ink, letterSpacing: "-0.015em" }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px] uppercase tracking-[0.05em]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: C.ink2, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right md:block">
          <span className="block text-[20px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 pb-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-[#1b13ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
          style={{ color: C.ink }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" className="k-arrow" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18 }}
          >
            <RedenKolom
              titel="In je voordeel"
              Icon={Check}
              tone={C.ink}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              Icon={AlertTriangle}
              tone={C.signal}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function RedenKolom({
  titel,
  Icon,
  tone,
  items,
}: {
  titel: string;
  Icon: LucideIcon;
  tone: string;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" strokeWidth={2.5} /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.ink2 }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0"
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
    <div className="space-y-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-[#1b13ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b13ff]"
        style={{ color: C.mute }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <header style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 24 }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[11.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.mute, ...num }}
          >
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span
            className="text-[11.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: strong ? C.signal : C.ink }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-3xl leading-[0.98]"
          style={{
            color: C.ink,
            fontSize: "clamp(2.1rem, 6.5vw, 4.2rem)",
            letterSpacing: "-0.03em",
          }}
        >
          <Kinetic text={opdracht.titel} wmin={360} wmax={840} />
        </h1>
        <p
          className="mt-4 flex items-center gap-1.5 text-[14px] uppercase tracking-[0.05em]"
          style={{ color: C.mute }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="signal">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" className="k-arrow" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div
        className="grid grid-cols-2 gap-px sm:grid-cols-4"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="bg-white p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.mute }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[20px] font-bold leading-none"
              style={{ color: C.ink, letterSpacing: "-0.02em", ...num }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Rule label="Waarom deze match bij je past" />
        <p className="mb-6 max-w-xl text-[14px] leading-relaxed" style={{ color: C.ink2 }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div style={{ borderLeft: `2px solid ${C.ink}`, paddingLeft: 18 }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.ink }}
            >
              <Check size={13} aria-hidden="true" strokeWidth={2.5} /> In je voordeel
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14.5px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.5}
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderLeft: `2px solid ${C.signal}`, paddingLeft: 18 }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.signal }}
            >
              <AlertTriangle size={13} aria-hidden="true" strokeWidth={2.5} /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14.5px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.5}
                    style={{ color: C.signal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 22 }}>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.signal }}
          >
            Vertrouwensregister
          </p>
          <h1
            className="mt-3 leading-[0.98]"
            style={{
              color: C.ink,
              fontSize: "clamp(2rem, 5.5vw, 3.4rem)",
              letterSpacing: "-0.03em",
            }}
          >
            <Kinetic text={PROFIEL.trust} wmin={360} wmax={860} />
          </h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </div>
        <div
          className="flex flex-col justify-center p-7"
          style={{ background: C.ink, color: "#fff" }}
        >
          <span
            className="font-bold leading-none"
            style={{ fontSize: 64, letterSpacing: "-0.05em", ...num }}
          >
            {ratio}%
          </span>
          <p
            className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "#b9b9c2" }}
          >
            dossier op orde
          </p>
          <div className="mt-5 flex h-3 w-full gap-px" aria-hidden="true">
            {CREDENTIALS.map((c) => (
              <span
                key={c.naam}
                className="flex-1"
                style={{ background: c.status === "VERIFIED" ? C.signal : "#33333a" }}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <Rule label="Certificaten" />
        <ul style={{ borderTop: `1px solid ${C.line}` }}>
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="k-row flex w-full items-center gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1b13ff]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    style={{ background: t.fill, color: t.text, border: `1px solid ${t.border}` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[16px] font-bold"
                      style={{ color: C.ink, letterSpacing: "-0.01em" }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12px] uppercase tracking-[0.05em]"
                      style={{ color: C.mute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusPill {...t} />
                  </span>
                  <span
                    className="text-[18px] font-bold transition-transform motion-reduce:transition-none"
                    style={{ color: C.ink, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                    <div className="pb-6 sm:pl-[60px]" style={{ paddingTop: 4 }}>
                      <span className="mb-3 inline-flex sm:hidden">
                        <StatusPill {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.ink2 }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Btn size="sm" variant="solid">
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
      </section>

      <section>
        <Rule label="Documentenkast" />
        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2"
          style={{ background: C.line, border: `1px solid ${C.line}` }}
        >
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <div key={d.naam} className="k-row flex items-center gap-3 bg-white p-4">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ border: `1px solid ${C.line}`, color: C.ink2 }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span
                    className="block text-[11px] uppercase tracking-[0.05em]"
                    style={{ color: C.mute, ...num }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusPill {...t} />
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
    <div className="space-y-8">
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.signal }}
        >
          Agenda
        </p>
        <h1
          className="mt-3 leading-[0.95]"
          style={{ color: C.ink, fontSize: "clamp(2rem, 6vw, 3.6rem)", letterSpacing: "-0.03em" }}
        >
          <Kinetic text="Wat je aandacht vraagt" wmin={340} wmax={840} />
        </h1>
        <p className="mt-3 text-[13px] uppercase tracking-[0.08em]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden
        </p>
      </div>

      <ol style={{ borderTop: `1px solid ${C.line}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel} className="k-row" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-start gap-5 py-6">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-[16px] font-bold"
                  style={{
                    background: warn ? C.signal : "#fff",
                    color: warn ? "#fff" : C.ink,
                    border: `1px solid ${warn ? C.signal : C.ink}`,
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: warn ? C.signal : C.mute }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" strokeWidth={2.5} />
                    ) : (
                      <Clock size={12} aria-hidden="true" strokeWidth={2.5} />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[19px] font-bold leading-snug"
                    style={{ color: C.ink, letterSpacing: "-0.01em" }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.ink2 }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "signal" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" className="k-arrow" />
                    </Btn>
                  </div>
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
function factuurTone(status: string): { fill: string; text: string; border: string } {
  if (status === "Betaald") return { fill: C.ink, text: "#fff", border: C.ink };
  if (status === "Openstaand") return { fill: C.signal, text: "#fff", border: C.signal };
  if (status === "Concept") return { fill: "#fff", text: C.ink, border: C.ink };
  return { fill: "#fff", text: C.signal, border: C.signal };
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.signal }}
          >
            Grootboek
          </p>
          <h1
            className="mt-3 leading-[0.95]"
            style={{ color: C.ink, fontSize: "clamp(2rem, 6vw, 3.6rem)", letterSpacing: "-0.03em" }}
          >
            <Kinetic text="Je facturen" wmin={360} wmax={880} />
          </h1>
        </div>
        <Btn variant="signal">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div
        className="grid grid-cols-1 gap-px sm:grid-cols-3"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", signal: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", signal: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", signal: false },
        ].map((s) => (
          <div key={s.l} className="bg-white p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.mute }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-bold leading-none"
              style={{ color: s.signal ? C.signal : C.ink, letterSpacing: "-0.03em", ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1.5 text-[11.5px]" style={{ color: C.mute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "ghost"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left" style={{ minWidth: 560 }}>
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: C.ink }}
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
                  className="transition-colors hover:bg-[#f7f7f9]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <td className="px-5 py-4 text-[12.5px]" style={{ color: C.ink2, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-5 py-4 text-[14px] font-bold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-5 py-4 text-[12.5px]" style={{ color: C.mute, ...num }}>
                    {f.datum}
                  </td>
                  <td className="px-5 py-4 text-[14px] font-bold" style={{ color: C.ink, ...num }}>
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                      style={{ background: t.fill, color: t.text, border: `1px solid ${t.border}` }}
                    >
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
