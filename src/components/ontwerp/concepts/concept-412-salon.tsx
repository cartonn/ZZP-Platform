"use client";

// Concept 412 — "Salon" · Warm boutique-hospitality / concierge.
// Licht, warm palet: taupe/zand, terracotta, diep olijf en messing-hairlines. Genereuze humanistische
// serif voor koppen, zachte grotesk voor body. Afgeronde editorial-kaarten met veel lucht, warme
// dubbele schaduw — alsof een boetiekhotel de software maakte. Menselijk, uitnodigend, premium-warm.
// Palet: zand #f4ede2, terracotta #b9603f, olijf #4a5133, messing #a8894f.
// Fonts: Fraunces/Newsreader-gevoel (display serif) + humanist grotesk body, tabulaire cijfers.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
  FileText,
  Flower2,
  Coffee,
  BookOpen,
  Sparkle,
  Heart,
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

// — Palet: warm zand, terracotta, olijf en messing-hairlines —
const C = {
  paper: "#faf5ec",
  sand: "#f4ede2",
  sandHi: "#fbf7f0",
  sandDeep: "#ece0cd",
  card: "#fffdf9",
  ink: "#33291d",
  inkSoft: "#5b4d3c",
  mute: "#877560",
  faint: "#a89681",
  terra: "#b9603f",
  terraHi: "#cd7452",
  terraDeep: "#994a2d",
  terraWash: "#f3ddd1",
  olive: "#4a5133",
  oliveInk: "#3c4229",
  brass: "#a8894f",
  brassLine: "rgba(168,137,79,0.32)",
  line: "rgba(120,96,64,0.18)",
  lineSoft: "rgba(120,96,64,0.11)",
  ok: "#5f7a4a",
  okInk: "#41562f",
  okWash: "#e4ecd7",
  warn: "#c07d33",
  warnInk: "#8a5615",
  warnWash: "#f6e6cd",
  info: "#4f7086",
  infoInk: "#365064",
  infoWash: "#dde8ef",
  bad: "#b04d3c",
  badInk: "#83321f",
  badWash: "#f5dbd3",
};

