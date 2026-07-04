"use client";

// Concept 58 — "Textiel" · Geweven stof & stiksel (WARM/LICHT).
// Tactiele textiel-esthetiek: een subtiele geweven-stof-textuur (kruislingse repeating-
// linear-gradients = weefsel), stiksel-randen (dashed borders als naaisteek), label-tags
// (zoals ingenaaide kledinglabels) voor status en certificaten, warme wol/linnen-tinten en
// geborduurd-aanvoelende koppen (accent-dashed onderstreping als stiksel). Menselijk, warm,
// ambachtelijk — passend bij zorg als mensenwerk. De inhoud blijft crisp leesbaar op de
// stoffen ondergrond. Humanist type.
// Bewust onderscheidend van Warm-humanist en Klei/claymorphism: dit is expliciet geweven
// textiel + stiksel + stof-labels, geen organische vormen of zacht 3D.
// Palet: linnen #efe9dd, stof #f7f2e8, wol #6d5f4b, stiksel #b9ac93, accent terracotta
// #9c5b3b, salie-groen #4a7a53.
// Fonts: --font-lab-manrope (body/humanist) + --font-lab-franklin (koppen).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  MapPin,
  FileText,
  Send,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Scissors,
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
  linen: "#efe9dd",
  linenDeep: "#e6dece",
  panel: "#f7f2e8",
  panelAlt: "#efe7d6",
  ink: "#332e28",
  inkSoft: "#5c554a",
  muted: "#8c8477",
  faint: "#b3a996",
  line: "#d9cfba",
  stitch: "#b0a184",
  wool: "#6d5f4b",
  accent: "#9c5b3b",
  accentDeep: "#7f4529",
  accentSoft: "#ecdccd",
  accentStitch: "#c58b6a",
  green: "#4a7a53",
  greenSoft: "#e0ebda",
  greenStitch: "#84a97f",
  amber: "#9a6a1f",
  amberSoft: "#f0e5c8",
  amberStitch: "#cbaa6a",
  red: "#a3453a",
  redSoft: "#eddbd4",
  redStitch: "#cc9184",
};

const display = { fontFamily: "var(--font-lab-franklin)" };
const bodyFont = { fontFamily: "var(--font-lab-manrope)" };

// Geweven weefsel: kruislingse draden, subtiel zodat tekst crisp blijft.
const weave = (base: string, strength = 0.045) => ({
  backgroundColor: base,
  backgroundImage: `repeating-linear-gradient(0deg, rgba(80,66,45,${strength}) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(80,66,45,${strength}) 0 1px, transparent 1px 4px)`,
});

type Tone = "green" | "amber" | "red" | "accent" | "wool";

