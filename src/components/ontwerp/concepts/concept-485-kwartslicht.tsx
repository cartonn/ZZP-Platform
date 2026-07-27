"use client";

// Concept 485 — "Kwartslicht" · Kristallijn mineraal. Koele kwarts-grijzen en ijsblauw, gefacetteerde
// vlakken die licht breken, één dichroïsch accent dat van tint verschuift, scherpe geometrische randen,
// glasheldere precisie. Premium, koel, technisch-elegant — als geslepen kristal.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Diamond,
  FileText,
  Gem,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
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

// — Koel kwarts-palet: ijsgrijs, mist, glacierblauw + dichroïsch accent —
const C = {
  bg: "#eef1f5",
  bgDeep: "#e3e8ef",
  panel: "#f8fafc",
  panelEdge: "#ffffff",
  ink: "#1b2430",
  inkSoft: "#3d4b5c",
  inkMute: "#697787",
  inkFaint: "#95a1b0",
  line: "#d5dde6",
  lineSoft: "#e6ebf1",

  ice: "#3f7db8",
  iceDeep: "#2c5f92",
  iceSoft: "#dceaf6",

  sage: "#3f8f76",
  sageDeep: "#2c6d59",
  sageSoft: "#d8ede6",

  amber: "#b07d2e",
  amberDeep: "#8c611f",
  amberSoft: "#f3e7cf",

  rose: "#b0466a",
  roseDeep: "#8d3453",
  roseSoft: "#f5dde5",
};

// Dichroïsch accent — de kleur die van tint verschuift (magenta → violet → cyaan).
const DICHROIC = "linear-gradient(115deg, #c14b8f 0%, #7b56d6 38%, #3f7db8 66%, #2fb6c6 100%)";

