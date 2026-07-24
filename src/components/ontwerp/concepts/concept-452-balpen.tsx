"use client";

// Concept 452 — "Balpen" · Handgetekende biro-annotatie op ruitjespapier.
// Alsof iemand het dashboard met een blauwe balpen op ruitjespapier heeft geschetst: lichte
// ruitjes-achtergrond, inkt-blauwe accenten (#1e3a8a), scheve onderstrepingen, cirkels om
// belangrijke cijfers, pijltjes-annotaties en "ingekleurde" statusblokjes. Body-tekst blijft
// nette schreefloze UI (leesbaar!) — alleen de accenten voelen hand-getekend. Editorial-sketch,
// licht, charmant maar professioneel.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  PenLine,
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

// — Palet: room-wit ruitjespapier + inkt-blauwe balpen —
const C = {
  paper: "#fbfaf5",
  paperCard: "#ffffff",
  grid: "#dce6f2",
  gridBold: "#cdd9ea",
  ink: "#1e2a4a",
  inkSoft: "#465272",
  inkMute: "#7c86a0",
  inkFaint: "#a7afc4",
  line: "#e4e8f0",
  // balpen-inkt
  pen: "#1e3a8a",
  penDeep: "#152a63",
  penMid: "#2f52b5",
  penLite: "#5a78d8",
  penWash: "#eaf0fd",
  penInk: "#e7effb",
  // status (ingekleurde blokjes — pen-arceringen)
  ok: "#1f7a4d",
  okInk: "#155c39",
  okWash: "#e5f4ec",
  warn: "#b26a12",
  warnInk: "#8a4f08",
  warnWash: "#fbeed7",
  bad: "#b23a2c",
  badInk: "#8a2b20",
  badWash: "#fae7e3",
};

const handFont = {
  // handgeschreven-gevoel voor accenten — valt terug op cursieve/generieke families, geen externe font.
  fontFamily: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Ink Free', cursive",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Ruitjespapier-achtergrond: fijne blauwe grid + iets zwaardere lijn elke 5 cellen.
function graphPaper(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage:
      `linear-gradient(${C.grid} 1px, transparent 1px),` +
      `linear-gradient(90deg, ${C.grid} 1px, transparent 1px),` +
      `linear-gradient(${C.gridBold} 1px, transparent 1px),` +
      `linear-gradient(90deg, ${C.gridBold} 1px, transparent 1px)`,
    backgroundSize: "22px 22px, 22px 22px, 110px 110px, 110px 110px",
  };
}