const TONE: Record<Tone, { fg: string; soft: string; stitch: string }> = {
  green: { fg: C.green, soft: C.greenSoft, stitch: C.greenStitch },
  amber: { fg: C.amber, soft: C.amberSoft, stitch: C.amberStitch },
  red: { fg: C.red, soft: C.redSoft, stitch: C.redStitch },
  accent: { fg: C.accent, soft: C.accentSoft, stitch: C.accentStitch },
  wool: { fg: C.wool, soft: C.panelAlt, stitch: C.stitch },
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; tone: Tone; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "amber", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", Icon: AlertTriangle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Textiel-primitieven ---------- */

// Een gestikte stoffen kaart: geweven vlak met een dashed stiksel-rand net binnen de rand.
function Cloth({
  children,
  className = "",
  seam = true,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  seam?: boolean;
  tone?: Tone;
}) {
  const seamColor = tone ? TONE[tone].stitch : C.stitch;
  return (
    <div
      className={`relative rounded-2xl ${className}`}
      style={{
        ...weave(C.panel),
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(80,66,45,0.06)",
      }}
    >
      {seam && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[5px] rounded-[12px]"
          style={{ border: `1.5px dashed ${seamColor}`, opacity: 0.55 }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Ingenaaid kledinglabel — een stoffen tag met stiksel-dashes bovenaan voor status.
function WovenLabel({
  tone,
  children,
  icon: Icon,
}: {
  tone: Tone;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span
      className="relative inline-flex items-center gap-1.5 rounded-md px-2.5 pb-1 pt-1.5 text-[11px] font-semibold"
      style={{
        color: TONE[tone].fg,
        ...weave(TONE[tone].soft, 0.05),
        border: `1px solid ${TONE[tone].stitch}`,
      }}
    >
      {/* stiksel-lijn bovenlangs, alsof het label is ingenaaid */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1.5 top-[3px] h-px"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${TONE[tone].stitch} 0 3px, transparent 3px 6px)`,
        }}
      />
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

function StatusLabel({ status }: { status: CredStatus }) {
  const st = statusStyle(status);
  return (
    <WovenLabel tone={st.tone} icon={st.Icon}>
      {st.label}
    </WovenLabel>
  );
}

// Geborduurd-aanvoelende kop: titel met een accent-dashed stiksel-onderstreping.
function StitchedTitle({
  children,
  size = "lg",
}: {
  children: React.ReactNode;
  size?: "lg" | "md";
}) {
  const cls = size === "lg" ? "text-[26px] sm:text-[30px]" : "text-[16px]";
  return (
    <span className="relative inline-block">
      <span
        className={`font-semibold leading-tight tracking-tight ${cls}`}
        style={{ ...display, color: C.ink }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-0 h-[3px] w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${C.accentStitch} 0 5px, transparent 5px 9px)`,
        }}
      />
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...bodyFont, color: C.accent }}
    >
      <Scissors size={11} aria-hidden="true" /> {children}
    </span>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <div className="mt-2.5">
        <StitchedTitle>{title}</StitchedTitle>
      </div>
      {note && (
        <p className="mt-3.5 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          {note}
        </p>
      )}
    </div>
  );
}

// Geweven voortgangsband met dwarsdraden.
function WovenBar({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: C.linenDeep, border: `1px solid ${C.line}` }}
      role="img"
      aria-label={`${pct} procent`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: TONE[tone].fg,
          backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 2px, transparent 2px 5px)`,
        }}
      />
    </div>
  );
}

function AccentButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd] disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      style={{ ...weave(C.accent, 0.08), color: "#fbf3ec", border: `1px solid ${C.accentDeep}` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[4px] rounded-[9px]"
        style={{ border: `1.5px dashed rgba(251,243,236,0.5)` }}
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept58() {
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
      style={{ ...bodyFont, color: C.ink, ...weave(C.linen, 0.05) }}
    >
      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[230px] shrink-0 flex-col p-4 md:flex"
          style={{ borderRight: `1px dashed ${C.stitch}` }}
        >
          <div className="flex items-center gap-3 px-2 pb-6 pt-2">
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ ...weave(C.accent, 0.08), border: `1px solid ${C.accentDeep}` }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[3px] rounded-lg"
                style={{ border: `1.5px dashed rgba(251,243,236,0.55)` }}
              />
              <Briefcase size={16} style={{ color: "#fbf3ec" }} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight" style={display}>
                Textiel
              </div>
              <div className="text-[10px]" style={{ color: C.muted }}>
                ZZP · mensenwerk
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
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b]"
                  style={{
                    color: on ? C.ink : C.muted,
                    ...(on ? weave(C.panel) : {}),
                    border: `1px ${on ? "solid" : "solid"} ${on ? C.line : "transparent"}`,
                  }}
                >
                  {on && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[4px] rounded-lg"
                      style={{ border: `1.5px dashed ${C.accentStitch}`, opacity: 0.5 }}
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  <span className="relative flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="relative h-4 w-1 rounded-full"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Cloth className="p-3.5" tone="accent">
              <div className="relative flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    ...weave(C.accentSoft, 0.05),
                    color: C.accentDeep,
                    border: `1px solid ${C.accentStitch}`,
                  }}
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: C.green }}
                  >
                    <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Cloth>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px dashed ${C.stitch}` }}
          >
            <h2 className="truncate text-[15px] font-semibold tracking-tight" style={display}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b] sm:flex"
                style={{ ...weave(C.panel), border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-xl p-2.5 transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b]"
                style={{ ...weave(C.panel), border: `1px solid ${C.line}`, color: C.inkSoft }}
                aria-label="Meldingen, 2 ongelezen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ background: C.accent, border: `1.5px solid ${C.panel}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b]"
                  style={{
                    color: on ? C.ink : C.muted,
                    ...(on ? weave(C.panel) : {}),
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
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

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4"
          style={{ ...weave(C.panel), border: `1px solid ${C.line}` }}
        >
          <div
            className="h-3 w-20 rounded-full motion-safe:animate-pulse"
            style={{ background: C.linenDeep }}
          />
          <div
            className="mt-3 h-6 w-16 rounded-md motion-safe:animate-pulse"
            style={{ background: C.linenDeep }}
          />
          <div
            className="mt-3 h-2.5 w-full rounded-full motion-safe:animate-pulse"
            style={{ background: C.panelAlt }}
          />
        </div>
      ))}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Overzicht"
          title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          note="Alles netjes ingenaaid — je werk, matches en certificaten op één stoffen ondergrond. Eén draadje vraagt vandaag aandacht."
        />
        <WovenLabel tone="green" icon={Check}>
          Profiel op orde
        </WovenLabel>
      </div>

      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Cloth key={k.label} className="p-4">
              <div className="relative">
                <p
                  className="text-[11px] font-medium uppercase tracking-wide"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span
                    className="text-[24px] font-semibold leading-none tracking-tight"
                    style={display}
                  >
                    {k.value}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                </div>
                <div className="mt-3">
                  <WovenBar
                    value={digits(k.value) > 100 ? 72 : digits(k.value)}
                    tone={k.up ? "accent" : "amber"}
                  />
                </div>
              </div>
            </Cloth>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Cloth className="overflow-hidden">
            <div
              className="relative flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px dashed ${C.stitch}` }}
            >
              <h3 className="text-[14px] font-semibold tracking-tight" style={display}>
                Beste matches
              </h3>
              <span className="text-[11px]" style={{ color: C.muted }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div className="relative">
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#efe7d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9c5b3b]"
                  style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.line}` }}
                >
                  <MatchPatch value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[13px] font-semibold tabular-nums">{o.tarief}</p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      {o.uren}
                    </p>
                  </div>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Cloth>

          <Cloth className="overflow-hidden">
            <div
              className="relative flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px dashed ${C.stitch}` }}
            >
              <h3 className="text-[14px] font-semibold tracking-tight" style={display}>
                Berichten
              </h3>
              <WovenLabel tone="accent">{ongelezen} ongelezen</WovenLabel>
            </div>
            <div className="relative">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold"
                    style={{
                      ...weave(b.ongelezen ? C.accentSoft : C.panelAlt, 0.05),
                      color: b.ongelezen ? C.accentDeep : C.muted,
                      border: `1px solid ${b.ongelezen ? C.accentStitch : C.line}`,
                    }}
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-hidden="true"
                        />
                      )}
                      {b.ongelezen && <span className="sr-only">ongelezen</span>}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </Cloth>
        </div>

        <div className="space-y-6">
          <Cloth className="p-5">
            <div className="relative">
              <h3 className="mb-3 text-[14px] font-semibold" style={display}>
                Certificaten
              </h3>
              <div className="space-y-3">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          ...weave(TONE[st.tone].soft, 0.05),
                          border: `1px solid ${TONE[st.tone].stitch}`,
                        }}
                      >
                        <st.Icon size={14} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      </div>
                      <span
                        className="text-[10.5px] font-semibold"
                        style={{ color: TONE[st.tone].fg }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Cloth>

          {/* Waarschuwing als los-genaaide lap */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ ...weave(C.amberSoft, 0.05), border: `1px solid ${C.amberStitch}` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[5px] rounded-[12px]"
              style={{ border: `1.5px dashed ${C.amberStitch}`, opacity: 0.6 }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: C.amber }} aria-hidden="true" />
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.amber }}
                >
                  Waarschuwing
                </span>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-snug" style={display}>
                {ACTIES[0]?.titel}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                {ACTIES[0]?.detail}
              </p>
              <AccentButton onClick={() => onOpen()} className="mt-4 w-full">
                {ACTIES[0]?.cta}
              </AccentButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Match als ingenaaide stoffen patch met stiksel-rand.
