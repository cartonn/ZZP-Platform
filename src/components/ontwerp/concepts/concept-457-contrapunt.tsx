"use client";

// Concept 457 — "Contrapunt" · Editorial split-screen.
// Twee-stemmig gesplitst layout-systeem: elk scherm is opgedeeld in twee gesynchroniseerde kolommen
// met een sterke verticale as. Links de ene stem (bv. "wat je hebt" / ZZP'er-blik), rechts de
// tegenstem (bv. "wat nog moet" / opdrachtgever-blik) van dezelfde data. Redactioneel, contrastrijk,
// bold typografie, één krachtig kleurenpaar: inkt-zwart tegenover warm perkament met vermiljoen als
// enige accent. Op mobiel stapelen de twee stemmen netjes. Animaties respecteren
// prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: inkt-zwart tegenover warm perkament, vermiljoen als enige accent —
const C = {
  // perkament (rechtsstem / pagina)
  paper: "#ece2cf",
  paperDeep: "#e2d6bd",
  card: "#f5eede",
  cardSoft: "#efe6d2",
  cardRaise: "#e8dcc4",
  // inkt (linksstem)
  ink: "#1a1712",
  inkDeep: "#100e0a",
  inkCard: "#241f18",
  inkRaise: "#2e281f",
  // vermiljoen-accent
  accent: "#cb4526",
  accentSoft: "#dd6644",
  accentDeep: "#a5391f",
  accentWashPaper: "rgba(203,69,38,0.12)",
  accentWashInk: "rgba(221,102,68,0.16)",
  // tekst op perkament
  onPaper: "#221d15",
  onPaperSoft: "#59503e",
  onPaperMute: "#877c63",
  onPaperFaint: "#a89b7f",
  // tekst op inkt
  onInk: "#f1e7d3",
  onInkSoft: "#c6bba2",
  onInkMute: "#8f846d",
  onInkFaint: "#6a6152",
  // lijnen
  linePaper: "rgba(34,29,21,0.14)",
  linePaperSoft: "rgba(34,29,21,0.08)",
  lineInk: "rgba(241,231,211,0.16)",
  lineInkSoft: "rgba(241,231,211,0.08)",
  // status (perkament-context)
  ok: "#2f8657",
  okInk: "#1f6b41",
  okWash: "rgba(47,134,87,0.14)",
  warn: "#b3781a",
  warnInk: "#8a5c10",
  warnWash: "rgba(179,120,26,0.16)",
  info: "#356f9c",
  infoInk: "#265777",
  infoWash: "rgba(53,111,156,0.14)",
  bad: "#b23a22",
  badInk: "#8f2c18",
  badWash: "rgba(178,58,34,0.14)",
  // status (inkt-context, lichter)
  okOnInk: "#63d29a",
  warnOnInk: "#e6b45c",
  infoOnInk: "#79b8dc",
  badOnInk: "#e78468",
};

const display = {
  fontFamily: "'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function pageBg(): React.CSSProperties {
  return {
    backgroundColor: C.paper,
    backgroundImage:
      "radial-gradient(120% 70% at 0% 0%, rgba(34,29,21,0.05), transparent 55%)," +
      "radial-gradient(90% 60% at 100% 8%, rgba(203,69,38,0.05), transparent 52%)",
  };
}

type Side = "ink" | "paper";

function statusMeta(
  s: CredStatus,
  side: Side = "paper",
): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  const onInk = side === "ink";
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: onInk ? C.okOnInk : C.ok,
        ink: onInk ? C.okOnInk : C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: onInk ? C.infoOnInk : C.info,
        ink: onInk ? C.infoOnInk : C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: onInk ? C.warnOnInk : C.warn,
        ink: onInk ? C.warnOnInk : C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: onInk ? C.badOnInk : C.bad,
        ink: onInk ? C.badOnInk : C.badInk,
        wash: C.badWash,
      };
  }
}

