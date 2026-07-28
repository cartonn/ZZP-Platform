"use client";

// Concept 495 — "Ademtype" · Kinetische typografie waarin de letter zélf de interface is. Enorme,
// "ademende" neo-serif koppen (subtiel schuivende letter-spacing/gewicht) tegenover strakke mono-metadata
// voor cijfers en labels. Minimale chrome: geen kaders, alleen haarlijnen en witruimte. Één koraal-accent.
// Rustig, expressief, premium — type-over-UI (2026 variabele-font trend).

import { useMemo, useState, type ReactNode, type CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
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

// — Palet: warm papierwit, diepe inkt, één koraal-accent —
const C = {
  bg: "#f5f2ec",
  ink: "#151210",
  inkSoft: "#4a4640",
  inkMute: "#867f74",
  inkFaint: "#b3aa9c",
  rule: "#ddd6c8",
  ruleSoft: "#e8e2d5",

  accent: "#e0472e",
  accentDeep: "#bd3620",

  ok: "#3f7a4b",
  wait: "#4f6d8f",
  warn: "#b57516",
};

const display: CSSProperties = {
  fontFamily: "'Playfair Display', 'Bodoni MT', 'Didot', 'Big Caslon', Georgia, serif",
};
const mono: CSSProperties = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Roboto Mono', 'JetBrains Mono', Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
};

function statusInfo(s: CredStatus): {
  label: string;
  tone: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: C.ok, Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: C.wait, Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: C.warn, Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", tone: C.accent, Icon: X, alarm: true };
  }
}

// — Mono-kicker: klein bovenlabel in kapitalen —
function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10.5px] font-medium uppercase tracking-[0.34em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </span>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return (
    <span className={`block h-px ${className}`} style={{ background: C.rule }} aria-hidden="true" />
  );
}

// — Tekst-knop: geen doos, alleen type + onderstreping/vlak —
function Btn({
  children,
  onClick,
  variant = "solid",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "text";
  className?: string;
  ariaLabel?: string;
}) {
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.ink, color: C.bg, border: `1px solid ${C.ink}` }
      : variant === "line"
        ? { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` }
        : { background: "transparent", color: C.accent, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-none px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f2ec] ${className}`}
      style={{ ...style, ...mono }}
    >
      {children}
    </button>
  );
}

