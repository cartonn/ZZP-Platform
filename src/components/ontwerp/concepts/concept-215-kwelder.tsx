"use client";

// Concept 215 — "Kwelder" · biofiel, gedempt-natuurlijk. 2026-trend: biophilic/natural palettes, calm/
// low-stimulation, organische vormen. Rustige, aardse naturalisme: gedempte salie-groen, klei en zand,
// zachte organische radii, veel lucht, laag-prikkelend. Vertrouwen via kalmte rond gevoelige documenten.
// Onderscheidt zich van felle/donkere concepten door de natuurlijke, matte, warme-groene rust. Fonts:
// Sora + Plus Jakarta Sans. UI Nederlands. Deterministisch (geen random/Date).

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
  BadgeCheck,
  Leaf,
  Sprout,
  Wind,
  MessageSquare,
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

// ── Palet — kwelder/zoutmoeras: gedempt salie-groen, klei, zand. Matte, warme rust. ──
const C = {
  bg: "#f1f0e8", // zand/kwelder-basis
  bgAlt: "#e9e8de", // dieper zand
  panel: "#f8f7f1", // licht paneel
  panelSoft: "#f0efe6", // zacht paneel
  ink: "#26302a", // diep mos
  inkSoft: "#4f5b51", // secundair blad
  inkFaint: "#8a927f", // labels / lucht
  line: "#dcdccf", // fijne rand
  lineStrong: "#c9caba", // sterkere rand
  sage: "#5b7355", // salie-accent
  sageDeep: "#465a41",
  sageBg: "#e2e8dc", // zacht salievlak
  clay: "#a98467", // klei-secundair
  clayBg: "#ece1d6",
  // status — kalm, natuurlijk, altijd label + icoon
  ok: "#4b7a4e", // blad-groen
  okBg: "#dfeada", // zacht bladvlak
  wait: "#3f6d86", // water-blauw
  waitBg: "#dde8ec",
  warn: "#9a6b34", // klei-amber
  warnBg: "#efe2cf",
  bad: "#a24a3c", // baksteen
  badBg: "#eddcd6",
};

