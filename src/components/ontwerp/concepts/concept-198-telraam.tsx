"use client";

// Concept 198 — "Telraam" · de abacus als data-metafoor. Cijfers, KPI's en tellingen worden getoond
// als telraam-kralen op staven: elke waarde is een rij messing-kralen die naar links zijn 'geschoven'
// tot aan de telling. Warm houten frame (walnoot + eiken), messing staven, ronde kralen met glans.
// Rekenkundige rust op parchment/oud-eiken achtergrond; mono-cijfers dragen elke telling. Onderscheidt
// zich radicaal van "weegschaal" (balans-armen), "meetlint" (maatlijnen) en "scorebord" (segment-cijfers):
// hier is de kralen-op-staaf-telraam de primaire datavisualisatie. Status NOOIT alleen op kleur — altijd
// label + icoon + vorm (kraal-vulling). Deterministisch — geen random/Date; kraaltellingen zijn vast.
// UI Nederlands. Fonts: Newsreader (display) + Space Grotesk (tekst) + Geist Mono (cijfers/tellingen).

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
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  Calculator,
  Hash,
  Ruler,
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

// ── Palet — warm ambachtelijk hout op parchment/oud-eiken. Messing draagt het accent (de kralen),
//    houttinten dragen de rust. Contrast via lichtheid + tint, nooit tint-alleen. ──
const C = {
  bg: "#efe2cc", // warme parchment / oud-eiken achtergrond
  bgDeep: "#e5d4b7", // dieper vlak
  panel: "#fbf4e5", // kaart-oppervlak (licht eiken)
  panelHi: "#fffdf7", // opgetild vlak / hover
  frame: "#5a3a22", // walnoot frame
  frameHi: "#7a5334", // lichter walnoot / rand-glans
  frameDeep: "#3d2716", // diepste hout
  rod: "#a9865130", // messing staaf (subtiel)
  rodLine: "#b89a63", // staaf-lijn
  brass: "#c1932c", // messing kraal (actief)
  brassHi: "#e9c25c", // kraal-glans
  brassDeep: "#946f1f", // kraal-schaduw
  beadIdle: "#d3bf99", // rustende kraal (licht hout)
  beadIdleEdge: "#b9a279",
  ink: "#2d2013", // donkerbruine tekst
  inkSoft: "#6a5740", // secundaire tekst
  inkFaint: "#9a866a", // labels
  line: "#dcc9a5", // fijne rand
  lineSoft: "#e8dcc2",
  green: "#3d7a4b", // geverifieerd / betaald (bos)
  greenSoft: "#e0eddf",
  amber: "#bf882a", // verloopt binnenkort
  amberSoft: "#f5e8c8",
  red: "#b0432d", // afgewezen (terracotta)
  redSoft: "#f3ddd4",
  slate: "#4a6a86", // in beoordeling (leisteen)
  slateSoft: "#dde7ee",
  onBrass: "#241a06", // tekst op messing
  cream: "#f6ecd6",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const bodyF = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Status-model — status via LABEL + ICOON + KLEUR + VORM (kraal-vulling), nooit kleur-alleen. ──
type BeadFill = "full" | "half" | "ring" | "cross";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
  fill: BeadFill;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Volle kraal — geteld, geverifieerd.
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        fg: C.green,
        bg: C.greenSoft,
        border: C.green,
        fill: "full",
      };
    case "SUBMITTED":
      // Halve kraal — half geschoven, in beoordeling.
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.slate,
        bg: C.slateSoft,
        border: C.slate,
        fill: "half",
      };
    case "EXPIRING":
      // Ring-kraal — leegt, vraagt aandacht.
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.amber,
        bg: C.amberSoft,
        border: C.amber,
        fill: "ring",
      };
    case "REJECTED":
      // Kruis-kraal — teruggeschoven, afgewezen.
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.red,
        bg: C.redSoft,
        border: C.red,
        fill: "cross",
      };
  }
}

