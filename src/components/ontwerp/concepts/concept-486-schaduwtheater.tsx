"use client";

// Concept 486 — "Schaduwtheater" · Dramatisch chiaroscuro. Bijna-zwart podium, één warme lichtpoel die
// de actieve content uitlicht terwijl de rest in schaduw wegvalt. Theatrale diepte, filmische focus op de
// volgende actie en verificatie. Elegant, niet grimmig — alle tekst blijft WCAG-leesbaar.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Aperture,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
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

// — Podium-palet: bijna-zwart, warme lichtpoel, gedempte schaduwtinten (alle tekst WCAG-leesbaar) —
const C = {
  stage: "#100e12",
  stageDeep: "#0a090c",
  panel: "#1a171d",
  panelLit: "#221e26",
  edge: "#2c2830",
  edgeSoft: "#241f28",
  // Tekst — bewust hoog contrast op donker
  ink: "#f6f1e9",
  inkSoft: "#cdc5ba",
  inkMute: "#9a9188",
  inkFaint: "#6f6860",

  gold: "#e6b45c",
  goldDeep: "#f0c674",
  goldSoft: "rgba(230,180,92,0.16)",

  sage: "#7fbf9a",
  sageDeep: "#9ad4b3",
  sageSoft: "rgba(127,191,154,0.16)",

  amber: "#e0a34e",
  amberDeep: "#f2ba68",
  amberSoft: "rgba(224,163,78,0.16)",

  rose: "#e3808f",
  roseDeep: "#f09aa7",
  roseSoft: "rgba(227,128,143,0.16)",

  ice: "#84b4dc",
  iceDeep: "#a3caea",
  iceSoft: "rgba(132,180,220,0.16)",
};

const body = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };
const display = { fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" };
const num = {
  fontFamily: "ui-monospace, 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// De warme lichtpoel — een spotlight die op de belangrijkste content valt.
const spotlight = (x: string, y: string) =>
  `radial-gradient(120% 90% at ${x} ${y}, rgba(240,198,116,0.20) 0%, rgba(230,180,92,0.08) 34%, rgba(16,14,18,0) 66%)`;

type Tone = { base: string; deep: string; soft: string };
const T = {
  gold: { base: C.gold, deep: C.goldDeep, soft: C.goldSoft } as Tone,
  sage: { base: C.sage, deep: C.sageDeep, soft: C.sageSoft } as Tone,
  amber: { base: C.amber, deep: C.amberDeep, soft: C.amberSoft } as Tone,
  rose: { base: C.rose, deep: C.roseDeep, soft: C.roseSoft } as Tone,
  ice: { base: C.ice, deep: C.iceDeep, soft: C.iceSoft } as Tone,
};

function credMeta(s: CredStatus): { tone: Tone; label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { tone: T.sage, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { tone: T.ice, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { tone: T.amber, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { tone: T.rose, label: "Afgewezen", Icon: XCircle, alarm: true };
  }
}

// — Podiumkaart: schaduwvlak met subtiele lichtrand; `lit` zet de spotlight erop —
function Stage({
  children,
  className = "",
  as: Tag = "div",
  lit = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  lit?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: lit
          ? `${spotlight("50%", "0%")}, linear-gradient(180deg, ${C.panelLit} 0%, ${C.panel} 100%)`
          : `linear-gradient(180deg, ${C.panel} 0%, ${C.stageDeep} 130%)`,
        border: `1px solid ${lit ? C.gold + "44" : C.edge}`,
        boxShadow: lit
          ? "0 0 0 1px rgba(240,198,116,0.08), 0 26px 60px -30px rgba(240,198,116,0.35), 0 20px 40px -28px rgba(0,0,0,0.9)"
          : "0 20px 40px -30px rgba(0,0,0,0.9)",
        color: C.ink,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
        }}
      />
      {children}
    </Tag>
  );
}

function Chip({
  children,
  tone,
  Icon,
}: {
  children: React.ReactNode;
  tone: Tone;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: tone.deep,
        background: tone.soft,
        border: `1px solid ${tone.base}44`,
        ...body,
      }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  tone = T.gold,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: Tone;
  variant?: "solid" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${tone.deep}, ${tone.base})`,
          color: "#1a1206",
          boxShadow: `0 8px 22px -12px ${tone.base}`,
        }
      : variant === "soft"
        ? { background: tone.soft, color: tone.deep, border: `1px solid ${tone.base}44` }
        : { background: "rgba(255,255,255,0.04)", color: C.inkSoft, border: `1px solid ${C.edge}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b45c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#100e12] ${pad} ${className}`}
      style={{ ...styles, ...body }}
    >
      {children}
    </button>
  );
}