function MatchPatch({ value }: { value: number }) {
  const tone: Tone = value >= 90 ? "accent" : value >= 80 ? "green" : "amber";
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
      style={{ ...weave(TONE[tone].soft, 0.06), border: `1px solid ${TONE[tone].stitch}` }}
      role="img"
      aria-label={`Matchscore ${value} procent`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] rounded-[8px]"
        style={{ border: `1.5px dashed ${TONE[tone].stitch}`, opacity: 0.7 }}
      />
      <span
        className="relative text-[14px] font-semibold tabular-nums"
        style={{ ...display, color: TONE[tone].fg }}
      >
        {value}
      </span>
    </span>
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
        note="Selecteer links; de gestikte detailkaart rechts toont de gekozen opdracht in het geheel."
      />

      <Cloth className="flex items-center gap-3 px-4 py-2.5">
        <span className="relative flex w-full items-center gap-3">
          <Search size={16} aria-hidden="true" style={{ color: C.accent }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8c8477]"
            style={{ color: C.ink }}
          />
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </span>
      </Cloth>

      {filtered.length === 0 ? (
        <Cloth className="px-6 py-16 text-center">
          <div className="relative">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ ...weave(C.panelAlt, 0.05), border: `1px solid ${C.stitch}` }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.accent }} />
            </span>
            <p className="mt-4 text-[16px] font-semibold" style={display}>
              Geen lap gevonden
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
              Geen opdracht voor &quot;{q}&quot;. Verbreed je zoekopdracht om meer te zien.
            </p>
            <div className="mt-5 flex justify-center">
              <AccentButton onClick={() => setQ("")}>Zoekopdracht wissen</AccentButton>
            </div>
          </div>
        </Cloth>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left focus-visible:outline-none"
                >
                  <div
                    className="relative flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                    style={{
                      ...weave(on ? C.panelAlt : C.panel, 0.05),
                      border: `1px solid ${on ? C.accentStitch : C.line}`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[5px] rounded-[13px]"
                      style={{
                        border: `1.5px dashed ${on ? C.accentStitch : C.stitch}`,
                        opacity: on ? 0.7 : 0.4,
                      }}
                    />
                    <MatchPatch value={o.match} />
                    <div className="relative min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: C.faint }}>
                          {o.id}
                        </span>
                        {on && (
                          <span className="text-[10px] font-semibold" style={{ color: C.accent }}>
                            geselecteerd
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[14px] font-semibold leading-snug">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="relative hidden text-right sm:block">
                      <p className="text-[13px] font-semibold tabular-nums">{o.tarief}</p>
                      <p className="mt-0.5 text-[10.5px]" style={{ color: C.muted }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Cloth className="sticky top-4 h-fit p-5" tone="accent">
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: C.muted }}
                  >
                    {sel.id}
                  </span>
                  <WovenLabel tone={sel.match >= 90 ? "accent" : "green"}>
                    {sel.match}% match
                  </WovenLabel>
                </div>
                <div className="mt-4 flex flex-col items-center text-center">
                  <MatchPatch value={sel.match} />
                  <p className="mt-3 text-[16px] font-semibold" style={display}>
                    {sel.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {sel.opdrachtgever} · {sel.plaats}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="rounded-lg px-2 py-2 text-center"
                      style={{ ...weave(C.panelAlt, 0.05), border: `1px solid ${C.line}` }}
                    >
                      <div
                        className="text-[9px] uppercase tracking-[0.12em]"
                        style={{ color: C.muted }}
                      >
                        {m.l}
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-semibold">{m.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sel.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[10.5px]"
                      style={{
                        color: C.inkSoft,
                        ...weave(C.panel, 0.04),
                        border: `1px dashed ${C.stitch}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <AccentButton onClick={() => onOpen(sel.id)} className="mt-5 w-full">
                  Opdracht openen <ChevronRight size={14} aria-hidden="true" />
                </AccentButton>
              </div>
            </Cloth>
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Cloth className="p-5 sm:p-7">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <MatchPatch value={opdracht.match} />
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <div className="mt-2">
                <StitchedTitle size="lg">{opdracht.titel}</StitchedTitle>
              </div>
              <p
                className="mt-3 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5 text-[10.5px]"
                    style={{
                      color: C.inkSoft,
                      ...weave(C.panelAlt, 0.04),
                      border: `1px dashed ${C.stitch}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <AccentButton onClick={react} disabled={state !== "idle"} className="shrink-0 px-5">
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
          </AccentButton>
        </div>
      </Cloth>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Cloth key={m.l} className="p-4">
            <div className="relative">
              <p
                className="text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.muted }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[17px] font-semibold tracking-tight" style={display}>
                {m.v}
              </p>
            </div>
          </Cloth>
        ))}
      </div>

      <Cloth className="p-6">
        <div className="relative">
          <h3 className="text-[16px] font-semibold" style={display}>
            Waarom deze match
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Transparant onderbouwd op basis van je geverifieerde profiel.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.green }}
              >
                <Check size={13} aria-hidden="true" /> Pluspunten
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{ ...weave(C.greenSoft, 0.05), border: `1px solid ${C.greenStitch}` }}
                      aria-hidden="true"
                    >
                      <Check size={11} style={{ color: C.green }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.amber }}
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
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{ ...weave(C.amberSoft, 0.05), border: `1px solid ${C.amberStitch}` }}
                      aria-hidden="true"
                    >
                      <Minus size={11} style={{ color: C.amber }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Cloth>
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
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Verificatie"
        title="Certificaten & documenten"
        note="Elk bewijsstuk draagt zijn eigen ingenaaide label. Groen = veilig, amber = aandacht, rood = actie."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[240px_1fr]">
        <Cloth className="p-5">
          <div className="relative">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.muted }}
            >
              Gereedheid
            </p>
            <p
              className="mt-2 text-[34px] font-semibold leading-none tracking-tight"
              style={display}
            >
              {pct}%
            </p>
            <div className="mt-3">
              <WovenBar value={pct} tone="green" />
            </div>
            <div className="mt-4 flex gap-2">
              <WovenLabel tone="green">{verified} veilig</WovenLabel>
              <WovenLabel tone="amber">{attention} actie</WovenLabel>
            </div>
          </div>
        </Cloth>

        <Cloth className="overflow-hidden">
          <div className="relative px-5 py-3.5" style={{ borderBottom: `1px dashed ${C.stitch}` }}>
            <h3 className="text-[14px] font-semibold" style={display}>
              Certificatenlijst
            </h3>
          </div>
          <div className="relative">
            {CREDENTIALS.map((c, i) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#efe7d6]"
                  style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.line}` }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      ...weave(TONE[st.tone].soft, 0.05),
                      border: `1px solid ${TONE[st.tone].stitch}`,
                    }}
                  >
                    {c.status === "SUBMITTED" ? (
                      <Loader2
                        size={16}
                        className="motion-safe:animate-spin"
                        style={{ color: TONE[st.tone].fg }}
                        aria-hidden="true"
                      />
                    ) : (
                      <st.Icon size={16} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{c.naam}</p>
                    <p className="text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                  <StatusLabel status={c.status} />
                </div>
              );
            })}
          </div>
        </Cloth>
      </div>

      <Cloth className="overflow-hidden">
        <div className="relative px-5 py-3.5" style={{ borderBottom: `1px dashed ${C.stitch}` }}>
          <h3 className="text-[14px] font-semibold" style={display}>
            Documentenarchief
          </h3>
        </div>
        <div className="relative">
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ ...weave(C.panelAlt, 0.05), border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.accent }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span className="hidden sm:block">
                  <StatusLabel status={d.status} />
                </span>
                <span className="sm:hidden">
                  <st.Icon size={16} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>
      </Cloth>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onOpen }: { onOpen: (id?: string) => void }) {
  const meta: Record<"warning" | "info", { tone: Tone; Icon: LucideIcon; label: string }> = {
    warning: { tone: "amber", Icon: AlertTriangle, label: "Waarschuwing" },
    info: { tone: "accent", Icon: Bell, label: "Melding" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Acties"
        title="Volgende beste stappen"
        note="Op volgorde van urgentie — netjes ingenaaid zodat je precies weet wat nu telt."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const m = meta[a.urgentie];
          return (
            <Cloth key={a.titel} className="p-5" tone={m.tone}>
              <div className="relative flex items-start gap-4">
                <span className="flex flex-col items-center gap-2 pt-0.5">
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      ...weave(TONE[m.tone].soft, 0.05),
                      border: `1px solid ${TONE[m.tone].stitch}`,
                    }}
                  >
                    <m.Icon size={18} style={{ color: TONE[m.tone].fg }} aria-hidden="true" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <WovenLabel tone={m.tone}>{m.label}</WovenLabel>
                  <p className="mt-2 text-[14px] font-semibold">{a.titel}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onOpen()}
                  className="shrink-0 self-center rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c5b3b]"
                  style={{
                    color: TONE[m.tone].fg,
                    ...weave(TONE[m.tone].soft, 0.05),
                    border: `1px solid ${TONE[m.tone].stitch}`,
                  }}
                >
                  {a.cta}
                </button>
              </div>
            </Cloth>
          );
        })}
      </div>
      <Cloth className="p-5">
        <div className="relative flex items-center gap-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ ...weave(C.greenSoft, 0.05), border: `1px solid ${C.greenStitch}` }}
          >
            <Check size={18} style={{ color: C.green }} aria-hidden="true" />
          </span>
          <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Meer heb je nu niet te doen. Nieuwe acties naaien we hier voor je in zodra ze relevant
            worden.
          </p>
        </div>
      </Cloth>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, Tone> = {
    Betaald: "green",
    Openstaand: "amber",
    Concept: "accent",
  };
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaalOpen = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Facturen"
          title="Kasstroom"
          note="Betaald en openstaand, netjes ingenaaid."
        />
        <AccentButton className="shrink-0">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </AccentButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Cloth className="p-5" tone="green">
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              Ontvangen
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight"
              style={{ ...display, color: C.green }}
            >
              € {totaalBetaald.toLocaleString("nl-NL")}
            </p>
          </div>
        </Cloth>
        <Cloth className="p-5" tone="amber">
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              Openstaand
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight"
              style={{ ...display, color: C.amber }}
            >
              € {totaalOpen.toLocaleString("nl-NL")}
            </p>
          </div>
        </Cloth>
      </div>

      <Cloth className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px dashed ${C.stitch}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const tone = statusTone[f.status] ?? "accent";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#efe7d6]"
                    style={{ borderTop: `1px dashed ${C.line}` }}
                  >
                    <td className="px-5 py-4 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <WovenLabel tone={tone}>{f.status}</WovenLabel>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cloth>
    </div>
  );
}
