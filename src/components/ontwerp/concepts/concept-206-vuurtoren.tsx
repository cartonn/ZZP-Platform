"use client";

// Concept 206 — "Vuurtoren" · een maritiem baken in diep nachtblauw (2026-trend: instrumentele,
// betekenisdragende data-omgevingen i.p.v. decoratie). Metafoor voor matching-op-afstand: opdrachten zijn
// "schepen" op afstand van het baken, geordend op reistijd/nabijheid — de hoofdas van de matching. Een
// roterende licht-kegel strijkt over afstandsringen; warm baken-amber tegen koud diep water. Bewust géén
// radar/sonar-scope: dit is een kust-baken met lichtstraal en kust-navigatie. Strak, instrumenteel, leesbaar.
// Deterministisch (geen random/Date). UI Nederlands. Fonts: Sora (display) + Inter (tekst) + Geist Mono (cijfers).

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
  BadgeCheck,
  Ship,
  Navigation,
  Anchor,
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

// ── Palet — nachtelijke kust: diep nachtblauw water, koude navy-panelen, warm baken-amber/goud accent. ──
const C = {
  abyss: "#060e1c", // diepste water / achtergrond
  sea: "#0a1729", // zee-vlak
  hull: "#0f2036", // paneel-romp
  hullHi: "#16304c", // opgetild paneel / hover
  line: "#20364f", // koude rand
  lineSoft: "#182b41",
  ink: "#eaf1fb", // helder tekst
  inkSoft: "#9db2ce", // secundaire tekst
  inkFaint: "#5f6a8c", // labels (koel grijsblauw)
  beam: "#f6b43c", // baken-amber
  beamHi: "#ffd27a", // lichter baken
  beamDeep: "#c8871f", // dieper baken
  glow: "rgba(246,180,60,0.16)", // licht-gloed
  onBeam: "#1a1103",
  ok: "#3fbf7a",
  okBg: "rgba(63,191,122,0.14)",
  wait: "#5aa8ff",
  waitBg: "rgba(90,168,255,0.14)",
  warn: "#f6b43c",
  warnBg: "rgba(246,180,60,0.14)",
  bad: "#ff6a5a",
  badBg: "rgba(255,106,90,0.14)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Reistijd (minuten) per opdracht — deterministisch uit de matching-redenen; nabijheid is de hoofdas.
function reistijdMin(o: Opdracht): number {
  const all = [...o.redenen.plus, ...o.redenen.min].join(" ");
  const m = all.match(/Reistijd\s+(\d+)\s*min/i);
  if (m && m[1]) return parseInt(m[1], 10);
  if (/korte reistijd/i.test(all)) return 15;
  return 30;
}
function reistijdLabel(o: Opdracht): string {
  return `${reistijdMin(o)} min varen`;
}

// ── Status-model — vorm draagt mee (solid/outline/dashed/double); kleur nooit de enige drager. ──
type Variant = "solid" | "outline" | "dashed" | "double";
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; variant: Variant };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg, variant: "solid" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg, variant: "outline" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnBg,
        variant: "dashed",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg, variant: "double" };
  }
}
function borderFor(v: Variant, color: string): React.CSSProperties {
  if (v === "dashed") return { border: `1.5px dashed ${color}` };
  if (v === "double") return { border: `2.5px double ${color}` };
  return { border: `1px solid ${color}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m.variant, m.fg) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Paneel — koude scheepsromp met fijne rand en waterlijn-glans bovenaan.
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
      className={`rounded-2xl ${className}`}
      style={{
        background: C.hull,
        boxShadow: `inset 0 0 0 1px ${C.line}, 0 12px 30px -20px rgba(0,0,0,0.8)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color: C.inkFaint }}
    >
      {children}
    </span>
  );
}

