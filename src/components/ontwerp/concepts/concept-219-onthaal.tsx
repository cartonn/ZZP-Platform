"use client";

// Concept 219 — "Onthaal" · warm-menselijk, gastvrij. 2026-trend: human-centered design als tegengif voor
// koud-zakelijke SaaS. Warme neutrale basis (crème/perzik) met terracotta-accent en zacht groen voor "goed".
// Royale radii, grote raakvlakken, ademende layout en een hartelijke — maar zakelijk correcte — micro-copy-toon.
// Het platform verwelkomt je: geen fel, geen kil, wél geruststellend en persoonlijk. Fonts: Manrope (koppen/nadruk)
// + Inter (lopende tekst). Status = altijd label + icoon, nooit alleen kleur. UI Nederlands, code Engels.
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Heart,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Sparkles,
  Sun,
  Handshake,
  MessageCircle,
  Bookmark,
  Send,
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

// ── Palet — warme crème/perzik-basis, terracotta-accent, honingzacht secundair, geruststellend groen. ──
const C = {
  bg: "#fbf6f0", // warme crème
  bgWarm: "#f6ece1", // dieper perzik-zand
  panel: "#fffdfa", // roomwit paneel
  panelHi: "#fdf4ea", // hover / opgetild
  ink: "#2b2422", // warme donkerbruin-inkt
  inkSoft: "#6b5f58", // secundaire tekst
  inkFaint: "#9c8d82", // labels / fijn
  line: "#efe3d5", // zachte rand
  lineStrong: "#e3d2bf", // sterkere rand
  accent: "#e07a5f", // terracotta (hoofdaccent)
  accentDeep: "#c65b40", // dieper terracotta
  accentInk: "#4a1d10", // tekst op terracotta
  accentBg: "#fbe4dc", // zacht terracotta-vlak
  honey: "#e9b872", // warm-secundair (honing)
  honeyDeep: "#c9942f",
  honeyBg: "#faedd3",
  ok: "#5a9367", // zacht groen (goed)
  okDeep: "#3f7350",
  okBg: "#e2efe4",
  wait: "#3d7ba8", // rustig blauw (in behandeling)
  waitBg: "#e0edf5",
  warn: "#b07a1e", // warm amber (aandacht)
  warnBg: "#f8ecd2",
  bad: "#c0553f", // gedempt rood (afgewezen)
  badBg: "#f8e1da",
};

