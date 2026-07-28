"use client";

// Concept 498 — "Zonnehof" · Solarpunk botanisch. Warm-optimistisch mosgroen met goud/zongeel,
// organisch-tech harmonie en subtiele blad/plant-motieven (inline svg + border-accenten). Hoopvol,
// levendig maar strak: positieve, menselijke energie zonder rommel. Groei, licht en vertrouwen als
// designtaal — het meest "levendig botanische" concept.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
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

// — Palet: mosgroen grond, zongeel/goud licht-accent, warm blad-groen —
const C = {
  bg: "#f4f7ec", // ochtendlicht op mos
  panel: "#ffffff",
  panelSoft: "#eef3e2",
  text: "#233024", // diep bladgroen-inkt
  textSoft: "#4c5a4c",
  textMute: "#79876f",
  textFaint: "#a7b39a",
  line: "#d9e3c8", // zachte stengel-lijn
  lineSoft: "#e7eed9",

  moss: "#3f7d4e", // mosgroen (primair)
  mossDeep: "#2f6440",
  mossSoft: "#dcecd7",

  gold: "#d99a1c", // zongeel/goud (accent + licht)
  goldDeep: "#b57d10",
  goldSoft: "#f7ecc9",

  clayWarn: "#c26a2e", // warm oranje (aandacht)
  claySoft: "#f6e2cf",
  sky: "#3f6f86", // hemelblauw (neutraal/in beoordeling)
  skySoft: "#dbe8ee",
};

const sans = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
  fontFeatureSettings: '"tnum" 1',
};

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.mossDeep,
        soft: C.mossSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.sky, soft: C.skySoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.goldDeep,
        soft: C.goldSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.clayWarn, soft: C.claySoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Botanisch blad-motief als subtiel svg-accent —
function LeafMark({ size = 18, color = C.moss }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16Z"
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 17.5C10 14 14 10 17.5 6.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: C.moss }}
    >
      <Sprout size={12} aria-hidden="true" />
      {children}
    </span>
  );
}

// — Kaart met zachte hoeken en een fijne bovenrand-accent (groeiend blad) —
function Card({
  children,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 16px 34px -28px rgba(35,48,36,0.5)",
        borderTop: accent ? `2px solid ${C.moss}` : `1px solid ${C.line}`,
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "quiet" | "gold";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-4 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const style: React.CSSProperties =
    variant === "solid"
      ? { background: C.moss, color: "#fff", border: `1px solid ${C.mossDeep}` }
      : variant === "gold"
        ? { background: C.gold, color: "#3a2c05", border: `1px solid ${C.goldDeep}` }
        : variant === "line"
          ? { background: "transparent", color: C.mossDeep, border: `1px solid ${C.moss}` }
          : { background: C.panelSoft, color: C.textSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7ec] ${pad} ${className}`}
      style={{ ...style, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const id = `zh-${tone.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.1" fill={tone} />
    </svg>
  );
}

// — Match als groeiende stengel-ring —
function MatchRing({ value, size = 64 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.mossDeep : C.gold;
  const track = strong ? C.mossSoft : C.goldSoft;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.3, ...num }}
        >
          {value}
        </span>
        <span
          className="text-[8px] uppercase tracking-[0.12em]"
          style={{ color: C.textMute, ...sans }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function SectionTitle({ over, children }: { over: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <Overline>{over}</Overline>
      <h2
        className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ color: C.text }}
      >
        {children}
      </h2>
    </div>
  );
}