const body = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };
const display = { fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" };
const num = {
  fontFamily: "ui-monospace, 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Gefacetteerd vlak: bijgesneden hoeken die het gevoel van geslepen kristal geven.
const FACET =
  "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

type Tone = { base: string; deep: string; soft: string };
const T = {
  ice: { base: C.ice, deep: C.iceDeep, soft: C.iceSoft } as Tone,
  sage: { base: C.sage, deep: C.sageDeep, soft: C.sageSoft } as Tone,
  amber: { base: C.amber, deep: C.amberDeep, soft: C.amberSoft } as Tone,
  rose: { base: C.rose, deep: C.roseDeep, soft: C.roseSoft } as Tone,
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

// — Gefacetteerd kristalvlak (kaart) met lichtbreking langs de rand —
function Facet({
  children,
  className = "",
  as: Tag = "div",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  glow?: string;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        clipPath: FACET,
        background: `linear-gradient(150deg, ${C.panelEdge} 0%, ${C.panel} 46%, ${C.bgDeep} 100%)`,
        boxShadow: glow
          ? `0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 30px -20px ${glow}`
          : "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 26px -20px rgba(27,36,48,0.4)",
        color: C.ink,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: FACET, border: `1px solid ${C.line}` }}
      />
      {/* lichtstreep die de facet-rand vangt */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[42px] w-[42px]"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)",
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />
      <div className="relative">{children}</div>
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: tone.deep,
        background: tone.soft,
        border: `1px solid ${tone.base}44`,
        clipPath:
          "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
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
  tone = T.ice,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  dichroic = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: Tone;
  variant?: "solid" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  dichroic?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const clip =
    "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)";
  const styles: React.CSSProperties = dichroic
    ? { background: DICHROIC, color: "#fff" }
    : variant === "solid"
      ? { background: tone.base, color: "#f7fafc" }
      : variant === "soft"
        ? { background: tone.soft, color: tone.deep, border: `1px solid ${tone.base}44` }
        : { background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7db8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f5] ${pad} ${className}`}
      style={{ ...styles, clipPath: clip, ...body }}
    >
      {children}
    </button>
  );
}

// — Sparkline als scherpe kristal-lijn —
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
      <path d={line} fill="none" stroke={tone} strokeWidth="1.6" strokeLinejoin="miter" />
      <rect
        x={last[0] - 2}
        y={last[1] - 2}
        width="4"
        height="4"
        fill={tone}
        transform={`rotate(45 ${last[0]} ${last[1]})`}
      />
    </svg>
  );
}

function SectionHead({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-4 w-1.5"
        style={{ background: DICHROIC, clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}
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

export function Concept485() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.bg,
        backgroundImage: [
          "radial-gradient(60% 40% at 82% -6%, rgba(123,86,214,0.10) 0%, rgba(123,86,214,0) 60%)",
          "radial-gradient(50% 34% at 4% 8%, rgba(63,125,184,0.12) 0%, rgba(63,125,184,0) 60%)",
          "linear-gradient(180deg, #eef1f5 0%, #e6ebf1 100%)",
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
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background: DICHROIC,
            color: "#fff",
            clipPath: "polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)",
          }}
          aria-hidden="true"
        >
          <Gem size={20} strokeWidth={1.8} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Kwartslicht
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.naam} · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.sageDeep,
            background: C.sageSoft,
            border: `1px solid ${C.sage}44`,
            clipPath:
              "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            color: C.inkMute,
            clipPath: FACET,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <FileText size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.rose, color: "#fff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
          style={{
            background: C.iceSoft,
            color: C.iceDeep,
            border: `1px solid ${C.ice}44`,
            clipPath: FACET,
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
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7db8]"
              style={{
                color: on ? C.ink : C.inkMute,
                background: on ? C.panel : "transparent",
                border: `1px solid ${on ? C.line : "transparent"}`,
                clipPath: "polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)",
                ...body,
              }}
            >
              {s.label}
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[2px]"
                  style={{ background: DICHROIC }}
                />
              )}
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
        <div
          className="relative overflow-hidden p-7"
          style={{
            clipPath: FACET,
            background: "linear-gradient(140deg, #1b2430 0%, #24405c 55%, #2c5f92 100%)",
            color: "#eef4fb",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-40"
            style={{
              background: DICHROIC,
              clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 12% 82%, 0 30%)",
              filter: "blur(2px)",
            }}
          />
          <p
            className="relative text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "rgba(238,244,251,0.7)" }}
          >
            Goedemorgen · {PROFIEL.plaats}
          </p>
          <h1
            className="relative mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]"
            style={{ ...display }}
          >
            Helder zicht, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="relative mt-3 max-w-md text-[14px] leading-relaxed"
            style={{ color: "rgba(238,244,251,0.85)" }}
          >
            Je certificaten zijn geverifieerd, verse matches liggen klaar en één actie vraagt
            aandacht. Alles glashelder, niets verborgen achter een score.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-2.5">
            <Button dichroic onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              onClick={onMarkt}
              className="!border-white/25 !bg-white/10 !text-white"
            >
              Naar marktplaats
            </Button>
          </div>
        </div>

        <Facet className="flex flex-col p-6" glow="rgba(176,125,46,0.5)">
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
            style={{ color: C.inkMute, borderTop: `1px solid ${C.line}` }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.sageDeep }} />
            {verified}/{CREDENTIALS.length} geverifieerd · {ratio}% compleet
          </p>
        </Facet>
      </section>

      <section>
        <SectionHead kicker="Deze maand">Kerncijfers</SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [T.ice, T.sage, T.amber, T.rose][i % 4] as Tone;
            return (
              <Facet key={k.label} className="p-5">
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
              </Facet>
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
              className="mb-4 text-[12px] font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7db8]"
              style={{ color: C.iceDeep }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead kicker="Vertrouwen">Certificaten</SectionHead>
          <Facet className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = credMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center"
                      style={{
                        background: m.tone.soft,
                        color: m.tone.deep,
                        clipPath:
                          "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
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
          </Facet>
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Facet as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7db8]"
      >
        <MatchGem value={opdracht.match} />
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
    </Facet>
  );
}

// — Match als geslepen edelsteen (ruit) —
function MatchGem({ value, size = 50 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? T.sage : T.ice;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        background: tone.soft,
        border: `1.5px solid ${tone.base}`,
        clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
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
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}`, clipPath: FACET }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#95a1b0]"
            style={{ color: C.ink, ...body }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#e6ebf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7db8]"
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
              tone={T.ice}
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
              <Facet className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 shrink-0 animate-pulse motion-reduce:animate-none"
                    style={{
                      background: C.lineSoft,
                      clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
                    }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              </Facet>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="Geen verbinding"
          tekst="We konden de opdrachten niet ophalen. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
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
            className="text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7db8]"
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
    <Facet className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center"
        style={{
          background: C.iceSoft,
          color: C.iceDeep,
          border: `1.5px solid ${C.ice}`,
          clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
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
      <Button tone={T.ice} className="mt-6" onClick={onCta}>
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Facet>
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
    <Facet as="article" className="p-5">
      <div className="flex items-start gap-4">
        <MatchGem value={opdracht.match} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={strong ? T.sage : T.ice} Icon={strong ? Gem : Diamond}>
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
                className="px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: C.bgDeep,
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                  clipPath:
                    "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)",
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7db8]"
          style={{
            color: C.iceDeep,
            background: C.iceSoft,
            border: `1px solid ${C.ice}33`,
            clipPath:
              "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
          }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Diamond size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Button tone={strong ? T.sage : T.ice} onClick={onOpen}>
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
    </Facet>
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
      className="p-4"
      style={{ background: tone.soft, border: `1px solid ${tone.base}33`, clipPath: FACET }}
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
              style={{ color: tone.base }}
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
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Button>

      <div
        className="relative overflow-hidden p-7"
        style={{
          clipPath: FACET,
          background: "linear-gradient(140deg, #1b2430 0%, #24405c 60%, #2c5f92 100%)",
          color: "#eef4fb",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-40"
          style={{
            background: DICHROIC,
            clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 12% 82%, 0 30%)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(255,255,255,0.14)", ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,0.14)" }}
          >
            <Gem size={12} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[27px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[33px]"
          style={{ ...display }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: "rgba(238,244,251,0.85)" }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <Button dichroic>
            <Check size={15} aria-hidden="true" /> Reageer op opdracht
          </Button>
          <Button variant="ghost" className="!border-white/25 !bg-white/10 !text-white">
            Bewaren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, Icon: Clock },
          { l: "Start", v: opdracht.start, Icon: Diamond },
          { l: "Match", v: `${opdracht.match}%`, Icon: Gem },
        ].map((m) => (
          <Facet key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center"
              style={{
                background: C.iceSoft,
                color: C.iceDeep,
                clipPath:
                  "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
              }}
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
          </Facet>
        ))}
      </div>

      <section>
        <SectionHead kicker="Verklaarbare matching">Waarom deze match bij je past</SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Facet className="p-6" glow="rgba(63,143,118,0.4)">
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
                    style={{ color: C.sage }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Facet>
          <Facet className="p-6" glow="rgba(176,125,46,0.4)">
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
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Facet>
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
      <div
        className="relative overflow-hidden p-7"
        style={{
          clipPath: FACET,
          background: "linear-gradient(140deg, #1b2430 0%, #234a3f 60%, #2c6d59 100%)",
          color: "#ecf6f1",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-30"
          style={{
            background: DICHROIC,
            clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 12% 82%, 0 30%)",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "rgba(236,246,241,0.7)" }}
            >
              Vertrouwensniveau
            </p>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ ...display }}
            >
              {PROFIEL.trust}
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "rgba(236,246,241,0.85)" }}
            >
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              bijna — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.14)",
              clipPath: "polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)",
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
          className="relative mt-5 h-2 w-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.2)" }}
          aria-hidden="true"
        >
          <span className="block h-full" style={{ width: `${ratio}%`, background: DICHROIC }} />
        </div>
      </div>

      <div>
        <SectionHead kicker="Vertrouwen">Certificaten</SectionHead>
        <Facet className="overflow-hidden p-2">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-3 py-4 text-left transition-colors hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f8f76]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                      style={{
                        background: m.tone.soft,
                        color: m.tone.deep,
                        clipPath: "polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)",
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
                          className="p-4"
                          style={{
                            background: C.bgDeep,
                            border: `1px solid ${C.line}`,
                            clipPath: FACET,
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
        </Facet>
      </div>

      <div>
        <SectionHead kicker="Veilig bewaard">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const m = credMeta(d.status);
            return (
              <Facet key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{
                    background: C.bgDeep,
                    color: C.inkSoft,
                    clipPath:
                      "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
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
              </Facet>
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
          Van boven naar beneden afhandelen — helder en één voor één.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? T.amber : T.ice;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goVerif = a.cta.toLowerCase().includes("vog");
          return (
            <li key={a.titel}>
              <Facet className="p-5" glow={warn ? "rgba(176,125,46,0.4)" : undefined}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px] font-semibold"
                    style={{
                      background: tone.soft,
                      color: tone.deep,
                      border: `1.5px solid ${tone.base}55`,
                      clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} Icon={warn ? AlertTriangle : Diamond}>
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
              </Facet>
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
        <Button dichroic>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.sage, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.amber, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.ice, Icon: FileText },
        ].map((s) => (
          <Facet key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{
                  background: s.tone.soft,
                  color: s.tone.deep,
                  clipPath:
                    "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
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
          </Facet>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            tone={T.ice}
            variant={sort === s ? "solid" : "ghost"}
            onClick={() => setSort(s)}
          >
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Button>
        ))}
      </div>

      <Facet className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
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
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
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
      </Facet>
    </div>
  );
}
