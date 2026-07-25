"use client";

// Concept 467 — "Windkracht" · Kinetisch vloeiend gradient-mesh. Zachte stromende kleurverloop-
// vlakken (gelaagde radial/linear gradients, koel cyaan → violet → warm koraal) die als levende
// achtergrond-mesh traag bewegen, met witte, licht-frosted kaarten erboven zodat alles leesbaar
// blijft. Match-scores worden vertaald naar een Beaufort-achtige windkracht-schaal (0–12): hoe
// sterker de match, hoe krachtiger de wind. Beweging is het onderscheid — smooth micro-interacties
// op hover/klik, en volledig gedempt bij prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wind,
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

// — Palet: koel-naar-warm luchtstroom, inkt op wit —
const C = {
  ink: "#0f1729", // diep nachtblauw-inkt
  inkSoft: "#334155",
  inkMute: "#64748b",
  inkFaint: "#94a3b8",
  line: "#e2e8f0",
  lineSoft: "#eef2f7",
  card: "#ffffff",
  cyan: "#0891b2",
  cyanSoft: "#cffafe",
  blue: "#2563eb",
  blueSoft: "#dbeafe",
  violet: "#7c3aed",
  violetSoft: "#ede9fe",
  coral: "#e11d6b", // warme kant van het verloop
  coralSoft: "#fce7f0",
  amber: "#b45309",
  amberSoft: "#fef3c7",
  green: "#0f766e",
  greenSoft: "#ccfbf1",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// Beaufort-vertaling: match-percentage → windkracht 0–12 met een sprekende benaming.
function windkracht(match: number): { schaal: number; naam: string } {
  const schaal = Math.max(1, Math.min(12, Math.round((match / 100) * 12)));
  const naam =
    schaal >= 10
      ? "Stormkracht"
      : schaal >= 8
        ? "Stormachtig"
        : schaal >= 6
          ? "Krachtige wind"
          : schaal >= 4
            ? "Matige wind"
            : "Zwakke wind";
  return { schaal, naam };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue, wash: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.coral,
        wash: C.coralSoft,
      };
  }
}

