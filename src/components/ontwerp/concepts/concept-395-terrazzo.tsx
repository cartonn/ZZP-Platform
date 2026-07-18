"use client";

// Concept 395 — "Terrazzo" · Gespikkeld steen & pastel-confetti.
// Warm-speels: een room-terrazzo-oppervlak met verspreide steen-chips (kleine gekleurde
// ovaaltjes/vlekjes als subtiele achtergrond-decoratie via CSS, nooit druk), zachte pastel-accenten
// (salie, terracotta, oker), afgeronde vormen. Premium en luchtig, maar rustig en leesbaar.
// Palet: room #f6f1e7 met salie #7fae8f, terracotta #d98b6f, oker #e0b354.
// Fonts: ronde grotesk (systeem) + mono cijfers.

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
  Circle,
  Sparkles,
  Bell,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: room-terrazzo met pastel steen-chips —
const C = {
  cream: "#f6f1e7",
  creamHi: "#fdfaf3",
  creamLo: "#efe7d7",
  surface: "#fffdf8",
  ink: "#33302a",
  inkSoft: "#494539",
  muted: "#7b7566",
  faint: "#a49d8c",
  line: "rgba(51,48,42,0.09)",
  sage: "#5f8f6f",
  sageBright: "#7fae8f",
  sageWash: "rgba(127,174,143,0.18)",
  terra: "#c56f50",
  terraBright: "#d98b6f",
  terraWash: "rgba(217,139,111,0.18)",
  ocher: "#c79632",
  ocherBright: "#e0b354",
  ocherWash: "rgba(224,179,84,0.20)",
  berry: "#b05a72",
  berryWash: "rgba(176,90,114,0.16)",
};

const sans = {
  fontFamily: '"Segoe UI", "Nunito", system-ui, -apple-system, "Helvetica Neue", sans-serif',
};
const mono = {
  fontFamily: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace',
};

const shadow = {
  soft: "0 6px 20px -10px rgba(120,100,60,0.30)",
  softSm: "0 3px 12px -7px rgba(120,100,60,0.28)",
  softLg: "0 14px 38px -14px rgba(120,100,60,0.34)",
};

// — Verstrooide terrazzo-chips als achtergrond-decoratie (deterministisch, rustig) —
type Chip = { x: number; y: number; r: number; rot: number; tone: string; sq?: boolean };
const CHIP_TONES = [C.sageBright, C.terraBright, C.ocherBright, C.berry];
function makeChips(seed: number, count: number): Chip[] {
  const out: Chip[] = [];
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 3 + rnd() * 6,
      rot: rnd() * 180,
      tone: CHIP_TONES[Math.floor(rnd() * CHIP_TONES.length)] as string,
      sq: rnd() > 0.62,
    });
  }
  return out;
}

function Terrazzo({
  seed = 7,
  count = 14,
  opacity = 0.5,
  className = "",
}: {
  seed?: number;
  count?: number;
  opacity?: number;
  className?: string;
}) {
  const chips = useMemo(() => makeChips(seed, count), [seed, count]);
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {chips.map((c, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.r * 2,
            height: c.sq ? c.r * 1.5 : c.r * 1.4,
            background: c.tone,
            borderRadius: c.sq ? 3 : "50%",
            transform: `rotate(${c.rot}deg)`,
          }}
        />
      ))}
    </span>
  );
}

const sans2 = sans;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.sage,
        wash: C.sageWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.ocher,
        wash: C.ocherWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.terra,
        wash: C.terraWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, tone: C.berry, wash: C.berryWash };
  }
}

// — Zacht afgerond terrazzo-oppervlak —
function Card({
  children,
  className = "",
  chips = false,
  seed = 3,
  elevated = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  chips?: boolean;
  seed?: number;
  elevated?: boolean;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`relative overflow-hidden ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.creamLo}`,
        borderRadius: 22,
        boxShadow: elevated ? shadow.softLg : shadow.soft,
      }}
    >
      {chips && <Terrazzo seed={seed} count={10} opacity={0.4} />}
      <span className="relative">{children}</span>
    </Tag>
  );
}

function Overline({ children, tone = C.terra }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]"
      style={{ color: tone, ...sans2 }}
    >
      {children}
    </p>
  );
}

function Pill({
  children,
  tone = C.muted,
  wash,
  filled = false,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
      style={{
        color: filled ? "#fff" : tone,
        background: filled ? tone : (wash ?? C.cream),
        ...sans2,
      }}
    >
      {children}
    </span>
  );
}

function Blob({
  children,
  size = 44,
  tone = C.sage,
  soft = false,
}: {
  children: React.ReactNode;
  size?: number;
  tone?: string;
  soft?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: soft ? C.cream : tone,
        color: soft ? tone : "#fff",
        boxShadow: soft ? "none" : shadow.softSm,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function PrimaryBtn({
  children,
  onClick,
  className = "",
  tone = C.terra,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-extrabold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#fff",
        background: tone,
        boxShadow: shadow.softSm,
        ...sans2,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.terra : C.surface,
        border: `1px solid ${active ? C.terra : C.creamLo}`,
        boxShadow: active ? "none" : shadow.softSm,
        ...sans2,
      }}
    >
      {children}
    </button>
  );
}

