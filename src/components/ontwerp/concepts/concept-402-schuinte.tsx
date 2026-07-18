"use client";

// Concept 402 — "Schuinte" · Anti-grid — gebroken diagonaal editorial.
// Een bewust gebroken raster: diagonale scheidingslijnen, overlappende blokken onder een
// lichte hoek (skew/rotate op containers; de content zelf blijft recht en messcherp leesbaar),
// oversized koppen die de kolomlijn doorbreken. Redactioneel-bold maar strak.
// Palet: bg #f5f3ee, fg #14110d, accent #ff4d2e (vermiljoen), zwart hairline-werk.
// Fonts-gevoel: Space Grotesk / Bricolage (systeem-fallback, geen import nodig).

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Bell,
  Slash,
  CornerDownRight,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm papier, inktzwart, vermiljoen accent —
const C = {
  bg: "#f5f3ee",
  bgAlt: "#efece4",
  paper: "#fbfaf6",
  ink: "#14110d",
  inkSoft: "#3b352d",
  inkMute: "#726a5c",
  inkFaint: "#a39a89",
  accent: "#ff4d2e",
  accentDeep: "#d63414",
  accentWash: "rgba(255,77,46,0.1)",
  hair: "#14110d",
  hairSoft: "rgba(20,17,13,0.14)",
  hairFaint: "rgba(20,17,13,0.08)",
  ok: "#2e7d46",
  okWash: "rgba(46,125,70,0.12)",
  warn: "#b5651d",
  warnWash: "rgba(181,101,29,0.13)",
  info: "#2f5db5",
  infoWash: "rgba(47,93,181,0.12)",
  bad: "#c0362a",
  badWash: "rgba(192,54,42,0.12)",
};

const display = {
  fontFamily: "'Space Grotesk', 'Bricolage Grotesque', system-ui, -apple-system, sans-serif",
  fontFeatureSettings: "'ss01'",
};
const body = {
  fontFamily: "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const mono = {
  fontFamily: "ui-monospace, 'Space Mono', SFMono-Regular, Menlo, Consolas, monospace",
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, tone: C.info, wash: C.infoWash };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, tone: C.bad, wash: C.badWash };
  }
}

// — Diagonale scheidingslijn tussen secties —
function DiagRule({ tone = C.hair, className = "" }: { tone?: string; className?: string }) {
  return (
    <div className={`relative h-5 w-full overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-full w-full">
        <line
          x1="0"
          y1="6"
          x2="100"
          y2="0"
          stroke={tone}
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// — Blok: recht leesvlak, optioneel onder een lichte hoek gezet via wrapper —
function Slab({
  children,
  className = "",
  as: Tag = "div",
  filled = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  filled?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: filled ? C.ink : C.paper,
        border: `1.5px solid ${C.hair}`,
        boxShadow: filled ? "6px 6px 0 0 rgba(255,77,46,0.9)" : "5px 5px 0 0 rgba(20,17,13,0.9)",
        color: filled ? C.bg : C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, tone = C.accentDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...body }}
    >
      <Slash size={12} aria-hidden="true" className="-rotate-12" />
      {children}
    </p>
  );
}

function Tag_({
  children,
  tone,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ color: tone, background: wash, border: `1.5px solid ${tone}`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function SolidButton({
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
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ee] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        background: C.accent,
        border: `1.5px solid ${C.hair}`,
        boxShadow: "3px 3px 0 0 #14110d",
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function LineButton({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ee] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: active ? C.bg : C.ink,
        background: active ? C.ink : "transparent",
        border: `1.5px solid ${C.hair}`,
        boxShadow: active ? "3px 3px 0 0 #ff4d2e" : "3px 3px 0 0 rgba(20,17,13,0.18)",
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Staafgrafiek als editorial bar-set (diagonaal ondersteund door skew) —
function BarSet({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {data.map((d, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(12, (d / max) * 100)}%`,
            background: i === data.length - 1 ? tone : "rgba(20,17,13,0.22)",
          }}
        />
      ))}
    </div>
  );
}

