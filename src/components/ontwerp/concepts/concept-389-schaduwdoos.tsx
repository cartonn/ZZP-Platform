"use client";

// Concept 389 — "Schaduwdoos" · Zachte diepte / verfijnd soft-depth.
// Warme off-white oppervlakken met gelaagde dubbele schaduw (licht van boven-links, zachte kern
// eronder). Gelaagde "dozen" met echte diepte-hiërarchie: verhoogde vlakken staan boven het blad,
// ingezette velden vallen erin. Mollige maar strakke vlakken, tactiel en premium — maar het contrast
// blijft bewaakt: koppen, labels en knoppen zijn glashelder (AA+), nooit wazig neumorfisch.
// Palet: warm off-white basis (#ece9e2), zachte licht/donker-schaduwen, één gedempt indigo accent
// (#585aa6). Fonts: Sora (koppen) + Manrope (body).

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
  Layers,
  Sparkle,
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

// — Palet: warm off-white met zachte dubbele schaduw en één gedempt indigo accent —
const C = {
  base: "#ece9e2",
  baseAlt: "#e6e2da",
  raise: "#f1eee7",
  raiseHi: "#f6f3ec",
  sink: "#e4e0d8",
  ink: "#2b2a26",
  inkSoft: "#413f39",
  muted: "#6d685d",
  faint: "#948e81",
  line: "rgba(43,42,38,0.09)",
  accent: "#585aa6",
  accentSoft: "#7b7dc0",
  accentInk: "#3f4184",
  accentWash: "rgba(88,90,166,0.11)",
  warn: "#b06a1e",
  warnWash: "rgba(176,106,30,0.13)",
  ok: "#4b7a53",
  hiLight: "rgba(255,255,255,0.9)",
  hiDark: "rgba(157,150,138,0.55)",
};

const head = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

// — Zachte-diepte schaduwrecepten —
const shadow = {
  raise: `7px 7px 16px ${C.hiDark}, -7px -7px 16px ${C.hiLight}`,
  raiseSm: `4px 4px 10px ${C.hiDark}, -4px -4px 10px ${C.hiLight}`,
  raiseLg: `12px 12px 28px ${C.hiDark}, -10px -10px 24px ${C.hiLight}`,
  inset: `inset 4px 4px 9px ${C.hiDark}, inset -4px -4px 9px ${C.hiLight}`,
  insetSm: `inset 3px 3px 6px ${C.hiDark}, inset -3px -3px 6px ${C.hiLight}`,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, tone: C.accent };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, tone: "#a23b34" };
  }
}

// — Verhoogde doos: staat boven het blad met zachte dubbele schaduw —
function Box({
  children,
  className = "",
  variant = "raise",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "raise" | "raiseLg" | "inset" | "flat";
  as?: "div" | "section" | "li";
}) {
  const map: Record<string, React.CSSProperties> = {
    raise: { background: C.raise, boxShadow: shadow.raise },
    raiseLg: { background: C.raiseHi, boxShadow: shadow.raiseLg },
    inset: { background: C.sink, boxShadow: shadow.inset },
    flat: { background: C.raise, boxShadow: "none", border: `1px solid ${C.line}` },
  };
  return (
    <Tag className={`rounded-[22px] ${className}`} style={map[variant]}>
      {children}
    </Tag>
  );
}

// — Zachte sparkline met verloop-onderkant —
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
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill={tone} />}
    </svg>
  );
}