// — Handgetekende scheve onderstreping onder een kop —
function Underline({ w = 120, tone = C.pen }: { w?: number; tone?: string }) {
  return (
    <svg width={w} height="9" viewBox={`0 0 ${w} 9`} aria-hidden="true" className="mt-1 block">
      <path
        d={`M2 6 C ${w * 0.25} 2, ${w * 0.5} 8, ${w * 0.7} 4 S ${w - 6} 3, ${w - 2} 5`}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// — Handgetekende cirkel rond een belangrijk cijfer —
function InkCircle({ children, tone = C.pen }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center px-1">
      <svg
        className="pointer-events-none absolute -inset-x-2 -inset-y-1"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M50 6 C 78 4, 96 18, 94 32 C 92 50, 66 56, 46 55 C 20 54, 5 42, 7 27 C 9 12, 30 6, 52 7"
          fill="none"
          stroke={tone}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

// — Sketch-kaart: witte kaart met dubbele hand-getekende inktrand —
function Sketch({
  children,
  className = "",
  as: Tag = "div",
  tone = C.line,
  note,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tone?: string;
  note?: string;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: C.paperCard,
        border: `1.5px solid ${tone}`,
        borderRadius: 12,
        boxShadow: `2px 3px 0 ${C.penWash}, 0 8px 22px -18px rgba(30,58,138,0.5)`,
        color: C.ink,
      }}
    >
      {note && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2.5 right-4 rotate-[-3deg] px-2 text-[12px] font-semibold"
          style={{ ...handFont, color: C.pen, background: C.paperCard }}
        >
          {note}
        </span>
      )}
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.pen }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <PenLine size={12} aria-hidden="true" />
      {children}
    </p>
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf5] active:translate-y-px ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${C.penMid}, ${C.pen} 60%, ${C.penDeep})`,
        border: `1.5px solid ${C.penDeep}`,
        boxShadow: `2px 3px 0 ${C.penLite}`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf5] ${className}`}
      style={{
        color: active ? C.penDeep : C.inkSoft,
        background: active ? C.penWash : C.paperCard,
        border: `1.5px solid ${active ? C.penLite : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
  line: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.okInk,
        wash: C.okWash,
        line: "#bfe2cd",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: C.penDeep,
        wash: C.penWash,
        line: C.penLite,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warnInk,
        wash: C.warnWash,
        line: "#e8cf9c",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.badInk,
        wash: C.badWash,
        line: "#eec0b8",
      };
  }
}

// — Balpen-sparkline: schetsmatige inktlijn, licht golvend —
function PenLineChart({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  // schets-effect: kwadratische bézier tussen punten
  let dPath = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    const [px, py] = pts[i - 1]!;
    const cx = (px + x) / 2;
    dPath += ` Q ${cx.toFixed(1)} ${(py - 1.5).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
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
      <path
        d={dPath}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.6"
        fill={C.paperCard}
        stroke={tone}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Meter({ value, tone = C.pen }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.penInk, border: `1px solid ${C.penLite}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundImage: `repeating-linear-gradient(45deg, ${tone} 0, ${tone} 3px, ${C.penMid} 3px, ${C.penMid} 6px)`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-semibold" style={{ color: C.penDeep, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept452() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...graphPaper(C.paper) }}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-7">
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
          className="inline-flex h-12 w-12 items-center justify-center rounded-[13px]"
          style={{
            background: C.penWash,
            border: `2px solid ${C.pen}`,
            boxShadow: `2px 3px 0 ${C.penLite}`,
          }}
          aria-hidden="true"
        >
          <PenLine size={22} style={{ color: C.pen }} />
        </span>
        <div>
          <p
            className="text-[21px] font-semibold leading-none"
            style={{ color: C.pen, ...handFont }}
          >
            Balpen
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · op ruitjespapier
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: "1.5px solid #bfe2cd", background: C.okWash }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: C.paperCard, border: `1.5px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.pen, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] text-[13px] font-semibold"
          style={{
            background: C.penWash,
            border: `2px solid ${C.pen}`,
            color: C.penDeep,
            ...handFont,
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
        className="flex items-center gap-1 overflow-x-auto rounded-[12px] p-1.5"
        style={{ background: C.paperCard, border: `1.5px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
              style={{
                color: on ? "#fff" : C.inkMute,
                backgroundImage: on ? `linear-gradient(135deg, ${C.penMid}, ${C.penDeep})` : "none",
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
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Sketch className="overflow-hidden p-7 md:p-9" tone={C.penLite} note="notitie">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={graphPaper("transparent")}
          />
          <div className="relative">
            <Eyebrow>Vandaag · geschetst</Eyebrow>
            <h1
              className="mt-4 text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
              style={{ color: C.ink }}
            >
              Goedemorgen,{" "}
              <span style={{ ...handFont, color: C.pen }}>{PROFIEL.naam.split(" ")[0]}</span>.
            </h1>
            <Underline w={190} />
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je praktijk, met de pen erbij: elk certificaat afgetekend, elke opdracht omcirkeld.
              Loop je acties langs — dan staat de dag strak in de kantlijn.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
            </div>
          </div>
        </Sketch>

        <Sketch className="p-7" tone="#e8cf9c" note="!">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2 className="mt-4 text-[20px] font-semibold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="my-4 h-px" style={{ background: C.line }} />
          <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
            <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
            {verified}/{CREDENTIALS.length} certificaten afgetekend · 7 open reacties
          </p>
        </Sketch>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow tone={C.inkMute}>Cijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Sketch key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold"
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
                style={{ color: C.ink, ...num }}
              >
                {i === 0 ? <InkCircle>{k.value}</InkCircle> : k.value}
              </p>
              <div className="mt-3">
                <PenLineChart data={k.spark} tone={k.up ? C.pen : C.inkMute} />
              </div>
            </Sketch>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#152a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf5]"
              style={{ color: C.pen }}
            >
              Alle →
            </button>
          </div>
          <Sketch className="overflow-hidden">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.gridBold}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4f7fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a]"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        background: i === 0 ? C.penWash : C.paper,
                        border: `2px solid ${i === 0 ? C.pen : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.penDeep : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Meter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Sketch>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow tone={C.inkMute}>Certificaten</Eyebrow>
          </div>
          <Sketch className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.gridBold}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        background: st.wash,
                        border: `1.5px solid ${st.line}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Sketch>
        </div>
      </section>
    </div>
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Open opdrachten
        </h1>
        <Underline w={220} />
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[11px] px-5 py-3"
          style={{ background: C.paperCard, border: `1.5px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a7afc4]"
            style={{ color: C.ink, ...bodyFont }}
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
              <Sketch className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded" style={{ background: C.penInk }} />
                  <div className="h-5 w-2/3 rounded" style={{ background: C.line }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: C.penInk }} />
                  <div className="h-2 w-full rounded" style={{ background: C.penInk }} />
                </div>
              </Sketch>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Sketch className="p-6" note="leeg">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.penWash, border: `2px solid ${C.pen}`, color: C.pen }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[24px] font-semibold" style={{ color: C.pen, ...handFont }}>
              Blanco bladzijde
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Sketch>
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
    <Sketch className="p-6" tone={strong ? C.penLite : C.line} note={strong ? "top!" : undefined}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkSoft, background: C.paper, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-16 w-16 flex-col items-center justify-center rounded-full"
            style={{
              background: strong ? C.penWash : C.paper,
              border: `2.5px solid ${strong ? C.pen : C.gridBold}`,
            }}
          >
            <span
              className="text-[16px] font-bold leading-none"
              style={{ color: strong ? C.penDeep : C.inkSoft, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint }}
            >
              match
            </span>
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: strong ? C.penDeep : C.ink, ...num }}
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
          className="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.penDeep, border: `1.5px solid ${C.line}` }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Sketch>
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
    <div
      className="rounded-[11px] p-4"
      style={{ background: C.paper, border: `1.5px dashed ${C.gridBold}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf5]"
        style={{ color: C.inkSoft, border: `1.5px solid ${C.line}`, background: C.paperCard }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Sketch className="overflow-hidden p-7 md:p-9" tone={C.penLite} note="opdracht">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={graphPaper("transparent")}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundImage: `linear-gradient(135deg, ${C.penMid}, ${C.penDeep})` }}
          >
            <PenLine size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <Underline w={260} />
        <p className="relative mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Sketch>

      <Sketch className="overflow-hidden">
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
                borderLeft: i % 4 === 0 ? "none" : `1px dashed ${C.gridBold}`,
                borderTop: i >= 2 ? `1px dashed ${C.gridBold}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Sketch>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Sketch className="p-6" tone="#bfe2cd">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: C.okInk, background: C.okWash, border: "1.5px solid #bfe2cd" }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk }}
              >
                Voor jou
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
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sketch>
          <Sketch className="p-6" tone="#e8cf9c">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: C.warnInk, background: C.warnWash, border: "1.5px solid #e8cf9c" }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk }}
              >
                Let op
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
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sketch>
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
      <Sketch className="overflow-hidden p-7 md:p-9" tone={C.penLite} note="dossier">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={graphPaper("transparent")}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <Underline w={180} />
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.penDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.paperCard, border: `2.5px solid ${C.pen}` }}
          >
            <span
              className="text-[26px] font-semibold leading-none"
              style={{ color: C.penDeep, ...num }}
            >
              <InkCircle>{ratio}</InkCircle>
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Sketch>

      <Sketch className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px dashed ${C.gridBold}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px dashed ${C.gridBold}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f4f7fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a] sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        background: st.wash,
                        border: `1.5px solid ${st.line}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1.5px solid ${st.line}`,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform sm:block"
                    style={{
                      color: C.inkFaint,
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
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[11px] p-4"
                        style={{ background: C.paper, border: `1.5px dashed ${C.gridBold}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
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
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Sketch>

      <div>
        <div className="mb-4">
          <Eyebrow tone={C.inkMute}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Sketch key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: C.paper, border: `1.5px solid ${C.line}`, color: C.inkSoft }}
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
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1.5px solid ${st.line}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Sketch>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <Underline w={280} />
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const ink = warn ? C.warnInk : C.penDeep;
          const wash = warn ? C.warnWash : C.penWash;
          const line = warn ? "#e8cf9c" : C.penLite;
          return (
            <li key={a.titel}>
              <Sketch className="p-6" tone={line} note={warn ? "!" : undefined}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{ background: wash, border: `2.5px solid ${line}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1.5px solid ${line}` }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <PenLine size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink }}
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
              </Sketch>
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
  line: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, line: "#e8cf9c", Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, line: "#bfe2cd", Icon: Check };
  return { ink: C.inkMute, wash: C.paper, line: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Facturen
          </h1>
          <Underline w={130} />
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            alarm: false,
            tone: "#bfe2cd",
            circle: true,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            tone: "#e8cf9c",
            circle: false,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            alarm: false,
            tone: C.penLite,
            circle: false,
          },
        ].map((s) => (
          <Sketch key={s.l} className="p-6" tone={s.tone}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
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
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.circle ? <InkCircle tone={C.ok}>{s.v}</InkCircle> : s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Sketch>
        ))}
      </section>

      <Sketch className="overflow-hidden">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px dashed ${C.gridBold}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f4f7fe] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.gridBold}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{ color: ft.ink, background: ft.wash, border: `1.5px solid ${ft.line}` }}
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
          style={{ borderTop: `1px dashed ${C.gridBold}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Sketch>
    </div>
  );
}