export function Concept402() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* achtergrond diagonale strepen, subtiel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(-24deg, ${C.ink} 0 1px, transparent 1px 46px)`,
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-white"
          style={{
            background: C.accent,
            border: `1.5px solid ${C.hair}`,
            transform: "rotate(-4deg)",
          }}
          aria-hidden="true"
        >
          <Slash size={20} className="-rotate-12" />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...display }}
          >
            Schuinte
          </p>
          <p
            className="mt-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.14em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {PROFIEL.plaats} — editorial
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] sm:inline-flex"
          style={{ color: C.ok, background: C.okWash, border: `1.5px solid ${C.ok}` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ background: C.paper, border: `1.5px solid ${C.hair}`, color: C.inkSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-bold text-white"
              style={{ background: C.accent, border: `1px solid ${C.hair}`, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[12.5px] font-bold"
          style={{
            background: C.ink,
            color: C.bg,
            border: `1.5px solid ${C.hair}`,
            transform: "rotate(4deg)",
            ...display,
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
    <nav aria-label="Hoofdnavigatie" className="mt-6 border-y-2" style={{ borderColor: C.hair }}>
      <div className="flex items-center gap-0 overflow-x-auto">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-4 py-3 text-[12.5px] font-bold uppercase tracking-[0.05em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14110d] motion-reduce:transition-none"
              style={{
                color: on ? C.accentDeep : C.inkMute,
                background: on ? C.accentWash : "transparent",
                ...body,
              }}
            >
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1"
                  style={{ background: C.accent }}
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
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative">
          <Kicker>Overzicht — vandaag</Kicker>
          <h1
            className="mt-4 text-[40px] font-bold leading-[0.94] tracking-[-0.03em] md:text-[56px]"
            style={{ color: C.ink, ...display }}
          >
            Goede<span style={{ color: C.accent }}>morgen</span>,
            <br />
            <span className="relative inline-block">
              {PROFIEL.naam.split(" ")[0]}.
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-2 w-full"
                style={{ background: C.accentWash }}
              />
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Geen rechte kaders, wel scherpe focus. Wat aandacht vraagt breekt door de lijn; de rest
            blijft rustig op zijn plek.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SolidButton onClick={onActies}>
              Volgende actie
              <ArrowUpRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <LineButton onClick={onOpen}>Marktplaats</LineButton>
          </div>
        </div>

        <Slab filled className="p-6" as="div">
          <div className="flex items-center justify-between">
            <Kicker tone={C.accent}>Vraagt aandacht</Kicker>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <h2
            className="mt-4 text-[21px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.bg, ...display }}
          >
            {primair.titel}
          </h2>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: "rgba(245,243,238,0.72)" }}
          >
            {primair.detail}
          </p>
          <div className="mt-5">
            <SolidButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
          <p
            className="mt-4 border-t pt-3 text-[11.5px]"
            style={{
              borderColor: "rgba(245,243,238,0.2)",
              color: "rgba(245,243,238,0.6)",
              ...mono,
            }}
          >
            {verified}/{CREDENTIALS.length} certificaten — 7 open reacties
          </p>
        </Slab>
      </section>

      <DiagRule tone={C.hairSoft} />

      <section>
        <Kicker>Kerncijfers — deze maand</Kicker>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="relative p-4"
              style={{
                background: C.paper,
                border: `1.5px solid ${C.hair}`,
                transform: i % 2 === 0 ? "rotate(-0.6deg)" : "rotate(0.6deg)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? C.okWash : C.warnWash,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[28px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...display }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <BarSet data={k.spark} tone={k.up ? C.accent : C.warn} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <DiagRule tone={C.hairSoft} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Kicker>Beste matches</Kicker>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ee]"
              style={{ color: C.accentDeep }}
            >
              Alle opdrachten →
            </button>
          </div>
          <div style={{ border: `1.5px solid ${C.hair}` }}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.hair}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#efece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14110d] motion-reduce:transition-none"
                    style={{ background: C.paper }}
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-bold tabular-nums"
                      style={{
                        background: i === 0 ? C.accent : "transparent",
                        color: i === 0 ? C.bg : C.ink,
                        border: `1.5px solid ${C.hair}`,
                        transform: "rotate(-3deg)",
                        ...display,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.accentDeep }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="p-4" style={{ background: C.paper, border: `1.5px solid ${C.hair}` }}>
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairFaint}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center"
                      style={{
                        color: st.tone,
                        background: st.wash,
                        border: `1.5px solid ${st.tone}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && <span className="sr-only">let op</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
          className="mt-3 text-[36px] font-bold leading-[0.95] tracking-[-0.03em] md:text-[46px]"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p
          className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          zichtbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-3"
          style={{ background: C.paper, border: `1.5px solid ${C.hair}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a39a89]"
            style={{ color: C.ink }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <LineButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </LineButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center px-6 py-16 text-center"
          style={{ background: C.paper, border: `1.5px solid ${C.hair}` }}
        >
          <span
            className="inline-flex h-16 w-16 items-center justify-center"
            style={{
              background: C.accentWash,
              color: C.accentDeep,
              border: `1.5px solid ${C.accent}`,
              transform: "rotate(-4deg)",
            }}
            aria-hidden="true"
          >
            <Search size={26} />
          </span>
          <p className="mt-5 text-[22px] font-bold" style={{ color: C.ink, ...display }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer te
            ontdekken.
          </p>
          <div className="mt-6">
            <SolidButton onClick={() => setQ("")}>
              Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
        </div>
      ) : (
        <ul className="space-y-6">
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
    <article
      className="relative"
      style={{
        background: C.paper,
        border: `1.5px solid ${C.hair}`,
        boxShadow: "5px 5px 0 0 rgba(20,17,13,0.9)",
      }}
    >
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.bg, background: C.ink, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkMute, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-bold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                style={{ color: C.inkSoft, border: `1.5px solid ${C.hairSoft}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex h-16 w-16 flex-col items-center justify-center"
            style={{
              background: strong ? C.accent : C.ink,
              color: C.bg,
              border: `1.5px solid ${C.hair}`,
              transform: "rotate(-4deg)",
            }}
          >
            <span
              className="text-[19px] font-bold tabular-nums leading-none"
              style={{ ...display }}
            >
              {opdracht.match}
            </span>
            <span className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.12em]">match</span>
          </span>
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ color: C.accentDeep, ...mono }}
          >
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-3 border-t px-5 py-3"
        style={{ borderColor: C.hairSoft }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.05em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf6]"
          style={{ color: C.accentDeep }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen}>
            Reageer <ArrowUpRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-0 border-t sm:grid-cols-2"
            style={{ borderColor: C.hairSoft }}
          >
            <RedenBlok
              titel="Sterke punten"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              border
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
  border = false,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
  border?: boolean;
}) {
  return (
    <div className="p-5" style={{ borderLeft: border ? `1.5px solid ${C.hairSoft}` : "none" }}>
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <CornerDownRight size={12} aria-hidden="true" />
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
    <div className="space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ee] motion-reduce:transition-none"
        style={{ color: C.ink, border: `1.5px solid ${C.hair}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Slab filled className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.bg, border: `1.5px solid rgba(245,243,238,0.4)`, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]"
            style={{ color: C.ink, background: strong ? C.accent : C.bg }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold leading-[0.98] tracking-[-0.03em] md:text-[46px]"
          style={{ color: C.bg, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: "rgba(245,243,238,0.7)" }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <SolidButton>
            Reageer op opdracht <ArrowUpRight size={14} aria-hidden="true" />
          </SolidButton>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5f3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110d] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            style={{ color: C.bg, border: `1.5px solid rgba(245,243,238,0.5)` }}
          >
            Bewaren
          </button>
        </div>
      </Slab>

      <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: `1.5px solid ${C.hair}` }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="p-4"
            style={{
              background: C.paper,
              borderLeft: i % 4 === 0 ? "none" : `1.5px solid ${C.hairSoft}`,
              borderTop: i >= 2 ? `1.5px solid ${C.hairSoft}` : "none",
            }}
          >
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] font-bold tabular-nums tracking-[-0.01em]"
              style={{ color: C.ink, ...display }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Kicker>Waarom deze match</Kicker>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant afgeleid van je geverifieerde profiel — wat sterk staat én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="p-5"
            style={{
              background: C.paper,
              border: `1.5px solid ${C.hair}`,
              boxShadow: "5px 5px 0 0 rgba(46,125,70,0.85)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: C.ok, background: C.okWash, border: `1.5px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ok }}
              >
                Sterke punten
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
          </div>
          <div
            className="p-5"
            style={{
              background: C.paper,
              border: `1.5px solid ${C.hair}`,
              boxShadow: "5px 5px 0 0 rgba(181,101,29,0.85)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: C.warn, background: C.warnWash, border: `1.5px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={15} />
              </span>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.warn }}
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
          </div>
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
    <div className="space-y-7">
      <Slab filled className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Kicker tone={C.accent}>Verificatie</Kicker>
            <h1
              className="mt-3 text-[30px] font-bold leading-[0.98] tracking-[-0.02em]"
              style={{ color: C.bg, ...display }}
            >
              Jouw certificaten
            </h1>
            <p
              className="mt-3 text-[13.5px] leading-relaxed"
              style={{ color: "rgba(245,243,238,0.72)" }}
            >
              <span className="font-bold" style={{ color: C.bg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{
              background: C.accent,
              color: C.bg,
              border: `1.5px solid ${C.bg}`,
              transform: "rotate(-4deg)",
            }}
          >
            <span
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ ...display }}
            >
              {ratio}
            </span>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em]">% gereed</span>
          </span>
        </div>
      </Slab>

      <div style={{ border: `1.5px solid ${C.hair}` }}>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1.5px solid ${C.hair}`, background: C.bgAlt }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
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
                style={{
                  borderTop: idx === 0 ? "none" : `1.5px solid ${C.hair}`,
                  background: C.paper,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#efece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14110d] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{
                        color: st.tone,
                        background: st.wash,
                        border: `1.5px solid ${st.tone}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-bold"
                        style={{ color: C.ink, ...display }}
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
                    <Tag_ tone={st.tone} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Tag_>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.accentDeep,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={16} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="p-4"
                        style={{ background: C.bgAlt, border: `1.5px solid ${C.hairSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
                          <LineButton>Historie</LineButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Kicker>Volgende acties</Kicker>
        <h1
          className="mt-3 text-[36px] font-bold leading-[0.95] tracking-[-0.03em] md:text-[46px]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu telt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.accent : C.info;
          const wash = warn ? C.accentWash : C.infoWash;
          return (
            <li key={a.titel}>
              <div
                className="relative"
                style={{
                  background: C.paper,
                  border: `1.5px solid ${C.hair}`,
                  boxShadow: `5px 5px 0 0 ${warn ? "rgba(255,77,46,0.9)" : "rgba(20,17,13,0.85)"}`,
                }}
              >
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 p-5 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{
                      background: warn ? C.accent : C.ink,
                      color: C.bg,
                      border: `1.5px solid ${C.hair}`,
                      transform: "rotate(-4deg)",
                      ...display,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Tag_ tone={tone} wash={wash} alarm={warn}>
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </Tag_>
                    <h2
                      className="mt-2.5 text-[18px] font-bold leading-snug tracking-[-0.01em]"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <SolidButton>
                      {a.cta}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </SolidButton>
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

function factuurTone(status: string): { tone: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { tone: C.warn, wash: C.warnWash, Icon: AlertTriangle };
  if (status === "Betaald") return { tone: C.ok, wash: C.okWash, Icon: Check };
  return { tone: C.inkMute, wash: "transparent", Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-3 text-[36px] font-bold leading-[0.95] tracking-[-0.03em] md:text-[46px]"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <SolidButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.info, alarm: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-5"
            style={{
              background: C.paper,
              border: `1.5px solid ${C.hair}`,
              transform: i === 1 ? "rotate(0.7deg)" : "rotate(-0.5deg)",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center"
                  style={{ background: C.warnWash, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div style={{ border: `1.5px solid ${C.hair}` }}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1.5px solid ${C.hair}`, background: C.bgAlt }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#efece4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}`,
                  background: C.paper,
                }}
              >
                <span
                  className="order-1 text-[11.5px] font-bold tabular-nums"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-bold sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag_ tone={ft.tone} wash={ft.wash} alarm={acc}>
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </Tag_>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.ink, ...display }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1.5px solid ${C.hair}`, background: C.bgAlt }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute }}
          >
            Totaal betaald
          </span>
          <span className="text-[22px] font-bold tabular-nums" style={{ color: C.ink, ...display }}>
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
