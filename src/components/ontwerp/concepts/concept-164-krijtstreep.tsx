"use client";

// Concept 164 — "Krijtstreep" · sartoriaal maatpak & quiet luxury.
// Menswear-tailoring: donkere wolstof (antraciet/marine) met fijne verticale krijtstreep
// als achtergrond-textuur (repeating-linear-gradient), ivoor en messing (brass) accent,
// serieuze serif-typografie en tailleer-details (steek/basting via dashed borders).
// 2026-trends: quiet luxury (ingehouden weelde, materiaal boven decoratie), tactiele stof-
// texturen als UI-oppervlak, en editorial serif-koppen. Onderscheidend: dit is een AFGEWERKT
// pinstripe maatpak, geen naaipatroon. Deterministisch — geen random/Date. UI-taal Nederlands.
// Fonts: Fraunces + Newsreader (display/serif) + mono (labels/data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  TriangleAlert,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  Scissors,
  Gem,
  BadgeCheck,
  Award,
  RefreshCw,
  Inbox,
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

// ── Palet — wolstof: antraciet & marine, ivoor stof, messing accent ──────────────
const C = {
  wool: "#1b2233", // marine-antraciet wolstof (hoofdtoon donkere panelen)
  woolDeep: "#141a28", // diepere naad/rand
  woolSoft: "#2a3346", // opgelichte wol
  charcoal: "#20242e", // antraciet
  ivory: "#f3eee2", // ivoor overhemdstof (lichte oppervlakken)
  ivoryDeep: "#e7dfcd", // ivoor met schaduw
  ivorySoft: "#faf7ef",
  brass: "#b3924f", // messing / goud accent
  brassBright: "#cbab68", // opgelicht messing
  brassDeep: "#8f7239",
  ink: "#252a1e", // donkere tekst op ivoor
  inkSoft: "#4a4d3f",
  taupe: "#8c8570", // gedempte label-tint
  taupeSoft: "#b7b09a",
  chalk: "rgba(243,238,226,0.10)", // krijtstreep-lijn op wol
  chalkStrong: "rgba(243,238,226,0.16)",
  ok: "#3f7d54", // salie-groen (geverifieerd)
  okSoft: "#e4efe5",
  warn: "#9a6a1f", // amber (verloopt)
  warnSoft: "#f4e9d4",
  danger: "#9e3b34", // gedempt bordeaux (afgewezen)
  dangerSoft: "#f2e0dd",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Krijtstreep — fijne verticale lijnen op wolstof. Het kern-motief.
const pinstripe = (line = C.chalk) =>
  `repeating-linear-gradient(90deg, transparent 0 13px, ${line} 13px 14px)`;
const pinstripeFine = (line = C.chalk) =>
  `repeating-linear-gradient(90deg, transparent 0 8px, ${line} 8px 8.5px)`;

// Basting-steek (tailleer-naad) via dashed rand op ivoor kaarten.
const bastingIvory = { border: `1px dashed rgba(140,133,112,0.55)` };

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        fg: C.ok,
        bg: C.okSoft,
        ring: "rgba(63,125,84,0.4)",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.inkSoft,
        bg: C.ivoryDeep,
        ring: "rgba(140,133,112,0.4)",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnSoft,
        ring: "rgba(154,106,31,0.4)",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.danger,
        bg: C.dangerSoft,
        ring: "rgba(158,59,52,0.4)",
      };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]"
      style={{ ...mono, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Messing label-chip (klein kapitaal-etiket, als een tailleur-merklabel).
function Label({
  children,
  Icon,
  tone = "brass",
}: {
  children: React.ReactNode;
  Icon?: LucideIcon;
  tone?: "brass" | "ivory" | "muted";
}) {
  const s =
    tone === "brass"
      ? { color: C.brassBright, border: `1px solid ${C.brass}55` }
      : tone === "ivory"
        ? { color: C.ink, border: `1px solid rgba(140,133,112,0.45)` }
        : { color: C.taupe, border: `1px solid rgba(140,133,112,0.3)` };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ ...mono, ...s }}
    >
      {Icon && <Icon size={11} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

// Ivoor kaart met basting-steek en zachte lift.
function Card({
  children,
  className = "",
  interactive = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-lg ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(20,26,40,0.5)]"
          : ""
      } ${className}`}
      style={{
        background: C.ivory,
        ...bastingIvory,
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 6px 18px -14px rgba(20,26,40,0.45)",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Sectiekop — messing revers-lijn + serif titel.
function SectionHead({
  eyebrow,
  title,
  Icon,
  right,
}: {
  eyebrow: string;
  title: string;
  Icon: LucideIcon;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: C.wool, boxShadow: `inset 0 0 0 1px ${C.brass}66` }}
            aria-hidden="true"
          >
            <Icon size={14} strokeWidth={2} style={{ color: C.brassBright }} />
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.taupe }}
          >
            {eyebrow}
          </span>
        </div>
        <h2
          className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.01em] sm:text-[26px]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.brassDeep }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-cijfer als tailleur-gradering — messing ring, cijfer draagt betekenis.
function MatchDial({ value, size = 52 }: { value: number; size?: number }) {
  const tone = value >= 90 ? C.ok : value >= 84 ? C.brass : C.taupe;
  return (
    <span
      className="relative flex shrink-0 flex-col items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: C.woolDeep,
        backgroundImage: pinstripeFine(),
        boxShadow: `inset 0 0 0 2px ${tone}88`,
      }}
      aria-hidden="true"
    >
      <span
        className="text-[16px] font-semibold leading-none"
        style={{ ...display, color: C.ivory }}
      >
        {value}
      </span>
      <span
        className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.brassBright }}
      >
        match
      </span>
    </span>
  );
}

// Mini staafje — messing draad-hoogtes.
function Threads({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.brass : "rgba(140,133,112,0.35)",
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept164() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...serif, background: C.woolDeep, color: C.ivory }}
    >
      {/* Kop — wolstof-revers met krijtstreep */}
      <header
        className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8"
        style={{ background: C.wool, backgroundImage: pinstripe() }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${C.brass}88, transparent)` }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: C.woolDeep, boxShadow: `inset 0 0 0 1.5px ${C.brass}` }}
            aria-hidden="true"
          >
            <Scissors size={20} strokeWidth={1.8} style={{ color: C.brassBright }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[20px] font-semibold tracking-[0.01em]"
              style={{ ...display, color: C.ivory }}
            >
              Krijtstreep
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.taupeSoft }}
            >
              Werk · Verificatie · Omzet
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] sm:inline-flex"
            style={{ ...mono, color: C.brassBright, boxShadow: `inset 0 0 0 1px ${C.brass}66` }}
          >
            <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              ...mono,
              color: C.woolDeep,
              background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher — revers-tabs */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.wool, borderTop: `1px solid ${C.woolSoft}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? {
                      ...mono,
                      color: C.woolDeep,
                      background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
                      ["--tw-ring-color" as string]: C.brass,
                      ["--tw-ring-offset-color" as string]: C.wool,
                    }
                  : {
                      ...mono,
                      color: C.taupeSoft,
                      boxShadow: `inset 0 0 0 1px ${C.woolSoft}`,
                      ["--tw-ring-color" as string]: C.brass,
                      ["--tw-ring-offset-color" as string]: C.wool,
                    }
              }
            >
              <span className="tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>{" "}
              {s.label}
            </button>
          );
        })}
      </nav>

      <main
        className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9"
        style={{ background: C.ivorySoft, color: C.ink }}
      >
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
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — wolstof-revers op krijtstreep */}
      <div
        className="relative overflow-hidden rounded-xl px-6 py-8 sm:px-9 sm:py-10"
        style={{
          background: C.wool,
          backgroundImage: pinstripe(),
          boxShadow: `inset 0 0 0 1px ${C.woolSoft}, 0 20px 40px -28px rgba(20,26,40,0.8)`,
        }}
      >
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.brass}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <Label Icon={Gem}>{PROFIEL.rol}</Label>
          <h1
            className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.015em] sm:text-[42px]"
            style={{ ...display, color: C.ivory }}
          >
            Drie matches boven 85%. De omzet stijgt.
          </h1>
          <p
            className="mt-3 max-w-lg text-[15px] leading-relaxed"
            style={{ ...serif, color: C.taupeSoft }}
          >
            Eén taak vraagt aandacht: je VOG verloopt binnenkort. Handel het op tijd af en blijf
            verifieerbaar — vertrouwen is op maat gemaakt.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
                color: C.woolDeep,
                ["--tw-ring-color" as string]: C.brass,
                ["--tw-ring-offset-color" as string]: C.wool,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: "transparent",
                color: C.ivory,
                boxShadow: `inset 0 0 0 1px ${C.brass}66`,
                ["--tw-ring-color" as string]: C.brass,
                ["--tw-ring-offset-color" as string]: C.wool,
              }}
            >
              <TriangleAlert size={15} strokeWidth={2} aria-hidden="true" /> Los actie op
            </button>
          </div>
        </div>
      </div>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.taupe }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Threads data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-5 lg:col-span-2">
          <SectionHead eyebrow="Op maat gesneden" title="Aanbevolen matches" Icon={Star} />
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.brass }}
                >
                  <MatchDial value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold tracking-[-0.01em]"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div className="mt-0.5 truncate text-[13px]" style={{ color: C.taupe }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0"
                        style={{ color: C.brassDeep }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            ...mono,
                            background: C.okSoft,
                            color: C.ok,
                            boxShadow: "inset 0 0 0 1px rgba(63,125,84,0.3)",
                          }}
                        >
                          <Check size={11} strokeWidth={3} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Rechterkolom: dekking + prioriteit + berichten (met loading/empty/error) */}
        <div className="space-y-5">
          <SectionHead eyebrow="Vertrouwen" title="Verificatie" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[48px] font-semibold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[22px]" style={{ color: C.brassDeep }}>
                  %
                </span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[13px]" style={{ ...serif, color: C.taupe }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: C.ivoryDeep }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${dek}%`,
                  background: `linear-gradient(90deg, ${C.brassBright}, ${C.brassDeep})`,
                }}
              />
            </div>
          </Card>

          {/* Prioriteit — wolstof-kaartje */}
          <div
            className="overflow-hidden rounded-lg p-5"
            style={{
              background: C.wool,
              backgroundImage: pinstripe(),
              boxShadow: `inset 0 0 0 1px ${C.brass}44`,
            }}
          >
            <Label Icon={TriangleAlert}>Prioriteit</Label>
            <h3
              className="mt-3 text-[18px] font-semibold leading-snug"
              style={{ ...display, color: C.ivory }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[13px] leading-relaxed"
              style={{ ...serif, color: C.taupeSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
                color: C.woolDeep,
                ["--tw-ring-color" as string]: C.brass,
                ["--tw-ring-offset-color" as string]: C.wool,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          <InboxPreview />
        </div>
      </div>
    </div>
  );
}

// ── Berichten-voorbeeld — bewijst loading (skeleton), empty én error in de designtaal ──
type InboxState = "content" | "loading" | "empty" | "error";
function InboxPreview() {
  const [state, setState] = useState<InboxState>("content");
  const tabs: { key: InboxState; label: string }[] = [
    { key: "content", label: "Inbox" },
    { key: "loading", label: "Laden" },
    { key: "empty", label: "Leeg" },
    { key: "error", label: "Fout" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Inbox size={15} strokeWidth={2} style={{ color: C.brassDeep }} aria-hidden="true" />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.taupe }}
          >
            Berichten
          </span>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Berichten-toestand">
          {tabs.map((t) => {
            const on = t.key === state;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                onClick={() => setState(t.key)}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...mono,
                  background: on ? C.wool : "transparent",
                  color: on ? C.brassBright : C.taupe,
                  boxShadow: on ? "none" : `inset 0 0 0 1px rgba(140,133,112,0.35)`,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {state === "loading" && (
          <ul className="space-y-3" aria-busy="true" aria-label="Berichten laden">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="h-9 w-9 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.ivoryDeep }}
                  aria-hidden="true"
                />
                <div className="flex-1 space-y-1.5">
                  <span
                    className="block h-2.5 animate-pulse rounded-full"
                    style={{ width: `${70 - i * 12}%`, background: C.ivoryDeep }}
                    aria-hidden="true"
                  />
                  <span
                    className="block h-2 animate-pulse rounded-full"
                    style={{ width: `${52 - i * 8}%`, background: C.ivoryDeep }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {state === "empty" && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: C.ivoryDeep }}
              aria-hidden="true"
            >
              <Inbox size={20} strokeWidth={1.8} style={{ color: C.taupe }} />
            </span>
            <p className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
              Geen berichten
            </p>
            <p className="max-w-[15rem] text-[12.5px]" style={{ ...serif, color: C.taupe }}>
              Zodra een opdrachtgever reageert, verschijnt het hier.
            </p>
          </div>
        )}

        {state === "error" && (
          <div
            className="flex items-start gap-3 rounded-md p-3.5"
            role="alert"
            style={{ background: C.dangerSoft, boxShadow: "inset 0 0 0 1px rgba(158,59,52,0.3)" }}
          >
            <XCircle size={17} strokeWidth={2} style={{ color: C.danger }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: C.danger }}>
                Berichten konden niet worden geladen
              </p>
              <p className="mt-0.5 text-[12px]" style={{ ...serif, color: C.inkSoft }}>
                Controleer je verbinding en probeer het opnieuw.
              </p>
              <button
                onClick={() => setState("content")}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  ...mono,
                  background: C.white,
                  color: C.danger,
                  boxShadow: "inset 0 0 0 1px rgba(158,59,52,0.4)",
                  ["--tw-ring-color" as string]: C.danger,
                }}
              >
                <RefreshCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        {state === "content" && (
          <ul className="space-y-2.5">
            {BERICHTEN.map((b) => (
              <li key={b.van} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    ...mono,
                    color: C.woolDeep,
                    background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...display, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.brass }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="truncate text-[12px]" style={{ color: C.taupe }}>
                    {b.preview}
                  </p>
                </div>
                <span className="shrink-0 text-[11px]" style={{ ...mono, color: C.taupeSoft }}>
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-7">
      <SectionHead
        eyebrow="Collectie"
        title="Marktplaats · open opdrachten"
        Icon={Award}
        right={
          <div
            className="flex items-center gap-2 rounded-full px-3 py-2"
            style={{ background: C.white, ...bastingIvory }}
          >
            <Search size={16} style={{ color: C.taupe }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ ...serif, color: C.ink }}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.ivoryDeep }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.taupe }} />
          </span>
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ ...serif, color: C.taupe }}>
            Geen opdracht voor “{q}”. Pas je zoekterm aan of bekijk de volledige collectie.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: C.wool,
              color: C.brassBright,
              ["--tw-ring-color" as string]: C.brass,
              ["--tw-ring-offset-color" as string]: C.ivorySoft,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <MatchDial value={o.match} size={48} />
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[15px] font-semibold leading-snug tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.taupe }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div
                className="px-4 pb-4 pt-3"
                style={{ borderTop: `1px dashed rgba(140,133,112,0.45)` }}
              >
                <dl className="grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-[0.02em]"
                      style={{
                        ...mono,
                        background: C.ivoryDeep,
                        color: C.inkSoft,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...mono,
                  background: C.wool,
                  backgroundImage: pinstripeFine(),
                  color: C.brassBright,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Card>
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
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          background: C.white,
          color: C.ink,
          ...bastingIvory,
          ["--tw-ring-color" as string]: C.brass,
          ["--tw-ring-offset-color" as string]: C.ivorySoft,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar collectie
      </button>

      {/* Kop — wolstof-revers */}
      <div
        className="relative overflow-hidden rounded-xl px-6 py-8 sm:px-9"
        style={{
          background: C.wool,
          backgroundImage: pinstripe(),
          boxShadow: `inset 0 0 0 1px ${C.woolSoft}`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <Label>{opdracht.id}</Label>
            <h1
              className="mt-3 max-w-2xl text-[27px] font-semibold leading-[1.06] tracking-[-0.015em] sm:text-[36px]"
              style={{ ...display, color: C.ivory }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...serif, color: C.taupeSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center"
            style={{ borderLeft: `1px solid ${C.brass}55`, paddingLeft: 20 }}
          >
            <span
              className="text-[52px] font-semibold leading-none"
              style={{ ...display, color: C.brassBright }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.taupeSoft }}
            >
              % match
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2} style={{ color: C.brassDeep }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[17px] font-semibold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.taupe }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <SectionHead eyebrow="Pluspunten" title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...serif, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: C.okSoft,
                      boxShadow: "inset 0 0 0 1px rgba(63,125,84,0.35)",
                    }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <SectionHead eyebrow="Overweging" title="Om te wegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...serif, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: C.warnSoft,
                      boxShadow: "inset 0 0 0 1px rgba(154,106,31,0.35)",
                    }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={3} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
            color: C.woolDeep,
            ["--tw-ring-color" as string]: C.brass,
            ["--tw-ring-offset-color" as string]: C.ivorySoft,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.white,
            color: C.ink,
            ...bastingIvory,
            ["--tw-ring-color" as string]: C.brass,
            ["--tw-ring-offset-color" as string]: C.ivorySoft,
          }}
        >
          <Star size={15} strokeWidth={2} aria-hidden="true" /> Bewaar
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
    <div className="space-y-7">
      <SectionHead
        eyebrow="Kwaliteitskeurmerk"
        title="Verificatie & certificaten"
        Icon={ShieldCheck}
        right={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: C.wool,
              color: C.brassBright,
              ["--tw-ring-color" as string]: C.brass,
              ["--tw-ring-offset-color" as string]: C.ivorySoft,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
          </button>
        }
      />

      {/* Dekking — wolstof-banner */}
      <div
        className="overflow-hidden rounded-xl px-6 py-6"
        style={{
          background: C.wool,
          backgroundImage: pinstripe(),
          boxShadow: `inset 0 0 0 1px ${C.brass}44`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div
              className="text-[54px] font-semibold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.brassBright }}
            >
              {dek}
              <span className="text-[24px]" style={{ color: C.taupeSoft }}>
                %
              </span>
            </div>
            <div className="max-w-xs">
              <div className="text-[16px] font-semibold" style={{ ...display, color: C.ivory }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p
                className="mt-1 text-[12.5px] leading-snug"
                style={{ ...serif, color: C.taupeSoft }}
              >
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking maakt je
                profiel aantoonbaar betrouwbaar.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{ ...mono, color: C.brassBright, boxShadow: `inset 0 0 0 1px ${C.brass}66` }}
          >
            <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch overflow-hidden">
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[15px] font-semibold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.taupe }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...mono,
                        background: C.wool,
                        color: C.brassBright,
                        ["--tw-ring-color" as string]: C.brass,
                        ["--tw-ring-offset-color" as string]: C.ivory,
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );

  return (
    <div className="space-y-7">
      <SectionHead eyebrow="Op volgorde" title="Volgende beste acties" Icon={Award} />
      <p className="-mt-3 text-[13.5px]" style={{ ...serif, color: C.taupe }}>
        Op urgentie gesorteerd — pak de bovenste eerst.
      </p>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="flex items-stretch overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                style={
                  warn
                    ? {
                        background: C.wool,
                        backgroundImage: pinstripe(),
                        boxShadow: `inset 0 0 0 1px ${C.brass}55`,
                      }
                    : { background: C.ivory, ...bastingIvory }
                }
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[26px] font-semibold"
                  style={{
                    ...display,
                    color: warn ? C.brassBright : C.taupe,
                    borderRight: warn
                      ? `1px solid ${C.brass}44`
                      : `1px dashed rgba(140,133,112,0.45)`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={
                        warn
                          ? {
                              ...mono,
                              color: C.brassBright,
                              boxShadow: `inset 0 0 0 1px ${C.brass}66`,
                            }
                          : { ...mono, background: C.ivoryDeep, color: C.inkSoft }
                      }
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-semibold tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.ivory : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13.5px] leading-relaxed"
                    style={{ ...serif, color: warn ? C.taupeSoft : C.taupe }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
                            color: C.woolDeep,
                            ["--tw-ring-color" as string]: C.brass,
                            ["--tw-ring-offset-color" as string]: C.wool,
                          }
                        : {
                            ...mono,
                            background: C.wool,
                            color: C.brassBright,
                            ["--tw-ring-color" as string]: C.brass,
                            ["--tw-ring-offset-color" as string]: C.ivorySoft,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.ivoryDeep };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-7">
      <SectionHead
        eyebrow="Boekhouding"
        title="Facturen"
        Icon={FileText}
        right={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: `linear-gradient(140deg, ${C.brassBright}, ${C.brassDeep})`,
              color: C.woolDeep,
              ["--tw-ring-color" as string]: C.brass,
              ["--tw-ring-offset-color" as string]: C.ivorySoft,
            }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, dark: true },
          { l: "Openstaand", v: `${open}`, dark: false },
          { l: "Te factureren", v: "€ 1.350", dark: false },
        ].map((s) =>
          s.dark ? (
            <div
              key={s.l}
              className="rounded-lg p-4"
              style={{
                background: C.wool,
                backgroundImage: pinstripe(),
                boxShadow: `inset 0 0 0 1px ${C.brass}44`,
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.taupeSoft }}
              >
                {s.l}
              </div>
              <div
                className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.brassBright }}
              >
                {s.v}
              </div>
            </div>
          ) : (
            <Card key={s.l} interactive className="p-4">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.taupe }}
              >
                {s.l}
              </div>
              <div
                className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {s.v}
              </div>
            </Card>
          ),
        )}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#efe9db]"
                style={{ borderTop: i === 0 ? "none" : `1px dashed rgba(140,133,112,0.4)` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: m.bg }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14px] font-semibold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.taupe }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]"
                  style={{ ...mono, background: m.bg, color: m.fg }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ background: C.wool, backgroundImage: pinstripeFine() }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.taupeSoft }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-semibold tabular-nums"
            style={{ ...display, color: C.brassBright }}
          >
            {betaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