function Overline({ children, tone = C.accent }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

// — Zachte pil/chip; alarm-variant krijgt gevulde waarschuwingstint —
function Pill({
  children,
  tone = C.muted,
  filled = false,
  inset = false,
}: {
  children: React.ReactNode;
  tone?: string;
  filled?: boolean;
  inset?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
      style={{
        color: filled ? "#fff" : tone,
        background: filled ? tone : C.base,
        boxShadow: inset ? shadow.insetSm : filled ? "none" : shadow.raiseSm,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

// — Ronde zachte icoonknop/plaat —
function Coin({
  children,
  size = 44,
  tone = C.accent,
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
        background: soft ? C.base : tone,
        color: soft ? tone : "#fff",
        boxShadow: soft ? shadow.raiseSm : shadow.raiseSm,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function PrimaryButton({
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
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585aa6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece9e2] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#fff",
        background: C.accent,
        boxShadow: shadow.raiseSm,
        ...body,
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
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585aa6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece9e2] ${className}`}
      style={{
        color: active ? C.accentInk : C.inkSoft,
        background: C.base,
        boxShadow: active ? shadow.insetSm : shadow.raiseSm,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

export function Concept389() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.base }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
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
        <Coin size={46} tone={C.accent}>
          <Layers size={20} aria-hidden="true" />
        </Coin>
        <div>
          <p className="text-[20px] font-bold leading-none tracking-[-0.01em]" style={head}>
            Schaduwdoos
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-none" style={{ color: C.faint }}>
            Rustig · tactiel · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold sm:inline-flex"
          style={{ color: C.ok, background: C.base, boxShadow: shadow.raiseSm }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.base, color: C.muted, boxShadow: shadow.raiseSm }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.warn }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px] font-semibold" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
          style={{ background: C.base, color: C.accent, boxShadow: shadow.raiseSm }}
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
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.sink, boxShadow: shadow.inset }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585aa6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4e0d8] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.muted,
                background: on ? C.accent : "transparent",
                boxShadow: on ? shadow.raiseSm : "none",
                ...body,
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
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <Overline>Vandaag · {PROFIEL.plaats}</Overline>
            <h1
              className="mt-4 text-[38px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[46px]"
              style={head}
            >
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              Alles wat telt ligt bovenop, de rest zakt rustig naar de achtergrond. Dit vraagt nu je
              aandacht.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Bekijk marktplaats</GhostButton>
            </div>
          </div>
        </div>

        {/* Primaire volgende actie — verhoogde doos met accent-inzet */}
        <Box variant="raiseLg" className="relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{ background: C.accentWash }}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between">
            <Overline>Belangrijkste nu</Overline>
            <Coin size={38} tone={C.warn}>
              <AlertTriangle size={17} aria-hidden="true" />
            </Coin>
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Box>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span className="text-[11.5px] font-semibold" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Box key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[11.5px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? "rgba(75,122,83,0.12)" : C.warnWash,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
              </div>
            </Box>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[12px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.accent }}
          >
            Alles bekijken
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[20px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585aa6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece9e2] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{
                  background: C.raise,
                  boxShadow: shadow.raiseSm,
                }}
              >
                <Coin size={44} tone={i === 0 ? C.accent : C.accentSoft}>
                  <span className="text-[13px] font-bold">{o.match}</span>
                </Coin>
                <span className="min-w-0">
                  <span className="block truncate text-[15.5px] font-bold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchMeter value={o.match} />
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
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2 w-16 overflow-hidden rounded-full"
        style={{ background: C.sink, boxShadow: shadow.insetSm }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.accent : C.accentSoft }}
        />
      </span>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: strong ? C.accentInk : C.muted }}
      >
        {value}%
      </span>
    </span>
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
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
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
          style={{ background: C.sink, boxShadow: shadow.inset }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#948e81]"
            style={{ color: C.ink, ...body }}
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
        <Box variant="inset" className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Coin size={64} tone={C.accent} soft>
              <Search size={26} aria-hidden="true" />
            </Coin>
            <p className="mt-5 text-[22px] font-bold" style={head}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Box>
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
    <Box className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pill tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Pill>
            <span className="truncate text-[12.5px] font-semibold" style={{ color: C.faint }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Pill key={t} tone={C.accentInk}>
                {t}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Coin size={54} tone={strong ? C.accent : C.accentSoft}>
            <span className="text-[16px] font-bold tabular-nums">{opdracht.match}</span>
          </Coin>
          <span className="text-[14px] font-bold tabular-nums" style={{ color: C.inkSoft }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.accentInk, background: C.accentWash }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Pluspunten" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Box>
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
    <Box variant="inset" className="p-4">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: tone }}>
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
    </Box>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, background: C.base, boxShadow: shadow.raiseSm }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Box variant="raiseLg" className="relative overflow-hidden p-7 md:p-9">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
          style={{ background: C.accentWash }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-3">
          <Pill tone={C.faint}>{opdracht.id}</Pill>
          <Pill tone={strong ? C.accent : C.accentSoft} filled>
            <Sparkle size={12} aria-hidden="true" /> {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[15px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Opdracht bewaren</GhostButton>
        </div>
      </Box>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Box key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Box>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Box className="p-5">
            <div className="flex items-center gap-2">
              <Coin size={34} tone={C.ok}>
                <Check size={16} aria-hidden="true" />
              </Coin>
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ok }}
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
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Box>
          <Box className="p-5">
            <div className="flex items-center gap-2">
              <Coin size={34} tone={C.warn}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Coin>
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.warn }}
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
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Box>
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
      <Box variant="raiseLg" className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em]"
              style={head}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-full p-4"
            style={{ background: C.base, boxShadow: shadow.inset }}
          >
            <div className="relative" style={{ width: 92, height: 92 }}>
              <svg width={92} height={92} viewBox="0 0 92 92" aria-hidden="true">
                <circle cx="46" cy="46" r={R} fill="none" stroke={C.sink} strokeWidth="9" />
                <circle
                  cx="46"
                  cy="46"
                  r={R}
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - ratio / 100)}
                  transform="rotate(-90 46 46)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold tabular-nums leading-none" style={head}>
                  {ratio}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  geverifieerd
                </span>
              </div>
            </div>
          </div>
        </div>
      </Box>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Box className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585aa6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1eee7]"
                >
                  <Coin size={44} tone={st.tone} soft>
                    <st.Icon size={19} aria-hidden="true" />
                  </Coin>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-bold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Pill tone={st.tone} inset>
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
                      <Box variant="inset" className="p-4">
                        <p
                          className="max-w-xl text-[13.5px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </Box>
                    </div>
                  </div>
                </div>
              </Box>
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
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
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
          const tone = warn ? C.warn : C.accent;
          return (
            <li key={a.titel}>
              <Box className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{ background: C.base, color: tone, boxShadow: shadow.raiseSm }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: tone, background: warn ? C.warnWash : C.accentWash }}
                      >
                        {warn ? (
                          <AlertTriangle size={11} aria-hidden="true" />
                        ) : (
                          <Sparkle size={11} aria-hidden="true" />
                        )}
                        {warn ? "Belangrijk" : "Kans"}
                      </span>
                    </div>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug" style={head}>
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
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Box>
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
          <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.accent, alarm: false },
        ].map((s) => (
          <Box key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[11.5px] font-bold uppercase tracking-[0.04em]"
                style={{ color: C.muted }}
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
              className="mt-2 text-[28px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Box>
        ))}
      </section>

      <Box className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-1 py-3.5 transition-colors hover:bg-[#e6e2da] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-bold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold"
                    style={{
                      color: acc ? C.warn : f.status === "Betaald" ? C.ok : C.muted,
                      background: acc ? C.warnWash : C.base,
                      boxShadow: acc ? "none" : shadow.insetSm,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {f.status === "Betaald" && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-bold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Box>
    </div>
  );
}