export function Concept498() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.text,
        background: C.bg,
        backgroundImage: [
          "radial-gradient(60% 45% at 100% 0%, rgba(217,154,28,0.12) 0%, rgba(255,255,255,0) 60%)",
          "radial-gradient(70% 50% at 0% 100%, rgba(63,125,78,0.10) 0%, rgba(255,255,255,0) 60%)",
        ].join(","),
      }}
    >
      <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-8 md:px-10">
        <Topbar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="zh-fade pt-7">
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
        @keyframes zhFade { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .zh-fade { animation: zhFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .zh-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Topbar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.mossSoft, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <LeafMark size={22} color={C.mossDeep} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.text }}
          >
            Zonnehof
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: C.textMute }}
          >
            Groeiplek voor zelfstandigen
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.mossDeep }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11.5px]"
          style={{ color: C.textSoft, border: `1px solid ${C.line}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          Post
          <span className="font-semibold" style={{ color: C.gold, ...num }}>
            {ongelezen}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{ background: C.goldSoft, color: C.goldDeep, border: `1px solid ${C.line}` }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl p-1"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e]"
              style={{
                color: on ? "#fff" : C.textSoft,
                background: on ? C.moss : "transparent",
                boxShadow: on ? "0 8px 18px -12px rgba(47,100,64,0.8)" : "none",
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
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Overline>Vandaag in bloei</Overline>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.015em] md:text-[38px]"
            style={{ color: C.text }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.textSoft }}>
            Je profiel groeit gestaag en staat op orde. Er komen verse opdrachten op die bij je
            passen, en één document vraagt binnenkort om wat licht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="quiet" onClick={onMarkt}>
              Naar de marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => (
              <Card key={k.label} className="p-4" accent>
                <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-1.5 text-[22px] font-semibold leading-none"
                  style={{ color: C.text, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: k.up ? C.mossDeep : C.goldDeep, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={k.up ? C.moss : C.gold} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="p-5" accent>
            <div className="flex items-center gap-2" style={{ color: C.goldDeep }}>
              <Sun size={16} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                Termijn nadert
              </span>
            </div>
            <h3 className="mt-2.5 text-[16px] font-semibold leading-snug" style={{ color: C.text }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
              {primair.detail}
            </p>
            <Btn variant="gold" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>

          <Card className="p-5">
            <Overline>Groei &amp; vertrouwen</Overline>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[32px] font-semibold leading-none"
                style={{ color: C.text, ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.textMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.panelSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.moss}, ${C.gold})`,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.textMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Card>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <SectionTitle over="Aanbevolen">Opdrachten die bij je bloeien</SectionTitle>
          <button
            type="button"
            onClick={onMarkt}
            className="mb-1 shrink-0 text-[12px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e]"
            style={{ color: C.mossDeep }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle over="Register">Je certificaten</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Card key={c.naam} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft, color: t.base }}
                  aria-hidden="true"
                >
                  <t.Icon size={16} />
                </span>
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
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[#f4f7ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7d4e]"
      >
        <MatchRing value={opdracht.match} size={56} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[16px] font-semibold leading-snug"
            style={{ color: C.text }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.textMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
          <span
            className="mt-1 flex items-center gap-1.5 text-[12px]"
            style={{ color: C.mossDeep }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
          <span className="text-[15px] font-semibold" style={{ color: C.text, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textFaint }}>
            per uur
          </span>
        </span>
        <ArrowRight
          size={17}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.textFaint }}
        />
      </button>
    </Card>
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
        <Overline>Marktplaats</Overline>
        <h1
          className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.textMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je profiel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a7b39a]"
            style={{ color: C.text }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-[#eef3e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e]"
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
              <Card className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.panelSoft }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.panelSoft }}
                  />
                </div>
              </Card>
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
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
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
            className="text-[11px] uppercase tracking-[0.1em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e]"
            style={{ color: C.textFaint }}
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
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ color: C.mossDeep, background: C.mossSoft }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-semibold" style={{ color: C.text }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.textSoft }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Card>
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
    <Card as="article" className="overflow-hidden" accent>
      <div className="flex items-start gap-4 p-5">
        <MatchRing value={opdracht.match} size={66} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: strong ? C.mossDeep : C.goldDeep }}
            >
              <Sprout size={12} aria-hidden="true" />
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.textFaint, ...num }}>
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-1.5 text-[18px] font-semibold leading-snug" style={{ color: C.text }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.textMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11.5px]"
                style={{
                  background: C.panelSoft,
                  color: C.textSoft,
                  border: `1px solid ${C.lineSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.text, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 pb-4"
        style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d4e]"
          style={{ color: C.mossDeep }}
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
            className="grid grid-cols-1 gap-6 px-5 pb-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 18 }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.mossDeep}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.goldDeep}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
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
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
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
            style={{ color: C.textSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
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
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </Btn>

      <Card className="p-6 md:p-7" accent>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px]" style={{ color: C.textMute, ...num }}>
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: strong ? C.mossDeep : C.goldDeep }}
          >
            <Sprout size={12} aria-hidden="true" />
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <div className="mt-3 flex items-start gap-5">
          <MatchRing value={opdracht.match} size={72} />
          <div className="min-w-0 flex-1">
            <h1
              className="text-[26px] font-semibold leading-[1.14] tracking-[-0.015em] md:text-[32px]"
              style={{ color: C.text }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.textMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-semibold" style={{ color: C.text, ...num }}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <section>
        <SectionTitle over="Motivering">Waarom deze match bij je past</SectionTitle>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.mossDeep }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
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
                    style={{ color: C.mossDeep }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.goldDeep }}
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
                    style={{ color: C.goldDeep }}
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

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Overline>Vertrouwensregister</Overline>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </div>
        <Card className="p-5" accent>
          <span
            className="text-[42px] font-semibold leading-none"
            style={{ color: C.text, ...num }}
          >
            {ratio}%
          </span>
          <p className="mt-1 text-[12px] uppercase tracking-[0.1em]" style={{ color: C.textMute }}>
            dossier op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: C.panelSoft }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: `linear-gradient(90deg, ${C.moss}, ${C.gold})`,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle over="Certificaten">Documentregister</SectionTitle>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Card className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[#f4f7ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7d4e]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.text }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.textMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusTag {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.textFaint, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                      <div className="px-4 pb-4 sm:pl-[72px]">
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.textSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
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
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionTitle over="Dossier">Documentenkast</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-3.5">
                <FileText size={16} aria-hidden="true" style={{ color: C.textMute }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.textMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusTag {...t} />
              </Card>
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
          className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.textSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.goldDeep : C.sky;
          const soft = warn ? C.goldSoft : C.skySoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5" accent={warn}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: soft, color: tone }}
                  aria-hidden="true"
                >
                  {warn ? <Sun size={18} /> : <Clock size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: tone }}
                  >
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1 text-[17px] font-semibold leading-snug"
                    style={{ color: C.text }}
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
                      variant={warn ? "gold" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
                <span
                  className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold sm:flex"
                  style={{ color: C.textFaint, border: `1px solid ${C.line}`, ...num }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.mossDeep, soft: C.mossSoft };
  if (status === "Openstaand") return { base: C.goldDeep, soft: C.goldSoft };
  if (status === "Concept") return { base: C.sky, soft: C.skySoft };
  return { base: C.clayWarn, soft: C.claySoft };
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
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.mossDeep },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.goldDeep },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.sky },
        ].map((s) => (
          <Card key={s.l} className="p-5" accent>
            <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>
              {s.l}
            </p>
            <p className="mt-1 text-[23px] font-semibold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.textMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </div>

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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.textMute }}
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
                    className="transition-colors hover:bg-[#f4f7ec]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.textSoft, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: C.text }}>
                      {f.klant}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.textMute, ...num }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[14px] font-semibold"
                      style={{ color: C.text, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                        style={{ color: t.base, background: t.soft }}
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
      </Card>
    </div>
  );
}
