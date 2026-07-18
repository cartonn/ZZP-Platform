"use client";

// Concept 403 — "Zandsteen" · Stille luxe — mineraal steen-palet (quiet luxury).
// Ingetogen premium: gelaagde zandsteen/taupe/kalk-tinten, veel rust, dunne serif-koppen,
// hairline-scheidingen, minimale kleuraccenten en hoogwaardige typografische hiërarchie.
// Rust en vertrouwen rond gevoelige documenten. Koel-ingetogen luxe, geen terracotta-warmte.
// Palet: bg #ece7de, fg #2b2620, accent #9a8873 (getemperd taupe/brons), warme grijzen.
// Fonts-gevoel: Newsreader (serif) + Manrope (sans) — systeem-fallback, geen import nodig.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
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

// — Palet: mineraal zandsteen, koel-ingetogen luxe, getemperd taupe accent —
const C = {
  bg: "#ece7de",
  bgDeep: "#e4ded2",
  panel: "#f4f1ea",
  panelAlt: "#efebe2",
  fg: "#2b2620",
  fgSoft: "#4f4840",
  fgMute: "#7c7468",
  fgFaint: "#a89f90",
  accent: "#9a8873",
  accentDeep: "#7d6d59",
  accentWash: "rgba(154,136,115,0.14)",
  hair: "rgba(43,38,32,0.14)",
  hairSoft: "rgba(43,38,32,0.08)",
  hairFaint: "rgba(43,38,32,0.05)",
  ok: "#5f7a5a",
  okWash: "rgba(95,122,90,0.14)",
  warn: "#a5762f",
  warnWash: "rgba(165,118,47,0.14)",
  info: "#5b6b7d",
  infoWash: "rgba(91,107,125,0.14)",
  bad: "#9a5148",
  badWash: "rgba(154,81,72,0.14)",
};

const serif = {
  fontFamily: "'Newsreader', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const sans = {
  fontFamily: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
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

// — Steen-paneel: kalm, licht, hairline-omlijning —
function Stone({
  children,
  className = "",
  as: Tag = "div",
  tint = "panel",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tint?: "panel" | "alt";
}) {
  return (
    <Tag
      className={`relative rounded-lg ${className}`}
      style={{
        background: tint === "panel" ? C.panel : C.panelAlt,
        border: `1px solid ${C.hair}`,
        boxShadow: "0 1px 2px rgba(43,38,32,0.04)",
        color: C.fg,
      }}
    >
      {children}
    </Tag>
  );
}

function Overline({ children, tone = C.accentDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: tone, ...sans }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-px w-5"
        style={{ background: tone, opacity: 0.6 }}
      />
      {children}
    </p>
  );
}