function StatusTag({ s }: { s: CredStatus }) {
  const info = statusInfo(s);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: info.tone, ...mono }}
    >
      <info.Icon size={12} aria-hidden="true" />
      {info.label}
      {info.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Match als enorme ademende cijfer-glyph —
function MatchGlyph({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const strong = value >= 90;
  const tone = strong ? C.ink : C.accent;
  const cls = size === "lg" ? "text-[76px]" : size === "sm" ? "text-[34px]" : "text-[52px]";
  return (
    <span
      className="inline-flex items-start leading-none"
      style={{ color: tone, ...display }}
      aria-label={`Match ${value} procent`}
    >
      <span className={`font-semibold ${cls}`}>{value}</span>
      <span className="ml-0.5 mt-1 text-[0.34em] font-medium" style={{ color: C.inkMute, ...mono }}>
        %
      </span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 22;
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

export function Concept495() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{ background: C.bg, color: C.ink }}
    >
      <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8 md:px-12">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ad-fade pt-10">
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
        @keyframes adFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ad-fade { animation: adFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes adBreathe {
          0%, 100% { letter-spacing: -0.02em; font-weight: 600; }
          50% { letter-spacing: 0.004em; font-weight: 620; }
        }
        .ad-breathe { animation: adBreathe 7s ease-in-out infinite; }
        .ad-hoverscale { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); transform-origin: left; display: inline-block; }
        .ad-hoverscale:hover { transform: scale(1.015); }
        @media (prefers-reduced-motion: reduce) {
          .ad-fade, .ad-breathe { animation: none !important; }
          .ad-hoverscale { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pt-8">
      <div className="flex items-baseline gap-3">
        <span
          className="text-[26px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Ademtype
        </span>
        <span
          className="hidden text-[10px] uppercase tracking-[0.28em] sm:inline"
          style={{ color: C.inkMute, ...mono }}
        >
          voor zelfstandigen
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.ok, ...mono }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          Post{" "}
          <span className="font-semibold" style={{ color: C.accent }}>
            {ongelezen}
          </span>
        </span>
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: C.ink, ...mono }}
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
      className="mt-6 border-b border-t py-3"
      style={{ borderColor: C.rule }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative rounded-none pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
              style={{ color: on ? C.ink : C.inkMute, ...mono }}
            >
              {s.label}
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[13px] left-0 right-0 h-[2px]"
                  style={{ background: C.accent }}
                />
              )}
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
    <div className="space-y-14">
      <section>
        <Kicker>Dashboard · {new Date().getFullYear()}</Kicker>
        <h1
          className="mt-4 max-w-3xl text-[46px] font-semibold leading-[0.98] tracking-[-0.02em] sm:text-[64px] md:text-[80px]"
          style={{ color: C.ink, ...display }}
        >
          <span className="ad-breathe ad-hoverscale block">Goedemorgen,</span>
          <span className="ad-hoverscale block" style={{ color: C.accent }}>
            {PROFIEL.naam.split(" ")[0]}.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
          Uw dossier is geverifieerd en op orde. Verse opdrachten sluiten aan bij uw profiel, en één
          document vraagt binnenkort om aandacht.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Btn variant="solid" onClick={onActies}>
            Volgende actie <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="line" onClick={onMarkt}>
            Naar de marktplaats
          </Btn>
        </div>
      </section>

      <section>
        <Kicker>Kerncijfers</Kicker>
        <Rule className="mt-3" />
        <div
          className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
          style={{ borderColor: C.ruleSoft }}
        >
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="py-6 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
              style={{ borderColor: C.rule }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {k.label}
              </p>
              <p
                className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...display }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: k.up ? C.ok : C.warn, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Spark data={k.spark} tone={C.inkFaint} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-end justify-between">
            <div>
              <Kicker>Aanbevolen</Kicker>
              <h2
                className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ color: C.ink, ...display }}
              >
                Opdrachten voor u
              </h2>
            </div>
            <button
              type="button"
              onClick={onMarkt}
              className="mb-1 rounded-none text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
              style={{ color: C.accent, ...mono }}
            >
              Alle →
            </button>
          </div>
          <Rule className="mt-4" />
          <ul>
            {OPDRACHTEN.map((o) => (
              <li key={o.id} className="border-b" style={{ borderColor: C.ruleSoft }}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-10">
          <div>
            <Kicker tone={C.warn}>Vraagt aandacht</Kicker>
            <h3
              className="mt-3 text-[24px] font-semibold leading-snug tracking-[-0.01em]"
              style={{ color: C.ink, ...display }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="line" className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
          <div>
            <Kicker>Vertrouwen</Kicker>
            <p
              className="mt-2 text-[72px] font-semibold leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...display }}
            >
              {ratio}
              <span className="align-super text-[0.34em]" style={{ color: C.inkMute, ...mono }}>
                %
              </span>
            </p>
            <div
              className="mt-3 h-1 w-full overflow-hidden"
              style={{ background: C.ruleSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full"
                style={{
                  width: `${ratio}%`,
                  background: C.ok,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p
              className="mt-2 text-[12px] uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {verified} van {CREDENTIALS.length} geverifieerd
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
      className="group flex w-full items-center gap-5 py-5 text-left transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
    >
      <span className="w-16 shrink-0">
        <MatchGlyph value={opdracht.match} size="sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[20px] font-semibold leading-snug tracking-[-0.01em]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] uppercase tracking-[0.06em]"
          style={{ color: C.inkMute, ...mono }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...mono }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </span>
      <ArrowRight
        size={18}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-1"
        style={{ color: C.accent }}
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
    <div className="space-y-8">
      <div>
        <Kicker>Marktplaats</Kicker>
        <h1
          className="mt-3 text-[40px] font-semibold leading-[1.0] tracking-[-0.02em] sm:text-[54px]"
          style={{ color: C.ink, ...display }}
        >
          <span className="ad-hoverscale block">Opdrachten die</span>
          <span className="ad-hoverscale block">bij u passen.</span>
        </h1>
        <p
          className="mt-3 text-[12px] uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
        >
          {filtered.length} van {OPDRACHTEN.length} sluiten aan op uw profiel
        </p>
      </div>

      <div
        className="flex flex-col gap-4 border-b border-t py-4 sm:flex-row sm:items-center"
        style={{ borderColor: C.rule }}
      >
        <div className="flex flex-1 items-center gap-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#b3aa9c]"
            style={{ color: C.ink, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-none transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="inline-flex items-center gap-1.5 rounded-none pb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
                style={{
                  color: on ? C.ink : C.inkMute,
                  borderBottom: `2px solid ${on ? C.accent : "transparent"}`,
                  ...mono,
                }}
              >
                <ArrowUpDown size={12} aria-hidden="true" />
                {s === "match" ? "Beste match" : "Hoogste tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Search size={26} aria-hidden="true" style={{ color: C.inkFaint }} />
          <p
            className="mt-4 text-[30px] font-semibold tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Niets gevonden
          </p>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Er is geen opdracht voor {q ? `“${q}”` : "uw zoekterm"}. Verruim uw zoekopdracht.
          </p>
          <Btn variant="line" className="mt-5" onClick={() => setQ("")}>
            Zoekterm wissen
          </Btn>
        </div>
      ) : (
        <ul>
          {filtered.map((o, i) => (
            <li key={o.id} className="border-b" style={{ borderColor: C.ruleSoft }}>
              <MarktRij opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktRij({
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
    <article className="py-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <MatchGlyph value={opdracht.match} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: strong ? C.ok : C.accent, ...mono }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span
              className="text-[10.5px] uppercase tracking-[0.1em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p
            className="mt-1 text-[12px] uppercase tracking-[0.06em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] uppercase tracking-[0.06em]"
                style={{ color: C.inkSoft, borderBottom: `1px solid ${C.rule}`, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className="text-[22px] font-semibold tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            per uur
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-none pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
          style={{ color: C.accent, borderBottom: `1px solid ${C.accent}`, ...mono }}
        >
          {open ? "Verberg redenen" : "Waarom deze match"}
        </button>
        <div className="ml-auto">
          <Btn variant="solid" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <RedenKolom
              titel="In uw voordeel"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
              Icon={AlertTriangle}
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
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[14px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full"
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
        className="inline-flex items-center gap-1.5 rounded-none text-[11px] font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
        style={{ color: C.inkMute, ...mono }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.ok : C.accent, ...mono }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-3xl text-[42px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[58px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-3 flex items-center gap-1.5 text-[13px] uppercase tracking-[0.06em]"
          style={{ color: C.inkMute, ...mono }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div
        className="grid grid-cols-2 gap-6 border-b border-t py-6 sm:grid-cols-4"
        style={{ borderColor: C.rule }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tracking-[-0.01em]"
              style={{ color: C.ink, ...display }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Kicker>Motivering</Kicker>
        <h2
          className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...display }}
        >
          Waarom deze match bij u past
        </h2>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen uw geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.ok, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> In uw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
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
    <div className="space-y-12">
      <section>
        <Kicker>Vertrouwensregister</Kicker>
        <h1
          className="mt-3 text-[46px] font-semibold leading-[1.0] tracking-[-0.02em] sm:text-[64px]"
          style={{ color: C.ink, ...display }}
        >
          {ratio}
          <span className="align-super text-[0.32em]" style={{ color: C.inkMute, ...mono }}>
            % op orde
          </span>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt bijna
          — tijdig vernieuwen houdt uw dossier compleet. Documenten worden versleuteld bewaard en
          uitsluitend met uw toestemming gedeeld.
        </p>
        <div
          className="mt-5 h-1 w-full max-w-lg overflow-hidden"
          style={{ background: C.ruleSoft }}
          aria-hidden="true"
        >
          <span
            className="block h-full"
            style={{
              width: `${ratio}%`,
              background: C.ok,
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </section>

      <section>
        <Kicker>Certificaten</Kicker>
        <Rule className="mt-3" />
        <ul>
          {CREDENTIALS.map((c) => {
            const info = statusInfo(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} className="border-b" style={{ borderColor: C.ruleSoft }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 py-5 text-left transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
                >
                  <info.Icon size={18} aria-hidden="true" style={{ color: info.tone }} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[19px] font-semibold tracking-[-0.01em]"
                      style={{ color: C.ink, ...display }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px] uppercase tracking-[0.06em]"
                      style={{ color: C.inkMute, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag s={c.status} />
                  </span>
                  <span
                    className="text-[18px]"
                    style={{
                      color: C.accent,
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "transform 0.2s",
                    }}
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
                    <div className="pb-6 sm:pl-[34px]">
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na uw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Btn variant="line">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn variant="text">Historie</Btn>
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
        <Kicker>Documentenkast</Kicker>
        <Rule className="mt-3" />
        <ul>
          {DOCUMENTEN.map((d) => (
            <li
              key={d.naam}
              className="flex items-center gap-3 border-b py-3.5"
              style={{ borderColor: C.ruleSoft }}
            >
              <FileText size={16} aria-hidden="true" style={{ color: C.inkMute }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold" style={{ color: C.ink }}>
                  {d.naam}
                </span>
                <span
                  className="block text-[11px] uppercase tracking-[0.06em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </span>
              </span>
              <StatusTag s={d.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-10">
      <div>
        <Kicker>Agenda</Kicker>
        <h1
          className="mt-3 text-[40px] font-semibold leading-[1.0] tracking-[-0.02em] sm:text-[54px]"
          style={{ color: C.ink, ...display }}
        >
          <span className="ad-hoverscale block">Wat vandaag uw</span>
          <span className="ad-hoverscale block" style={{ color: C.accent }}>
            aandacht vraagt.
          </span>
        </h1>
      </div>

      <ol className="space-y-0">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.wait;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li
              key={a.titel}
              className="grid grid-cols-[auto_1fr] gap-6 border-t py-7"
              style={{ borderColor: C.rule }}
            >
              <span
                className="text-[40px] font-semibold leading-none tracking-[-0.02em]"
                style={{ color: C.inkFaint, ...display }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
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
                  className="mt-2 text-[24px] font-semibold leading-snug tracking-[-0.01em]"
                  style={{ color: C.ink, ...display }}
                >
                  {a.titel}
                </h2>
                <p
                  className="mt-1.5 max-w-lg text-[14px] leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <Btn
                  variant={warn ? "solid" : "line"}
                  className="mt-4"
                  onClick={goMarkt ? onMarkt : undefined}
                >
                  {a.cta} <ArrowRight size={13} aria-hidden="true" />
                </Btn>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): string {
  if (status === "Betaald") return C.ok;
  if (status === "Openstaand") return C.warn;
  if (status === "Concept") return C.wait;
  return C.accent;
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
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-3 text-[40px] font-semibold leading-[1.0] tracking-[-0.02em] sm:text-[54px]"
            style={{ color: C.ink, ...display }}
          >
            Uw facturen
          </h1>
        </div>
        <Btn variant="solid">Nieuwe factuur</Btn>
      </div>

      <section
        className="grid grid-cols-1 gap-8 border-b border-t py-6 sm:grid-cols-3"
        style={{ borderColor: C.rule }}
      >
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.ok },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.wait },
        ].map((s) => (
          <div key={s.l}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[34px] font-semibold tracking-[-0.02em]"
              style={{ color: s.tone, ...display }}
            >
              {s.v}
            </p>
            <p
              className="mt-0.5 text-[11.5px] uppercase tracking-[0.06em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-4" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => {
          const on = sort === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={on}
              className="inline-flex items-center gap-1.5 rounded-none pb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0472e]"
              style={{
                color: on ? C.ink : C.inkMute,
                borderBottom: `2px solid ${on ? C.accent : "transparent"}`,
                ...mono,
              }}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "datum" ? "Op datum" : "Op bedrag"}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr className="border-b" style={{ borderColor: C.rule }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="py-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-opacity hover:opacity-70"
                style={{ borderColor: C.ruleSoft }}
              >
                <td className="py-4 pr-4 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                  {f.nr}
                </td>
                <td
                  className="py-4 pr-4 text-[16px] font-semibold tracking-[-0.01em]"
                  style={{ color: C.ink, ...display }}
                >
                  {f.klant}
                </td>
                <td className="py-4 pr-4 text-[12.5px]" style={{ color: C.inkMute, ...mono }}>
                  {f.datum}
                </td>
                <td
                  className="py-4 pr-4 text-[15px] font-semibold"
                  style={{ color: C.ink, ...mono }}
                >
                  {f.bedrag}
                </td>
                <td className="py-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: factuurTone(f.status), ...mono }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: factuurTone(f.status) }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