const display = {
  fontFamily: "'Fraunces', 'Newsreader', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const bodyF = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Kaart: warme, ruime editorial-kaart met dubbele zachte schaduw en messing-hairline —
function Card({
  children,
  className = "",
  warm = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  warm?: boolean;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: warm
          ? `linear-gradient(155deg, ${C.sandHi} 0%, ${C.card} 60%, ${C.sand} 100%)`
          : C.card,
        border: `1px solid ${warm ? C.brassLine : C.line}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 28px rgba(120,80,40,0.08), 0 2px 6px rgba(120,80,40,0.05)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({
  children,
  tone = C.terra,
  Icon,
}: {
  children: React.ReactNode;
  tone?: string;
  Icon?: LucideIcon;
}) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[0.24em]"
      style={{ color: tone, ...bodyF }}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </p>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...bodyF }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
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
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9603f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede2] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.sandHi,
        background: `linear-gradient(160deg, ${C.terraHi}, ${C.terra})`,
        boxShadow: `0 2px 0 ${C.terraDeep}, 0 10px 22px rgba(185,96,63,0.28)`,
        ...bodyF,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8894f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede2] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.sandHi : C.inkSoft,
        background: active ? C.olive : C.sandHi,
        border: `1px solid ${active ? C.olive : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Zachte sparkline in terracotta/olijf, afgeronde curve —
function SoftLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 7) - 3.5;
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
        <linearGradient id={`soft-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#soft-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.terra : value >= 85 ? C.brass : C.mute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.sandDeep }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept412() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: `radial-gradient(120% 80% at 78% -6%, ${C.sandHi} 0%, ${C.paper} 46%, ${C.sand} 100%)`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.terraWash, border: `1px solid ${C.brassLine}`, color: C.terra }}
          aria-hidden="true"
        >
          <Flower2 size={20} />
        </span>
        <div>
          <p
            className="text-[23px] font-semibold leading-none tracking-[0.005em]"
            style={{ color: C.ink, ...display }}
          >
            Salon
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.mute, ...bodyF }}>
            {PROFIEL.plaats} · met egards ontvangen
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.sandHi, border: `1px solid ${C.line}`, color: C.mute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.terra, color: C.sandHi, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...display }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.mute, ...bodyF }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-semibold"
          style={{
            background: C.terraWash,
            border: `1px solid ${C.brassLine}`,
            color: C.terra,
            ...bodyF,
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.sandHi, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8894f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede2] motion-reduce:transition-none"
              style={{
                color: on ? C.sandHi : C.inkSoft,
                background: on ? C.terra : "transparent",
                ...bodyF,
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-7 md:p-9" warm>
          <Eyebrow Icon={Coffee}>Welkom terug</Eyebrow>
          <h1
            className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.01em] md:text-[46px]"
            style={{ color: C.ink, ...display }}
          >
            Goedemorgen,{" "}
            <span className="italic" style={{ color: C.terra }}>
              {PROFIEL.naam.split(" ")[0]}
            </span>
            .
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Neem plaats — we hebben alles voor u klaargezet. Wat vandaag telt staat bovenaan, met
            zorg geordend, zodat uw praktijk verifieerbaar en betaald blijft. De rest wachten wij
            graag voor u af.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende attentie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Naar de etalage</GhostButton>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk} Icon={AlertTriangle}>
              Vraagt aandacht
            </Eyebrow>
            <Sparkle size={20} aria-hidden="true" style={{ color: C.brass }} />
          </div>
          <h2
            className="mt-4 text-[23px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="text-[12px]" style={{ color: C.mute, ...num }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow Icon={BookOpen}>Het gastenboek · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Card key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold" style={{ color: C.mute, ...bodyF }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[28px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <SoftLine data={k.spark} tone={k.up ? C.terra : C.brass} id={`kpi-${i}`} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow Icon={BookOpen}>De etalage · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[12px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9603f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede2]"
              style={{ color: C.terra, ...bodyF }}
            >
              Alles bekijken →
            </button>
          </div>
          <Card>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-[#f9f2e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b9603f] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        background: i === 0 ? C.terraWash : C.sand,
                        border: `1px solid ${i === 0 ? C.brassLine : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.terra : C.mute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.mute }}
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
                        style={{ color: C.faint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow Icon={ShieldCheck}>Certificaten</Eyebrow>
          </div>
          <Card className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.mute }}>
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
        <Eyebrow Icon={BookOpen}>De etalage · open opdrachten</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.ink, ...display }}
        >
          Onze selectie voor u
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.mute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten met zorg gekozen
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89681]"
            style={{ color: C.ink, ...bodyF }}
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6" warm>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: C.terraWash,
                border: `1px solid ${C.brassLine}`,
                color: C.terra,
              }}
              aria-hidden="true"
            >
              <Coffee size={26} />
            </span>
            <p className="mt-5 text-[24px] font-semibold" style={{ color: C.ink, ...display }}>
              Nog even geduld
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht past bij {q ? `“${q}”` : "uw zoekterm"}. Verruim de zoekterm, dan zetten
              wij graag meer voor u klaar.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
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
  const tone = strong ? C.terra : C.brass;
  return (
    <Card className="p-6" warm={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
              style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.mute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                style={{
                  color: C.oliveInk,
                  background: C.okWash,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyF,
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
            style={{ background: C.sandHi, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.faint, ...bodyF }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9603f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]"
          style={{ color: C.terra, border: `1px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In uw voordeel"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
              wash={C.okWash}
            />
            <RedenBlok
              titel="Ter attentie"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              wash={C.warnWash}
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
  wash,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
  wash: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: wash, border: `1px solid ${C.lineSoft}` }}>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyF }}
      >
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
  const tone = strong ? C.terra : C.brass;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9603f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede2]"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.sandHi, ...bodyF }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de etalage
      </button>

      <Card className="p-7 md:p-9" warm>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold"
            style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-bold"
            style={{ color: C.sandHi, background: tone, ...bodyF }}
          >
            <Heart size={11} aria-hidden="true" /> {strong ? "Aanrader" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
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
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.mute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[19px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <Eyebrow Icon={Sparkle}>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant afgelezen van uw geverifieerde profiel — wat in uw voordeel telt én waar u op
          mag letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...bodyF }}
              >
                In uw voordeel
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
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...bodyF }}
              >
                Ter attentie
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
                    style={{ color: C.warnInk }}
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
    <div className="space-y-6">
      <Card className="p-7 md:p-9" warm>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow Icon={ShieldCheck}>Verificatie · uw referenties</Eyebrow>
            <h1
              className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[38px]"
              style={{ color: C.ink, ...display }}
            >
              Uw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn met egards geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.sandHi, border: `1.5px solid ${C.brass}` }}
          >
            <span className="text-[26px] font-bold leading-none" style={{ color: C.terra, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...bodyF }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Card>

      <Card>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.mute, ...bodyF }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f9f2e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b9603f] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.mute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
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
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.sand, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na uw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
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
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow Icon={Sparkle}>Attenties · met zorg voor u geordend</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu uw aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.terra;
          const ink = warn ? C.warnInk : C.terra;
          const wash = warn ? C.warnWash : C.terraWash;
          return (
            <li key={a.titel}>
              <Card className="p-6" warm={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{
                      background: C.sandHi,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Heart size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[20px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
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
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
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

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.mute, wash: C.sand, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow Icon={BookOpen}>Facturen · uw rekening</Eyebrow>
          <h1
            className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Card key={s.l} className="p-6" warm={s.alarm}>
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.mute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.mute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.mute, ...bodyF }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f9f2e7] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.mute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...display }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.mute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...bodyF,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.mute, ...bodyF }}
          >
            <Sparkle size={12} aria-hidden="true" style={{ color: C.terra }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
