"use client";

// Concept 55 — "Aquarel" · Geschilderde wassingen, ambachtelijk-warm (waterverf-esthetiek).
// Zachte, organische kleurwassingen (blur-blobs, radial/conic-gradients met lage opacity) als
// achtergrond-textuur, warme aardse tinten die overlopen in zacht blauw/roze, papier-gevoel,
// penseel-achtige accenten onder koppen. De content-kaarten blijven crisp en hoog-leesbaar:
// de wassingen zitten op de achtergrond, nooit achter tekst. Verzorgend, warm, vertrouwenwekkend
// rond gevoelige documenten. Serif display + humanist body.
// Onderscheidend van Aurora/mesh (digitale neon) en Gouden uur: dit is zachte painterly waterverf.
// Palet: papier #faf5ee, blad #fffdf9, inkt #3a2f28, terracotta #c2725a, salie #7f9d84,
// hemel #8bb0c9, oker #c99a52, blush #d69a94.
// Fonts: --font-lab-fraunces (serif display) + --font-lab-jakarta (humanist body).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  FileText,
  MessageSquare,
  Search,
  MapPin,
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Minus,
  Plus,
  Send,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#faf5ee",
  panel: "#fffdf9",
  panelAlt: "#f7efe4",
  ink: "#3a2f28",
  inkSoft: "#5f5147",
  muted: "#8a786a",
  faint: "#ac9a8b",
  line: "#ece0d1",
  lineSoft: "#f3ebde",
  terracotta: "#c2725a",
  sage: "#7f9d84",
  sky: "#8bb0c9",
  ochre: "#c99a52",
  blush: "#d69a94",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };

/* ---------- Status-taal (warm, met kleur + icoon + label) ---------- */

type Tone = "sage" | "sky" | "ochre" | "terracotta";

const TONE: Record<Tone, { fg: string; wash: string; line: string }> = {
  sage: { fg: "#4f6b55", wash: "rgba(127,157,132,0.16)", line: "rgba(127,157,132,0.4)" },
  sky: { fg: "#4a7592", wash: "rgba(139,176,201,0.16)", line: "rgba(139,176,201,0.42)" },
  ochre: { fg: "#8a6420", wash: "rgba(201,154,82,0.18)", line: "rgba(201,154,82,0.44)" },
  terracotta: { fg: "#a24e38", wash: "rgba(194,114,90,0.16)", line: "rgba(194,114,90,0.42)" },
};

function statusMeta(s: CredStatus): { label: string; tone: Tone; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "sage", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "sky", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "ochre", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "terracotta", Icon: X };
  }
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

/* ---------- Primitieven ---------- */

// Zachte waterverf-wassing — blur-blob, laag in opacity, puur decoratief op de achtergrond.
function Wash({
  className = "",
  color,
  size = 340,
}: {
  className?: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 40% 35%, ${color} 0%, transparent 68%)`,
        filter: "blur(46px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function StatusPill({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const m = statusMeta(status);
  const t = TONE[m.tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        small ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ color: t.fg, background: t.wash, border: `1px solid ${t.line}`, ...body }}
    >
      <m.Icon size={small ? 11 : 12.5} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.26em]"
      style={{ color: C.terracotta, ...body }}
    >
      {children}
    </p>
  );
}

// Kop met penseelstreek eronder (geschilderd accent).
function SectionHead({
  kicker,
  title,
  note,
  brush = C.ochre,
}: {
  kicker: string;
  title: string;
  note?: string;
  brush?: string;
}) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="relative mt-2 inline-block text-[28px] font-medium leading-[1.06] tracking-[-0.01em] sm:text-[34px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-2.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${brush} 0%, transparent 92%)`,
            opacity: 0.4,
            filter: "blur(2px)",
            borderRadius: "40% 60% 55% 45% / 60% 40% 60% 40%",
          }}
        />
      </h1>
      {note && (
        <p
          className="mt-3 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ color: C.muted, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Crispe kaart — leesbaar, met zeer zachte papier-schaduw (waterverf op papier).
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(58,47,40,0.04), 0 12px 30px -22px rgba(58,47,40,0.3)",
      }}
    >
      {children}
    </div>
  );
}