// — Sterke verticale as tussen de twee stemmen; stapelt tot een horizontale scheiding op mobiel —
function SplitStage({
  leftLabel,
  rightLabel,
  left,
  right,
  className = "",
}: {
  leftLabel: string;
  rightLabel: string;
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`grid grid-cols-1 overflow-hidden rounded-[18px] md:grid-cols-2 ${className}`}
      style={{ border: `1.5px solid ${C.onPaper}` }}
    >
      <div
        className="relative flex flex-col"
        style={{ background: C.ink, color: C.onInk, ...crossHatch("ink") }}
      >
        <VoiceHeader label={leftLabel} side="ink" />
        <div className="flex-1 p-5 sm:p-6">{left}</div>
      </div>
      <div
        className="relative flex flex-col"
        style={{
          background: C.card,
          color: C.onPaper,
          borderTop: `1.5px solid ${C.onPaper}`,
          ...crossHatch("paper"),
        }}
      >
        {/* Verticale as-lijn op desktop */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-px md:block"
          style={{ background: C.onPaper }}
        />
        <VoiceHeader label={rightLabel} side="paper" />
        <div className="flex-1 p-5 sm:p-6">{right}</div>
      </div>
    </section>
  );
}

// Fijne redactionele arcering-textuur.
function crossHatch(side: Side): React.CSSProperties {
  const c = side === "ink" ? "rgba(241,231,211,0.03)" : "rgba(34,29,21,0.035)";
  return {
    backgroundImage: `repeating-linear-gradient(135deg, ${c} 0, ${c} 1px, transparent 1px, transparent 7px)`,
  };
}

function VoiceHeader({ label, side }: { label: string; side: Side }) {
  const onInk = side === "ink";
  return (
    <div
      className="flex items-center justify-between gap-2 px-5 py-3 sm:px-6"
      style={{ borderBottom: `1px solid ${onInk ? C.lineInk : C.linePaper}` }}
    >
      <span
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em]"
        style={{ color: onInk ? C.onInkMute : C.onPaperMute, ...bodyFont }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rotate-45"
          style={{ background: C.accent }}
          aria-hidden="true"
        />
        {label}
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: onInk ? C.onInkFaint : C.onPaperFaint, ...bodyFont }}
        aria-hidden="true"
      >
        {onInk ? "I" : "II"}
      </span>
    </div>
  );
}

function Eyebrow({ children, side = "paper" }: { children: React.ReactNode; side?: Side }) {
  const onInk = side === "ink";
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.28em]"
      style={{ color: C.accent, ...bodyFont }}
    >
      <span
        className="inline-block h-2 w-2 rotate-45"
        style={{ background: C.accent }}
        aria-hidden="true"
      />
      <span style={{ color: onInk ? C.onInkMute : C.onPaperMute }}>{children}</span>
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
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-bold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...bodyFont }}
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
  side = "paper",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  side?: Side;
}) {
  const offset =
    side === "ink" ? "focus-visible:ring-offset-[#1a1712]" : "focus-visible:ring-offset-[#ece2cf]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-2.5 text-[13px] font-bold transition-all duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 ${offset} active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#f7efe0",
        background: C.accent,
        border: `1.5px solid ${C.accentDeep}`,
        boxShadow: "0 2px 0 " + C.accentDeep,
        ...bodyFont,
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
  side = "paper",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
  side?: Side;
}) {
  const onInk = side === "ink";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2.5 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece2cf] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#f7efe0" : onInk ? C.onInkSoft : C.onPaper,
        background: active ? C.onPaper : "transparent",
        border: `1.5px solid ${active ? C.onPaper : onInk ? C.lineInk : C.linePaper}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Redactioneel kaartje (perkament) —
function PaperCard({
  children,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-[12px] ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${accent ? C.accent : C.linePaper}`,
        boxShadow: accent ? "0 2px 0 " + C.accentDeep : "0 1px 2px rgba(34,29,21,0.06)",
        color: C.onPaper,
      }}
    >
      {children}
    </Tag>
  );
}

