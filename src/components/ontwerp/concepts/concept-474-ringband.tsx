"use client";

// Concept 474 — "Ringband" · Tactiel ring-register / tabbladen-ordner. De hoofdnav bestaat uit
// fysiek-aanvoelende gekleurde tab-tongen (zoals een ringband met register), elk scherm is een
// "tabblad" op licht manila/creme papier met gestanste ringgaten aan de rand en een subtiele
// omslagschaduw. Georganiseerd, vertrouwd, tactiel — maar strak en premium, nooit kitscherig.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  BookMarked,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

// — Palet: warm manila/creme papier, gedempte register-kleuren (klei/olijf/staalblauw/wijnrood) —
const C = {
  bg: "#f4efe4", // warm manila-basis
  bgDeep: "#e9e1d1", // diepere manila (schaduwrand)
  sheet: "#fbf7ee", // room-papier voor een tabblad
  sheetAlt: "#f5eede", // iets warmer paneel binnen een blad
  ink: "#2a2620", // donker inkt
  inkSoft: "#4b4438",
  inkMute: "#7a6f5d",
  inkFaint: "#a89a82",
  line: "#e3d9c4", // warme hairline
  lineSoft: "#eee5d3",
  ring: "#cdbfa4", // ringgat-rand
  // register-tongen (gedempt)
  clay: "#a86b4c",
  olive: "#6f7a45",
  steel: "#4a6b82",
  wine: "#8f3b52",
  ochre: "#b0862e",
  plum: "#6c587c",
  // status
  green: "#3f7040",
  greenSoft: "#e2ecd8",
  blue: "#3d6079",
  blueSoft: "#dde8ef",
  amber: "#9c6a16",
  amberSoft: "#f3e6c6",
  red: "#8f3b52",
  redSoft: "#f2dde3",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
// Klassieke slab/serif voor register-labels en koppen — ordner-gevoel.
const slab = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

// Zes register-kleuren, één per scherm (in SCREENS-volgorde).
const TAB_TONES = [C.clay, C.olive, C.steel, C.wine, C.ochre, C.plum];
function toneFor(key: ScreenKey): string {
  const idx = SCREENS.findIndex((s) => s.key === key);
  return TAB_TONES[idx % TAB_TONES.length] ?? C.clay;
}

// Papier-textuur: fijne vezelruis via gestapelde radiale gradients + zachte omslagschaduw.
function paperBg(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage: [
      "radial-gradient(rgba(120,100,60,0.05) 1px, transparent 1.4px)",
      "radial-gradient(rgba(150,130,90,0.04) 1px, transparent 1.4px)",
      "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 22%)",
    ].join(","),
    backgroundSize: "7px 7px, 11px 11px, 100% 100%",
    backgroundPosition: "0 0, 3px 4px, 0 0",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue, wash: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.red, wash: C.redSoft };
  }
}

// — Gestanste ringgaten langs de linkerrand van een blad —
function RingHoles({ count = 7 }: { count?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 flex w-9 flex-col items-center justify-around py-6"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block h-3.5 w-3.5 rounded-full"
          style={{
            background: C.bg,
            boxShadow: `inset 0 1px 2px rgba(60,45,20,0.35), 0 1px 0 rgba(255,255,255,0.6)`,
            border: `1px solid ${C.ring}`,
          }}
        />
      ))}
    </div>
  );
}

// — Een "blad" (sheet) met papier, ringgaten-rand en omslagschaduw —
function Sheet({
  children,
  className = "",
  as: Tag = "div",
  holes = true,
  tint = C.sheet,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  holes?: boolean;
  tint?: string;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-l-[6px] rounded-r-[14px] ${className}`}
      style={{
        ...paperBg(tint),
        border: `1px solid ${C.line}`,
        borderLeft: holes ? `1px solid ${C.ring}` : `1px solid ${C.line}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 2px 3px 0 rgba(60,45,20,0.05), 0 14px 30px -20px rgba(60,45,20,0.4)",
        color: C.ink,
      }}
    >
      {holes && <RingHoles />}
      <div className={holes ? "pl-9" : ""}>{children}</div>
    </Tag>
  );
}

