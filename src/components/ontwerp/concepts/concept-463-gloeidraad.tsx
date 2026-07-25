"use client";

// Concept 463 — "Gloeidraad" · Warm tungsten dark mode. Premium bijna-zwart, warm getint (#0e0d0b),
// met precies ÉÉN warme gloeidraad-amber/tungsten accent (#f0a860) die op actieve elementen zacht
// gloeit (box-shadow glow). Strikt hoog contrast, tabulaire cijfers overal — warm i.p.v. koel-neon.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
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

// — Palet: warm getint bijna-zwart met één gloeidraad-amber accent —
const C = {
  base: "#0e0d0b", // warm bijna-zwart
  surface: "#1a1815",
  raise: "#221f1a",
  hover: "#2a2620",
  ink: "#f4efe6", // warm wit
  inkSoft: "#c8bfae",
  inkMute: "#8f8676",
  inkFaint: "#6b6355",
  line: "#2e2a23",
  lineSoft: "#242019",
  amber: "#f0a860", // gloeidraad
  amberDeep: "#c9843f",
  amberSoft: "#3a2c1a",
  glow: "rgba(240,168,96,0.35)",
  emerald: "#5fb98a",
  sky: "#7fb0e6",
  rose: "#e07a72",
};

const bodyFont = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, tone: C.emerald, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.sky, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: ShieldAlert, tone: C.amber, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, alarm: true };
  }
}