// — Frosted witte kaart die boven de bewegende mesh zweeft —
function Card({
  children,
  className = "",
  as: Tag = "div",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  hover?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-2xl ${hover ? "wk-lift" : ""} ${className}`}
      style={{
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${C.line}`,
        boxShadow: "0 8px 30px -12px rgba(15,23,41,0.18)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-1.5 w-6 rounded-full"
        style={{ background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})` }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function FlowButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 active:translate-y-0 motion-reduce:transition-none ${className}`}
      style={{
        background: `linear-gradient(105deg, ${C.cyan}, ${C.blue} 45%, ${C.violet} 100%)`,
        boxShadow: "0 10px 24px -10px rgba(124,58,237,0.55)",
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
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.ink : "rgba(255,255,255,0.7)",
        border: `1px solid ${active ? C.ink : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Vloeiende sparkline: zachte curve met verloop-vulling —
function FlowSpark({ data, id }: { data: number[]; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((d - min) / span) * (h - 8);
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`wk-l-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.cyan} />
          <stop offset="100%" stopColor={C.violet} />
        </linearGradient>
        <linearGradient id={`wk-a-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cyan} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.violet} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#wk-a-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#wk-l-${id})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// — Windkracht-meter: schaal 0..12 als een rij oplopende vlaggetjes —
function WindMeter({ match, compact = false }: { match: number; compact?: boolean }) {
  const { schaal, naam } = windkracht(match);
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => {
          const on = i < schaal;
          return (
            <span
              key={i}
              className="w-[3px] rounded-full transition-all duration-300 motion-reduce:transition-none"
              style={{
                height: `${6 + i * 1.4}px`,
                background: on ? `linear-gradient(180deg, ${C.cyan}, ${C.violet})` : C.line,
                opacity: on ? 1 : 0.6,
              }}
            />
          );
        })}
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            Windkracht {schaal}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.inkMute }}>
            {naam} · {match}% match
          </span>
        </span>
      )}
    </div>
  );
}

export function Concept467() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...bodyFont, color: C.ink }}
    >
      {/* Bewegende gradient-mesh achtergrond */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="wk-mesh absolute inset-[-20%]"
          style={{
            background: `radial-gradient(42% 55% at 18% 22%, ${C.cyanSoft} 0%, transparent 60%), radial-gradient(46% 60% at 82% 18%, ${C.violetSoft} 0%, transparent 62%), radial-gradient(50% 58% at 68% 88%, ${C.coralSoft} 0%, transparent 60%), radial-gradient(50% 60% at 25% 92%, ${C.blueSoft} 0%, transparent 62%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(248,250,252,0.35), rgba(248,250,252,0.75))",
          }}
        />
      </div>

      <style>{`
        @keyframes wkDrift { 0% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(2%, -1.5%, 0) scale(1.06); } 100% { transform: translate3d(0,0,0) scale(1); } }
        .wk-mesh { animation: wkDrift 22s ease-in-out infinite; }
        @keyframes wkRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .wk-rise { animation: wkRise 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .wk-lift { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease; }
        .wk-lift:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -14px rgba(124,58,237,0.28); }
        @media (prefers-reduced-motion: reduce) {
          .wk-mesh, .wk-rise { animation: none !important; }
          .wk-lift { transition: none !important; }
          .wk-lift:hover { transform: none; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="wk-rise pt-6">
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
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{
            background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
            boxShadow: "0 10px 24px -10px rgba(124,58,237,0.6)",
          }}
          aria-hidden="true"
        >
          <Wind size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[18px] font-bold leading-none tracking-tight" style={{ color: C.ink }}>
            Windkracht
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · in de stroom
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.green, background: C.greenSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.coral, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, ...num }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1"
        style={{
          background: "rgba(255,255,255,0.7)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
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
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.inkMute,
                background: on ? `linear-gradient(105deg, ${C.cyan}, ${C.violet})` : "transparent",
                boxShadow: on ? "0 8px 18px -8px rgba(124,58,237,0.5)" : "none",
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6 pt-2">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-7 md:p-8">
          <Eyebrow>Jouw stroming · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            De wind staat gunstig: sterke matches drijven jouw kant op en je verificaties zijn op
            orde. Vang de beste tochten voordat ze luwen.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <FlowButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </FlowButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
          <div
            className="mt-6 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${C.lineSoft}` }}
          >
            <Compass size={18} style={{ color: C.violet }} aria-hidden="true" />
            <p className="text-[12px]" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {verified}/{CREDENTIALS.length}
              </span>{" "}
              certificaten geverifieerd · 7 open reacties in de stroom
            </p>
          </div>
        </Card>

        <Card className="p-6" hover>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <FlowButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </FlowButton>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Meters · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const Trend = k.up ? TrendingUp : TrendingDown;
            const tone = k.up ? C.green : C.coral;
            return (
              <Card key={k.label} className="p-5" hover>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <FlowSpark data={k.spark} id={`d467-${i}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Sterkste tochten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
              style={{ color: C.violet }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <Card className="flex items-center gap-4 p-4" hover>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="flex flex-1 items-center gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-bold" style={{ color: C.ink }}>
                        {o.titel}
                      </span>
                      <span className="block text-[11.5px]" style={{ color: C.inkMute }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <WindMeter match={o.match} compact />
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      style={{ color: C.inkFaint }}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.green}>Certificaten</Eyebrow>
          </div>
          <Card className="p-4">
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
                      style={{ background: st.wash, color: st.ink }}
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
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && <span className="sr-only">(let op)</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-6 pt-2">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {filtered.length} van {OPDRACHTEN.length} tochten in de wind
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#94a3b8]"
            style={{ color: C.ink }}
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
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.lineSoft }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.lineSoft }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.lineSoft }} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.cyanSoft, color: C.cyan }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink }}>
              Windstil
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen tocht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en vang nieuwe
              wind.
            </p>
            <div className="mt-6">
              <FlowButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </FlowButton>
            </div>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5" hover>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-1.5 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkSoft, background: C.lineSoft }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="inline-flex flex-col items-center rounded-2xl px-3 py-2 text-white"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})` }}
          >
            <span className="text-[20px] font-bold leading-none" style={{ ...num }}>
              {opdracht.match}
            </span>
            <span className="text-[8.5px] font-bold uppercase tracking-[0.12em]">match</span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <WindMeter match={opdracht.match} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
          style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <FlowButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </FlowButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.coral}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
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
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.6)",
        border: `1px solid ${C.lineSoft}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
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
  const { schaal, naam } = windkracht(opdracht.match);
  return (
    <div className="space-y-5 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.card }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="overflow-hidden p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, background: C.lineSoft, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
            style={{ background: `linear-gradient(105deg, ${C.cyan}, ${C.violet})` }}
          >
            <Wind size={11} aria-hidden="true" /> Windkracht {schaal} · {naam}
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5">
          <WindMeter match={opdracht.match} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <FlowButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </FlowButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Card>

      <Card>
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
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgestemd op je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.green }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.coral }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
            </p>
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
                    style={{ color: C.coral }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
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
    <div className="space-y-5 pt-2">
      <Card className="overflow-hidden p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.green}>Verificatie</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="relative inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.violet} ${ratio * 3.6}deg, ${C.lineSoft} 0deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full"
              style={{ background: C.card }}
            >
              <span
                className="text-[24px] font-bold leading-none"
                style={{ color: C.violet, ...num }}
              >
                {ratio}%
              </span>
              <span
                className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute }}
              >
                op orde
              </span>
            </span>
          </span>
        </div>
      </Card>

      <Card>
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
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(124,58,237,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7c3aed] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: st.wash, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                    style={{ color: st.ink, background: st.wash }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[72px]">
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.6)",
                          border: `1px solid ${C.lineSoft}`,
                        }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <FlowButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </FlowButton>
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
      </Card>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.blue}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4" hover>
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: C.lineSoft, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <Eyebrow>Acties · op urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Vang de tegenwind vroeg — zo blijf je zichtbaar, verifieerbaar en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          const wash = warn ? C.amberSoft : C.blueSoft;
          return (
            <li key={a.titel}>
              <Card className="p-5" hover>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-bold"
                    style={{ background: wash, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: tone, background: wash }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Wind size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <FlowButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </FlowButton>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.coral, wash: C.coralSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.lineSoft, Icon: FileText };
}

function Facturen() {
  const [dicht, setDicht] = useState(false);
  const zichtbaar = useMemo(
    () => (dicht ? FACTUREN.filter((f) => f.status !== "Concept") : FACTUREN),
    [dicht],
  );
  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Jouw omzetstroom
          </h1>
        </div>
        <FlowButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </FlowButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: "€ 8.622", sub: "3 facturen", tone: C.green, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.coral, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te sturen", tone: C.inkMute, alarm: false },
        ].map((s) => (
          <Card key={s.l} className="p-5" hover>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.coral }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex items-center justify-end">
        <GhostButton onClick={() => setDicht((v) => !v)} active={dicht} ariaPressed={dicht}>
          {dicht ? "Toon concepten" : "Verberg concepten"}
        </GhostButton>
      </div>

      <Card className="overflow-hidden">
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
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.12em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[rgba(124,58,237,0.04)]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{ color: ft.ink, background: ft.wash }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