function Label({ children, tone = C.clay }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <BookMarked size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Btn({
  children,
  onClick,
  tone = C.clay,
  variant = "solid",
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  variant?: "solid" | "ghost";
  className?: string;
  ariaPressed?: boolean;
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`group inline-flex items-center justify-center gap-2 rounded-[7px] px-4 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: solid ? "#fbf7ee" : tone,
        background: solid ? tone : C.sheet,
        border: `1px solid ${solid ? tone : C.line}`,
        boxShadow: solid
          ? "inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 5px -2px rgba(60,45,20,0.4)"
          : "0 1px 0 rgba(255,255,255,0.5)",
        ...bodyFont,
        // focus ring in accentkleur
        ["--tw-ring-color" as string]: tone,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
  );
}

function SparkBars({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 22 + ((d - min) / span) * 32;
        return (
          <span
            key={i}
            className="w-full rounded-[2px]"
            style={{
              height: `${h}%`,
              background: i === data.length - 1 ? tone : `${tone}66`,
              transition: "height 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        );
      })}
    </div>
  );
}

function Meter({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="relative h-2 w-28 overflow-hidden rounded-full"
        style={{ background: C.bgDeep }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

function StatusChip({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const st = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] font-bold ${small ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"}`}
      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}`, ...bodyFont }}
    >
      <st.Icon size={small ? 10 : 11} aria-hidden="true" />
      {st.label}
      {st.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

export function Concept474() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const tone = toneFor(screen);

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, backgroundColor: C.bg }}
    >
      <style>{`
        @keyframes rbFlip { from { opacity: 0; transform: perspective(1200px) rotateX(4deg) translateY(10px); } to { opacity: 1; transform: perspective(1200px) rotateX(0) translateY(0); } }
        .rb-flip { animation: rbFlip 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; transform-origin: left center; }
        .rb-int { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1); }
        .rb-int:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .rb-flip { animation: none !important; } .rb-int { transition: none !important; } .rb-int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar tone={tone} />
        <TabRail screen={screen} setScreen={setScreen} />
        <main key={screen} className="rb-flip pt-5">
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

