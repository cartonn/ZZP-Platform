"use client";

// Concept 470 — "Dagraad" · Dageraad-warmte, warm-menselijk. Zacht perzik-naar-lavendel
// dageraad-verloop op de achtergrond, ruime radii, humanist-serif koppen en menselijke microcopy.
// Vertrouwen rond gevoelige documenten via warmte en gastvrijheid, niet via koele neutraliteit.
// Licht, optimistisch, premium — expliciet warm (perzik/amber/roze-lavendel), nooit koel-grijs.

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
  Heart,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Sunrise,
  TrendingDown,
  TrendingUp,
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

// — Palet: dageraad — perzik → amber → roze-lavendel, warm en menselijk —
const C = {
  dawn: "#fdf3ec", // warme perzik-basis
  dawnAlt: "#fbe9df", // iets dieper perzik
  card: "#fffaf5", // room-wit paneel
  cardAlt: "#fdf1e8",
  ink: "#3b2b28", // warm bruin-inkt
  inkSoft: "#5c4842",
  inkMute: "#8a7269",
  inkFaint: "#b09a90",
  line: "#f0dccf", // warme hairline
  lineSoft: "#f6e8dd",
  amber: "#c2571f", // dageraad-amber accent
  amberSoft: "#fce0cf",
  rose: "#b0437a", // roze-lavendel accent
  roseSoft: "#f6dced",
  lavender: "#7159a8", // lavendel voor info
  lavenderSoft: "#e6ddf3",
  green: "#3f7d54", // geverifieerd
  greenSoft: "#d6ecda",
  gold: "#a9781a", // let-op / verloopt
  goldSoft: "#f7e7c4",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
// Humanist-serif voor koppen — warm en menselijk.
const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

// Dageraad-verloop voor de hele achtergrond: perzik onderin naar zacht roze-lavendel bovenin,
// met een warme "zonopkomst"-gloed rechtsboven. Puur CSS-gradients, geen assets.
function dawnBg(): React.CSSProperties {
  return {
    backgroundColor: C.dawn,
    backgroundImage: [
      "radial-gradient(120% 80% at 85% -10%, rgba(240,180,120,0.4) 0%, rgba(240,180,120,0) 55%)",
      "radial-gradient(110% 70% at 10% 0%, rgba(200,150,200,0.28) 0%, rgba(200,150,200,0) 50%)",
      "linear-gradient(180deg, #f7e4ec 0%, #fdf0e6 40%, #fdf3ec 100%)",
    ].join(","),
  };
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
      return {
        label: "In behandeling",
        Icon: Clock,
        alarm: false,
        ink: C.lavender,
        wash: C.lavenderSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.gold,
        wash: C.goldSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.rose,
        wash: C.roseSoft,
      };
  }
}