function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const last = pts[pts.length - 1];
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
        <linearGradient id={`tz-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.26" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#tz-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />}
    </svg>
  );
}

function MatchBar({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span className="h-2.5 w-16 overflow-hidden rounded-full" style={{ background: C.creamLo }}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.sage : C.ocher }}
        />
      </span>
      <span
        className="text-[13px] font-extrabold tabular-nums"
        style={{ color: strong ? C.sage : C.muted, ...mono }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept395() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...sans2, color: C.ink, background: C.cream }}
    >
      <Terrazzo seed={41} count={26} opacity={0.28} />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-7">
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
        <Blob size={46} tone={C.terra}>
          <Circle size={20} aria-hidden="true" />
        </Blob>
        <div>
          <p className="text-[19px] font-extrabold leading-none tracking-[-0.01em]" style={sans2}>
            Terrazzo
          </p>
          <p className="mt-1 text-[11px] font-bold leading-none" style={{ color: C.faint }}>
            Warm · luchtig · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.sage, background: C.sageWash }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.surface, color: C.muted, boxShadow: shadow.softSm }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.terra }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-extrabold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px] font-bold" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <Blob size={44} tone={C.sage}>
          <span className="text-[13px] font-extrabold" style={mono}>
            {PROFIEL.initialen}
          </span>
        </Blob>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: C.surface,
          border: `1px solid ${C.creamLo}`,
          boxShadow: shadow.softSm,
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
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.muted,
                background: on ? C.terra : "transparent",
                ...sans2,
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
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col justify-center">
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[38px] font-extrabold leading-[1.02] tracking-[-0.02em] md:text-[46px]"
            style={sans2}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            Alles wat telt ligt luchtig bovenop; de rest ligt rustig in het oppervlak. Dit vraagt nu
            je aandacht.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryBtn onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryBtn>
            <GhostBtn onClick={onOpen}>Bekijk marktplaats</GhostBtn>
          </div>
        </div>

        <Card chips seed={12} elevated className="p-6">
          <div className="flex items-center justify-between">
            <Overline tone={C.terra}>Belangrijkste nu</Overline>
            <Blob size={38} tone={C.terra}>
              <AlertTriangle size={17} aria-hidden="true" />
            </Blob>
          </div>
          <h2
            className="mt-4 text-[22px] font-extrabold leading-snug tracking-[-0.01em]"
            style={sans2}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryBtn onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryBtn>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span className="text-[11.5px] font-bold" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [C.sage, C.terra, C.ocher, C.berry][i % 4] as string;
            return (
              <Card key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums"
                    style={{
                      color: k.up ? C.sage : C.terra,
                      background: k.up ? C.sageWash : C.terraWash,
                      ...mono,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[29px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                  style={mono}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} id={`kpi-${i}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Overline>Open opdrachten</Overline>
            <button
              type="button"
              onClick={onOpen}
              className="rounded-full text-[12px] font-extrabold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]"
              style={{ color: C.terra }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[20px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.creamLo}`,
                    boxShadow: shadow.softSm,
                  }}
                >
                  <Blob size={44} tone={i === 0 ? C.sage : C.ocher}>
                    <span className="text-[13px] font-extrabold" style={mono}>
                      {o.match}
                    </span>
                  </Blob>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-extrabold" style={sans2}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchBar value={o.match} />
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.faint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4">
            <Overline>Certificaten</Overline>
          </div>
          <Card chips seed={22} className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] font-extrabold" style={sans2}>
                {verified} van {CREDENTIALS.length} geverifieerd
              </p>
              <span
                className="text-[12px] font-extrabold tabular-nums"
                style={{ color: C.sage, ...mono }}
              >
                {Math.round((verified / CREDENTIALS.length) * 100)}%
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-3">
                    <Blob size={34} tone={st.tone} soft>
                      <st.Icon size={15} aria-hidden="true" />
                    </Blob>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-extrabold" style={sans2}>
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.faint }}>
                        {c.detail}
                      </span>
                    </span>
                    <Pill tone={st.tone} wash={st.wash}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Pill>
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
        <Overline>De marktplaats</Overline>
        <h1
          className="mt-3 text-[34px] font-extrabold leading-none tracking-[-0.02em]"
          style={sans2}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{
            background: C.surface,
            border: `1px solid ${C.creamLo}`,
            boxShadow: shadow.softSm,
          }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#a49d8c]"
            style={{ color: C.ink, ...sans2 }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostBtn
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostBtn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card chips seed={9} className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Blob size={64} tone={C.ocher} soft>
              <Search size={26} aria-hidden="true" />
            </Blob>
            <p className="mt-5 text-[22px] font-extrabold" style={sans2}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryBtn onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryBtn>
            </div>
          </div>
        </Card>
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
  const strong = opdracht.match >= 90;
  return (
    <Card chips={index === 0} seed={index + 5} className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pill tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Pill>
            <span
              className="truncate text-[12px] font-bold tabular-nums"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18.5px] font-extrabold leading-snug tracking-[-0.01em]"
            style={sans2}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Pill key={t} tone={C.sage} wash={C.sageWash}>
                {t}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Blob size={54} tone={strong ? C.sage : C.ocher}>
            <span className="text-[16px] font-extrabold tabular-nums" style={mono}>
              {opdracht.match}
            </span>
          </Blob>
          <span
            className="text-[14px] font-extrabold tabular-nums"
            style={{ color: C.inkSoft, ...mono }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8]"
          style={{ color: C.terra, background: C.terraWash }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryBtn onClick={onOpen} tone={C.sage}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryBtn>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Pluspunten"
              tone={C.sage}
              wash={C.sageWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.terra}
              wash={C.terraWash}
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
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-[18px] p-4" style={{ background: wash }}>
      <p
        className="text-[10.5px] font-extrabold uppercase tracking-[0.16em]"
        style={{ color: tone }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <Icon
              size={14}
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
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] motion-reduce:transition-none motion-reduce:hover:translate-x-0"
        style={{
          color: C.inkSoft,
          background: C.surface,
          border: `1px solid ${C.creamLo}`,
          boxShadow: shadow.softSm,
        }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card chips seed={17} elevated className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone={C.faint}>{opdracht.id}</Pill>
          <Pill tone={strong ? C.sage : C.ocher} filled>
            <Sparkles size={12} aria-hidden="true" /> {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={sans2}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[15px] font-bold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryBtn tone={C.sage}>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryBtn>
          <GhostBtn>Opdracht bewaren</GhostBtn>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-extrabold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Blob size={34} tone={C.sage}>
                <Check size={16} aria-hidden="true" />
              </Blob>
              <p
                className="text-[13px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: C.sage }}
              >
                Pluspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.inkSoft }}
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
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Blob size={34} tone={C.terra}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Blob>
              <p
                className="text-[13px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: C.terra }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.terra }}
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
  const R = 34;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-7">
      <Card chips seed={31} elevated className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em]"
              style={sans2}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-extrabold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 92, height: 92 }}>
            <svg width={92} height={92} viewBox="0 0 92 92" aria-hidden="true">
              <circle cx="46" cy="46" r={R} fill="none" stroke={C.creamLo} strokeWidth="9" />
              <circle
                cx="46"
                cy="46"
                r={R}
                fill="none"
                stroke={C.sage}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 46 46)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-extrabold tabular-nums leading-none" style={mono}>
                {ratio}
              </span>
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Card>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="p-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c56f50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8]"
                >
                  <Blob size={44} tone={st.tone} soft>
                    <st.Icon size={19} aria-hidden="true" />
                  </Blob>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-extrabold" style={sans2}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Pill tone={st.tone} wash={st.wash}>
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Pill>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 pl-[60px]">
                      <div className="rounded-[18px] p-4" style={{ background: st.wash }}>
                        <p
                          className="max-w-xl text-[13.5px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryBtn tone={st.tone}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryBtn>
                          <GhostBtn>Historie</GhostBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline>Volgende acties</Overline>
        <h1
          className="mt-3 text-[34px] font-extrabold leading-none tracking-[-0.02em]"
          style={sans2}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[14px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terra : C.sage;
          const wash = warn ? C.terraWash : C.sageWash;
          return (
            <li key={a.titel}>
              <Card chips={warn} seed={i + 3} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-extrabold tabular-nums"
                    style={{ background: wash, color: tone, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
                      style={{ color: tone, background: wash }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Sparkles size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-extrabold leading-snug" style={sans2}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryBtn tone={tone}>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryBtn>
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

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-3 text-[34px] font-extrabold leading-none tracking-[-0.02em]"
            style={sans2}
          >
            Facturen
          </h1>
        </div>
        <PrimaryBtn tone={C.sage}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryBtn>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.sage, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.terra, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.ocher, alarm: false },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.terraWash, color: C.terra }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-extrabold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.terra : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12.5px] font-bold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] font-extrabold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const paid = f.status === "Betaald";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-1 py-3.5 transition-colors hover:bg-[#efe7d7] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <span
                  className="order-1 text-[12px] font-bold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-extrabold sm:order-2"
                  style={sans2}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] font-semibold tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-extrabold"
                    style={{
                      color: acc ? C.terra : paid ? C.sage : C.muted,
                      background: acc ? C.terraWash : paid ? C.sageWash : C.creamLo,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {paid && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-extrabold tabular-nums sm:order-5"
                  style={{ color: acc ? C.terra : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-extrabold tabular-nums" style={mono}>
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