// Kleine kraal-indicator die de vorm (vulling) van een status toont — vorm draagt betekenis. ──
function BeadMark({ fill, color }: { fill: BeadFill; color: string }) {
  if (fill === "full")
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
    );
  if (fill === "half")
    return (
      <span
        className="inline-block h-2.5 w-2.5 overflow-hidden rounded-full"
        style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }}
        aria-hidden="true"
      >
        <span className="block h-full w-1/2" style={{ background: color }} />
      </span>
    );
  if (fill === "ring")
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ boxShadow: `inset 0 0 0 2px ${color}` }}
        aria-hidden="true"
      />
    );
  return (
    <span className="inline-flex h-2.5 w-2.5 items-center justify-center" aria-hidden="true">
      <XCircle size={11} strokeWidth={3} style={{ color }} />
    </span>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `1px solid ${m.border}55` }}
    >
      <BeadMark fill={m.fill} color={m.fg} />
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Telraam-kraal — ronde kraal met messing-glans (actief) of licht hout (rustend). ──
function Bead({ active, size = 18 }: { active: boolean; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: active
          ? `radial-gradient(circle at 34% 30%, ${C.brassHi}, ${C.brass} 55%, ${C.brassDeep})`
          : `radial-gradient(circle at 34% 30%, #f3e9d2, ${C.beadIdle} 60%, ${C.beadIdleEdge})`,
        boxShadow: active
          ? `inset 0 -1px 2px ${C.brassDeep}, 0 1px 2px rgba(0,0,0,0.28)`
          : `inset 0 -1px 2px ${C.beadIdleEdge}, 0 1px 1px rgba(0,0,0,0.14)`,
      }}
      aria-hidden="true"
    />
  );
}