// ── Baken — het hart van het concept: lichttoren met roterende kegel over afstandsringen; schepen erop. ──
function Beacon({ opdrachten, onOpen }: { opdrachten: Opdracht[]; onOpen: (o: Opdracht) => void }) {
  // sorteer op nabijheid (dichtstbij eerst) — reistijd is de hoofdas
  const ships = [...opdrachten].sort((a, b) => reistijdMin(a) - reistijdMin(b));
  const maxMin = Math.max(...ships.map(reistijdMin), 40);
  // vaste posities op de "kust" (deterministische hoeken), radius schaalt met reistijd
  const angles = [-58, 4, 62];

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-2xl"
      style={{
        background: `radial-gradient(120% 120% at 50% 100%, ${C.sea}, ${C.abyss} 70%)`,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
    >
      {/* afstandsringen rond het baken (onderaan-midden) */}
      {[0.32, 0.56, 0.82].map((r, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "50%",
            bottom: "8%",
            width: `${r * 150}%`,
            height: `${r * 150}%`,
            transform: "translate(-50%, 50%)",
            border: `1px ${i === 1 ? "solid" : "dashed"} ${C.line}`,
          }}
          aria-hidden="true"
        />
      ))}
      {/* roterende licht-kegel (CSS-animatie, geen JS-timers → deterministisch renderresultaat) */}
      <span
        className="beacon-sweep pointer-events-none absolute"
        style={{
          left: "50%",
          bottom: "8%",
          width: "150%",
          height: "150%",
          transform: "translate(-50%, 50%)",
          background: `conic-gradient(from -18deg, transparent 0deg, ${C.glow} 12deg, rgba(246,180,60,0.28) 20deg, transparent 40deg)`,
          borderRadius: "50%",
          transformOrigin: "50% 100%",
        }}
        aria-hidden="true"
      />
      {/* lichtbron-gloed */}
      <span
        className="pointer-events-none absolute h-8 w-8 rounded-full blur-md"
        style={{
          left: "50%",
          bottom: "8%",
          transform: "translate(-50%, 50%)",
          background: C.beamHi,
        }}
        aria-hidden="true"
      />

      {/* schepen — als knoppen op de kaart, positie uit hoek + reistijd-radius */}
      {ships.map((o, i) => {
        const rad = 0.28 + (reistijdMin(o) / maxMin) * 0.5; // 0.28..0.78 van halve breedte
        const a = ((angles[i] ?? 0) * Math.PI) / 180;
        const x = 50 + Math.sin(a) * rad * 46;
        const y = 92 - Math.cos(a) * rad * 74;
        const strong = o.match >= 90;
        return (
          <button
            key={o.id}
            onClick={() => onOpen(o)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-2 py-1.5 text-left transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: C.hullHi,
              boxShadow: `inset 0 0 0 1px ${strong ? C.beam + "88" : C.line}, 0 6px 16px -8px #000`,
              ["--tw-ring-color" as string]: C.beam,
            }}
            aria-label={`${o.titel} — ${reistijdLabel(o)}, match ${o.match} procent`}
          >
            <div className="flex items-center gap-1.5">
              <Ship
                size={14}
                strokeWidth={2}
                style={{ color: strong ? C.beamHi : C.inkSoft }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: strong ? C.beamHi : C.ink }}
              >
                {o.match}
              </span>
            </div>
            <span
              className="mt-0.5 block text-[10px] tabular-nums"
              style={{ ...mono, color: C.inkFaint }}
            >
              {reistijdMin(o)}′
            </span>
          </button>
        );
      })}

      {/* het baken zelf */}
      <div
        className="absolute"
        style={{ left: "50%", bottom: "8%", transform: "translate(-50%, 40%)" }}
        aria-hidden="true"
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: C.beam, boxShadow: `0 0 24px 4px ${C.glow}` }}
        >
          <Navigation size={20} strokeWidth={2.2} style={{ color: C.onBeam }} />
        </span>
      </div>

      <div className="absolute left-3 top-3">
        <Label>Baken · nabijheid</Label>
      </div>

      <style>{`
        @keyframes beaconSweep { to { transform: translate(-50%, 50%) rotate(360deg); } }
        .beacon-sweep { animation: beaconSweep 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .beacon-sweep { animation: none; } }
      `}</style>
    </div>
  );
}

