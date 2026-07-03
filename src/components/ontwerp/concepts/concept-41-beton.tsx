"use client";

// Concept 41 — "Beton" · Neo-brutalisme, verfijnd — ruw, structureel, zelfverzekerd.
// Dikke 2px zwarte randen, harde offset-slagschaduwen (box-shadow: 6px 6px 0 #14110c), platte
// blokken die bij hover "vastklikken" (translate + schaduwverschuiving), monospace micro-labels,
// zichtbare rasterstructuur en één elektrische accentkleur. Brutalisme als structuur, niet chaos:
// meedogenloos leesbaar, premium SaaS. Onderscheidend van elk ander concept door de rauwe,
// blok-gebaseerde vormtaal met harde slagschaduwen en tabbladen-als-tegels.
// Palet: papier #f4f1e9, inkt #14110c, elektrisch-limoen #b8f000, hazard-oranje #ff5c1a.
// Fonts: --font-lab-space (display) + --font-lab-plex-mono (labels).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  Zap,
  Square,
  CornerDownRight,
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

const C = {
  paper: "#f4f1e9",
  paperAlt: "#eae6da",
  card: "#fffdf7",
  ink: "#14110c",
  inkSoft: "#3f382e",
  muted: "#6b6252",
  faint: "#98907e",
  lime: "#b8f000",
  limeDeep: "#5f7d00",
  orange: "#ff5c1a",
  orangeDeep: "#c23f0d",
  green: "#1f7a3d",
  greenTint: "#dff0e2",
  line: "#14110c",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

const HARD = "6px 6px 0 #14110c";
const HARD_SM = "4px 4px 0 #14110c";
const HARD_LIME = "6px 6px 0 #b8f000";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

type StatusMeta = { label: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): StatusMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenTint, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.inkSoft, bg: "#efe9da", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.orangeDeep, bg: "#ffe4d6", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.orangeDeep, bg: "#ffe4d6", Icon: X };
  }
}

/* ---------- Brutalistische bouwstenen ---------- */

function Block({
  children,
  className = "",
  shadow = HARD,
  bg = C.card,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: string;
  bg?: string;
  interactive?: boolean;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`border-2 ${interactive ? "transition-all duration-150" : ""} ${className}`}
      style={{ background: bg, borderColor: C.line, boxShadow: shadow }}
    >
      {children}
    </Tag>
  );
}

function MonoLabel({
  children,
  color = C.muted,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${className}`}
      style={{ ...mono, color }}
    >
      {children}
    </span>
  );
}

function Chip({ meta, size = "md" }: { meta: StatusMeta; size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 font-semibold uppercase tracking-wide ${pad}`}
      style={{ ...mono, borderColor: C.line, color: meta.fg, background: meta.bg }}
    >
      <meta.Icon size={size === "sm" ? 10 : 12} aria-hidden="true" strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

function SectionHead({
  index,
  kicker,
  title,
  note,
}: {
  index: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center border-2 text-[15px] font-bold tabular-nums"
        style={{
          ...mono,
          borderColor: C.line,
          background: C.lime,
          color: C.ink,
          boxShadow: HARD_SM,
        }}
      >
        {index}
      </div>
      <div className="min-w-0">
        <MonoLabel color={C.orangeDeep}>{kicker}</MonoLabel>
        <h1
          className="mt-1 text-[27px] font-bold uppercase leading-none tracking-tight sm:text-[31px]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h1>
        {note && (
          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function BarSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 22 + ((d - min) / span) * 14;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-full"
            style={{
              height: `${h}px`,
              background: last ? color : C.ink,
              opacity: last ? 1 : 0.16 + (i / data.length) * 0.5,
              border: `1px solid ${C.line}`,
            }}
          />
        );
      })}
    </div>
  );
}