// — Sparkline die als een lichtstraal oplicht —
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
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="5"
        fill="none"
        stroke={tone}
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}

function SectionHead({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-4 w-1 rounded-full"
        style={{
          background: `linear-gradient(180deg, ${C.goldDeep}, ${C.gold})`,
          boxShadow: `0 0 12px ${C.gold}`,
        }}
      />
      <div>
        {kicker && (
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: C.inkFaint }}
          >
            {kicker}
          </p>
        )}
        <h2
          className="text-[16px] font-semibold tracking-[-0.01em]"
          style={{ color: C.ink, ...display }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept486() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.stage,
        backgroundImage: [
          spotlight("50%", "-8%"),
          `radial-gradient(90% 60% at 50% 120%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)`,
        ].join(","),
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
              onVerif={() => setScreen("verificatie")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && (
            <Acties
              onMarkt={() => setScreen("marktplaats")}
              onVerif={() => setScreen("verificatie")}
            />
          )}
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
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `radial-gradient(circle at 40% 30%, ${C.goldDeep}, ${C.gold} 60%, ${C.amber})`,
            color: "#1a1206",
            boxShadow: `0 8px 24px -8px ${C.gold}`,
          }}
          aria-hidden="true"
        >
          <Aperture size={20} strokeWidth={1.8} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Schaduwtheater
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.naam} · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.sageDeep, background: C.sageSoft, border: `1px solid ${C.sage}44` }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.edge}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <FileText size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.gold, color: "#1a1206", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{
            background: C.goldSoft,
            color: C.goldDeep,
            border: `1px solid ${C.gold}44`,
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
    <nav aria-label="Hoofdnavigatie">
      <div
        className="flex items-stretch gap-1.5 overflow-x-auto rounded-xl p-1.5"
        style={{ background: C.stageDeep, border: `1px solid ${C.edgeSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e6b45c]"
              style={
                on
                  ? {
                      color: "#1a1206",
                      background: `linear-gradient(180deg, ${C.goldDeep}, ${C.gold})`,
                      boxShadow: `0 6px 18px -8px ${C.gold}`,
                      ...body,
                    }
                  : { color: C.inkMute, background: "transparent", ...body }
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
  onVerif,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Stage lit className="p-7">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: C.goldDeep }}
          >
            In de schijnwerpers · {PROFIEL.plaats}
          </p>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]"
            style={{ color: C.ink, ...display }}
          >
            Het podium is van jou, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je certificaten staan in het licht, verse matches wachten in de coulissen en één actie
            vraagt nu je aandacht. Alles wat telt, uitgelicht — de rest in rust.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button tone={T.gold} onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Button>
            <Button variant="ghost" onClick={onMarkt}>
              Naar marktplaats
            </Button>
          </div>
        </Stage>

        <Stage lit className="flex flex-col p-6">
          <Chip tone={T.amber} Icon={AlertTriangle}>
            Vraagt aandacht
          </Chip>
          <h2
            className="mt-3 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <Button tone={T.amber} className="w-full" onClick={onVerif}>
              {primair.cta} <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
          <p
            className="mt-4 flex items-center gap-2 pt-3 text-[12px]"
            style={{ color: C.inkMute, borderTop: `1px solid ${C.edge}` }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.sageDeep }} />
            {verified}/{CREDENTIALS.length} geverifieerd · {ratio}% compleet
          </p>
        </Stage>
      </section>

      <section>
        <SectionHead kicker="Deze maand">Kerncijfers</SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [T.gold, T.sage, T.ice, T.amber][i % 4] as Tone;
            return (
              <Stage key={k.label} className="p-5">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p
                    className="text-[26px] font-semibold leading-none tracking-[-0.01em]"
                    style={{ color: C.ink, ...num }}
                  >
                    {k.value}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: k.up ? C.sageDeep : C.amberDeep, ...num }}
                  >
                    {k.up ? (
                      <TrendingUp size={12} aria-hidden="true" />
                    ) : (
                      <TrendingDown size={12} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone.base} />
                </div>
              </Stage>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead kicker="Matching">Opdrachten voor jou</SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="mb-4 text-[12px] font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b45c]"
              style={{ color: C.goldDeep }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} lit={i === 0} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead kicker="Vertrouwen">Certificaten</SectionHead>
          <Stage className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = credMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: m.tone.soft,
                        color: m.tone.deep,
                        border: `1px solid ${m.tone.base}33`,
                      }}
                      aria-hidden="true"
                    >
                      <m.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: m.alarm ? m.tone.deep : C.inkMute }}
                      >
                        {m.label}
                      </span>
                    </span>
                    {m.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: m.tone.deep }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Stage>
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({
  opdracht,
  onOpen,
  lit,
}: {
  opdracht: Opdracht;
  onOpen: () => void;
  lit: boolean;
}) {
  return (
    <Stage as="article" lit={lit}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e6b45c]"
      >
        <MatchSpot value={opdracht.match} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15px] font-semibold"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold"
            style={{ color: C.sageDeep }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Stage>
  );
}

// — Match als een lichtcirkel die uit de schaduw oplicht —
function MatchSpot({ value, size = 50 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? T.sage : T.gold;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 40%, ${tone.soft}, transparent 72%)`,
        border: `1.5px solid ${tone.base}66`,
        boxShadow: `0 0 18px -4px ${tone.base}88`,
      }}
      aria-hidden="true"
    >
      <span className="text-[13px] font-semibold leading-none" style={{ color: tone.deep, ...num }}>
        {value}
      </span>
    </span>
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
        <SectionHead kicker="Marktplaats">Opdrachten die bij je passen</SectionHead>
        <p className="text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde
          profiel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.edge}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#6f6860]"
            style={{ color: C.ink, ...body }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b45c]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              tone={T.gold}
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Stage className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.edge }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.edge }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.edge }}
                    />
                  </div>
                </div>
              </Stage>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="Het doek valt even"
          tekst="We konden de opdrachten niet ophalen. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets in het licht"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} lit={i === 0} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b45c]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
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
    <Stage lit className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${C.goldSoft}, transparent 72%)`,
          color: C.goldDeep,
          border: `1.5px solid ${C.gold}66`,
        }}
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink, ...display }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Button tone={T.gold} className="mt-6" onClick={onCta}>
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Stage>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
  lit,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
  lit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Stage as="article" lit={lit} className="p-5">
      <div className="flex items-start gap-4">
        <MatchSpot value={opdracht.match} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={strong ? T.sage : T.gold} Icon={strong ? ShieldCheck : Aperture}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: C.inkSoft,
                  border: `1px solid ${C.edge}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b45c]"
          style={{ color: C.goldDeep, background: C.goldSoft, border: `1px solid ${C.gold}44` }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Aperture size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Button tone={strong ? T.sage : T.gold} onClick={onOpen}>
            Reageren <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={T.sage}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={T.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Stage>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: tone.soft, border: `1px solid ${tone.base}33` }}
    >
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone.deep }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone.deep }}
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
  const tone = strong ? T.sage : T.gold;
  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Button>

      <Stage lit className="p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: C.inkSoft,
              border: `1px solid ${C.edge}`,
              ...num,
            }}
          >
            {opdracht.id}
          </span>
          <Chip tone={tone} Icon={ShieldCheck}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[27px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[33px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button tone={T.gold}>
            <Check size={15} aria-hidden="true" /> Reageer op opdracht
          </Button>
          <Button variant="ghost">Bewaren</Button>
        </div>
      </Stage>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, Icon: Clock },
          { l: "Start", v: opdracht.start, Icon: Aperture },
          { l: "Match", v: `${opdracht.match}%`, Icon: ShieldCheck },
        ].map((m) => (
          <Stage key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: C.goldSoft, color: C.goldDeep, border: `1px solid ${C.gold}33` }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </Stage>
        ))}
      </div>

      <section>
        <SectionHead kicker="Verklaarbare matching">Waarom deze match bij je past</SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Stage className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.sageDeep }}
            >
              <Check size={15} aria-hidden="true" /> In jouw voordeel
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
                    style={{ color: C.sageDeep }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Stage>
          <Stage className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.amberDeep }}
            >
              <AlertTriangle size={15} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amberDeep }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Stage>
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
    <div className="space-y-5">
      <Stage lit className="p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: C.goldDeep }}
            >
              Vertrouwensniveau
            </p>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...display }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              bijna — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${C.sageSoft}, transparent 72%)`,
              border: `2px solid ${C.sage}66`,
              color: C.sageDeep,
            }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-semibold leading-none" style={{ ...num }}>
              {ratio}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]">
              % in orde
            </span>
          </span>
        </div>
        <div
          className="mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: `linear-gradient(90deg, ${C.sage}, ${C.sageDeep})`,
              boxShadow: `0 0 12px ${C.sage}`,
            }}
          />
        </div>
      </Stage>

      <div>
        <SectionHead kicker="Vertrouwen">Certificaten</SectionHead>
        <Stage className="p-2">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 rounded-lg px-3 py-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7fbf9a]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: m.tone.soft,
                        color: m.tone.deep,
                        border: `1px solid ${m.tone.base}33`,
                      }}
                      aria-hidden="true"
                    >
                      <m.Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip tone={m.tone} Icon={m.Icon}>
                          {m.label}
                          {m.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pb-4 sm:pl-[68px]">
                        <div
                          className="rounded-lg p-4"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${C.edge}`,
                          }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              tone={
                                c.status === "EXPIRING"
                                  ? T.amber
                                  : c.status === "REJECTED"
                                    ? T.rose
                                    : T.sage
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </Button>
                            <Button size="sm" variant="ghost">
                              Historie
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Stage>
      </div>

      <div>
        <SectionHead kicker="Veilig bewaard">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const m = credMeta(d.status);
            return (
              <Stage key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: C.inkSoft,
                    border: `1px solid ${C.edge}`,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Chip>
              </Stage>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt, onVerif }: { onMarkt: () => void; onVerif: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionHead kicker="Op volgorde van urgentie">Wat vandaag je aandacht vraagt</SectionHead>
        <p className="max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          De eerste staat in het licht — handel van boven naar beneden af, één voor één.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? T.amber : T.gold;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goVerif = a.cta.toLowerCase().includes("vog");
          return (
            <li key={a.titel}>
              <Stage lit={i === 0} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold"
                    style={{
                      background: `radial-gradient(circle at 50% 40%, ${tone.soft}, transparent 72%)`,
                      color: tone.deep,
                      border: `1.5px solid ${tone.base}66`,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} Icon={warn ? AlertTriangle : Aperture}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[17px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Button tone={tone} onClick={goMarkt ? onMarkt : goVerif ? onVerif : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Stage>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { tone: Tone; Icon: LucideIcon } {
  if (status === "Betaald") return { tone: T.sage, Icon: Check };
  if (status === "Openstaand") return { tone: T.amber, Icon: Clock };
  return { tone: T.ice, Icon: FileText };
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
        <SectionHead kicker="Administratie">Jouw facturen</SectionHead>
        <Button tone={T.gold}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.sage, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.amber, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.ice, Icon: FileText },
        ].map((s) => (
          <Stage key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: s.tone.soft,
                  color: s.tone.deep,
                  border: `1px solid ${s.tone.base}33`,
                }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip tone={s.tone}>{s.l}</Chip>
            </div>
            <p className="mt-3 text-[24px] font-semibold" style={{ color: C.ink, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Stage>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            tone={T.gold}
            variant={sort === s ? "solid" : "ghost"}
            onClick={() => setSort(s)}
          >
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Button>
        ))}
      </div>

      <Stage className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.edge}` }}>
              {["Klant", "Nummer", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, textAlign: h === "Bedrag" ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const { tone, Icon } = factuurTone(f.status);
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}>
                  <td className="px-4 py-3 text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-semibold"
                    style={{ color: C.ink, ...num }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={tone} Icon={Icon}>
                      {f.status}
                    </Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Stage>
    </div>
  );
}