function Chip({
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ color: tone, background: wash, border: `1px solid ${tone}33`, ...sans }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6d59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7de] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: C.accentDeep,
        boxShadow: "0 2px 8px -3px rgba(125,109,89,0.6)",
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function QuietButton({
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6d59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7de] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.fg : C.fgSoft,
        background: active ? C.panel : "transparent",
        border: `1px solid ${active ? C.accent : C.hair}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Zeer fijne sparkline, laag contrast —
function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
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
        <linearGradient id={`zs-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.18" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#zs-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={C.panel} stroke={tone} strokeWidth="1.2" />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1 w-20 overflow-hidden rounded-full"
        style={{ background: C.bgDeep }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: C.accent }}
        />
      </span>
      <span
        className="text-[12px] font-semibold tabular-nums"
        style={{ color: C.accentDeep, ...mono }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept403() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-8">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold text-white"
          style={{ background: C.accentDeep, ...serif }}
          aria-hidden="true"
        >
          Z
        </span>
        <div>
          <p
            className="text-[19px] font-medium leading-none tracking-[0.01em]"
            style={{ color: C.fg, ...serif }}
          >
            Zandsteen
          </p>
          <p
            className="mt-1.5 text-[10.5px] uppercase leading-none tracking-[0.16em]"
            style={{ color: C.fgMute }}
          >
            {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ color: C.ok, background: C.okWash, border: `1px solid ${C.ok}33` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.hair}`, color: C.fgMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white"
              style={{ background: C.accent, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.fg }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.fgMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium"
          style={{
            background: C.panel,
            border: `1px solid ${C.hair}`,
            color: C.accentDeep,
            ...serif,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7 border-b" style={{ borderColor: C.hair }}>
      <div className="flex items-center gap-1 overflow-x-auto">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7d6d59] motion-reduce:transition-none"
              style={{ color: on ? C.fg : C.fgMute }}
            >
              {s.label}
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-9">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Overline>Overzicht · vandaag</Overline>
          <h1
            className="mt-5 text-[36px] font-light leading-[1.06] tracking-[-0.01em] md:text-[46px]"
            style={{ color: C.fg, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
            Een rustig overzicht van je praktijk. Alleen wat aandacht vraagt komt naar voren; de
            rest blijft ingetogen op de achtergrond.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SolidButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <QuietButton onClick={onOpen}>Marktplaats</QuietButton>
          </div>
        </div>

        <Stone className="p-6">
          <div className="flex items-center justify-between">
            <Overline tone={C.warn}>Vraagt aandacht</Overline>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.warnWash, color: C.warn }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2
            className="mt-4 text-[20px] font-normal leading-snug"
            style={{ color: C.fg, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
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
            style={{ borderColor: C.hairSoft, color: C.fgMute, ...mono }}
          >
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Stone>
      </section>

      <section>
        <Overline>Kerncijfers · deze maand</Overline>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Stone key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: C.fgMute }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold tabular-nums"
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
                className="mt-3 text-[28px] font-light tabular-nums leading-none tracking-[-0.01em]"
                style={{ color: C.fg, ...serif }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
              </div>
            </Stone>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Overline>Beste matches</Overline>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6d59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7de]"
              style={{ color: C.accentDeep }}
            >
              Alles →
            </button>
          </div>
          <Stone className="overflow-hidden">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#efebe2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7d6d59] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-medium tabular-nums"
                      style={{
                        background: C.accentWash,
                        color: C.accentDeep,
                        border: `1px solid ${C.accent}33`,
                        ...serif,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-normal"
                        style={{ color: C.fg, ...serif }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.fgMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.fgFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Stone>
        </div>

        <div>
          <div className="mb-4">
            <Overline>Certificaten</Overline>
          </div>
          <Stone className="p-5">
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: st.tone, background: st.wash }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-medium"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.fgMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && <span className="sr-only">let op</span>}
                  </li>
                );
              })}
            </ul>
          </Stone>
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
        <Overline>Marktplaats</Overline>
        <h1
          className="mt-3 text-[32px] font-light leading-tight tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.fg, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.fgMute, ...mono }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} zichtbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.hair}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89f90]"
            style={{ color: C.fg }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <QuietButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </QuietButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Stone className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.accentWash, color: C.accentDeep }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[20px] font-normal" style={{ color: C.fg, ...serif }}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer te
              ontdekken.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Stone>
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
  return (
    <Stone className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, background: C.panelAlt, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-medium" style={{ color: C.fgMute, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-normal leading-snug"
            style={{ color: C.fg, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{
                  color: C.fgSoft,
                  background: C.panelAlt,
                  border: `1px solid ${C.hairSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-full"
            style={{ background: C.accentWash, border: `1px solid ${C.accent}44` }}
          >
            <span
              className="text-[17px] font-medium tabular-nums leading-none"
              style={{ color: C.accentDeep, ...serif }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.14em]"
              style={{ color: C.fgMute }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.fg, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-[#efebe2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6d59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
          style={{ color: C.accentDeep, border: `1px solid ${C.hair}` }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2"
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
            />
          </div>
        </div>
      </div>
    </Stone>
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
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.fgSoft }}>
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
  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d6d59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7de]"
        style={{ color: C.fgSoft, border: `1px solid ${C.hair}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Stone className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium"
            style={{ color: C.fgMute, background: C.panelAlt, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              color: C.accentDeep,
              background: C.accentWash,
              border: `1px solid ${C.accent}33`,
            }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-light leading-[1.1] tracking-[-0.01em] md:text-[42px]"
          style={{ color: C.fg, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.fgMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <SolidButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SolidButton>
          <QuietButton>Bewaren</QuietButton>
        </div>
      </Stone>

      <Stone className="overflow-hidden">
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.hairSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.hairSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-medium uppercase tracking-[0.16em]"
                style={{ color: C.fgMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[19px] font-light tabular-nums tracking-[-0.01em]"
                style={{ color: C.fg, ...serif }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Stone>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Transparant afgeleid van je geverifieerde profiel — wat sterk staat én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Stone className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.ok, background: C.okWash }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
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
                  style={{ color: C.fgSoft }}
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
          </Stone>
          <Stone className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.warn, background: C.warnWash }}
                aria-hidden="true"
              >
                <AlertTriangle size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
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
                  style={{ color: C.fgSoft }}
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
          </Stone>
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
      <Stone className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Verificatie</Overline>
            <h1
              className="mt-3 text-[28px] font-light leading-tight tracking-[-0.01em]"
              style={{ color: C.fg, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-medium" style={{ color: C.fg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.accentWash, border: `1px solid ${C.accent}44` }}
          >
            <span
              className="text-[28px] font-light tabular-nums leading-none"
              style={{ color: C.accentDeep, ...serif }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.fgMute }}
            >
              % gereed
            </span>
          </span>
        </div>
      </Stone>

      <Stone className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-medium uppercase tracking-[0.18em]"
              style={{ color: C.fgMute }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#efebe2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7d6d59] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ color: st.tone, background: st.wash }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-normal"
                        style={{ color: C.fg, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.fgMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.fgFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[72px]">
                      <div
                        className="rounded-lg p-4"
                        style={{ background: C.panelAlt, border: `1px solid ${C.hairSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
                          <QuietButton>Historie</QuietButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Stone>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline>Volgende acties</Overline>
        <h1
          className="mt-3 text-[32px] font-light leading-tight tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.fg, ...serif }}
        >
          Wat nu telt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.fgSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const wash = warn ? C.warnWash : C.infoWash;
          return (
            <li key={a.titel}>
              <Stone className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-medium tabular-nums"
                    style={{
                      background: wash,
                      color: tone,
                      border: `1px solid ${tone}33`,
                      ...serif,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} wash={wash} alarm={warn}>
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <ArrowRight size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </Chip>
                    <h2
                      className="mt-2.5 text-[17px] font-normal leading-snug"
                      style={{ color: C.fg, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <SolidButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
                  </div>
                </div>
              </Stone>
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
  return { tone: C.fgMute, wash: "transparent", Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-3 text-[32px] font-light leading-tight tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.fg, ...serif }}
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
        ].map((s) => (
          <Stone key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: C.fgMute }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-light tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warn : C.fg, ...serif }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Stone>
        ))}
      </section>

      <Stone className="overflow-hidden">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-medium uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.fgMute }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#efebe2] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-medium tabular-nums"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-normal sm:order-2"
                  style={{ color: C.fg, ...serif }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip tone={ft.tone} wash={ft.wash} alarm={acc}>
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.fg, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.hairSoft}` }}
        >
          <span
            className="text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: C.fgMute }}
          >
            Totaal betaald
          </span>
          <span className="text-[22px] font-light tabular-nums" style={{ color: C.fg, ...serif }}>
            {totaalBetaald}
          </span>
        </div>
      </Stone>
    </div>
  );
}