function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.beamHi} 0deg, ${C.beam} ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.hull }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.beamHi }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.beam : C.lineSoft,
          }}
        />
      ))}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.beam }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept206() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState(OPDRACHTEN[0]!.id);
  const active = (OPDRACHTEN.find((o) => o.id === activeId) ?? OPDRACHTEN[0]) as Opdracht;
  const openOpdracht = (o: Opdracht) => {
    setActiveId(o.id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.abyss, color: C.ink }}
    >
      {/* zachte licht-gloed hoog in het beeld — het baken schijnt over het water */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(60% 40% at 50% 0%, ${C.glow}, transparent 60%)` }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <header
          className="sticky top-0 z-20"
          style={{
            background: C.abyss + "e6",
            borderBottom: `1px solid ${C.line}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.beam, boxShadow: `0 0 22px 2px ${C.glow}` }}
                aria-hidden="true"
              >
                <Navigation size={20} strokeWidth={2.2} style={{ color: C.onBeam }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...mono, color: C.beam }}
                >
                  Vuurtoren
                </div>
                <div
                  className="text-[22px] font-semibold leading-none tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  Baken
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}44`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ ...mono, background: C.beam, color: C.onBeam }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>
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
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    background: on ? C.beam : C.hull,
                    color: on ? C.onBeam : C.inkSoft,
                    boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
                    ["--tw-ring-color" as string]: C.beam,
                    ["--tw-ring-offset-color" as string]: C.abyss,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={openOpdracht}
              onActies={() => setScreen("acties")}
              onMarkt={() => setScreen("marktplaats")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Anchor size={12} aria-hidden="true" /> Nabijheid als hoofdas — het baken toont wat
            dichtbij en betrouwbaar is.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: (o: Opdracht) => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const dichtste = [...OPDRACHTEN].sort((a, b) => reistijdMin(a) - reistijdMin(b))[0]!;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.lineSoft,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Het baken */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Schepen op afstand</Label>
            <button
              onClick={onMarkt}
              className="text-[11px] font-semibold"
              style={{ color: C.beam }}
            >
              Alle koersen →
            </button>
          </div>
          <Beacon opdrachten={OPDRACHTEN} onOpen={onOpen} />
          <p className="flex items-center gap-1.5 text-[11.5px]" style={{ color: C.inkSoft }}>
            <Ship size={12} style={{ color: C.beam }} aria-hidden="true" /> Dichtstbij:{" "}
            {dichtste.titel} · {reistijdLabel(dichtste)}
          </p>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: C.beam, boxShadow: `0 20px 40px -22px ${C.beamDeep}` }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, background: "rgba(0,0,0,0.16)", color: C.onBeam }}
            >
              <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Baken-waarschuwing
            </span>
            <h3
              className="mt-2.5 text-[19px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.onBeam }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(26,17,3,0.78)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.onBeam,
                color: C.beamHi,
                ["--tw-ring-color" as string]: C.onBeam,
                ["--tw-ring-offset-color" as string]: C.beam,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold" style={{ ...display, color: C.ink }}>
                Verificatie-dekking
              </span>
              <StatusTag status="VERIFIED" />
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${(verified / CREDENTIALS.length) * 100}%`, background: C.ok }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkSoft }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien alleen
              geverifieerde documenten.
            </p>
          </Panel>

          <Panel className="p-4">
            <Label>Koers-ranglijst</Label>
            <div className="mt-2 space-y-2">
              {[...OPDRACHTEN]
                .sort((a, b) => reistijdMin(a) - reistijdMin(b))
                .map((o) => (
                  <button
                    key={o.id}
                    onClick={() => onOpen(o)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[color:var(--hi)] focus-visible:outline-none focus-visible:ring-2"
                    style={{ ["--hi" as string]: C.hullHi, ["--tw-ring-color" as string]: C.beam }}
                  >
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.beamHi }}
                    >
                      {reistijdMin(o)}′
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <ChevronRight size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
                  </button>
                ))}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats ────────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const filtered = [...OPDRACHTEN]
    .filter(
      (o) =>
        o.titel.toLowerCase().includes(q.toLowerCase()) ||
        o.plaats.toLowerCase().includes(q.toLowerCase()) ||
        o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => reistijdMin(a) - reistijdMin(b));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[20px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          Marktplaats · op nabijheid
        </h2>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.hull, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <Search size={15} style={{ color: C.beam }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.waitBg }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.6} style={{ color: C.beam }} />
          </span>
          <p
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen schip in zicht
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en de horizon vult zich opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.beam,
              color: C.onBeam,
              ["--tw-ring-color" as string]: C.beam,
              ["--tw-ring-offset-color" as string]: C.abyss,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-2">
                {/* nabijheid als prominente maat */}
                <div
                  className="mb-3 flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.beam}33` }}
                >
                  <span
                    className="flex items-center gap-1.5 text-[11.5px] font-semibold"
                    style={{ color: C.beamHi }}
                  >
                    <Ship size={13} strokeWidth={2} aria-hidden="true" /> Nabijheid
                  </span>
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.beamHi }}
                  >
                    {reistijdLabel(o)}
                  </span>
                </div>
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.lineSoft, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onOpen(o)}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.beam,
                  ["--tw-ring-color" as string]: C.beam,
                }}
              >
                Zet koers <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Nabijheid", v: reistijdLabel(opdracht), Icon: Ship },
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.hull,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.beam,
          ["--tw-ring-offset-color" as string]: C.abyss,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...mono, background: C.warnBg, color: C.beam }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...bodyF, background: C.waitBg, color: C.beamHi }}
              >
                <Ship size={11} strokeWidth={2.2} aria-hidden="true" /> {reistijdLabel(opdracht)}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={80} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.warnBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.beam }} />
            </span>
            <div
              className="mt-3 text-[15px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <Label>Waarom dit past</Label>
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <Label>Om te overwegen</Label>
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}44` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.beam,
            color: C.onBeam,
            ["--tw-ring-color" as string]: C.beam,
            ["--tw-ring-offset-color" as string]: C.abyss,
          }}
        >
          Zet koers naar deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.hull,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.beam,
            ["--tw-ring-offset-color" as string]: C.abyss,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.beam }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="flex items-center gap-2 text-[20px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          <ShieldCheck size={18} style={{ color: C.beam }} aria-hidden="true" /> Verificatie
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.beam,
            color: C.onBeam,
            ["--tw-ring-color" as string]: C.beam,
            ["--tw-ring-offset-color" as string]: C.abyss,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.ok} 0deg, ${C.ok} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.hull }}
            >
              <span
                className="text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ok }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[20px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              Elk geverifieerd certificaat brengt je profiel scherper in beeld. Houd je dekking
              hoog, dan blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <div className="mt-3">
              <StatusTag status="VERIFIED" />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg, ...borderFor(m.variant, m.fg) }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.hullHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.beam,
                        ["--tw-ring-offset-color" as string]: C.hull,
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
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold tracking-tight" style={{ ...display, color: C.ink }}>
        Volgende beste acties
      </h2>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.beam }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.warnBg : C.waitBg,
                      color: warn ? C.warn : C.wait,
                      boxShadow: `inset 0 0 0 1px ${(warn ? C.warn : C.wait) + "44"}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[17px] font-semibold tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: C.onBeam,
                              ["--tw-ring-color" as string]: C.warn,
                              ["--tw-ring-offset-color" as string]: C.hull,
                            }
                          : {
                              ...bodyF,
                              background: C.hullHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.beam,
                              ["--tw-ring-offset-color" as string]: C.hull,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <Label>Berichten</Label>
        <Panel>
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
                  background: C.waitBg,
                  color: C.wait,
                  boxShadow: `inset 0 0 0 1px ${C.wait}33`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.beam }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ color: C.inkSoft }}>
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
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ──────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { fg: string; bg: string; Icon: LucideIcon; dashed: boolean } => {
    if (status === "Betaald") return { fg: C.ok, bg: C.okBg, Icon: Check, dashed: false };
    if (status === "Openstaand") return { fg: C.warn, bg: C.warnBg, Icon: Clock, dashed: true };
    return { fg: C.inkSoft, bg: C.lineSoft, Icon: FileText, dashed: false };
  };
  const betaald = "€ 8.622";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[20px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          Facturen
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.beam,
            color: C.onBeam,
            ["--tw-ring-color" as string]: C.beam,
            ["--tw-ring-offset-color" as string]: C.abyss,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${FACTUREN.filter((f) => f.status === "Openstaand").length}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.hullHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
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
                  <tr key={f.nr} style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: C.inkSoft }}>
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: m.dashed ? `1.5px dashed ${m.fg}` : `1px solid ${m.fg}44`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.beam }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(26,17,3,0.75)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onBeam }}
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