const headF = { fontFamily: "var(--font-lab-sora)" }; // Sora — rustige koppen
const bodyF = { fontFamily: "var(--font-lab-jakarta)" }; // Plus Jakarta Sans — leesbaar

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Organisch paneel — zachte, asymmetrische radii, matte rand, nauwelijks schaduw. Rust.
function Panel({
  children,
  className = "",
  style,
  radius = "22px 22px 22px 22px",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  radius?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.panel,
        borderRadius: radius,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — blad-glyph in salievlak + kalme titel.
function SectionHead({ kicker, title, Icon }: { kicker: string; title: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        style={{ background: C.sageBg, borderRadius: "16px 16px 16px 6px" }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.8} style={{ color: C.sageDeep }} />
      </span>
      <div className="min-w-0">
        <div
          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...bodyF, color: C.clay }}
        >
          {kicker}
        </div>
        <h2 className="text-[19px] font-semibold leading-tight" style={{ ...headF, color: C.ink }}>
          {title}
        </h2>
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.sage }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Deterministische blad-ring — een cirkel-voortgang, afgeleid van een percentage. Geen animatie/random.
function LeafRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - pct / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={7} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.sage}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        style={{ ...headF, fill: C.ink, fontSize: size / 4.2, fontWeight: 600 }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept215() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* zeer zachte organische lichtvelden — laag-prikkelend, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(60% 50% at 12% 8%, ${C.sageBg}66 0%, transparent 60%), radial-gradient(50% 45% at 90% 100%, ${C.clayBg}55 0%, transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header className="relative" style={{ background: C.bg }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: C.sage, borderRadius: "18px 18px 18px 6px" }}
                aria-hidden="true"
              >
                <Leaf size={20} strokeWidth={1.9} style={{ color: C.panel }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                  style={{ ...bodyF, color: C.clay }}
                >
                  Kwelder
                </div>
                <div
                  className="text-[23px] font-semibold leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  Werkruimte
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  Opdrachten · Verificatie · Facturen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: C.okBg, color: C.ok }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
                style={{
                  ...headF,
                  background: C.sageBg,
                  color: C.sageDeep,
                  borderRadius: "14px 14px 14px 5px",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

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
                  className="shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    borderRadius: "12px 12px 12px 4px",
                    background: on ? C.sage : C.panel,
                    color: on ? C.panel : C.inkSoft,
                    boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
                    ["--tw-ring-color" as string]: C.sage,
                    ["--tw-ring-offset-color" as string]: C.bg,
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[12.5px]"
            style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
          >
            <Wind size={13} aria-hidden="true" /> Rustig en natuurlijk — ruimte om te ademen, elke
            status met label en icoon.
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

  return (
    <div className="space-y-8">
      <Panel className="relative overflow-hidden" radius="28px 28px 28px 10px">
        <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...bodyF, background: C.sageBg, color: C.sageDeep }}
              >
                <Sprout size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                {PROFIEL.plaats}
              </span>
            </div>
            <h1
              className="mt-5 text-[32px] font-semibold leading-[1.1] sm:text-[42px]"
              style={{ ...headF, color: C.ink }}
            >
              Rustig verder bouwen aan je werk.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              Drie sterke matches staan klaar en één zachte herinnering: je VOG verloopt binnenkort.
              Alles op zijn tijd, met overzicht en kalmte.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  borderRadius: "14px 14px 14px 5px",
                  background: C.sage,
                  color: C.panel,
                  ["--tw-ring-color" as string]: C.sage,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  borderRadius: "14px 14px 14px 5px",
                  background: C.panel,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.sage,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Bekijk herinnering
              </button>
            </div>
          </div>
          <div
            className="flex flex-col items-center gap-4 p-6 text-center"
            style={{
              background: C.panelSoft,
              borderRadius: "24px 24px 24px 8px",
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            <LeafRing pct={dek} />
            <div>
              <div className="text-[14px] font-semibold" style={{ ...headF, color: C.ink }}>
                Certificaat-dekking
              </div>
              <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4" radius="18px 18px 18px 6px">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...bodyF,
                  background: k.up ? C.okBg : C.bgAlt,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-semibold leading-none"
              style={{ ...headF, color: i === 0 ? C.sageDeep : C.ink }}
            >
              {k.value}
            </div>
            <Bars data={k.spark} accent={i === 0} />
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead kicker="Aanbevolen" title="Opdrachten voor jou" Icon={Sprout} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} radius="18px 18px 18px 6px">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-black/[0.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    borderRadius: "18px 18px 18px 6px",
                    ["--tw-ring-color" as string]: C.sage,
                  }}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center"
                    style={{ background: C.sageBg, borderRadius: "18px 18px 18px 6px" }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[18px] font-semibold leading-none"
                      style={{ ...headF, color: C.sageDeep }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...bodyF, color: C.sage }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-semibold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[13px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]"
                          style={{ ...bodyF, background: C.bgAlt, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead kicker="Herinnering" title="Zachte prioriteit" Icon={Leaf} />
          <Panel
            className="relative overflow-hidden p-5"
            radius="22px 22px 22px 8px"
            style={{ background: C.clayBg }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.warnBg, color: C.warn }}
            >
              <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> Aandacht
            </span>
            <h3
              className="mt-3 text-[19px] font-semibold leading-tight"
              style={{ ...headF, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                borderRadius: "12px 12px 12px 4px",
                background: C.clay,
                color: C.panel,
                ["--tw-ring-color" as string]: C.clay,
                ["--tw-ring-offset-color" as string]: C.clayBg,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Panel>

          <Panel className="p-5" radius="22px 22px 22px 8px">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: C.okBg, borderRadius: "16px 16px 16px 5px" }}
                aria-hidden="true"
              >
                <BadgeCheck size={22} strokeWidth={1.9} style={{ color: C.ok }} />
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
                  Opdrachtgevers zien uitsluitend geverifieerde documenten. Je vertrouwensniveau
                  staat op hoog.
                </p>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// Deterministische staafjes — bars afgeleid van mock-spark. Geen animatie/random.
function Bars({ data, accent = false }: { data: number[]; accent?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  return (
    <div className="mt-3 flex items-end gap-1" style={{ height: 24 }} aria-hidden="true">
      {data.map((d, i) => {
        const hpct = 25 + ((d - min) / span) * 75;
        return (
          <span
            key={i}
            className="flex-1 rounded-t-[3px]"
            style={{ height: `${hpct}%`, background: accent ? C.sage : C.lineStrong }}
          />
        );
      })}
    </div>
  );
}

// ── Marktplaats ─────────────
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
        <SectionHead kicker="Marktplaats" title="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3.5 py-2"
            style={{
              background: C.panel,
              borderRadius: "12px 12px 12px 4px",
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            }}
          >
            <Search size={15} style={{ color: C.sage }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              borderRadius: "12px 12px 12px 4px",
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
              ["--tw-ring-color" as string]: C.sage,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.sage }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ background: C.badBg, borderRadius: "16px 16px 16px 5px" }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...headF, color: C.ink }}>
              Niet alle opdrachten geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              Een deel van de lijst ontbreekt. Laad opnieuw om het volledige aanbod te zien.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-4" radius="18px 18px 18px 6px">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse"
                  style={{ background: C.bgAlt, borderRadius: "18px 18px 18px 6px" }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded"
                    style={{ background: C.bgAlt }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.line }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel
          className="flex flex-col items-center justify-center gap-3 p-16 text-center"
          radius="24px 24px 24px 8px"
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.sageBg, borderRadius: "22px 22px 22px 7px" }}
            aria-hidden="true"
          >
            <Sprout size={28} strokeWidth={1.8} style={{ color: C.sageDeep }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...headF, color: C.ink }}>
            Nog niets gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
            Geen opdracht gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              borderRadius: "12px 12px 12px 4px",
              background: C.sage,
              color: C.panel,
              ["--tw-ring-color" as string]: C.sage,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden" radius="20px 20px 20px 7px">
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <span
                  className="text-[11px] font-semibold tracking-[0.06em]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ ...bodyF, background: C.sageBg, color: C.sageDeep }}
                >
                  {o.match} match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[17px] font-semibold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{ ...bodyF, background: C.bgAlt, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-black/[0.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.sageDeep,
                  ["--tw-ring-color" as string]: C.sage,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
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
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          borderRadius: "12px 12px 12px 4px",
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
          ["--tw-ring-color" as string]: C.sage,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="relative overflow-hidden" radius="26px 26px 26px 9px">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...bodyF, background: C.bgAlt, color: C.inkSoft }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.14] sm:text-[34px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <LeafRing pct={opdracht.match} size={104} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4" radius="16px 16px 16px 5px">
            <span
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: C.sageBg, borderRadius: "12px 12px 12px 4px" }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.sageDeep }} />
            </span>
            <div className="mt-3 text-[16px] font-semibold" style={{ ...headF, color: C.ink }}>
              {f.v}
            </div>
            <div
              className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead kicker="Groeit" title="Waarom dit past" Icon={Check} />
          <Panel className="p-5" radius="20px 20px 20px 7px">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
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
          <SectionHead kicker="Aandacht" title="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="p-5" radius="20px 20px 20px 7px">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg }}
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
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            borderRadius: "16px 16px 16px 5px",
            background: C.sage,
            color: C.panel,
            ["--tw-ring-color" as string]: C.sage,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13.5px] font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            borderRadius: "16px 16px 16px 5px",
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.sage,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.sage }} aria-hidden="true" /> Bewaar
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
        <SectionHead kicker="Dossier" title="Verificatie & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            borderRadius: "12px 12px 12px 4px",
            background: C.sage,
            color: C.panel,
            ["--tw-ring-color" as string]: C.sage,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="relative overflow-hidden" radius="26px 26px 26px 9px">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <LeafRing pct={dek} size={104} />
          <div className="max-w-sm">
            <div className="text-[19px] font-semibold" style={{ ...headF, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              Elk geverifieerd certificaat geeft opdrachtgevers rust. Houd je dekking hoog en je
              blijft betrouwbaar zichtbaar — zonder ruis.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okBg, color: C.ok }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel
              key={c.naam}
              className="flex items-center gap-3.5 p-4"
              radius="18px 18px 18px 6px"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRadius: "16px 16px 16px 5px" }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15.5px] font-semibold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.bgAlt,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.sage,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <section className="space-y-3">
        <SectionHead kicker="Kluis" title="Documenten" Icon={FileText} />
        <Panel className="overflow-hidden" radius="20px 20px 20px 7px">
          {DOCUMENTEN.map((d, i) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                style={{ background: C.bgAlt, borderRadius: "12px 12px 12px 4px" }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={1.9} style={{ color: C.inkSoft }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold"
                  style={{ ...headF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div className="text-[11.5px]" style={{ ...bodyF, color: C.inkFaint }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusTag status={d.status} />
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead kicker="Werklijst" title="Wat nu te doen" Icon={Sprout} />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden" radius="20px 20px 20px 7px">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.clay : C.sage }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-semibold"
                    style={{
                      ...headF,
                      background: warn ? C.warnBg : C.sageBg,
                      color: warn ? C.warn : C.sageDeep,
                      borderRadius: "16px 16px 16px 5px",
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
                          ...bodyF,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Aandacht" : "Kans"}
                      </span>
                      <h3
                        className="text-[16.5px] font-semibold"
                        style={{ ...headF, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              borderRadius: "12px 12px 12px 4px",
                              background: C.clay,
                              color: C.panel,
                              ["--tw-ring-color" as string]: C.clay,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...bodyF,
                              borderRadius: "12px 12px 12px 4px",
                              background: C.panel,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                              ["--tw-ring-color" as string]: C.sage,
                              ["--tw-ring-offset-color" as string]: C.panel,
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
        <SectionHead kicker="Postbus" title="Recente gesprekken" Icon={MessageSquare} />
        <Panel className="overflow-hidden" radius="20px 20px 20px 7px">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{
                  ...headF,
                  background: C.sageBg,
                  color: C.sageDeep,
                  borderRadius: "12px 12px 12px 4px",
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...headF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.sage }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px]" style={{ ...bodyF, color: C.inkFaint }}>
                {b.tijd}
              </span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead kicker="Boekhouding" title="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            borderRadius: "12px 12px 12px 4px",
            background: C.sage,
            color: C.panel,
            ["--tw-ring-color" as string]: C.sage,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, accent: true },
          { l: "Openstaand", v: `${open}`, accent: false },
          { l: "Te factureren", v: "€ 1.350", accent: false },
        ].map((s) => (
          <Panel key={s.l} className="p-4" radius="18px 18px 18px 6px">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-3 text-[26px] font-semibold leading-none"
              style={{ ...headF, color: s.accent ? C.sageDeep : C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden" radius="20px 20px 20px 7px">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...bodyF, color: C.inkFaint }}
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
                      className="px-4 py-3 text-[13px] font-semibold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.sage }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...bodyF, color: C.panel }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold"
                  style={{ ...headF, color: C.panel }}
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