// — Voortgangsbalk, blokkerig/redactioneel —
function BarMeter({
  value,
  side = "paper",
  tone = C.accent,
}: {
  value: number;
  side?: Side;
  tone?: string;
}) {
  const track = side === "ink" ? C.inkRaise : C.cardRaise;
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-[3px]"
        style={{
          background: track,
          border: `1px solid ${side === "ink" ? C.lineInk : C.linePaper}`,
        }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span
        className="text-[12.5px] font-bold"
        style={{ color: side === "ink" ? C.onInk : C.onPaper, ...num }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept457() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.onPaper, ...pageBg() }}
    >
      <style>{`
        @keyframes cpRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .cp-rise { animation: cpRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes cpInLeft { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes cpInRight { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        .cp-in-left { animation: cpInLeft 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cp-in-right { animation: cpInRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .cp-rise, .cp-in-left, .cp-in-right { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="cp-rise pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px]"
          style={{ border: `1.5px solid ${C.onPaper}` }}
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 left-0 w-1/2" style={{ background: C.ink }} />
          <span className="absolute inset-y-0 right-0 w-1/2" style={{ background: C.card }} />
          <span
            className="relative h-4 w-[2px]"
            style={{ background: C.accent }}
            aria-hidden="true"
          />
        </span>
        <div>
          <p
            className="text-[21px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.onPaper, ...display }}
          >
            Contrapunt
          </p>
          <p
            className="mt-1.5 text-[11px] leading-none"
            style={{ color: C.onPaperMute, ...bodyFont }}
          >
            {PROFIEL.plaats} · twee stemmen, één blik
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.ok}`,
            background: C.okWash,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
          style={{
            background: C.cardSoft,
            border: `1px solid ${C.linePaper}`,
            color: C.onPaperMute,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.accent, color: "#f7efe0", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.onPaper, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.onPaperMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-[13px] font-bold"
          style={{
            background: C.ink,
            border: `1.5px solid ${C.onPaper}`,
            color: C.onInk,
            ...bodyFont,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-[10px] p-1.5"
        style={{ background: C.cardSoft, border: `1.5px solid ${C.linePaper}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-[7px] px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2] motion-reduce:transition-none"
              style={{
                color: on ? "#f7efe0" : C.onPaperMute,
                background: on ? C.onPaper : "transparent",
                ...bodyFont,
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
  const [lens, setLens] = useState<"zzp" | "opdrachtgever">("zzp");
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const openReacties = 7;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Vandaag · in twee stemmen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.015em] md:text-[40px]"
            style={{ color: C.onPaper, ...display }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="mt-2 max-w-md text-[13.5px] leading-relaxed"
            style={{ color: C.onPaperSoft }}
          >
            Elke pagina leest als een partituur: links wat je hebt, rechts wat nog moet. Lees ze
            naast elkaar en je weet meteen waar je staat.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-[8px] p-1"
          role="group"
          aria-label="Lens kiezen"
          style={{ background: C.cardSoft, border: `1.5px solid ${C.linePaper}` }}
        >
          {(
            [
              { k: "zzp", l: "Als ZZP'er" },
              { k: "opdrachtgever", l: "Als opdrachtgever" },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => setLens(o.k)}
              aria-pressed={lens === o.k}
              className="rounded-[6px] px-3 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2] motion-reduce:transition-none"
              style={{
                color: lens === o.k ? "#f7efe0" : C.onPaperMute,
                background: lens === o.k ? C.accent : "transparent",
                ...bodyFont,
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <SplitStage
        leftLabel="Wat je hebt"
        rightLabel="Wat nog moet"
        left={
          <div className="cp-in-left space-y-5">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.onInkMute, ...bodyFont }}
              >
                {lens === "zzp" ? "Jouw profiel staat" : "Deze professional biedt"}
              </p>
              <p
                className="mt-2 text-[46px] font-semibold leading-none tracking-[-0.02em]"
                style={{ color: C.onInk, ...num }}
              >
                {ratio}%
                <span className="ml-2 text-[15px] font-bold" style={{ color: C.onInkSoft }}>
                  op orde
                </span>
              </p>
              <div className="mt-3">
                <BarMeter value={ratio} side="ink" tone={C.okOnInk} />
              </div>
            </div>
            <ul className="space-y-2.5">
              {CREDENTIALS.filter((c) => c.status === "VERIFIED").map((c) => (
                <li
                  key={c.naam}
                  className="flex items-center gap-2.5 text-[13px]"
                  style={{ color: C.onInkSoft }}
                >
                  <ShieldCheck
                    size={15}
                    aria-hidden="true"
                    className="shrink-0"
                    style={{ color: C.okOnInk }}
                  />
                  <span className="font-semibold" style={{ color: C.onInk }}>
                    {c.naam}
                  </span>
                  <span className="ml-auto text-[10.5px] uppercase tracking-[0.12em]">
                    geverifieerd
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <PrimaryButton onClick={onOpen} side="ink">
                {lens === "zzp" ? "Naar de marktplaats" : "Profiel bekijken"}
                <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        }
        right={
          <div className="cp-in-right space-y-5">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.onPaperMute, ...bodyFont }}
              >
                Vraagt nu je aandacht
              </p>
              <h2
                className="mt-2 text-[22px] font-semibold leading-snug"
                style={{ color: C.onPaper, ...display }}
              >
                {primair.titel}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.onPaperSoft }}>
                {primair.detail}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton onClick={onActies}>
                {primair.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton onClick={onActies}>Alle acties</GhostButton>
            </div>
            <div
              className="grid grid-cols-2 gap-3 pt-2"
              style={{ borderTop: `1px solid ${C.linePaper}` }}
            >
              <div className="pt-3">
                <p
                  className="text-[26px] font-semibold leading-none"
                  style={{ color: C.accent, ...num }}
                >
                  {openReacties}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: C.onPaperMute }}>
                  open reacties
                </p>
              </div>
              <div className="pt-3">
                <p
                  className="text-[26px] font-semibold leading-none"
                  style={{ color: C.onPaper, ...num }}
                >
                  {CREDENTIALS.length - verified}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: C.onPaperMute }}>
                  nog te verifiëren
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section>
        <div className="mb-3">
          <Eyebrow>Cijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <PaperCard key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: C.onPaperMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-bold"
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
                className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.onPaper, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <EditorialSpark data={k.spark} up={k.up} id={`k457-${k.label}`} />
              </div>
            </PaperCard>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>Open opdrachten</Eyebrow>
          <button
            type="button"
            onClick={onOpen}
            className="rounded text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-[#a5391f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece2cf]"
            style={{ color: C.accent, ...bodyFont }}
          >
            Alle →
          </button>
        </div>
        <PaperCard>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li
                key={o.id}
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.linePaperSoft}` }}
              >
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#e8dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#cb4526] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] text-[12px] font-bold"
                    style={{
                      background: o.match >= 90 ? C.accent : C.cardRaise,
                      color: o.match >= 90 ? "#f7efe0" : C.onPaperSoft,
                      border: `1px solid ${o.match >= 90 ? C.accentDeep : C.linePaper}`,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[15px] font-bold"
                      style={{ color: C.onPaper, ...bodyFont }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12px]"
                      style={{ color: C.onPaperMute }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <BarMeter value={o.match} tone={o.match >= 90 ? C.accent : C.warn} />
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.onPaperFaint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PaperCard>
      </section>
    </div>
  );
}

function EditorialSpark({ data, up, id }: { data: number[]; up: boolean; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const tone = up ? C.accent : C.warn;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
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
        <linearGradient id={`cpf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#cpf-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={C.card} stroke={tone} strokeWidth="1.8" />
    </svg>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

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
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
          style={{ color: C.onPaper, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.onPaperMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten · elke kaart leest links wat
          pleit, rechts wat opvalt
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[8px] px-4 py-3"
          style={{ background: C.card, border: `1.5px solid ${C.linePaper}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.onPaperFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89b7f]"
            style={{ color: C.onPaper, ...bodyFont }}
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
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div
                className="grid grid-cols-1 overflow-hidden rounded-[14px] md:grid-cols-2"
                style={{ border: `1.5px solid ${C.linePaper}` }}
              >
                <div className="p-6" style={{ background: C.ink }}>
                  <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                    <div className="h-3 w-24 rounded-full" style={{ background: C.inkRaise }} />
                    <div className="h-5 w-2/3 rounded-full" style={{ background: C.inkCard }} />
                    <div className="h-3 w-1/2 rounded-full" style={{ background: C.inkRaise }} />
                  </div>
                </div>
                <div className="p-6" style={{ background: C.card }}>
                  <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                    <div className="h-3 w-20 rounded-full" style={{ background: C.cardRaise }} />
                    <div className="h-3 w-full rounded-full" style={{ background: C.cardRaise }} />
                    <div className="h-3 w-3/4 rounded-full" style={{ background: C.cardRaise }} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <PaperCard className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-[12px]"
              style={{ background: C.ink, border: `1.5px solid ${C.accent}`, color: C.accentSoft }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.onPaper, ...display }}>
              Geen tegenstem gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.onPaperSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm om de partituur
              weer te vullen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </PaperCard>
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
  const strong = opdracht.match >= 90;
  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-[14px] md:grid-cols-[1.05fr_1fr]"
      style={{ border: `1.5px solid ${strong ? C.accent : C.onPaper}` }}
    >
      {/* Stem I — inkt: wat pleit vóór */}
      <div
        className="relative flex flex-col"
        style={{ background: C.ink, color: C.onInk, ...crossHatch("ink") }}
      >
        <div
          className="flex items-center justify-between gap-2 px-5 py-2.5"
          style={{ borderBottom: `1px solid ${C.lineInk}` }}
        >
          <span
            className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.onInkMute, ...bodyFont }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rotate-45"
              style={{ background: C.okOnInk }}
              aria-hidden="true"
            />
            Wat pleit vóór
          </span>
          <span className="text-[10px] font-bold" style={{ color: C.onInkFaint, ...num }}>
            № {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3
            className="text-[19px] font-semibold leading-snug"
            style={{ color: C.onInk, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.onInkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ color: C.onInkSoft }}
              >
                <Check
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.okOnInk }}
                />
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[5px] px-2 py-0.5 text-[10px] font-bold"
                style={{
                  color: C.onInkSoft,
                  background: C.inkRaise,
                  border: `1px solid ${C.lineInk}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stem II — perkament: wat opvalt + score/actie */}
      <div
        className="relative flex flex-col"
        style={{ background: C.card, color: C.onPaper, ...crossHatch("paper") }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-px md:block"
          style={{ background: strong ? C.accent : C.onPaper }}
        />
        <div
          className="flex items-center justify-between gap-2 px-5 py-2.5"
          style={{ borderBottom: `1px solid ${C.linePaper}` }}
        >
          <span
            className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.onPaperMute, ...bodyFont }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rotate-45"
              style={{ background: C.warn }}
              aria-hidden="true"
            />
            Wat opvalt
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10px] font-bold"
            style={{
              color: strong ? "#f7efe0" : C.onPaper,
              background: strong ? C.accent : C.cardRaise,
              ...num,
            }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ color: C.onPaperSoft }}
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
          <div
            className="mt-4 flex items-center justify-between gap-3 pt-4"
            style={{ borderTop: `1px solid ${C.linePaper}` }}
          >
            <div>
              <p
                className="text-[18px] font-semibold leading-none"
                style={{ color: C.onPaper, ...num }}
              >
                {opdracht.tarief}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.onPaperMute }}>
                start {opdracht.start.toLowerCase()}
              </p>
            </div>
            <PrimaryButton onClick={onOpen}>
              Reageer <ArrowRight size={13} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb4526] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece2cf]"
        style={{
          color: C.onPaperSoft,
          border: `1.5px solid ${C.linePaper}`,
          background: C.card,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-[5px] px-2.5 py-0.5 text-[10.5px] font-bold"
          style={{ color: C.onPaperMute, border: `1px solid ${C.linePaper}`, ...num }}
        >
          {opdracht.id}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-[5px] px-2.5 py-0.5 text-[11px] font-bold"
          style={{ color: "#f7efe0", background: C.accent, ...bodyFont }}
        >
          {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
        </span>
      </div>
      <h1
        className="max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[42px]"
        style={{ color: C.onPaper, ...display }}
      >
        {opdracht.titel}
      </h1>
      <p className="text-[14px]" style={{ color: C.onPaperSoft }}>
        {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <PaperCard>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.linePaperSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.linePaperSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.onPaperMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.onPaper, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </PaperCard>

      <div>
        <Eyebrow>Verklaarbare matching · twee stemmen</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.onPaperSoft }}>
          Afgelezen van je geverifieerde profiel — links wat vóór je pleit, rechts waar je op moet
          letten. Transparant, zonder verborgen score.
        </p>
      </div>

      <SplitStage
        leftLabel="Voor jou · wat pleit vóór"
        rightLabel="Let op · wat opvalt"
        left={
          <ul className="cp-in-left space-y-3.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px]"
                style={{ color: C.onInkSoft }}
              >
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]"
                  style={{ background: C.accentWashInk, color: C.okOnInk }}
                  aria-hidden="true"
                >
                  <Check size={14} />
                </span>
                <span style={{ color: C.onInk }}>{r}</span>
              </li>
            ))}
          </ul>
        }
        right={
          <ul className="cp-in-right space-y-3.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px]"
                style={{ color: C.onPaperSoft }}
              >
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
                <span style={{ color: C.onPaper }}>{r}</span>
              </li>
            ))}
          </ul>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <PrimaryButton>
          Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
        </PrimaryButton>
        <GhostButton>Bewaren</GhostButton>
        <span className="ml-auto text-[12px]" style={{ color: C.accent, ...bodyFont }}>
          Match {opdracht.match}% — {strong ? "sterk" : "goed"} afgestemd op jouw profiel.
        </span>
      </div>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const opOrde = CREDENTIALS.filter((c) => c.status === "VERIFIED");
  const aandacht = CREDENTIALS.filter((c) => c.status !== "VERIFIED");

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.015em] md:text-[38px]"
          style={{ color: C.onPaper, ...display }}
        >
          Jouw certificaten
        </h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.onPaperSoft }}>
          <span className="font-bold" style={{ color: C.accent }}>
            {PROFIEL.trust}.
          </span>{" "}
          {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Links wat op orde is,
          rechts wat nog aandacht vraagt. Documenten blijven versleuteld en privé.
        </p>
      </div>

      <SplitStage
        leftLabel={`Op orde · ${opOrde.length}`}
        rightLabel={`Vraagt aandacht · ${aandacht.length}`}
        left={
          <div className="cp-in-left space-y-4">
            <div className="flex items-center gap-3">
              <p
                className="text-[40px] font-semibold leading-none"
                style={{ color: C.onInk, ...num }}
              >
                {ratio}%
              </p>
              <div className="flex-1">
                <BarMeter value={ratio} side="ink" tone={C.okOnInk} />
                <p className="mt-1 text-[11px]" style={{ color: C.onInkMute }}>
                  geverifieerd &amp; geldig
                </p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {opOrde.length === 0 ? (
                <li className="text-[13px]" style={{ color: C.onInkMute }}>
                  Nog niets geverifieerd.
                </li>
              ) : (
                opOrde.map((c) => {
                  const st = statusMeta(c.status, "ink");
                  return (
                    <li
                      key={c.naam}
                      className="flex items-center gap-3 rounded-[8px] p-3"
                      style={{ background: C.inkCard, border: `1px solid ${C.lineInk}` }}
                    >
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[7px]"
                        style={{ background: C.accentWashInk, color: st.tone }}
                        aria-hidden="true"
                      >
                        <st.Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[13px] font-bold"
                          style={{ color: C.onInk }}
                        >
                          {c.naam}
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: C.onInkMute }}>
                          {c.detail}
                        </span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: st.tone }}
                      >
                        <st.Icon size={11} aria-hidden="true" />
                        {st.label}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        }
        right={
          <ul className="cp-in-right space-y-3">
            {aandacht.map((c) => {
              const st = statusMeta(c.status, "paper");
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  className="overflow-hidden rounded-[10px]"
                  style={{ border: `1.5px solid ${st.alarm ? st.tone : C.linePaper}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#efe6d2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#cb4526] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[7px]"
                      style={{ background: st.wash, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[13.5px] font-bold"
                        style={{ color: C.onPaper }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.onPaperMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.onPaperFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-500 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4">
                        <div className="mb-3 flex">
                          <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                            <st.Icon size={11} aria-hidden="true" />
                            {st.label}
                          </Chip>
                        </div>
                        <p
                          className="text-[12.5px] leading-relaxed"
                          style={{ color: C.onPaperSoft }}
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
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        }
      />

      <div>
        <div className="mb-3">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status, "paper");
            return (
              <PaperCard key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
                  style={{
                    background: C.cardRaise,
                    border: `1px solid ${C.linePaper}`,
                    color: C.onPaperSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-bold"
                    style={{ color: C.onPaper }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.onPaperMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </PaperCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  const urgent = ACTIES.filter((a) => a.urgentie === "warning");
  const aanbevolen = ACTIES.filter((a) => a.urgentie !== "warning");
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
          style={{ color: C.onPaper, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.onPaperSoft }}>
          Links wat niet kan wachten, rechts wat je vooruithelpt. Werk de linkerstem af en de
          rechter opent zich vanzelf.
        </p>
      </div>

      <SplitStage
        leftLabel={`Urgent · ${urgent.length}`}
        rightLabel={`Aanbevolen · ${aanbevolen.length}`}
        left={
          <ol className="cp-in-left space-y-3">
            {urgent.length === 0 ? (
              <li className="text-[13px]" style={{ color: C.onInkMute }}>
                Niets urgents — mooi bijgewerkt.
              </li>
            ) : (
              urgent.map((a, i) => (
                <li
                  key={a.titel}
                  className="rounded-[10px] p-4"
                  style={{ background: C.inkCard, border: `1.5px solid ${C.accent}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[11px] font-bold"
                      style={{ background: C.accentWashInk, color: C.accentSoft, ...num }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: C.accentSoft }}
                    >
                      <AlertTriangle size={11} aria-hidden="true" />
                      Urgent
                    </span>
                  </div>
                  <h2
                    className="mt-2.5 text-[17px] font-semibold leading-snug"
                    style={{ color: C.onInk, ...display }}
                  >
                    {a.titel}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.onInkSoft }}>
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <PrimaryButton side="ink">
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </li>
              ))
            )}
          </ol>
        }
        right={
          <ol className="cp-in-right space-y-3">
            {aanbevolen.map((a, i) => (
              <li
                key={a.titel}
                className="rounded-[10px] p-4"
                style={{ background: C.cardSoft, border: `1.5px solid ${C.linePaper}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[11px] font-bold"
                    style={{ background: C.cardRaise, color: C.onPaperSoft, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.onPaperMute }}
                  >
                    <ChevronRight size={11} aria-hidden="true" />
                    Aanbevolen
                  </span>
                </div>
                <h2
                  className="mt-2.5 text-[17px] font-semibold leading-snug"
                  style={{ color: C.onPaper, ...display }}
                >
                  {a.titel}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.onPaperSoft }}>
                  {a.detail}
                </p>
                <div className="mt-3">
                  <GhostButton>
                    {a.cta}
                    <ArrowRight size={13} aria-hidden="true" />
                  </GhostButton>
                </div>
              </li>
            ))}
          </ol>
        }
      />
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
  return { ink: C.onPaperMute, wash: C.cardRaise, tone: C.linePaper, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const rest = FACTUREN.filter((f) => f.status !== "Betaald");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
            style={{ color: C.onPaper, ...display }}
          >
            Facturen
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.onPaperMute }}>
            Links wat binnen is, rechts wat nog moet komen.
          </p>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <SplitStage
        leftLabel={`Ontvangen · ${betaald.length}`}
        rightLabel={`Nog te ontvangen · ${rest.length}`}
        left={
          <div className="cp-in-left space-y-4">
            <div>
              <p
                className="text-[40px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.onInk, ...num }}
              >
                {totaalBetaald}
              </p>
              <p
                className="mt-1 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.onInkMute }}
              >
                <Check size={13} aria-hidden="true" style={{ color: C.okOnInk }} />
                {betaald.length} facturen voldaan deze maand
              </p>
            </div>
            <ul className="space-y-2">
              {betaald.map((f) => (
                <li
                  key={f.nr}
                  className="flex items-center gap-3 rounded-[8px] p-3"
                  style={{ background: C.inkCard, border: `1px solid ${C.lineInk}` }}
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[7px]"
                    style={{ background: C.accentWashInk, color: C.okOnInk }}
                    aria-hidden="true"
                  >
                    <Check size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-bold"
                      style={{ color: C.onInk }}
                    >
                      {f.klant}
                    </span>
                    <span className="block text-[10.5px]" style={{ color: C.onInkMute, ...num }}>
                      {f.nr} · {f.datum}
                    </span>
                  </span>
                  <span className="text-[14px] font-bold" style={{ color: C.onInk, ...num }}>
                    {f.bedrag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        }
        right={
          <div className="cp-in-right space-y-3">
            {rest.map((f) => {
              const ft = factuurTone(f.status);
              const acc = f.status === "Openstaand";
              return (
                <div
                  key={f.nr}
                  className="rounded-[10px] p-4"
                  style={{
                    background: C.cardSoft,
                    border: `1.5px solid ${acc ? C.warn : C.linePaper}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-[15px] font-bold"
                        style={{ color: C.onPaper, ...bodyFont }}
                      >
                        {f.klant}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: C.onPaperMute, ...num }}>
                        {f.nr} · {f.datum}
                      </p>
                    </div>
                    <span
                      className="text-[18px] font-bold"
                      style={{ color: acc ? C.warnInk : C.onPaper, ...num }}
                    >
                      {f.bedrag}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10.5px] font-bold"
                      style={{
                        color: ft.ink,
                        background: ft.wash,
                        border: `1px solid ${ft.tone}`,
                        ...bodyFont,
                      }}
                    >
                      {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                      {f.status}
                    </span>
                    {acc ? (
                      <PrimaryButton>Herinnering sturen</PrimaryButton>
                    ) : (
                      <GhostButton>Versturen</GhostButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        }
      />
    </div>
  );
}