function TopBar({ tone }: { tone: string }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[9px]"
          style={{
            background: tone,
            color: "#fbf7ee",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 8px -3px rgba(60,45,20,0.5)",
          }}
          aria-hidden="true"
        >
          <BookMarked size={20} strokeWidth={2} />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-tight"
            style={{ color: C.ink, ...slab }}
          >
            Ringband
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            Persoonlijk register · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
          style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.wine, color: "#fbf7ee", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-[12.5px] font-bold"
          style={{ background: C.sheetAlt, border: `1px solid ${C.ring}`, color: C.clay, ...num }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// Register-tabs: gekleurde tab-tongen die als een ordner-register uitsteken.
function TabRail({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Register" className="relative z-10">
      <div className="flex items-end gap-1.5 overflow-x-auto pb-0 pt-2">
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          const tone = TAB_TONES[i % TAB_TONES.length] ?? C.clay;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative shrink-0 rounded-t-[10px] px-4 pb-2.5 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
              style={{
                paddingTop: on ? "13px" : "9px",
                marginBottom: on ? "-1px" : "0",
                color: on ? "#fbf7ee" : C.inkSoft,
                background: on ? tone : C.sheetAlt,
                border: `1px solid ${on ? tone : C.line}`,
                borderBottom: on ? `1px solid ${tone}` : `1px solid ${C.line}`,
                boxShadow: on
                  ? "inset 0 1px 0 rgba(255,255,255,0.25), 0 -2px 6px -3px rgba(60,45,20,0.3)"
                  : "none",
                ...bodyFont,
                ["--tw-ring-color" as string]: tone,
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: on ? "#fbf7ee" : tone }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* omslag-rand onder de tabs, alsof het blad hier begint */}
      <div className="h-px w-full" style={{ background: C.ring }} aria-hidden="true" />
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5 pt-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Sheet className="rb-int p-7 md:p-8" as="section">
          <Label tone={C.clay}>Voorblad · overzicht</Label>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink, ...slab }}
          >
            Alles op zijn plek, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je register is netjes bijgehouden: certificaten geordend, verse matches ingesorteerd en
            één tabblad dat vandaag even je aandacht vraagt. Blader rustig door.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Btn onClick={onActies} tone={C.clay}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Btn>
            <Btn onClick={onOpen} tone={C.steel} variant="ghost">
              Naar de marktplaats
            </Btn>
          </div>
        </Sheet>

        <Sheet className="rb-int p-6" tint={C.sheetAlt} as="section">
          <div className="flex items-center justify-between">
            <Label tone={C.ochre}>Tussenblad · let op</Label>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-[7px]"
              style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, color: C.amber }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink, ...slab }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <Btn onClick={onActies} tone={C.ochre} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Sheet>
      </section>

      <section>
        <div className="mb-3">
          <Label tone={C.olive}>Cijferblad · deze maand</Label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.olive : C.wine;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Sheet key={k.label} className="rb-int p-5" holes={false}>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[25px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <SparkBars data={k.spark} tone={tone} />
                </div>
              </Sheet>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Label tone={C.steel}>Ingesorteerde matches</Label>
            <button
              type="button"
              onClick={onOpen}
              className="rounded-[5px] px-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.steel, ...bodyFont, ["--tw-ring-color" as string]: C.steel }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.green : C.steel;
              return (
                <li key={o.id}>
                  <Sheet className="rb-int p-4" as="article" holes={false}>
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2"
                      style={{ ["--tw-ring-color" as string]: tone }}
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[9px]"
                        style={{
                          background: strong ? C.greenSoft : C.blueSoft,
                          border: `1px solid ${tone}`,
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[15px] font-bold leading-none"
                          style={{ color: tone, ...num }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: tone }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.inkMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </button>
                  </Sheet>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Label tone={C.green}>Certificatenblad</Label>
          </div>
          <Sheet className="p-4" holes={false}>
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[7px]"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
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
          </Sheet>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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
    <div className="space-y-6 pt-5">
      <Sheet className="p-6 md:p-7">
        <Label tone={C.steel}>Register · marktplaats</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.ink, ...slab }}
        >
          Opdrachten voor jou
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
        </p>
      </Sheet>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[9px] px-4 py-3"
          style={{ background: C.sheet, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89a82]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Sorteren en laden"
        >
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              onClick={() => setSort(s)}
              tone={C.steel}
              variant={sort === s ? "solid" : "ghost"}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
          <Btn
            onClick={() => {
              setFailed(false);
              setLoading((v) => !v);
            }}
            tone={C.olive}
            variant={loading ? "solid" : "ghost"}
            ariaPressed={loading}
          >
            {loading ? "Stop laden" : "Verversen"}
          </Btn>
          <Btn
            onClick={() => setFailed((v) => !v)}
            tone={C.wine}
            variant={failed ? "solid" : "ghost"}
            ariaPressed={failed}
          >
            Fout tonen
          </Btn>
        </div>
      </div>

      {failed ? (
        <Sheet className="p-6" holes={false}>
          <div className="flex flex-col items-center py-12 text-center" role="alert">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[10px]"
              style={{ background: C.redSoft, border: `1px solid ${C.red}`, color: C.red }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.ink, ...slab }}>
              Het register kon niet worden geladen
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de opdrachten. Probeer het blad opnieuw te
              openen.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setFailed(false)} tone={C.wine}>
                Opnieuw proberen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
            </div>
          </div>
        </Sheet>
      ) : loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Sheet className="p-5" holes={false}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.bgDeep }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.bgDeep }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.bgDeep }} />
                </div>
              </Sheet>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Sheet className="p-6" holes={false}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[10px]"
              style={{ background: C.sheetAlt, border: `1px solid ${C.line}`, color: C.inkMute }}
              aria-hidden="true"
            >
              <Inbox size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.ink, ...slab }}>
              Geen tabblad gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `"${q}"` : "je zoekterm"}. Probeer een ander trefwoord.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setQ("")} tone={C.steel}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
            </div>
          </div>
        </Sheet>
      ) : (
        <ul className="space-y-3">
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
  const tone = strong ? C.green : C.steel;
  return (
    <Sheet className="rb-int p-5" as="article" holes={false}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-[5px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              tab {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.ink, ...slab }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[5px] px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.sheetAlt,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-[7px] px-3 py-1.5"
            style={{ background: strong ? C.greenSoft : C.blueSoft, border: `1px solid ${tone}` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.ink,
            border: `1px solid ${C.line}`,
            background: C.sheet,
            ...bodyFont,
            ["--tw-ring-color" as string]: tone,
          }}
        >
          <Paperclip size={12} aria-hidden="true" />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn onClick={onOpen} tone={C.clay}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={C.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Sheet>
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
      className="rounded-[9px] p-4"
      style={{
        background: C.sheetAlt,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
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
  const tone = strong ? C.green : C.steel;
  return (
    <div className="space-y-5 pt-5">
      <Btn onClick={onBack} tone={C.steel} variant="ghost">
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Sheet className="p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-[5px] px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[5px] px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: "#fbf7ee", background: tone, ...bodyFont }}
          >
            <ShieldCheck size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[36px]"
          style={{ color: C.ink, ...slab }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Btn tone={C.clay}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn tone={C.steel} variant="ghost">
            Bewaren in register
          </Btn>
        </div>
      </Sheet>

      <Sheet holes={false}>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Sheet>

      <section>
        <Label tone={C.clay}>Waarom deze match bij je past</Label>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én wat goed is om te
          weten, open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Sheet className="p-6" holes={false}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
          <Sheet className="p-6" holes={false}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.amber, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
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
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-5">
      <Sheet className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label tone={C.wine}>Register · verificatie</Label>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...slab }}
            >
              Jouw certificatenblad
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.green} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.greenSoft, border: `2px solid ${C.green}` }}
            aria-hidden="true"
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.green, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Sheet>

      <Sheet holes={false}>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f5eede] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: st.ink }}
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
                    style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex">
                      <StatusChip status={c.status} />
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.inkFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="rounded-[9px] p-4"
                        style={{ background: C.sheetAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn tone={c.status === "EXPIRING" ? C.amber : C.clay}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </Btn>
                          <Btn tone={C.steel} variant="ghost">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Sheet>

      <div>
        <div className="mb-3">
          <Label tone={C.plum}>Documentenkast</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <Sheet key={d.naam} className="flex items-center gap-3 p-4" holes={false}>
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                style={{ background: C.sheetAlt, border: `1px solid ${C.line}`, color: C.inkSoft }}
                aria-hidden="true"
              >
                <FileText size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                  {d.naam}
                </span>
                <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </span>
              </span>
              <StatusChip status={d.status} small />
            </Sheet>
          ))}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-5">
      <Sheet className="p-6 md:p-7">
        <Label tone={C.ochre}>Register · acties op volgorde</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.ink, ...slab }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden geordend op urgentie. Eén tabblad tegelijk, dan ben je zo weer bij.
        </p>
      </Sheet>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.steel;
          return (
            <li key={a.titel}>
              <Sheet className="rb-int p-5" holes={false}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[8px] text-[14px] font-bold"
                    style={{
                      background: warn ? C.amberSoft : C.blueSoft,
                      border: `1px solid ${tone}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[5px] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberSoft : C.blueSoft,
                        border: `1px solid ${tone}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Clock size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink, ...slab }}
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
                    <Btn tone={warn ? C.amber : C.clay}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.wine, wash: C.redSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.sheetAlt, Icon: FileText };
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
    <div className="space-y-5 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Sheet className="flex-1 p-6 md:p-7">
          <Label tone={C.olive}>Register · facturen</Label>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
            style={{ color: C.ink, ...slab }}
          >
            Jouw facturen
          </h1>
        </Sheet>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.wine },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Sheet key={s.l} className="rb-int p-5" holes={false}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.wine }} />}
            </div>
            <p
              className="mt-2 text-[25px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Sheet>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
          {(["datum", "bedrag"] as const).map((s) => (
            <Btn
              key={s}
              onClick={() => setSort(s)}
              tone={C.olive}
              variant={sort === s ? "solid" : "ghost"}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "datum" ? "Op datum" : "Op bedrag"}
            </Btn>
          ))}
        </div>
        <Btn tone={C.clay}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <Sheet holes={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f5eede]"
                    style={{
                      background: i % 2 === 1 ? C.sheetAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