// Geschilderde match-ring — waterverf-boog met zachte rand.
function MatchRing({ value, tone }: { value: number; tone: Tone }) {
  const t = TONE[tone];
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${t.fg} ${deg}deg, ${t.wash} ${deg}deg)`,
      }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
        style={{ background: C.panel, color: C.ink, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Hoofdcomponent ---------- */

export function Concept55() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.paper, ...body }}
    >
      {/* Waterverf-wassingen op de achtergrond */}
      <Wash className="-left-24 -top-24" color="rgba(194,114,90,0.55)" size={420} />
      <Wash className="right-[-6rem] top-10" color="rgba(139,176,201,0.5)" size={360} />
      <Wash className="bottom-[-8rem] left-1/3" color="rgba(201,154,82,0.42)" size={400} />
      <Wash className="bottom-16 right-24" color="rgba(214,154,148,0.4)" size={300} />
      {/* Fijne papier-korrel */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `radial-gradient(rgba(58,47,40,0.05) 0.5px, transparent 0.6px)`,
          backgroundSize: "3px 3px",
        }}
      />

      <div className="relative z-10 flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[240px] shrink-0 flex-col p-5 md:flex"
          style={{ borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3 pb-7">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${C.blush}, ${C.terracotta})`,
                boxShadow: "0 6px 16px -8px rgba(194,114,90,0.6)",
              }}
            >
              <Heart size={18} style={{ color: "#fff" }} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[16px] font-medium tracking-tight" style={display}>
                Aquarel
              </div>
              <div className="text-[10.5px]" style={{ color: C.faint }}>
                ZZP · verzorgend
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? TONE.terracotta.wash : "transparent",
                    ["--tw-ring-color" as string]: C.terracotta,
                  }}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: on ? C.terracotta : C.faint }}
                  />
                  <span className="flex-1 text-left font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: C.terracotta }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <Card className="p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${C.sage}, #5f7d64)`,
                    color: "#fff",
                    ...body,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[10.5px]"
                    style={{ color: TONE.sage.fg }}
                  >
                    <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-8"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 className="truncate text-[16px] font-medium tracking-tight" style={display}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#f7efe4] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                  ["--tw-ring-color" as string]: C.terracotta,
                }}
                aria-label="Zoeken"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoeken…</span>
              </button>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold md:hidden"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${C.sage}, #5f7d64)`,
                  color: "#fff",
                }}
              >
                {PROFIEL.initialen}
              </div>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.terracotta : C.muted,
                    background: on ? TONE.terracotta.wash : "transparent",
                    border: `1px solid ${on ? TONE.terracotta.line : C.line}`,
                    ["--tw-ring-color" as string]: C.terracotta,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onOpen={open} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  const KPI_TONE: Tone[] = ["sage", "sky", "ochre", "terracotta"];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Overzicht"
          title={`Fijn dat je er bent, ${PROFIEL.naam.split(" ")[0]}`}
          note="Een warm, rustig beeld van je week. We houden je certificaten in de gaten en wijzen je zachtjes op wat aandacht vraagt."
        />
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
          style={{
            color: TONE.sage.fg,
            background: TONE.sage.wash,
            border: `1px solid ${TONE.sage.line}`,
            ...body,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </div>

      {/* KPI's als geschilderde tegels */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const t = TONE[KPI_TONE[i] ?? "sage"];
          return (
            <Card key={k.label} className="relative overflow-hidden p-4 sm:p-5">
              <span
                aria-hidden="true"
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${t.wash}, transparent 70%)`,
                  filter: "blur(8px)",
                }}
              />
              <p className="relative text-[11.5px] font-medium" style={{ color: C.muted }}>
                {k.label}
              </p>
              <p
                className="relative mt-2 text-[27px] font-medium leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </p>
              <div
                className="relative mt-2.5 flex items-center gap-1.5 text-[11.5px]"
                style={{ color: t.fg }}
              >
                {k.up ? (
                  <ArrowUpRight size={13} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={13} aria-hidden="true" />
                )}
                <span className="font-semibold">{k.trend}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[15px] font-medium tracking-tight" style={display}>
                Opdrachten voor jou
              </h3>
              <span className="text-[11.5px]" style={{ color: C.faint }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7efe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                    ["--tw-ring-color" as string]: C.terracotta,
                  }}
                >
                  <MatchRing value={o.match} tone={o.match >= 90 ? "sage" : "sky"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium" style={{ color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                      {o.tarief}
                    </p>
                    <p className="text-[11px]" style={{ color: C.faint }}>
                      {o.uren}
                    </p>
                  </div>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[15px] font-medium tracking-tight" style={display}>
                Berichten
              </h3>
              <span className="text-[11.5px] font-semibold" style={{ color: C.terracotta }}>
                {ongelezen} ongelezen
              </span>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-5 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: b.ongelezen ? TONE.terracotta.wash : C.panelAlt,
                    color: b.ongelezen ? TONE.terracotta.fg : C.muted,
                    border: `1px solid ${b.ongelezen ? TONE.terracotta.line : C.line}`,
                    ...body,
                  }}
                >
                  {b.initialen}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {b.van}
                    </p>
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: C.terracotta }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                  {b.tijd}
                </span>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Waarschuwing — VOG verloopt */}
          <Card className="relative overflow-hidden p-5">
            <span
              aria-hidden="true"
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full"
              style={{
                background: `radial-gradient(circle, ${TONE.ochre.wash}, transparent 70%)`,
                filter: "blur(6px)",
              }}
            />
            <div className="relative flex items-center gap-2">
              <AlertTriangle size={14} aria-hidden="true" style={{ color: TONE.ochre.fg }} />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: TONE.ochre.fg }}
              >
                Even aandacht
              </span>
            </div>
            <p className="relative mt-2 text-[17px] font-medium leading-snug" style={display}>
              {ACTIES[0]?.titel}
            </p>
            <p className="relative mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onOpen()}
              className="relative mt-4 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                background: `linear-gradient(120deg, ${C.terracotta}, ${C.blush})`,
                ["--tw-ring-color" as string]: C.terracotta,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              {ACTIES[0]?.cta}
            </button>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[15px] font-medium tracking-tight" style={display}>
                Certificaten
              </h3>
            </div>
            <div className="space-y-1 p-3">
              {CREDENTIALS.map((c) => (
                <div key={c.naam} className="flex items-center gap-3 px-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>
                      {c.naam}
                    </p>
                  </div>
                  <StatusPill status={c.status} small />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        brush={C.sky}
        note="Blader rustig door de mogelijkheden. Kies links; het detail verschijnt rechts als een geschilderd blad."
      />

      <Card className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#ac9a8b]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${TONE.sky.wash}, transparent 72%)`,
            }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.sky }} />
          </div>
          <p className="mt-4 text-[18px] font-medium" style={display}>
            Nog niets gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht komt overeen met &quot;{q}&quot;. Probeer een ander woord.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `linear-gradient(120deg, ${C.terracotta}, ${C.blush})`,
              ["--tw-ring-color" as string]: C.terracotta,
            }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              const tone: Tone = o.match >= 90 ? "sage" : "sky";
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    ["--tw-ring-color" as string]: C.terracotta,
                    ["--tw-ring-offset-color" as string]: C.paper,
                  }}
                >
                  <div
                    className="relative flex items-center gap-4 rounded-2xl p-4"
                    style={{
                      background: C.panel,
                      border: `1px solid ${on ? TONE[tone].line : C.line}`,
                      boxShadow: on
                        ? `0 10px 26px -18px rgba(58,47,40,0.4)`
                        : "0 1px 2px rgba(58,47,40,0.03)",
                    }}
                  >
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-3 left-0 w-1 rounded-full"
                        style={{ background: TONE[tone].fg }}
                      />
                    )}
                    <MatchRing value={o.match} tone={tone} />
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[10.5px] uppercase tracking-[0.14em]"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <p
                        className="truncate text-[14.5px] font-medium leading-snug"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                        {o.tarief}
                      </p>
                      <p className="text-[11px]" style={{ color: C.faint }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Card className="sticky top-4 h-fit overflow-hidden p-5">
              <span
                aria-hidden="true"
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${TONE.ochre.wash}, transparent 70%)`,
                  filter: "blur(6px)",
                }}
              />
              <span
                className="relative text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: C.faint }}
              >
                {sel.id}
              </span>
              <h2 className="relative mt-1 text-[21px] font-medium leading-snug" style={display}>
                {sel.titel}
              </h2>
              <p
                className="relative mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={13} aria-hidden="true" /> {sel.opdrachtgever} · {sel.plaats}
              </p>
              <div className="relative mt-4 flex items-center gap-3">
                <MatchRing value={sel.match} tone={sel.match >= 90 ? "sage" : "sky"} />
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: C.ink }}>
                    Match-index
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    op basis van je geverifieerde profiel
                  </p>
                </div>
              </div>
              <dl className="relative mt-4 grid grid-cols-3 gap-2">
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-xl px-2 py-2.5 text-center"
                    style={{ background: C.panelAlt }}
                  >
                    <dt
                      className="text-[9.5px] uppercase tracking-[0.1em]"
                      style={{ color: C.faint }}
                    >
                      {m.l}
                    </dt>
                    <dd className="mt-0.5 text-[12px] font-semibold" style={{ color: C.ink }}>
                      {m.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => onOpen(sel.id)}
                className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: `linear-gradient(120deg, ${C.terracotta}, ${C.blush})`,
                  ["--tw-ring-color" as string]: C.terracotta,
                }}
              >
                Opdracht openen <ChevronRight size={14} aria-hidden="true" />
              </button>
            </Card>
          )}
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
  const tone: Tone = opdracht.match >= 90 ? "sage" : "sky";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <span
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{
            background: `radial-gradient(circle, ${TONE[tone].wash}, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <MatchRing value={opdracht.match} tone={tone} />
            <div className="min-w-0">
              <Kicker>{opdracht.id}</Kicker>
              <h1
                className="mt-1.5 text-[25px] font-medium leading-tight tracking-tight"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[13px]"
                style={{ color: C.muted }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[10.5px]"
                    style={{
                      background: C.panelAlt,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-90"
            style={{
              background:
                state === "sent"
                  ? `linear-gradient(120deg, ${C.sage}, #5f7d64)`
                  : `linear-gradient(120deg, ${C.terracotta}, ${C.blush})`,
              ["--tw-ring-color" as string]: C.terracotta,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="rounded-xl p-3.5" style={{ background: C.panelAlt }}>
              <p
                className="text-[9.5px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                {m.l}
              </p>
              <p className="mt-1 text-[16px] font-semibold" style={{ color: C.ink }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3
          className="flex items-center gap-2 text-[16px] font-medium tracking-tight"
          style={display}
        >
          <Sparkle size={16} aria-hidden="true" style={{ color: C.ochre }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: TONE.sage.fg }}
            >
              <Check size={13} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: TONE.sage.fg }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: TONE.ochre.fg }}
            >
              <Minus size={13} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <Minus
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: TONE.ochre.fg }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const [loading, setLoading] = useState(false);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  const refresh = () => {
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1100);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Verificatie"
          title="Jouw certificaten, veilig bewaard"
          brush={C.sage}
          note="Gevoelige documenten verdienen zorg. Hier zie je in één rustig beeld wat geverifieerd is en wat aandacht vraagt."
        />
        <button
          onClick={refresh}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f7efe4] focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: `1px solid ${C.line}`,
            color: C.inkSoft,
            ["--tw-ring-color" as string]: C.terracotta,
          }}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkle size={13} aria-hidden="true" />
          )}
          Vernieuwen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
        <Card className="relative overflow-hidden p-5">
          <span
            aria-hidden="true"
            className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full"
            style={{
              background: `radial-gradient(circle, ${TONE.sage.wash}, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
          <p
            className="relative text-[11.5px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.muted }}
          >
            Gereedheid
          </p>
          <p
            className="relative mt-2 text-[36px] font-medium leading-none tracking-tight"
            style={display}
          >
            {verified}
            <span className="text-[18px]" style={{ color: C.faint }}>
              /{total}
            </span>
          </p>
          <p
            className="relative mt-3 flex items-center gap-1.5 text-[11.5px]"
            style={{ color: TONE.ochre.fg }}
          >
            <AlertTriangle size={12} aria-hidden="true" /> {attention} vragen aandacht
          </p>
        </Card>

        <Card className="overflow-hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <div
                    className="h-10 w-10 shrink-0 animate-pulse rounded-xl"
                    style={{ background: C.panelAlt }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3 w-1/2 animate-pulse rounded"
                      style={{ background: C.panelAlt }}
                    />
                    <div
                      className="h-2.5 w-2/3 animate-pulse rounded"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                  <div
                    className="h-6 w-24 animate-pulse rounded-full"
                    style={{ background: C.panelAlt }}
                  />
                </div>
              ))
            : CREDENTIALS.map((c, i) => {
                const m = statusMeta(c.status);
                return (
                  <div
                    key={c.naam}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f7efe4]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: TONE[m.tone].wash,
                        border: `1px solid ${TONE[m.tone].line}`,
                      }}
                    >
                      {c.status === "SUBMITTED" ? (
                        <Loader2
                          size={16}
                          className="motion-safe:animate-spin"
                          style={{ color: TONE[m.tone].fg }}
                          aria-hidden="true"
                        />
                      ) : (
                        <m.Icon size={16} style={{ color: TONE[m.tone].fg }} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>
                        {c.naam}
                      </p>
                      <p className="text-[11.5px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                );
              })}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <h3 className="text-[15px] font-medium tracking-tight" style={display}>
            Documentenarchief
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => (
          <div
            key={d.naam}
            className="flex items-center gap-3.5 px-5 py-3.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <FileText size={15} style={{ color: C.terracotta }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                {d.naam}
              </p>
              <p className="truncate text-[11px]" style={{ color: C.faint }}>
                {d.type} · {d.grootte} · {d.bijgewerkt}
              </p>
            </div>
            <StatusPill status={d.status} small />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onOpen }: { onOpen: (id?: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Volgende acties"
        title="Wat vraagt nu je zorg"
        brush={C.terracotta}
        note="Op volgorde van urgentie — we nemen je zachtjes bij de hand, het dringendste eerst."
      />
      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone: Tone = warn ? "ochre" : "sky";
          return (
            <Card
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: TONE[tone].wash, border: `1px solid ${TONE[tone].line}` }}
                >
                  {warn ? (
                    <AlertTriangle size={18} style={{ color: TONE[tone].fg }} aria-hidden="true" />
                  ) : (
                    <ListChecks size={18} style={{ color: TONE[tone].fg }} aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color: TONE[tone].fg,
                    background: TONE[tone].wash,
                    border: `1px solid ${TONE[tone].line}`,
                  }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-2 text-[14px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onOpen()}
                className="shrink-0 self-center rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: TONE[tone].fg,
                  background: TONE[tone].wash,
                  border: `1px solid ${TONE[tone].line}`,
                  ["--tw-ring-color" as string]: C.terracotta,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: TONE.sage.wash, border: `1px solid ${TONE.sage.line}` }}
        >
          <Heart size={18} style={{ color: TONE.sage.fg }} aria-hidden="true" />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Verder is alles in balans. Nieuwe acties verschijnen hier zodra ze relevant worden — we
          houden het voor je in de gaten.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const meta: Record<string, { tone: Tone; Icon: LucideIcon }> = {
    Betaald: { tone: "sage", Icon: Check },
    Openstaand: { tone: "ochre", Icon: Clock },
    Concept: { tone: "sky", Icon: FileText },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Facturen"
          title="Jouw kasstroom"
          brush={C.ochre}
          note="Betaald en openstaand, warm in beeld."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: `linear-gradient(120deg, ${C.terracotta}, ${C.blush})`,
            ["--tw-ring-color" as string]: C.terracotta,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card className="relative overflow-hidden p-5">
          <span
            aria-hidden="true"
            className="absolute -right-6 -top-6 h-20 w-20 rounded-full"
            style={{
              background: `radial-gradient(circle, ${TONE.sage.wash}, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
          <p
            className="relative text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: C.muted }}
          >
            Ontvangen
          </p>
          <p className="relative mt-1.5 text-[25px] font-medium tracking-tight" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="relative overflow-hidden p-5">
          <span
            aria-hidden="true"
            className="absolute -right-6 -top-6 h-20 w-20 rounded-full"
            style={{
              background: `radial-gradient(circle, ${TONE.ochre.wash}, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
          <p
            className="relative text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: C.muted }}
          >
            Openstaand
          </p>
          <p className="relative mt-1.5 text-[25px] font-medium tracking-tight" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = meta[f.status] ?? meta.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f7efe4]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-4 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            color: TONE[m.tone].fg,
                            background: TONE[m.tone].wash,
                            border: `1px solid ${TONE[m.tone].line}`,
                          }}
                        >
                          <m.Icon size={12} aria-hidden="true" />
                          {f.status}
                        </span>
                      </div>
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