// — Oppervlak: warm paneel; glow=true laat de gloeidraad zacht branden —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  glow?: boolean;
}) {
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${glow ? C.amberDeep : C.line}`,
        boxShadow: glow
          ? `0 0 0 1px rgba(240,168,96,0.12), 0 8px 30px -12px ${C.glow}`
          : "0 1px 2px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: tone, boxShadow: `0 0 6px ${tone}` }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

// Primaire knop — de gloeidraad brandt.
function GlowButton({
  children,
  onClick,
  className = "",
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_0_22px_-2px_rgba(240,168,96,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b] active:translate-y-0 motion-reduce:transition-none ${full ? "w-full" : ""} ${className}`}
      style={{
        color: "#1a1204",
        background: `linear-gradient(180deg, #f5b978, ${C.amber})`,
        boxShadow: `0 0 16px -4px ${C.glow}`,
        ...bodyFont,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 hover:border-[#c9843f] hover:text-[#f0a860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.amber : C.inkSoft,
        background: active ? C.amberSoft : "transparent",
        border: `1px solid ${active ? C.amberDeep : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline met warme gloeidraad —
function GlowSpark({ data, id, tone }: { data: number[]; id: string; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((d - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${w},${h} 0,${h}`;
  const [lx, ly] = pts[pts.length - 1] ?? [w, h];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`gl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#gl-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="2.6" fill={tone} />
    </svg>
  );
}

function trendNumber(t: string) {
  return t.replace(/^[+-]/, "");
}

export function Concept463() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ background: C.base, color: C.ink, ...bodyFont }}
    >
      <style>{`
        @keyframes emberIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ember-in { animation: emberIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ember-in { animation: none !important; } }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ember-in pt-7">
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
    <header
      className="flex items-center justify-between gap-4 py-6"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            background: C.amberSoft,
            border: `1px solid ${C.amberDeep}`,
            color: C.amber,
            boxShadow: `0 0 14px -4px ${C.glow}`,
          }}
          aria-hidden="true"
        >
          <Flame size={18} strokeWidth={2} />
        </span>
        <div>
          <p className="text-[16px] font-semibold leading-none tracking-[-0.01em]">Gloeidraad</p>
          <p className="mt-1.5 text-[11.5px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · warm overzicht
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
          style={{
            color: C.emerald,
            background: "rgba(95,185,138,0.12)",
            border: "1px solid rgba(95,185,138,0.35)",
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-[#f0a860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b]"
          style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
              style={{
                background: C.amber,
                boxShadow: `0 0 6px ${C.amber}`,
                border: `2px solid ${C.base}`,
              }}
              aria-hidden="true"
            />
          )}
        </button>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold leading-tight">{PROFIEL.naam}</span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{
            background: C.raise,
            border: `1px solid ${C.amberDeep}`,
            color: C.amber,
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
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1815] motion-reduce:transition-none"
              style={
                on
                  ? {
                      color: "#1a1204",
                      background: `linear-gradient(180deg, #f5b978, ${C.amber})`,
                      boxShadow: `0 0 14px -4px ${C.glow}`,
                      ...bodyFont,
                    }
                  : { color: C.inkMute, background: "transparent", ...bodyFont }
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-7 md:p-9">
          <Eyebrow>Vandaag</Eyebrow>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[40px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Alles staat warm en scherp voor je klaar. Eén draad gloeit op — dat vraagt nu je
            aandacht. De rest brandt rustig op de achtergrond.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <GlowButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </GlowButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        {/* Het element dat NU gloeit */}
        <Panel className="flex flex-col p-6" glow>
          <div className="flex items-center justify-between">
            <Eyebrow>Vraagt aandacht</Eyebrow>
            <ShieldAlert size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[17px] font-semibold leading-snug">{primair.titel}</h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-5">
            <GlowButton onClick={onActies} full>
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </GlowButton>
          </div>
          <p
            className="mt-4 flex items-center gap-2 pt-4 text-[12px]"
            style={{ color: C.inkMute, borderTop: `1px solid ${C.line}`, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.emerald }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.emerald : C.amber;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Panel key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {trendNumber(k.trend)}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.01em]"
                  style={num}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <GlowSpark data={k.spark} id={`k463-${i}`} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Passende opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11.5px] font-semibold transition-colors hover:text-[#f0a860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b]"
              style={{ color: C.inkMute }}
            >
              Alles →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#221f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f0a860] motion-reduce:transition-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{o.titel}</span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="text-[13px] font-semibold transition-colors group-hover:text-[#f0a860]"
                      style={{ color: C.inkSoft, ...num }}
                    >
                      {o.match}%
                    </span>
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#f0a860] motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.emerald}>Certificaten</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: `${st.tone}1f`, color: st.tone }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold">{c.naam}</span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: st.tone, boxShadow: `0 0 6px ${st.tone}` }}
                        aria-hidden="true"
                      />
                    )}
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5 transition-colors focus-within:border-[#c9843f]"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6b6355]"
            style={{ color: C.ink, ...bodyFont }}
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
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Search size={22} />
            </span>
            <p className="mt-5 text-[19px] font-semibold">De draad is koud</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <GlowButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </GlowButton>
            </div>
          </div>
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
    <Panel className="overflow-hidden" glow={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-5">
        <div className="min-w-0">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id} · #{String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug">{opdracht.titel}</h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkSoft, background: C.raise, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-2xl px-3 py-2"
            style={
              strong
                ? {
                    background: C.amberSoft,
                    border: `1px solid ${C.amberDeep}`,
                    boxShadow: `0 0 14px -4px ${C.glow}`,
                  }
                : { background: C.raise, border: `1px solid ${C.line}` }
            }
          >
            <span
              className="text-[18px] font-semibold leading-none"
              style={{ color: strong ? C.amber : C.inkSoft, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: strong ? C.amber : C.inkMute }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 pb-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors hover:text-[#f0a860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1815]"
          style={{ color: C.inkSoft }}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <GlowButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </GlowButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
            <RedenBlok
              titel="Voor jou"
              items={opdracht.redenen.plus}
              tone={C.emerald}
              Icon={Check}
            />
            <RedenBlok
              titel="Let op"
              items={opdracht.redenen.min}
              tone={C.amber}
              Icon={ShieldAlert}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  items,
  tone,
  Icon,
}: {
  titel: string;
  items: string[];
  tone: string;
  Icon: LucideIcon;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.raise,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
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
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:text-[#f0a860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a860] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b]"
        style={{ color: C.inkSoft, background: C.surface, border: `1px solid ${C.line}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" glow>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ color: "#1a1204", background: C.amber }}
          >
            <Flame size={11} aria-hidden="true" /> {opdracht.match}% match
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[36px]">
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <GlowButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </GlowButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
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
              <Eyebrow tone={C.inkMute}>{m.l}</Eyebrow>
              <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]" style={num}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgewogen tegen je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          strak en transparant.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.emerald }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
            </p>
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
                    style={{ color: C.emerald }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <ShieldAlert size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <ShieldAlert
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
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

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <Panel className="p-7 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie</Eyebrow>
            <h1 className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.02em]">
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.emerald }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en gloeit op. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{
              background: C.amberSoft,
              border: `1px solid ${C.amberDeep}`,
              boxShadow: `0 0 22px -6px ${C.glow}`,
            }}
          >
            <span
              className="text-[28px] font-semibold leading-none"
              style={{ color: C.amber, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              % op orde
            </span>
          </span>
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
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#221f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f0a860] motion-reduce:transition-none sm:px-6"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `${st.tone}1f`, color: st.tone }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.naam}</span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
                    style={{
                      color: st.tone,
                      background: `${st.tone}1a`,
                      border: `1px solid ${st.tone}55`,
                    }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.inkFaint, transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[80px]">
                      <div
                        className="rounded-2xl p-4"
                        style={{ background: C.raise, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <GlowButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </GlowButton>
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
        <div className="mb-3">
          <Eyebrow tone={C.sky}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: C.raise, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{d.naam}</span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.tone,
                    background: `${st.tone}1a`,
                    border: `1px solid ${st.tone}55`,
                  }}
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
    <div className="space-y-5">
      <div>
        <Eyebrow>Acties</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — de bovenste gloeit het felst. Werk ze rustig van boven naar
          beneden weg.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.sky;
          return (
            <li key={a.titel}>
              <Panel className="p-5" glow={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-[14px] font-semibold"
                    style={{
                      background: warn ? C.amber : C.raise,
                      color: warn ? "#1a1204" : C.inkSoft,
                      border: warn ? "none" : `1px solid ${C.line}`,
                      boxShadow: warn ? `0 0 14px -4px ${C.glow}` : "none",
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: `${tone}1a`,
                        border: `1px solid ${tone}55`,
                      }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-semibold leading-snug">{a.titel}</h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <GlowButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </GlowButton>
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

function factuurMeta(status: string): { Icon: LucideIcon; tone: string } {
  if (status === "Openstaand") return { Icon: Clock, tone: C.amber };
  if (status === "Betaald") return { Icon: Check, tone: C.emerald };
  return { Icon: FileText, tone: C.inkMute };
}

function Facturen() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
            Overzicht
          </h1>
        </div>
        <GlowButton>Nieuwe factuur</GlowButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: "€ 8.622", sub: "3 facturen", tone: C.emerald, glow: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber, glow: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.inkMute, glow: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5" glow={s.glow}>
            <Eyebrow tone={s.tone}>{s.l}</Eyebrow>
            <p
              className="mt-2 text-[24px] font-semibold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkFaint, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const fm = factuurMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#221f1a]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[11.5px] font-medium"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-semibold">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                        style={{
                          color: fm.tone,
                          background: `${fm.tone}1a`,
                          border: `1px solid ${fm.tone}55`,
                        }}
                      >
                        <fm.Icon size={11} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-semibold"
                      style={{ color: fm.tone, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