// — Zacht room-paneel met ruime radii en warme, diffuse schaduw —
function Card({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  tint = C.card,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  tint?: string;
}) {
  return (
    <Tag
      className={`dg-card relative overflow-hidden rounded-[22px] ${interactive ? "dg-card--int" : ""} ${className}`}
      style={{
        background: tint,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(59,43,40,0.04), 0 8px 24px -14px rgba(150,90,70,0.28)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Sunrise size={13} aria-hidden="true" />
      {children}
    </p>
  );
}

function SolidButton({
  children,
  onClick,
  tone = C.amber,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf3ec] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#fff8f1",
        background: tone,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 3px 10px -3px rgba(150,80,40,0.4)",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf3ec] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff8f1" : C.inkSoft,
        background: active ? C.ink : C.card,
        border: `1px solid ${active ? C.ink : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline: zachte gloeiende lijn met dageraad-verloop —
function SparkLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = `dg-grad-${id}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={tone} />
    </svg>
  );
}

function Meter({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.dawnAlt }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept470() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...dawnBg() }}
    >
      <style>{`
        @keyframes dgRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dg-rise { animation: dgRise 0.46s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dg-card--int { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1); }
        .dg-card--int:hover { transform: translateY(-3px); box-shadow: 0 1px 2px rgba(59,43,40,0.04), 0 18px 34px -16px rgba(150,90,70,0.4); }
        @media (prefers-reduced-motion: reduce) { .dg-rise { animation: none !important; } .dg-card--int { transition: none !important; } .dg-card--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="dg-rise pt-6">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-[16px]"
          style={{
            background: "linear-gradient(135deg, #e8873f 0%, #c2571f 55%, #b0437a 100%)",
            color: "#fff8f1",
            boxShadow: "0 4px 12px -4px rgba(194,87,31,0.6)",
          }}
          aria-hidden="true"
        >
          <Sunrise size={20} strokeWidth={2} />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-tight"
            style={{ color: C.ink, ...serif }}
          >
            Dagraad
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · goedemorgen
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            ...bodyFont,
          }}
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
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.rose, color: "#fff8f1", ...num }}
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold"
          style={{
            background: C.amberSoft,
            border: `1px solid ${C.amber}`,
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-stretch gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-1 focus-visible:ring-offset-[#fdf1e8] motion-reduce:transition-none"
              style={{
                color: on ? "#fff8f1" : C.inkSoft,
                background: on ? C.ink : "transparent",
                boxShadow: on ? "0 2px 8px -2px rgba(59,43,40,0.4)" : "none",
                ...bodyFont,
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
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-7 md:p-8" interactive>
          <Eyebrow>Je dag begint</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[42px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Fijn dat je er bent. Je certificaten zijn in orde, er liggen verse matches klaar en één
            klein dingetje vraagt vandaag even je aandacht. We lopen het rustig samen door.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SolidButton onClick={onActies} tone={C.amber}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <GhostButton onClick={onOpen}>Bekijk de marktplaats</GhostButton>
          </div>
        </Card>

        <Card className="p-6" interactive tint={C.cardAlt}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.gold}>Even aandacht</Eyebrow>
            <Sun size={17} aria-hidden="true" style={{ color: C.gold }} />
          </div>
          <h2
            className="mt-3 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <SolidButton onClick={onActies} tone={C.gold} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Card>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.rose}>Jouw cijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.green : C.rose;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Card key={k.label} className="p-5" interactive>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
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
                  <SparkLine data={k.spark} tone={tone} id={`k470-${i}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Matches die bij je passen</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf3ec]"
              style={{ color: C.amber, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.green : C.lavender;
              return (
                <li key={o.id}>
                  <Card className="p-4" interactive as="article">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[15px]"
                        style={{
                          background: strong ? C.greenSoft : C.lavenderSoft,
                          border: `1px solid ${tone}`,
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[15px] font-bold leading-none"
                          style={{ color: tone, ...num }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: tone }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.inkMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.green}>Jouw certificaten</Eyebrow>
          </div>
          <Card className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
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
    <div className="space-y-6 pt-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Opdrachten voor jou
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b09a90]"
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
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
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
                  <div className="h-3 w-24 rounded-full" style={{ background: C.cardAlt }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.cardAlt }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.cardAlt }} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.cardAlt, border: `1px solid ${C.line}`, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink, ...serif }}>
              Nog niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord — er komt
              vast iets moois voorbij.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")} tone={C.amber}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Card>
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
  const tone = strong ? C.green : C.lavender;
  return (
    <Card className="p-5" interactive as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
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
                style={{
                  color: C.inkSoft,
                  background: C.cardAlt,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-full px-3 py-1.5"
            style={{
              background: strong ? C.greenSoft : C.lavenderSoft,
              border: `1px solid ${tone}`,
            }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf5]"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen} tone={C.ink}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={C.rose}
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
      className="rounded-[16px] p-4"
      style={{
        background: C.cardAlt,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
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
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.lavender;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2571f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf3ec]"
        style={{ color: C.ink, border: `1px solid ${C.line}`, background: C.card, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: "#fff8f1", background: tone, ...bodyFont }}
          >
            <Heart size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <SolidButton tone={C.amber}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SolidButton>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
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
        <Eyebrow>Waarom deze match bij je past</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én wat goed is om te
          weten, open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
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
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.rose, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
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
                    style={{ color: C.rose }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-6">
      <Card className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — dat pakken we op tijd samen op. Je documenten blijven versleuteld en
              privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.green} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}` }}
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.green, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              % in orde
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
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#fdf1e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c2571f] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
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
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.ink}`,
                        ...bodyFont,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.inkFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="rounded-[16px] p-4"
                        style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton tone={c.status === "EXPIRING" ? C.gold : C.amber}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
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
          <Eyebrow tone={C.lavender}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: C.cardAlt, border: `1px solid ${C.line}`, color: C.inkSoft }}
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
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}` }}
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
    <div className="space-y-5 pt-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          We houden het licht: van boven naar beneden, dan ben je zo weer bij. Eén ding tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.gold : C.lavender;
          return (
            <li key={a.titel}>
              <Card className="p-5" interactive>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
                    style={{
                      background: warn ? C.goldSoft : C.lavenderSoft,
                      border: `1px solid ${tone}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.goldSoft : C.lavenderSoft,
                        border: `1px solid ${tone}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sun size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink, ...serif }}
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
                    <SolidButton tone={warn ? C.gold : C.amber}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
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
  if (status === "Openstaand") return { ink: C.rose, wash: C.roseSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.cardAlt, Icon: FileText };
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
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Jouw facturen
          </h1>
        </div>
        <SolidButton tone={C.amber}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.rose },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Card key={s.l} className="p-5" interactive>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.rose }} />}
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

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <GhostButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
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
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fdf1e8]"
                    style={{
                      background: i % 2 === 1 ? C.cardAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
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