function MatchBadge({ value }: { value: number }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border-2"
      style={{
        ...mono,
        borderColor: C.line,
        background: value >= 90 ? C.lime : C.card,
        color: C.ink,
      }}
    >
      <span className="text-[14px] font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[7px] font-semibold uppercase tracking-widest">match</span>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept41() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selected, setSelected] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (o: Opdracht) => {
    setSelected(o);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.paper }}
    >
      {/* Zichtbaar raster op de achtergrond */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${C.paperAlt} 1px, transparent 1px), linear-gradient(90deg, ${C.paperAlt} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col border-r-2 p-4 md:flex"
          style={{ borderColor: C.line, background: C.paperAlt }}
        >
          <div className="flex items-center gap-3 pb-6">
            <div
              className="flex h-10 w-10 items-center justify-center border-2 text-[16px] font-bold"
              style={{ ...display, borderColor: C.line, background: C.lime, boxShadow: HARD_SM }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold uppercase tracking-tight" style={display}>
                Beton
              </div>
              <MonoLabel>ZZP Platform</MonoLabel>
            </div>
          </div>

          <MonoLabel className="mb-2 pl-1">Navigatie</MonoLabel>
          <nav className="flex flex-col gap-2">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 border-2 px-3 py-2.5 text-left text-[12.5px] font-semibold uppercase tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...mono,
                    borderColor: C.line,
                    background: on ? C.ink : C.card,
                    color: on ? C.lime : C.inkSoft,
                    boxShadow: on ? HARD_LIME : HARD_SM,
                    transform: on ? "translate(-1px,-1px)" : "none",
                  }}
                >
                  <Icon size={16} aria-hidden="true" strokeWidth={2.5} />
                  <span className="flex-1">{s.label}</span>
                  {on && <Square size={8} aria-hidden="true" fill={C.lime} strokeWidth={0} />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Block className="p-3" shadow={HARD_SM}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 text-[12px] font-bold"
                  style={{ ...display, borderColor: C.line, background: C.orange, color: "#fff" }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={11} aria-hidden="true" style={{ color: C.green }} />
                    <MonoLabel color={C.green}>{PROFIEL.trust}</MonoLabel>
                  </div>
                </div>
              </div>
            </Block>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b-2 px-5 sm:px-7"
            style={{ borderColor: C.line, background: C.card }}
          >
            <MonoLabel color={C.orangeDeep}>
              {String(SCREENS.findIndex((s) => s.key === screen) + 1).padStart(2, "0")} /
            </MonoLabel>
            <h2 className="truncate text-[15px] font-bold uppercase tracking-tight" style={display}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2 border-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex"
                style={{ ...mono, borderColor: C.line, background: C.card, boxShadow: HARD_SM }}
                aria-label="Zoeken"
              >
                <Search size={13} aria-hidden="true" strokeWidth={2.5} />
                Zoek
              </button>
              <button
                className="relative border-2 p-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: C.line, background: C.card, boxShadow: HARD_SM }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" strokeWidth={2.5} />
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center border-2 text-[8px] font-bold"
                  style={{ ...mono, borderColor: C.line, background: C.orange, color: "#fff" }}
                  aria-hidden="true"
                >
                  2
                </span>
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b-2 px-4 py-2.5 md:hidden"
            style={{ borderColor: C.line, background: C.paperAlt }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 border-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide focus-visible:outline-none"
                  style={{
                    ...mono,
                    borderColor: C.line,
                    background: on ? C.ink : C.card,
                    color: on ? C.lime : C.inkSoft,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={openOpdracht} onScreen={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={selected} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onScreen,
}: {
  onOpen: (o: Opdracht) => void;
  onScreen: (s: ScreenKey) => void;
}) {
  const kpiColors = [C.lime, C.orange, C.green, C.orange];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero-blok */}
      <Block className="relative overflow-hidden" bg={C.ink}>
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, ${C.lime} 0 2px, transparent 2px 14px)`,
          }}
        />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <MonoLabel color={C.lime}>Basis · {PROFIEL.plaats}</MonoLabel>
            <h1
              className="mt-2.5 text-[30px] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-[38px]"
              style={display}
            >
              Goeiemorgen,
              <br />
              <span style={{ color: C.lime }}>{PROFIEL.naam.split(" ")[0]}.</span>
            </h1>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed" style={{ color: "#cfc9bb" }}>
              Drie matches boven de 80 procent staan klaar. Eén certificaat vraagt binnenkort actie
              — alles staat scherp op scherm.
            </p>
          </div>
          <button
            onClick={() => onScreen("marktplaats")}
            className="inline-flex shrink-0 items-center gap-2 border-2 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110c]"
            style={{
              ...mono,
              borderColor: C.lime,
              background: C.lime,
              color: C.ink,
              boxShadow: HARD_LIME,
            }}
          >
            <Zap size={15} aria-hidden="true" strokeWidth={2.5} /> Bekijk matches
          </button>
        </div>
      </Block>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.lime;
          return (
            <Block key={k.label} className="p-4" interactive shadow={HARD_SM}>
              <div className="flex items-start justify-between">
                <MonoLabel>{k.label}</MonoLabel>
                <span
                  className="inline-flex items-center gap-0.5 border-2 px-1.5 text-[10px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    borderColor: C.line,
                    color: k.up ? C.green : C.orangeDeep,
                    background: k.up ? C.greenTint : "#ffe4d6",
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" strokeWidth={3} />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" strokeWidth={3} />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-bold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <BarSpark data={k.spark} color={col} />
              </div>
            </Block>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold uppercase tracking-tight" style={display}>
                Beste matches
              </h2>
              <MonoLabel>verklaarbaar gesorteerd</MonoLabel>
            </div>
            <Block>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o)}
                  className="group flex w-full items-center gap-4 border-t-2 px-4 py-3.5 text-left transition-colors first:border-t-0 hover:bg-[#f4f1e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff5c1a]"
                  style={{ borderColor: i === 0 ? "transparent" : C.line }}
                >
                  <MatchBadge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                      style={{ ...mono, color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" strokeWidth={2.5} /> {o.opdrachtgever} ·{" "}
                      {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12px] font-bold tabular-nums sm:inline"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="transition-transform group-hover:translate-x-0.5"
                    style={{ color: C.ink }}
                  />
                </button>
              ))}
            </Block>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold uppercase tracking-tight" style={display}>
                Berichten
              </h2>
              <MonoLabel color={C.orangeDeep}>{ongelezen} ongelezen</MonoLabel>
            </div>
            <Block>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 border-t-2 px-4 py-3.5 first:border-t-0"
                  style={{ borderColor: i === 0 ? "transparent" : C.line }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center border-2 text-[11px] font-bold"
                    style={{
                      ...display,
                      borderColor: C.line,
                      background: b.ongelezen ? C.orange : C.paperAlt,
                      color: b.ongelezen ? "#fff" : C.muted,
                    }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-2 w-2 shrink-0 border"
                          style={{ borderColor: C.line, background: C.lime }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </Block>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-[14px] font-bold uppercase tracking-tight" style={display}>
              Certificaten
            </h2>
            <Block className="p-4">
              <div className="space-y-3">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2"
                        style={{ borderColor: C.line, background: st.bg }}
                        aria-hidden="true"
                      >
                        <st.Icon size={14} strokeWidth={2.5} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold">{c.naam}</p>
                        <p className="truncate text-[11px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Block>
          </div>

          {/* Aanbevolen actie */}
          <Block className="p-5" bg={C.lime} shadow={HARD}>
            <MonoLabel color={C.limeDeep}>Aanbevolen nu</MonoLabel>
            <p className="mt-2 text-[18px] font-bold uppercase leading-tight" style={display}>
              {ACTIES[0]?.titel}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onScreen("acties")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 border-2 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, borderColor: C.line, background: C.ink, boxShadow: HARD_SM }}
            >
              <CornerDownRight size={14} aria-hidden="true" strokeWidth={2.5} /> {ACTIES[0]?.cta}
            </button>
          </Block>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        index="02"
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Gesorteerd op verwantschap. Elk blok toont de match en de kernvoorwaarden — direct te lezen, direct te openen."
      />

      <Block className="flex items-center gap-3 px-4 py-3" shadow={HARD_SM}>
        <Search size={17} aria-hidden="true" strokeWidth={2.5} style={{ color: C.orange }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[12px] font-semibold uppercase tracking-wide outline-none placeholder:text-[#98907e]"
          style={{ ...mono, color: C.ink }}
        />
        <span
          className="shrink-0 border-2 px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{ ...mono, borderColor: C.line, background: C.paperAlt }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Block>

      {filtered.length === 0 ? (
        <Block className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center border-2"
            style={{ borderColor: C.line, background: C.orange, boxShadow: HARD_SM }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2.5} color="#fff" />
          </div>
          <p className="mt-5 text-[17px] font-bold uppercase" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaten voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 border-2 px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, borderColor: C.line, background: C.lime, boxShadow: HARD_SM }}
          >
            Wis zoekopdracht
          </button>
        </Block>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o)}
              className="group text-left focus-visible:outline-none"
            >
              <Block className="h-full p-5 transition-all duration-150 group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-focus-visible:ring-2 group-focus-visible:ring-[#ff5c1a] group-focus-visible:ring-offset-2">
                <div className="flex items-start justify-between gap-3">
                  <MonoLabel color={C.faint}>{o.id}</MonoLabel>
                  <MatchBadge value={o.match} />
                </div>
                <p className="mt-3 text-[16px] font-bold uppercase leading-tight" style={display}>
                  {o.titel}
                </p>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[11.5px]"
                  style={{ ...mono, color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" strokeWidth={2.5} /> {o.opdrachtgever} ·{" "}
                  {o.plaats}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="border-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ ...mono, borderColor: C.line, background: C.paperAlt }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t-2 pt-3.5"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="text-[14px] font-bold tabular-nums"
                    style={{ ...display, color: C.orangeDeep }}
                  >
                    {o.tarief}
                  </span>
                  <span
                    className="text-[11.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {o.uren}
                  </span>
                </div>
              </Block>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  const metrics: { l: string; v: string; accent?: boolean }[] = [
    { l: "Tarief", v: opdracht.tarief, accent: true },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Kop */}
      <Block className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MonoLabel color={C.orangeDeep}>{opdracht.id}</MonoLabel>
              <span
                className="border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ ...mono, borderColor: C.line, background: C.lime }}
              >
                {opdracht.match}% match
              </span>
            </div>
            <h1
              className="mt-2.5 text-[26px] font-bold uppercase leading-none tracking-tight"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-2.5 flex items-center gap-1.5 text-[12.5px]"
              style={{ ...mono, color: C.inkSoft }}
            >
              <MapPin size={14} aria-hidden="true" strokeWidth={2.5} /> {opdracht.opdrachtgever} ·{" "}
              {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 border-2 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-100"
            style={{
              ...mono,
              borderColor: C.line,
              background: state === "sent" ? C.green : C.lime,
              color: state === "sent" ? "#fff" : C.ink,
              boxShadow: HARD_SM,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" strokeWidth={2.5} className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" strokeWidth={2.5} />}
            {state === "idle" && <Send size={14} aria-hidden="true" strokeWidth={2.5} />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Verstuurd"}
          </button>
        </div>
      </Block>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <Block key={m.l} className="p-4" shadow={HARD_SM} bg={m.accent ? C.lime : C.card}>
            <MonoLabel color={m.accent ? C.limeDeep : C.muted}>{m.l}</MonoLabel>
            <p
              className="mt-1.5 text-[17px] font-bold tabular-nums leading-none tracking-tight"
              style={display}
            >
              {m.v}
            </p>
          </Block>
        ))}
      </div>

      {/* Waarom deze match */}
      <Block className="p-6">
        <h3 className="text-[15px] font-bold uppercase tracking-tight" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12px]" style={{ ...mono, color: C.muted }}>
          Onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-2 p-4" style={{ borderColor: C.line, background: C.greenTint }}>
            <MonoLabel color={C.green}>Pluspunten</MonoLabel>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[12.5px] font-medium">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2"
                    style={{ borderColor: C.line, background: "#fff" }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 p-4" style={{ borderColor: C.line, background: "#ffe4d6" }}>
            <MonoLabel color={C.orangeDeep}>Aandachtspunten</MonoLabel>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2"
                    style={{ borderColor: C.line, background: "#fff" }}
                    aria-hidden="true"
                  >
                    <Minus size={12} strokeWidth={3} style={{ color: C.orangeDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="border-2 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide"
              style={{ ...mono, borderColor: C.line, background: C.paperAlt }}
            >
              {t}
            </span>
          ))}
        </div>
      </Block>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        index="04"
        kicker="Vertrouwen"
        title="Verificatie"
        note="Elk bewijsstuk onafhankelijk gecontroleerd. Dat is de basis van je vertrouwensniveau bij opdrachtgevers."
      />

      {/* Vertrouwensblok */}
      <Block className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center" bg={C.ink}>
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center border-2"
          style={{ borderColor: C.lime, background: "transparent" }}
        >
          <ShieldCheck size={30} aria-hidden="true" strokeWidth={2} style={{ color: C.lime }} />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-bold uppercase text-white" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-1 text-[12px]" style={{ ...mono, color: "#cfc9bb" }}>
            <span className="font-bold" style={{ color: C.lime }}>
              {verified}
            </span>{" "}
            / {total} geverifieerd · {attention} vraagt actie
          </p>
          <div
            className="mt-3 flex h-3 gap-1 border-2 p-0.5"
            style={{ borderColor: C.lime }}
            aria-hidden="true"
          >
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="h-full flex-1"
                  style={{ background: c.status === "VERIFIED" ? C.lime : st.fg }}
                />
              );
            })}
          </div>
        </div>
      </Block>

      {/* Certificaten */}
      <Block>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 border-t-2 px-5 py-4 transition-colors first:border-t-0 hover:bg-[#f4f1e9]"
              style={{ borderColor: i === 0 ? "transparent" : C.line }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2"
                style={{ borderColor: C.line, background: st.bg }}
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={18}
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon
                    size={18}
                    aria-hidden="true"
                    strokeWidth={2.5}
                    style={{ color: st.fg }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <Chip meta={st} />
            </div>
          );
        })}
      </Block>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[14px] font-bold uppercase tracking-tight" style={display}>
          Documenten
        </h2>
        <Block>
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 border-t-2 px-4 py-3.5 first:border-t-0"
                style={{ borderColor: i === 0 ? "transparent" : C.line }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: C.line, background: C.paperAlt }}
                  aria-hidden="true"
                >
                  <FileText size={15} strokeWidth={2.5} style={{ color: C.inkSoft }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{d.naam}</p>
                  <p className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <Chip meta={st} size="sm" />
              </div>
            );
          })}
        </Block>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.orangeDeep, bg: "#ffe4d6", Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.inkSoft, bg: C.paperAlt, Icon: Bell, label: "Ter info" },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        index="05"
        kicker="Aandacht"
        title="Volgende acties"
        note="Op volgorde van urgentie. Eén blok, één actie — geen ruis."
      />
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Block key={a.titel} className="flex items-start gap-4 p-5" interactive>
              <div className="flex flex-col items-center gap-2">
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: C.line, background: t.bg }}
                >
                  <t.Icon size={19} aria-hidden="true" strokeWidth={2.5} style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 border-2 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest"
                  style={{ ...mono, borderColor: C.line, color: t.fg, background: t.bg }}
                >
                  <t.Icon size={9} aria-hidden="true" strokeWidth={3} /> {t.label}
                </span>
                <p className="mt-2 text-[14px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center border-2 px-4 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  borderColor: C.line,
                  background: a.urgentie === "warning" ? C.orange : C.lime,
                  color: a.urgentie === "warning" ? "#fff" : C.ink,
                  boxShadow: HARD_SM,
                }}
              >
                {a.cta}
              </button>
            </Block>
          );
        })}
      </div>
      <Block className="flex items-center gap-4 p-5" bg={C.greenTint} shadow={HARD_SM}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2"
          style={{ borderColor: C.line, background: "#fff" }}
        >
          <Check size={18} aria-hidden="true" strokeWidth={3} style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bijgewerkt. Nieuwe acties verschijnen hier zodra ze relevant worden — je hoeft niets
          zelf te bewaken.
        </p>
      </Block>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon; label: string }> = {
    Betaald: { fg: C.green, bg: C.greenTint, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.orangeDeep, bg: "#ffe4d6", Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.paperAlt, Icon: FileText, label: "Concept" },
  };

  const totaal = "€ 5.552";
  const openstaand = "€ 1.350";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHead
          index="06"
          kicker="Omzet"
          title="Facturen"
          note="Wat binnen is en wat nog komt — in harde cijfers."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 border-2 px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, borderColor: C.line, background: C.lime, boxShadow: HARD_SM }}
        >
          <Plus size={14} aria-hidden="true" strokeWidth={3} /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Block className="p-4" shadow={HARD_SM}>
          <MonoLabel>Betaald deze maand</MonoLabel>
          <p className="mt-1.5 text-[24px] font-bold tabular-nums leading-none" style={display}>
            {totaal}
          </p>
        </Block>
        <Block className="p-4" shadow={HARD_SM} bg="#ffe4d6">
          <MonoLabel color={C.orangeDeep}>Openstaand</MonoLabel>
          <p className="mt-1.5 text-[24px] font-bold tabular-nums leading-none" style={display}>
            {openstaand}
          </p>
        </Block>
      </div>

      <Block className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}`, background: C.paperAlt }}>
                <th className="px-5 py-3">
                  <MonoLabel>Nummer</MonoLabel>
                </th>
                <th className="px-5 py-3">
                  <MonoLabel>Klant</MonoLabel>
                </th>
                <th className="hidden px-5 py-3 sm:table-cell">
                  <MonoLabel>Datum</MonoLabel>
                </th>
                <th className="px-5 py-3 text-right">
                  <MonoLabel>Bedrag</MonoLabel>
                </th>
                <th className="px-5 py-3 text-right">
                  <MonoLabel>Status</MonoLabel>
                </th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f4f1e9]"
                    style={{ borderTop: i === 0 ? "none" : `2px solid ${C.line}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13.5px] font-bold tabular-nums"
                      style={display}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <span
                          className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                          style={{ ...mono, borderColor: C.line, color: t.fg, background: t.bg }}
                        >
                          <t.Icon size={11} aria-hidden="true" strokeWidth={2.5} /> {t.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Block>
    </div>
  );
}