// ── Telraam-rij — de kern-datavisualisatie. Een messing staaf met `total` kralen; `filled` kralen
//    zijn naar LINKS geschoven (geteld), de rest rust rechts. Het gat toont de telling. ──
function AbacusRow({ total, filled, size = 18 }: { total: number; filled: number; size?: number }) {
  const clamped = Math.max(0, Math.min(total, filled));
  const left = Array.from({ length: clamped });
  const right = Array.from({ length: total - clamped });
  return (
    <div className="relative flex items-center" style={{ minHeight: size + 6 }} aria-hidden="true">
      {/* Messing staaf */}
      <span
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${C.brassDeep}, ${C.rodLine}, ${C.brassDeep})`,
        }}
      />
      {/* Geschoven (getelde) kralen — links */}
      <div className="relative z-10 flex items-center" style={{ gap: 1 }}>
        {left.map((_, i) => (
          <Bead key={`a${i}`} active size={size} />
        ))}
      </div>
      {/* Gat = de telling */}
      <div className="flex-1" />
      {/* Rustende kralen — rechts */}
      <div className="relative z-10 flex items-center" style={{ gap: 1 }}>
        {right.map((_, i) => (
          <Bead key={`b${i}`} active={false} size={size} />
        ))}
      </div>
    </div>
  );
}

// Kralen-spark — mini kolommetjes van gestapelde kralen (trend). ──
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const beads = Math.max(1, Math.round((v / max) * 4));
        const last = i === data.length - 1;
        return (
          <span key={i} className="flex flex-1 flex-col-reverse items-center gap-[2px]">
            {Array.from({ length: beads }).map((_, b) => (
              <span
                key={b}
                className="h-1.5 w-full rounded-[2px]"
                style={{ background: last ? C.brass : `${C.brass}44` }}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}

// ── Houten frame-kaart — walnoot rand met lichte eiken binnenkant. ──
function WoodCard({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        interactive ? "transition-transform duration-200 hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: C.panel,
        boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 0 0 3px ${C.panel}, inset 0 0 0 4px ${C.frameHi}44, 0 10px 26px -18px rgba(58,36,22,0.5)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Sectie-kop — messing glyph + serif-titel + houten liniaal. ──
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: C.frame, boxShadow: `inset 0 1px 0 ${C.frameHi}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.brassHi }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[23px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-[3px] flex-1 rounded-full sm:block"
        style={{ background: `linear-gradient(90deg, ${C.rodLine}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.brassDeep }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-telling — mono-cijfer met een korte telraam-rij eronder. ──
function MatchCount({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 30 : size === "sm" ? 18 : 22;
  const beads = Math.round((value / 100) * 10);
  return (
    <div className="shrink-0">
      <div className="flex items-baseline gap-0.5">
        <span
          className="font-bold tabular-nums leading-none"
          style={{ ...mono, color: C.ink, fontSize: px }}
        >
          {value}
        </span>
        <span className="text-[11px] font-semibold" style={{ ...mono, color: C.inkFaint }}>
          %
        </span>
      </div>
      <div className="mt-1 w-[92px]">
        <AbacusRow total={10} filled={beads} size={8} />
      </div>
      <div
        className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em]"
        style={{ ...mono, color: C.inkFaint }}
      >
        match
      </div>
    </div>
  );
}

// ── Knoppen ──
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        ...bodyF,
        background: C.frame,
        color: C.cream,
        boxShadow: `inset 0 1px 0 ${C.frameHi}, 0 6px 16px -10px ${C.frameDeep}`,
        ["--tw-ring-color" as string]: C.brass,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        ...bodyF,
        background: C.panel,
        color: C.ink,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
        ["--tw-ring-color" as string]: C.brass,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept198() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Houtnerf — deterministische, zeer subtiele horizontale nerf */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${C.frame} 0 1px, transparent 1px 5px)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 70% at 50% -10%, ${C.panel}88, transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — walnoot masthead als telraam-frame-bovenlijst */}
        <header
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${C.frame}, ${C.frameDeep})` }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${C.brassDeep}, ${C.brassHi}, ${C.brassDeep})`,
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: C.frameDeep }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              {/* Logo — mini telraam-rij */}
              <span
                className="flex h-11 w-14 shrink-0 flex-col justify-center gap-[3px] rounded-lg px-1.5"
                style={{ background: C.frameDeep, boxShadow: `inset 0 0 0 1px ${C.frameHi}66` }}
                aria-hidden="true"
              >
                {[3, 1, 2].map((f, i) => (
                  <div key={i} className="relative flex items-center">
                    <span
                      className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                      style={{ background: C.rodLine }}
                    />
                    <div className="relative z-10 flex gap-[1px]">
                      {[0, 1, 2, 3].map((b) => (
                        <span
                          key={b}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: b < f ? C.brassHi : "#6b5030" }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.brassHi }}
                >
                  Telraam
                </div>
                <div
                  className="text-[26px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.cream }}
                >
                  Kraalwerk
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "#c3a77e" }}
                >
                  Tellen · Matchen · Verifiëren
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.frameDeep,
                  color: C.brassHi,
                  boxShadow: `inset 0 0 0 1px ${C.frameHi}66`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  background: `radial-gradient(circle at 34% 30%, ${C.brassHi}, ${C.brass} 60%, ${C.brassDeep})`,
                  color: C.onBrass,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — kraal-tabs op een staaf */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: `radial-gradient(circle at 30% 20%, ${C.brassHi}, ${C.brass} 70%)`,
                          color: C.onBrass,
                          ["--tw-ring-color" as string]: C.brassHi,
                          ["--tw-ring-offset-color" as string]: C.frameDeep,
                        }
                      : {
                          ...bodyF,
                          background: C.frameDeep,
                          color: "#d3ba90",
                          boxShadow: `inset 0 0 0 1px ${C.frameHi}55`,
                          ["--tw-ring-color" as string]: C.brass,
                          ["--tw-ring-offset-color" as string]: C.frameDeep,
                        }
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: on ? C.onBrass : C.brass }}
                    aria-hidden="true"
                  />
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
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 pt-6 text-[11px]"
            style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.inkFaint }}
          >
            <Calculator size={12} aria-hidden="true" /> Elke kraal een telling — schuif tot de som
            klopt.
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
  // Vaste, deterministische kraal-tellingen (van 10) per KPI — puur decoratieve visualisatie.
  const beadCounts = [9, 7, 8, 4];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: C.panel,
              color: C.brassDeep,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            <Star size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[47px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches geteld boven de 85%.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            De som klopt: je profiel telt op. Eén kraal moet nog verschoven — je VOG verloopt
            binnenkort. Regel het en houd de telling sluitend.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onOpen}>
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
            <GhostButton onClick={onActies}>
              <TriangleAlert
                size={14}
                strokeWidth={2.4}
                style={{ color: C.amber }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </GhostButton>
          </div>
        </div>

        {/* Telraam-frame — de vier KPI's als kralen-rijen in één houten frame (signature-visual) */}
        <div
          className="relative rounded-3xl p-5 sm:p-6"
          style={{
            background: `linear-gradient(180deg, ${C.frameHi}, ${C.frame})`,
            boxShadow: `inset 0 2px 0 ${C.frameHi}, 0 18px 40px -24px ${C.frameDeep}`,
          }}
        >
          <div
            className="rounded-2xl px-4 py-4"
            style={{
              background: C.frameDeep,
              boxShadow: `inset 0 0 0 1px ${C.frameHi}44, inset 0 2px 10px rgba(0,0,0,0.35)`,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.brassHi }}
              >
                Telraam · deze maand
              </span>
              <Hash size={13} style={{ color: "#c3a77e" }} aria-hidden="true" />
            </div>
            <div className="space-y-3.5">
              {KPIS.map((k, i) => (
                <div key={k.label}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span
                      className="text-[11px] font-semibold"
                      style={{ ...bodyF, color: "#dcc6a0" }}
                    >
                      {k.label}
                    </span>
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.cream }}
                    >
                      {k.value}
                    </span>
                  </div>
                  <AbacusRow total={10} filled={beadCounts[i] ?? 0} size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI-kaarten met kralen-spark */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <WoodCard key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  ...mono,
                  background: k.up ? C.greenSoft : C.lineSoft,
                  color: k.up ? C.green : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.green + "44" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[28px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </WoodCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead title="Aanbevolen matches" sub="Op telling gerangschikt" Icon={Calculator} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <WoodCard key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.brass }}
                >
                  <MatchCount value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{ ...bodyF, background: C.lineSoft, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.8}
                            style={{ color: C.green }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </WoodCard>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-telling" Icon={ShieldCheck} />
          <WoodCard className="p-5">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[40px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {dek}
              </span>
              <span className="text-[18px] font-bold" style={{ ...mono, color: C.inkFaint }}>
                %
              </span>
            </div>
            <div className="mt-3">
              <AbacusRow total={10} filled={Math.round(dek / 10)} size={18} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <StatusChip status="VERIFIED" />
            </div>
            <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien alleen
              de getelde, geverifieerde documenten.
            </p>
          </WoodCard>

          {/* Prioriteit — messing-vlak */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: `linear-gradient(140deg, ${C.brassHi}, ${C.brass})`,
              boxShadow: `inset 0 1px 0 #fff6, 0 12px 30px -20px ${C.brassDeep}`,
            }}
          >
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(36,26,6,0.18)", color: C.onBrass }}
              >
                <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[22px] font-semibold leading-tight"
                style={{ ...display, color: C.onBrass }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(36,26,6,0.78)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.frame,
                  color: C.cream,
                  ["--tw-ring-color" as string]: C.onBrass,
                  ["--tw-ring-offset-color" as string]: C.brass,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, empty-state, skeleton-loading én foutstrook ─────────────
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
        <SectionHead title="Marktplaats" sub="Open opdrachten geteld" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.brassDeep }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw tellen"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.brass,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.brassDeep }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.redSoft, border: `1px solid ${C.red}55` }}
        >
          <XCircle size={18} strokeWidth={2.4} style={{ color: C.red }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
              Sommige tellingen konden niet worden opgehaald
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Tel opnieuw.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.red, ["--tw-ring-color" as string]: C.red }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <WoodCard key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-24 shrink-0 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3.5 w-3/4 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-1/2 animate-pulse rounded"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </WoodCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <WoodCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.lineSoft }}
            aria-hidden="true"
          >
            <Calculator size={28} strokeWidth={1.6} style={{ color: C.brassDeep }} />
          </span>
          <p className="text-[22px] font-semibold" style={{ ...display, color: C.ink }}>
            De telling komt op nul
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om opnieuw te tellen.
          </p>
          <div className="mt-1">
            <PrimaryButton onClick={() => setQ("")}>Zoekterm wissen</PrimaryButton>
          </div>
        </WoodCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <WoodCard key={o.id} interactive className="flex flex-col">
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${C.brassHi}, ${C.brassDeep})` }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-3 p-4">
                <MatchCount value={o.match} size="sm" />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{ ...bodyF, background: C.lineSoft, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 rounded-b-2xl py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.brassDeep,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </WoodCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <GhostButton onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </GhostButton>

      <WoodCard className="relative">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-md px-2.5 py-1 text-[11px] font-bold tabular-nums"
              style={{
                ...mono,
                background: C.lineSoft,
                color: C.brassDeep,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[30px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchCount value={opdracht.match} size="lg" />
        </div>
      </WoodCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <WoodCard key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.brassDeep }} />
            </span>
            <div
              className="mt-3 text-[17px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </WoodCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <WoodCard className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.greenSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.8} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </WoodCard>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <WoodCard className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </WoodCard>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <PrimaryButton className="flex-1 !py-3.5">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
        <GhostButton className="!py-3.5">
          <Star size={15} strokeWidth={2.2} style={{ color: C.brassDeep }} aria-hidden="true" />{" "}
          Bewaar
        </GhostButton>
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </PrimaryButton>
      </div>

      {/* Vertrouwens-telraam */}
      <WoodCard className="relative">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <div className="shrink-0">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[48px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {dek}
              </span>
              <span className="text-[20px] font-bold" style={{ ...mono, color: C.inkFaint }}>
                %
              </span>
            </div>
            <div className="mt-3 w-[220px]">
              <AbacusRow total={10} filled={Math.round(dek / 10)} size={20} />
            </div>
          </div>
          <div className="max-w-sm">
            <div className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat schuift een kraal bij. Houd je telling hoog, dan blijft
              je profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.green, color: "#fff" }}
            >
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </WoodCard>

      {/* Verificatie-flow — stappen op een staaf */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { s: "Tel op", t: "Bewijs uploaden", Icon: Plus },
          { s: "Schuif", t: "Ingediend", Icon: Clock },
          { s: "Controleer", t: "Verificatie", Icon: Search },
          { s: "Sluit", t: "Geverifieerd", Icon: ShieldCheck },
        ].map((step, i, arr) => (
          <div
            key={step.s}
            className="relative flex items-center gap-3 rounded-xl p-3"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{
                ...mono,
                background: `radial-gradient(circle at 34% 30%, ${C.brassHi}, ${C.brass} 65%, ${C.brassDeep})`,
                color: C.onBrass,
              }}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.brassDeep }}
              >
                {step.s}
              </div>
              <div
                className="truncate text-[12.5px] font-semibold"
                style={{ ...bodyF, color: C.ink }}
              >
                {step.t}
              </div>
            </div>
            {i < arr.length - 1 && (
              <ChevronRight
                size={16}
                className="absolute -right-2 top-1/2 hidden -translate-y-1/2 sm:block"
                style={{ color: C.brassDeep }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <WoodCard key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.border}44` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.lineSoft,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.brass,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </WoodCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties + berichten + documenten ────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie geteld — pak de bovenste eerst"
        Icon={Calculator}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <WoodCard interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.amber : C.brass }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.amberSoft,
                            color: C.amber,
                            boxShadow: `inset 0 0 0 1px ${C.amber}55`,
                          }
                        : {
                            ...mono,
                            background: C.lineSoft,
                            color: C.brassDeep,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? { ...mono, background: C.amber, color: "#fff" }
                            : {
                                ...mono,
                                background: C.greenSoft,
                                color: C.green,
                                boxShadow: `inset 0 0 0 1px ${C.green}44`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[18px] font-semibold"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.frame,
                              color: C.cream,
                              ["--tw-ring-color" as string]: C.brass,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...bodyF,
                              background: C.lineSoft,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.brass,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </WoodCard>
            </li>
          );
        })}
      </ol>

      {/* Berichten */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <WoodCard>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.lineSoft,
                  color: C.brassDeep,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.brass }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </WoodCard>
      </section>

      {/* Documenten */}
      <section className="space-y-3">
        <SectionHead title="Documenten" sub="Geteld en veilig bewaard" Icon={Ruler} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <WoodCard key={d.naam} className="flex items-center gap-3 p-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.lineSoft }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={2} style={{ color: C.brassDeep }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13px] font-semibold"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusChip status={d.status} />
            </WoodCard>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fill: BeadFill; fg: string; solid: boolean } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fill: "full", fg: C.green, solid: true };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fill: "half", fg: C.amber, solid: false };
    return { label: "Concept", Icon: FileText, fill: "ring", fg: C.slate, solid: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand geteld" Icon={Coins} />
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, filled: 9 },
          { l: "Openstaand", v: `${open}`, filled: 2 },
          { l: "Te factureren", v: "€ 1.350", filled: 3 },
        ].map((s) => (
          <WoodCard key={s.l} interactive className="p-4">
            <div className="text-[11px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
            <div className="mt-3">
              <AbacusRow total={10} filled={s.filled} size={12} />
            </div>
          </WoodCard>
        ))}
      </div>

      <WoodCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.lineSoft }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.solid ? C.greenSoft : "transparent",
                          color: m.fg,
                          border: `1px solid ${m.fg}55`,
                        }}
                      >
                        <BeadMark fill={m.fill} color={m.fg} />
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: `linear-gradient(90deg, ${C.brassHi}, ${C.brass})` }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(36,26,6,0.72)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onBrass }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </WoodCard>
    </div>
  );
}