const headF = { fontFamily: "var(--font-lab-manrope)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.okDeep, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ ...headF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Zacht paneel met warme rand en subtiele opgetilde schaduw — de basisvorm van dit ontwerp.
function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[26px] ${className}`}
      style={{
        background: C.panel,
        boxShadow: `0 1px 0 ${C.line}, 0 12px 30px -22px ${C.ink}30`,
        border: `1px solid ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — vriendelijk rond icoonvlak + titel + optionele geruststellende ondertitel.
function SectionHead({
  title,
  sub,
  Icon,
  tint = C.accent,
  tintBg = C.accentBg,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
  tintBg?: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: tintBg }}
        aria-hidden="true"
      >
        <Icon size={19} strokeWidth={2.2} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[19px] font-extrabold leading-tight" style={{ ...headF, color: C.ink }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={15} strokeWidth={2} style={{ color: C.honeyDeep }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Kleine, vriendelijke sparkline (deterministisch uit de mock-reeks).
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 26 - ((v - min) / span) * 22 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Warme match-badge — rond, honing-getint, met "%".
function MatchBadge({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? { box: "h-24 w-24", num: "text-[32px]", lbl: "text-[10px]" }
      : size === "sm"
        ? { box: "h-12 w-12", num: "text-[15px]", lbl: "text-[8px]" }
        : { box: "h-16 w-16", num: "text-[21px]", lbl: "text-[9px]" };
  return (
    <span
      className={`flex ${dims.box} shrink-0 flex-col items-center justify-center rounded-full`}
      style={{
        background: `linear-gradient(150deg, ${C.honeyBg}, ${C.accentBg})`,
        border: `1.5px solid ${C.honey}`,
      }}
      aria-hidden="true"
    >
      <span
        className={`${dims.num} font-extrabold tabular-nums leading-none`}
        style={{ ...headF, color: C.accentDeep }}
      >
        {value}
      </span>
      <span
        className={`${dims.lbl} font-bold uppercase tracking-[0.14em]`}
        style={{ ...headF, color: C.honeyDeep }}
      >
        match
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept219() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* zachte, warme lichtvlekken — geruststellende sfeer, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(760px 460px at 12% -6%, ${C.accentBg}70, transparent 60%), radial-gradient(680px 440px at 96% 4%, ${C.honeyBg}70, transparent 62%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — hartelijk welkom */}
        <header
          className="sticky top-0 z-30"
          style={{ background: `${C.bg}f2`, backdropFilter: "blur(10px)" }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: C.accent, boxShadow: `0 8px 20px -8px ${C.accentDeep}` }}
                aria-hidden="true"
              >
                <Handshake size={22} strokeWidth={2.2} style={{ color: "#fff" }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[19px] font-extrabold leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  Onthaal
                </div>
                <div className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  Fijn dat je er bent, {PROFIEL.naam.split(" ")[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold sm:inline-flex"
                style={{ ...headF, background: C.okBg, color: C.okDeep }}
              >
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
                style={{
                  ...headF,
                  background: C.honeyBg,
                  color: C.accentDeep,
                  border: `1.5px solid ${C.honey}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — zachte pill-tabs */}
          <nav
            className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-3 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...headF,
                          background: C.ink,
                          color: C.bg,
                          ["--tw-ring-color" as string]: C.accent,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                      : {
                          ...headF,
                          background: C.panel,
                          color: C.inkSoft,
                          border: `1px solid ${C.line}`,
                          ["--tw-ring-color" as string]: C.accent,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t pt-6 text-center text-[12px]"
            style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
          >
            <Heart size={13} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" /> Met
            zorg gemaakt — elke status draagt een woord én een icoon, zodat alles altijd duidelijk
            is.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const sparkColors = [C.accent, C.honeyDeep, C.ok, C.wait];

  return (
    <div className="space-y-8">
      {/* Warm welkomstpaneel */}
      <Panel
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.panel}, ${C.panelHi})` }}
      >
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
              style={{ ...headF, background: C.honeyBg, color: C.honeyDeep }}
            >
              <Sun size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-5 text-[30px] font-extrabold leading-[1.08] sm:text-[40px]"
              style={{ ...headF, color: C.ink }}
            >
              Welkom terug, {PROFIEL.naam.split(" ")[0]}.
              <br />
              <span style={{ color: C.accentDeep }}>Drie warme matches</span> staan voor je klaar.
            </h1>
            <p
              className="mt-4 max-w-lg text-[15px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              We hebben rustig voor je meegekeken. Er is één ding dat aandacht vraagt — je VOG
              verloopt binnenkort — en verder ziet je week er goed en geregeld uit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.accent,
                  color: "#fff",
                  boxShadow: `0 10px 22px -10px ${C.accentDeep}`,
                  ["--tw-ring-color" as string]: C.accentDeep,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk je matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.panel,
                  color: C.ink,
                  border: `1.5px solid ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los één ding op
              </button>
            </div>
          </div>

          {/* Vertrouwens-cirkel */}
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-[22px] p-6 text-center"
            style={{ background: C.bgWarm, border: `1px solid ${C.line}` }}
          >
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke={C.line} strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={C.ok}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(dek / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className="text-[30px] font-extrabold tabular-nums leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  {dek}%
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...headF, color: C.inkFaint }}
                >
                  dekking
                </span>
              </div>
            </div>
            <StatusChip status="VERIFIED" />
            <p className="text-[12.5px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Opdrachtgevers
              zien alleen gecontroleerde documenten.
            </p>
          </div>
        </div>
      </Panel>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  ...headF,
                  background: k.up ? C.okBg : C.honeyBg,
                  color: k.up ? C.okDeep : C.honeyDeep,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.accent} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Warm aanbevolen"
            sub="Opdrachten die goed bij je passen"
            Icon={Sparkles}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ["--hov" as string]: C.panelHi,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <MatchBadge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-extrabold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[13px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                          style={{ ...bodyF, background: C.okBg, color: C.okDeep }}
                        >
                          <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Panel>
            ))}
          </div>
        </section>

        {/* Rechterkolom — aandachtspunt + berichten */}
        <section className="space-y-4">
          <SectionHead
            title="Vraagt aandacht"
            sub="Eén rustig te regelen puntje"
            Icon={Bookmark}
            tint={C.warn}
            tintBg={C.warnBg}
          />
          <Panel
            className="relative overflow-hidden"
            style={{ background: `linear-gradient(150deg, ${C.warnBg}, ${C.panelHi})` }}
          >
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...headF, background: C.warn, color: "#fff" }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[18px] font-extrabold leading-tight"
                style={{ ...headF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.ink,
                  color: C.bg,
                  ["--tw-ring-color" as string]: C.warn,
                  ["--tw-ring-offset-color" as string]: C.warnBg,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4">
              <MessageCircle
                size={16}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              <span className="text-[14px] font-extrabold" style={{ ...headF, color: C.ink }}>
                Recente berichten
              </span>
            </div>
            <div className="mt-2">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ ...headF, background: C.accentBg, color: C.accentDeep }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13.5px] font-bold"
                        style={{ ...headF, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-label="Ongelezen bericht"
                        />
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-[12px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ ...bodyF, color: C.inkFaint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Alle open opdrachten, rustig op een rij"
          Icon={Search}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.panel, border: `1.5px solid ${C.line}` }}
          >
            <Search size={16} style={{ color: C.accent }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1.5px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Zachte foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[20px] p-4"
          role="alert"
          style={{ background: C.badBg, border: `1.5px solid ${C.bad}44` }}
        >
          <XCircle size={20} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold" style={{ ...headF, color: C.ink }}>
              We konden niet alles ophalen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de opdrachten liet even op zich wachten. Ververs gerust om het opnieuw te
              proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...headF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-16 w-16 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-full"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-full"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: C.honeyBg }}
            aria-hidden="true"
          >
            <Search size={32} strokeWidth={1.8} style={{ color: C.honeyDeep }} />
          </span>
          <p className="text-[20px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Nog niets gevonden
          </p>
          <p
            className="max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het zoekveld,
            dan tonen we weer alles wat er is.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.accent,
              color: "#fff",
              ["--tw-ring-color" as string]: C.accentDeep,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alle opdrachten
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ ...headF, background: C.bgWarm, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <MatchBadge value={o.match} size="sm" />
              </div>
              <div className="px-5 pb-2 pt-3">
                <h3
                  className="text-[17px] font-extrabold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2.5">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                      style={{ ...bodyF, background: C.honeyBg, color: C.honeyDeep }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-4 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.accentDeep,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1.5px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.panel}, ${C.panelHi})` }}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ ...headF, background: C.honeyBg, color: C.honeyDeep }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-extrabold leading-[1.1] sm:text-[34px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchBadge value={opdracht.match} size="lg" />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: C.honeyBg }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2} style={{ color: C.honeyDeep }} />
            </span>
            <div
              className="mt-3 text-[17px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...headF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit bij je past" Icon={Check} tint={C.ok} tintBg={C.okBg} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.6} style={{ color: C.okDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <SectionHead
            title="Even bij stilstaan"
            Icon={TriangleAlert}
            tint={C.warn}
            tintBg={C.warnBg}
          />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2.2} style={{ color: C.ok }} aria-hidden="true" />
          <span className="text-[14px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{
                ...bodyF,
                background: C.bgWarm,
                color: C.inkSoft,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck
                size={13}
                strokeWidth={2.2}
                style={{ color: C.honeyDeep }}
                aria-hidden="true"
              />{" "}
              {t}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...headF,
            background: applied ? C.okBg : C.accent,
            color: applied ? C.okDeep : "#fff",
            boxShadow: applied ? "none" : `0 12px 24px -12px ${C.accentDeep}`,
            ["--tw-ring-color" as string]: C.accentDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.honeyBg : C.panel,
            color: C.ink,
            border: `1.5px solid ${saved ? C.honey : C.line}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Heart
            size={16}
            strokeWidth={2.2}
            style={{ color: saved ? C.accent : C.honeyDeep }}
            fill={saved ? C.accent : "none"}
            aria-hidden="true"
          />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je betrouwbaar maken"
          Icon={ShieldCheck}
          tint={C.ok}
          tintBg={C.okBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.accent,
            color: "#fff",
            ["--tw-ring-color" as string]: C.accentDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Panel
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.okBg}, ${C.panelHi})` }}
      >
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke={`${C.ok}33`} strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={C.okDeep}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(dek / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span
                className="text-[28px] font-extrabold tabular-nums leading-none"
                style={{ ...headF, color: C.ink }}
              >
                {dek}%
              </span>
            </div>
          </div>
          <div className="max-w-sm">
            <div className="text-[20px] font-extrabold" style={{ ...headF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat maakt je profiel warmer en betrouwbaarder. Je bent al
              ver — nog even en alles staat op groen.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...headF,
                background: C.panel,
                color: C.okDeep,
                border: `1px solid ${C.ok}44`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-extrabold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-3 py-1 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...headF,
                        background: C.bgWarm,
                        color: C.ink,
                        border: `1px solid ${C.line}`,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijken"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Documenten-lijst */}
      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé bewaard"
          Icon={FileText}
          tint={C.wait}
          tintBg={C.waitBg}
        />
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgWarm }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...headF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: C.accentBg }}
                          aria-hidden="true"
                        >
                          <FileText size={15} strokeWidth={2} style={{ color: C.accentDeep }} />
                        </span>
                        <span
                          className="text-[13.5px] font-semibold"
                          style={{ ...headF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Vandaag voor jou"
          sub="Rustig af te vinken, van belangrijk naar minder"
          Icon={Sparkles}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            ...headF,
            background: openCount === 0 ? C.okBg : C.honeyBg,
            color: openCount === 0 ? C.okDeep : C.honeyDeep,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "puntje" : "puntjes"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.warn : C.wait;
          const tintBg = warn ? C.warnBg : C.waitBg;
          return (
            <li key={a.titel}>
              <Panel className="overflow-hidden" style={isDone ? { opacity: 0.7 } : undefined}>
                <div className="flex items-stretch">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: isDone ? C.ok : tint }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[16px] font-extrabold tabular-nums"
                      style={{
                        ...headF,
                        background: isDone ? C.okBg : tintBg,
                        color: isDone ? C.okDeep : tint,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={20} strokeWidth={2.6} />
                      ) : warn ? (
                        <TriangleAlert size={19} strokeWidth={2.2} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]"
                          style={{ ...headF, background: tintBg, color: tint }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Sparkles size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-extrabold ${isDone ? "line-through" : ""}`}
                          style={{ ...headF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13.5px] leading-relaxed"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...headF,
                                  background: C.accent,
                                  color: "#fff",
                                  ["--tw-ring-color" as string]: C.accentDeep,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                              : {
                                  ...headF,
                                  background: C.bgWarm,
                                  color: C.ink,
                                  border: `1.5px solid ${C.line}`,
                                  ["--tw-ring-color" as string]: C.accent,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.okDeep,
                            ["--tw-ring-color" as string]: C.ok,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.6} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Panel className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.okBg }}
            aria-hidden="true"
          >
            <Heart size={28} strokeWidth={2} style={{ color: C.okDeep }} />
          </span>
          <p className="text-[18px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Helemaal bij
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Je hebt alles opgepakt. Geniet van je dag — we laten het weten zodra er iets nieuws is.
          </p>
        </Panel>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.okDeep, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgWarm };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Rustig overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.honeyDeep}
          tintBg={C.honeyBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.accent,
            color: "#fff",
            ["--tw-ring-color" as string]: C.accentDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.okDeep, tintBg: C.okBg },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.warn, tintBg: C.warnBg },
          {
            l: "Nog te factureren",
            v: "€ 1.350",
            Icon: Send,
            tint: C.accentDeep,
            tintBg: C.accentBg,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: s.tintBg }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.2} style={{ color: s.tint }} />
              </span>
              <div className="text-[12px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[26px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.bgWarm }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...headF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-5 py-4 text-[13.5px] font-bold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{ ...headF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-extrabold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...headF, color: C.honey }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-extrabold tabular-nums"
                  style={{ ...headF, color: "#fff" }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
