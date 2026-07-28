"use client";

// Concept 505 — "Vulpen" · Premium-dark editorial luxe. Inktzwarte achtergrond, serif-displaykoppen
// en ledger/tabulaire cijfers, dunne gouden/koperen hairlines en hoog leesbaar contrast (warme
// crème-inkt op zwart). Rustig, luxueus, redactioneel — als een goed gezet financieel katern.
// Status altijd met label + icoon, nooit enkel kleur.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Minus,
  PenLine,
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

// — Palet: inktzwart met warme crème-inkt en gouden/koperen hairlines —
const C = {
  bg: "#0c0b0a",
  panel: "#131210",
  panelUp: "#181613",
  line: "rgba(201,169,97,0.22)",
  lineSoft: "rgba(201,169,97,0.12)",

  cream: "#efe7d6",
  creamSoft: "#cbc2ae",
  creamMute: "#9a9182",
  creamFaint: "#6f685c",

  gold: "#c9a961",
  goldDeep: "#a8863f",
  copper: "#c08a5a",
  sage: "#8fa877",
  steel: "#7fa0b0",
  amber: "#d3a24a",
  rose: "#c56d63",
};

const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const sans = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const ledger = { ...serif, fontVariantNumeric: "tabular-nums" as const };
const ledgerSans = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.sage,
        soft: "rgba(143,168,119,0.14)",
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.steel,
        soft: "rgba(127,160,176,0.14)",
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: "rgba(211,162,74,0.16)",
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rose,
        soft: "rgba(197,109,99,0.16)",
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — Redactioneel paneel met hairline-rand en subtiele diepte —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone = "panel",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: "panel" | "up";
  interactive?: boolean;
}) {
  const bg = tone === "up" ? C.panelUp : C.panel;
  return (
    <Tag
      className={`rounded-[6px] ${interactive ? "vp-lift" : ""} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        boxShadow:
          tone === "up"
            ? "0 24px 60px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 16px 40px -28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
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
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0b0a]";
  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        className={`${base} ${pad} hover:brightness-105 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldDeep})`,
          color: "#1a1408",
          boxShadow: "0 10px 24px -12px rgba(201,169,97,0.6)",
          ...sans,
        }}
      >
        {children}
      </button>
    );
  }
  const style: React.CSSProperties =
    variant === "outline"
      ? { background: "transparent", color: C.cream, border: `1px solid ${C.line}` }
      : { background: "transparent", color: C.creamMute, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} hover:border-[rgba(201,169,97,0.5)] hover:text-[#efe7d6] ${className}`}
      style={{ ...style, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusPill({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
      style={{ color: base, background: soft, border: `1px solid ${base}44` }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Ledger match-meter: dunne gouden boog met tabulaire cijfers —
function MatchMeter({ value, size = 56 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.sage : C.gold;
  const r = (size - 5) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(201,169,97,0.16)" strokeWidth="2" />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.32, ...ledger }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 uppercase tracking-[0.14em]"
          style={{ color: C.creamFaint, fontSize: size * 0.12 }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = useMemo(() => `vp-spark-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
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
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={tone} />
    </svg>
  );
}

function Eyebrow({ children, tone = C.gold }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: tone }}>
      {children}
    </span>
  );
}

// — Dunne gouden scheidingslijn met kleine ruit als redactioneel accent —
function Rule() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="h-px flex-1" style={{ background: C.line }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: C.gold, opacity: 0.7 }} />
      <span className="h-px flex-1" style={{ background: C.line }} />
    </div>
  );
}

function SectionHead({
  over,
  children,
  right,
}: {
  over: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>{over}</Eyebrow>
        <h2
          className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.cream, ...serif }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept505() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...sans,
        color: C.cream,
        background: `radial-gradient(130% 100% at 50% -10%, #17140d 0%, ${C.bg} 55%, #080706 100%)`,
      }}
    >
      {/* Fijne vignet + gouden lichtstreep bovenin */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,169,97,0.5), transparent)",
          }}
        />
        <span
          className="absolute h-[40vw] w-[40vw] rounded-full"
          style={{
            top: "-16%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(201,169,97,0.1), rgba(201,169,97,0) 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vp-fade pt-6">
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
        .vp-lift { transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease, border-color 0.28s ease; }
        .vp-lift:hover { transform: translateY(-2px); border-color: rgba(201,169,97,0.5); box-shadow: 0 26px 60px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,169,97,0.14); }
        @keyframes vpFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .vp-fade { animation: vpFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .vp-lift, .vp-fade { animation: none !important; transition: none !important; }
          .vp-lift:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center gap-4 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[8px]"
          style={{
            background: "linear-gradient(135deg, #1c1913, #0f0d0a)",
            color: C.gold,
            border: `1px solid ${C.line}`,
            boxShadow: "inset 0 1px 0 rgba(201,169,97,0.14)",
          }}
          aria-hidden="true"
        >
          <PenLine size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[0.02em]"
            style={{ color: C.cream, ...serif }}
          >
            Vulpen
          </p>
          <p
            className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.creamMute }}
          >
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] sm:inline-flex"
          style={{
            color: C.sage,
            background: "rgba(143,168,119,0.12)",
            border: `1px solid ${C.sage}44`,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.creamSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
              style={{ background: C.gold, color: "#1a1408" }}
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.gold, ...serif }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-[6px] p-1.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-[4px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961]"
              style={
                on
                  ? {
                      color: "#1a1408",
                      background: `linear-gradient(135deg, ${C.gold}, ${C.goldDeep})`,
                    }
                  : { color: C.creamMute }
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
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Eyebrow>Editie · {PROFIEL.plaats}</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
            style={{ color: C.cream, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.creamSoft }}>
            Uw register is geverifieerd en in balans. Verse opdrachten sluiten aan op uw profiel, en
            één document verdient binnenkort aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <div className="mt-7">
            <Rule />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {KPIS.map((k, i) => {
              const tone = i === 3 ? C.amber : i === 2 ? C.sage : C.gold;
              return (
                <div key={k.label}>
                  <p
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: C.creamMute }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-2 text-[26px] font-semibold leading-none"
                    style={{ color: C.cream, ...ledger }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: k.up ? C.sage : C.amber, ...ledgerSans }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Panel interactive tone="up" className="p-5">
            <div className="flex items-center gap-2" style={{ color: C.amber }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]">
                Termijn nadert
              </span>
            </div>
            <h3
              className="mt-3 text-[17px] font-semibold leading-snug"
              style={{ color: C.cream, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>

          <Panel interactive className="p-5">
            <Eyebrow tone={C.sage}>Vertrouwen</Eyebrow>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span
                className="text-[38px] font-semibold leading-none"
                style={{ color: C.cream, ...ledger }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.creamMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(201,169,97,0.14)" }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.sage}, ${C.gold})`,
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: C.creamMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Panel>
        </aside>
      </section>

      <section>
        <SectionHead
          over="Aanbevolen"
          right={
            <button
              type="button"
              onClick={onMarkt}
              className="rounded text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961]"
              style={{ color: C.gold }}
            >
              Volledige lijst →
            </button>
          }
        >
          Opdrachten voor u
        </SectionHead>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead over="Register">Uw certificaten</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Panel key={c.naam} interactive className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
                  style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                  aria-hidden="true"
                >
                  <t.Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.cream }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.creamMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Panel interactive as="article">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a961]"
      >
        <MatchMeter value={opdracht.match} size={52} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[16px] font-semibold leading-snug"
            style={{ color: C.cream, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
            style={{ color: C.creamMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.cream, ...ledger }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.creamFaint }}>
            per uur
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.gold }}
        />
      </button>
    </Panel>
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
    <div className="space-y-5">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-2 text-[29px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: C.cream, ...serif }}
        >
          Opdrachten die bij u passen
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.creamMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op uw profiel.
        </p>
      </div>

      <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[4px] px-4 py-2.5"
          style={{ background: C.bg, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.gold }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#6f685c]"
            style={{ color: C.cream }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[rgba(201,169,97,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961]"
              style={{ color: C.creamMute }}
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
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: "rgba(201,169,97,0.12)" }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: "rgba(201,169,97,0.12)" }}
                  />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rose}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.gold}
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
            className="rounded text-[10.5px] uppercase tracking-[0.14em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961]"
            style={{ color: C.creamFaint }}
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
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Panel tone="up" className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[10px]"
        style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}33` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[21px] font-semibold" style={{ color: C.cream, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.creamSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Panel>
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
  const tone = strong ? C.sage : C.gold;
  return (
    <Panel interactive as="article">
      <div className="flex items-start gap-4 p-5">
        <MatchMeter value={opdracht.match} size={62} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: tone }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[10.5px]" style={{ color: C.creamFaint, ...ledgerSans }}>
              №{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[19px] font-semibold leading-snug"
            style={{ color: C.cream, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.creamMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]"
                style={{
                  background: "rgba(201,169,97,0.08)",
                  color: C.creamSoft,
                  border: `1px solid ${C.line}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[18px] font-semibold" style={{ color: C.cream, ...ledger }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.creamFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.2)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a961]"
          style={{ color: C.gold }}
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
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In uw voordeel"
              tone={C.sage}
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
    </Panel>
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
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.creamSoft }}
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rotate-45"
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
  const tone = strong ? C.sage : C.gold;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel tone="up" className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <MatchMeter value={opdracht.match} size={78} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px]" style={{ color: C.creamMute, ...ledgerSans }}>
                {opdracht.id}
              </span>
              <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: tone }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[36px]"
              style={{ color: C.cream, ...serif }}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-2.5 flex items-center gap-1.5 text-[14px]"
              style={{ color: C.creamMute }}
            >
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline">Bewaren</Btn>
        </div>

        <div className="mt-6">
          <Rule />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Aanvang", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.creamMute }}>
                {m.l}
              </p>
              <p className="mt-2 text-[19px] font-semibold" style={{ color: C.cream, ...ledger }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-[4px] px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.04em]"
              style={{
                background: "rgba(201,169,97,0.08)",
                color: C.creamSoft,
                border: `1px solid ${C.line}`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHead over="Motivering">Waarom deze match bij u past</SectionHead>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.creamSoft }}>
          Afgezet tegen uw geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in uw voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.sage }}
            >
              <Check size={13} aria-hidden="true" /> In uw voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.creamSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.sage }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.creamSoft }}
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
          </div>
        </div>
      </Panel>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-6">
          <Eyebrow tone={C.sage}>Vertrouwensregister</Eyebrow>
          <h1
            className="mt-2 text-[27px] font-semibold leading-tight tracking-[-0.015em]"
            style={{ color: C.cream, ...serif }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.creamSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt uw dossier compleet. Al uw documenten worden versleuteld
            bewaard en uitsluitend met uw toestemming gedeeld.
          </p>
        </Panel>
        <Panel tone="up" className="flex flex-col justify-center p-6">
          <span
            className="text-[46px] font-semibold leading-none"
            style={{ color: C.cream, ...ledger }}
          >
            {ratio}%
          </span>
          <p
            className="mt-2 text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: C.creamMute }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(201,169,97,0.14)" }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: `linear-gradient(90deg, ${C.sage}, ${C.gold})`,
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Panel>
      </section>

      <section>
        <SectionHead over="Certificaten">Documentregister</SectionHead>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Panel interactive>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a961]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
                      style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.cream }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.creamMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusPill {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.gold, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                      <div
                        className="px-4 pb-4 sm:pl-[70px]"
                        style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
                      >
                        <span className="mb-2 inline-flex sm:hidden">
                          <StatusPill {...t} />
                        </span>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.creamSoft }}
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
                          <Btn size="sm" variant="outline">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionHead over="Dossier">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Panel key={d.naam} interactive className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
                  style={{ background: C.bg, color: C.gold, border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.cream }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.creamMute, ...ledgerSans }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusPill {...t} />
              </Panel>
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
        <Eyebrow>Agenda</Eyebrow>
        <h1
          className="mt-2 text-[29px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: C.cream, ...serif }}
        >
          Wat vandaag uw aandacht vraagt
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.creamMute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.steel;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Panel
                interactive
                tone={warn ? "up" : "panel"}
                className="flex items-start gap-4 p-5"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[16px] font-semibold"
                  style={{
                    background: `${tone}1f`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                    ...ledger,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: tone }}
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
                    style={{ color: C.cream, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.creamSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
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

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.sage, soft: "rgba(143,168,119,0.14)" };
  if (status === "Openstaand") return { base: C.amber, soft: "rgba(211,162,74,0.16)" };
  if (status === "Concept") return { base: C.steel, soft: "rgba(127,160,176,0.14)" };
  return { base: C.rose, soft: "rgba(197,109,99,0.16)" };
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Grootboek</Eyebrow>
          <h1
            className="mt-2 text-[29px] font-semibold leading-tight tracking-[-0.015em]"
            style={{ color: C.cream, ...serif }}
          >
            Uw facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.sage },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.steel },
        ].map((s) => (
          <Panel key={s.l} interactive className="p-5">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.creamMute }}>
              {s.l}
            </p>
            <p className="mt-1.5 text-[26px] font-semibold" style={{ color: s.tone, ...ledger }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.creamMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.creamMute }}
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
                    className="transition-colors hover:bg-[rgba(201,169,97,0.05)]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.creamSoft, ...ledgerSans }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[14px] font-semibold"
                      style={{ color: C.cream }}
                    >
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.creamMute, ...ledgerSans }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[15px] font-semibold"
                      style={{ color: C.cream, ...ledger }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
                        style={{
                          color: t.base,
                          background: t.soft,
                          border: `1px solid ${t.base}44`,
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
        </div>
      </Panel>
    </div>
  );
}
