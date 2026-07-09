"use client";

// Concept 212 — "Loket" · digitale overheid, vertrouwen. Rijkshuisstijl-geïnspireerd: formeel, glashelder,
// zeer toegankelijk. Diep rijksblauw + wit, strakke horizontale scheidingslijnen, formulier-achtige rust,
// duidelijke "u bent hier"-stappen en statusbalken. Vertrouwen via institutionele degelijkheid — past bij
// VOG/BIG/diploma-verificatie. Fonts: Libre Franklin (display) + Inter (body). Palet: wit, rijksblauw
// #154273, spaarzaam lint #ffb612. Status altijd label + icoon. UI Nederlands, code Engels. Deterministisch.

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
  Euro,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Landmark,
  CircleDot,
  Info,
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

// ── Palet — institutioneel wit met rijksblauw. Lint (geel) uiterst spaarzaam als attentie-accent. ──
const C = {
  bg: "#ffffff",
  bgAlt: "#f4f6f9", // zeer licht blauwgrijs vlak
  ink: "#1a1a1a",
  inkSoft: "#4b5563",
  inkFaint: "#6b7280",
  line: "#dfe4ea", // fijne scheidingslijn
  lineStrong: "#c3cad4",
  blue: "#154273", // rijksblauw
  blueDeep: "#0f3057",
  blueSoft: "#eaf0f6", // zacht blauwvlak
  lint: "#ffb612", // rijkshuisstijl-lint — uiterst spaarzaam
  // status — label + icoon dragen betekenis; achtergrond ondersteunt met AA-contrast.
  ok: "#15803d",
  okBg: "#e7f4ec",
  wait: "#1d4ed8",
  waitBg: "#e6edfb",
  warn: "#b45309",
  warnBg: "#fbf0e0",
  bad: "#b91c1c",
  badBg: "#f9e6e6",
};

const headF = { fontFamily: "var(--font-lab-franklin)" }; // Libre Franklin — koppen, formeel
const bodyF = { fontFamily: "var(--font-lab-inter)" }; // Inter — leesbaar

// ── Status-model ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

// Overheidsstatus-badge — rechthoekig, label + icoon, dunne rand in statuskleur.
function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-medium"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
    >
      <m.Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Formeel paneel — wit met dunne rand, geen schaduw-drukte; overheidsformulier-rust.
function Panel({
  children,
  className = "",
  style,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
}) {
  return (
    <div
      className={`rounded-md ${className}`}
      role={role}
      style={{ background: C.bg, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

// Sectiekop — blauwe accentbalk links + titel, formeel.
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 h-[26px] w-[3px] shrink-0 rounded-full"
        style={{ background: C.blue }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-tight" style={{ ...headF, color: C.ink }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.04em]"
        style={{ ...bodyF, color: C.inkFaint }}
      >
        <Icon size={12} strokeWidth={2} aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-0.5 truncate text-[14px] font-medium" style={{ ...bodyF, color: C.ink }}>
        {value}
      </dd>
    </div>
  );
}

// Voortgangsbalk — overheids-statusbalk met percentage.
function Progress({ value, tone = C.blue }: { value: number; tone?: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.line }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: tone }}
      />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept212() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bgAlt, color: C.ink }}
    >
      {/* Lint bovenaan — dunne rijkshuisstijl-streep */}
      <div className="h-1 w-full" style={{ background: C.lint }} aria-hidden="true" />

      {/* Kop — formele overheidsbalk */}
      <header style={{ background: C.blue }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
              style={{ background: "#ffffff1a", boxShadow: "inset 0 0 0 1px #ffffff33" }}
              aria-hidden="true"
            >
              <Landmark size={22} strokeWidth={1.8} color="#fff" />
            </span>
            <div className="leading-tight">
              <div
                className="text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ color: "#ffffffb3" }}
              >
                ZZP-Loket
              </div>
              <div className="text-[19px] font-semibold" style={{ ...headF, color: "#fff" }}>
                Mijn dossier
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[12px] font-medium sm:inline-flex"
              style={{ background: "#ffffff1f", color: "#fff" }}
            >
              <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-semibold" style={{ ...headF, color: "#fff" }}>
                {PROFIEL.naam}
              </div>
              <div className="text-[11px]" style={{ color: "#ffffffb3" }}>
                {PROFIEL.plaats}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ ...headF, background: "#fff", color: C.blue }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Navigatie — formele tabs */}
        <nav
          className="mx-auto flex max-w-6xl items-stretch gap-0 overflow-x-auto px-2 md:px-6"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 px-4 py-3 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  color: on ? "#fff" : "#ffffffb0",
                  ["--tw-ring-color" as string]: C.lint,
                }}
              >
                {s.label}
                <span
                  className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full transition-transform"
                  style={{ background: C.lint, transform: on ? "scaleX(1)" : "scaleX(0)" }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
            onVerif={() => setScreen("verificatie")}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer className="border-t" style={{ borderColor: C.line, background: C.bg }}>
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12px] md:px-8"
          style={{ color: C.inkFaint }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Info size={13} aria-hidden="true" /> Elke status draagt een label en een icoon — helder
            en toegankelijk.
          </span>
          <span>Beveiligde omgeving · documenten zijn standaard privé</span>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  // "U bent hier" — dossierstappen.
  const stappen = [
    { label: "Profiel", done: true },
    { label: "Documenten", done: true },
    { label: "Verificatie", done: false, hier: true },
    { label: "Matchen", done: false },
  ];

  return (
    <div className="space-y-8">
      {/* Welkomstpaneel */}
      <Panel className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          <div className="p-6 sm:p-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12px] font-medium"
              style={{ background: C.blueSoft, color: C.blue }}
            >
              <CircleDot size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[26px] font-semibold leading-tight sm:text-[30px]"
              style={{ ...headF, color: C.ink }}
            >
              Welkom terug, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p
              className="mt-2 max-w-lg text-[14px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Uw dossier is bijna compleet. Er is één aandachtspunt: uw VOG verloopt binnenkort.
              Verwerk dit om verifieerbaar te blijven voor opdrachtgevers.
            </p>

            {/* Stappen — "u bent hier" */}
            <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3">
              {stappen.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={
                      s.done
                        ? { background: C.okBg, color: C.ok }
                        : s.hier
                          ? { background: C.blue, color: "#fff" }
                          : {
                              background: C.bgAlt,
                              color: C.inkFaint,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                            }
                    }
                  >
                    {s.done ? (
                      <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                    ) : s.hier ? (
                      <CircleDot size={13} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <span className="text-[11px] tabular-nums">{i + 1}</span>
                    )}
                    {s.label}
                    {s.hier && (
                      <span
                        className="ml-0.5 text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: "#ffffffcc" }}
                      >
                        · u bent hier
                      </span>
                    )}
                  </span>
                  {i < stappen.length - 1 && (
                    <ChevronRight size={14} style={{ color: C.lineStrong }} aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.blue,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.blue,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-[#f4f6f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  color: C.blue,
                  boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.blue,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los aandachtspunt op
              </button>
            </div>
          </div>

          {/* Vertrouwenspaneel */}
          <div
            className="border-t p-6 sm:p-8 lg:border-l lg:border-t-0"
            style={{ borderColor: C.line, background: C.bgAlt }}
          >
            <SectionHead title="Vertrouwensniveau" sub="Certificaat-dekking van uw dossier" />
            <div className="mt-5 flex items-end justify-between">
              <span
                className="text-[44px] font-semibold tabular-nums leading-none"
                style={{ ...headF, color: C.blue }}
              >
                {dek}%
              </span>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-3">
              <Progress value={dek} />
            </div>
            <p className="mt-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
              uitsluitend geverifieerde documenten.
            </p>
            <button
              onClick={onVerif}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...headF,
                color: C.blue,
                ["--tw-ring-color" as string]: C.blue,
                ["--tw-ring-offset-color" as string]: C.bgAlt,
              }}
            >
              Naar verificatie <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div
              className="text-[12px] font-medium uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {k.label}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span
                className="text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...headF, color: C.ink }}
              >
                {k.value}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                style={
                  k.up
                    ? { background: C.okBg, color: C.ok }
                    : { background: C.bgAlt, color: C.inkSoft }
                }
              >
                {k.trend}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead title="Aanbevolen opdrachten" sub="Gerangschikt op match-percentage" />
          <Panel className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f4f6f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.blue,
                }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md"
                  style={{ background: C.blueSoft }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[18px] font-semibold tabular-nums leading-none"
                    style={{ ...headF, color: C.blue }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="text-[9px] font-medium uppercase tracking-[0.06em]"
                    style={{ color: C.blue }}
                  >
                    match
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-semibold"
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
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11.5px]"
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
            ))}
          </Panel>
        </section>

        {/* Aandachtspunt */}
        <section className="space-y-4">
          <SectionHead title="Aandachtspunt" sub="Vraagt om actie" />
          <Panel className="overflow-hidden" style={{ boxShadow: `inset 0 0 0 1px ${C.warn}44` }}>
            <div className="h-1 w-full" style={{ background: C.lint }} aria-hidden="true" />
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11.5px] font-medium"
                style={{ background: C.warnBg, color: C.warn }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Actie vereist
              </span>
              <h3
                className="mt-3 text-[16px] font-semibold leading-tight"
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
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.blue,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.blue,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
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
        <SectionHead title="Opdrachtenregister" sub="Open opdrachten die bij uw dossier passen" />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2"
            style={{ background: C.bg, boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }}
          >
            <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Verversen"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.bg,
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.bgAlt,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.blue }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <Panel
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ boxShadow: `inset 0 0 0 1px ${C.bad}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...headF, color: C.ink }}>
              Register niet volledig geladen
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de opdrachten kon niet worden opgehaald. Ververs om opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-sm px-2.5 py-1 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </Panel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-md"
                  style={{ background: C.bgAlt }}
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
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.blueSoft }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.8} style={{ color: C.blue }} />
          </span>
          <p className="text-[18px] font-semibold" style={{ ...headF, color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen resultaat voor &ldquo;{q}&rdquo;. Pas uw zoekterm aan om het register opnieuw te
            doorzoeken.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-md px-4 py-2.5 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.blue,
              color: "#fff",
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 border-b px-4 py-3"
                style={{ borderColor: C.line, background: C.bgAlt }}
              >
                <span
                  className="text-[11.5px] font-medium uppercase tracking-[0.06em]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                  style={{ ...headF, background: C.blueSoft, color: C.blue }}
                >
                  {o.match}% match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[16px] font-semibold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <Meta Icon={MapPin} label="Plaats" value={o.plaats} />
                  <Meta Icon={Euro} label="Tarief" value={o.tarief} />
                  <Meta Icon={Clock} label="Omvang" value={o.uren} />
                  <Meta Icon={CalendarDays} label="Start" value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm px-2 py-0.5 text-[11px]"
                      style={{
                        ...bodyF,
                        background: C.bgAlt,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 border-t py-3 text-[13px] font-semibold transition-colors hover:bg-[#f4f6f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderColor: C.line,
                  color: C.blue,
                  ["--tw-ring-color" as string]: C.blue,
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

// ── Opdracht-detail ────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Euro },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          color: C.blue,
          boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
          ["--tw-ring-color" as string]: C.blue,
          ["--tw-ring-offset-color" as string]: C.bgAlt,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar register
      </button>

      <Panel className="overflow-hidden">
        <div className="h-1 w-full" style={{ background: C.blue }} aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="text-[12px] font-medium uppercase tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {opdracht.id} · start {opdracht.start}
            </span>
            <h1
              className="mt-2 max-w-2xl text-[24px] font-semibold leading-tight sm:text-[30px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div
              className="flex h-24 w-24 flex-col items-center justify-center rounded-lg"
              style={{ background: C.blueSoft, boxShadow: `inset 0 0 0 1px ${C.blue}22` }}
              aria-hidden="true"
            >
              <span
                className="text-[34px] font-semibold tabular-nums leading-none"
                style={{ ...headF, color: C.blue }}
              >
                {opdracht.match}
              </span>
              <span
                className="text-[10px] font-medium uppercase tracking-[0.06em]"
                style={{ color: C.blue }}
              >
                match %
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <dt
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              <f.Icon size={12} strokeWidth={2} aria-hidden="true" /> {f.l}
            </dt>
            <dd
              className="mt-1.5 text-[18px] font-semibold tabular-nums"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </dd>
          </Panel>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
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
          <SectionHead title="Om te overwegen" />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[14px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.blue,
            color: "#fff",
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.bgAlt,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            color: C.blue,
            boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.bgAlt,
          }}
        >
          <Star size={15} strokeWidth={2} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatiedossier" sub="Certificaten en documenten" />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.blue,
            color: "#fff",
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.bgAlt,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Panel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div
              className="text-[13px] font-medium uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              Vertrouwensniveau
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className="text-[40px] font-semibold tabular-nums leading-none"
                style={{ ...headF, color: C.blue }}
              >
                {dek}%
              </span>
              <span className="text-[15px] font-medium" style={{ ...bodyF, color: C.inkSoft }}>
                {verified} van {CREDENTIALS.length} geverifieerd
              </span>
            </div>
          </div>
          <StatusTag status="VERIFIED" />
        </div>
        <div className="mt-4">
          <Progress value={dek} />
        </div>
        <p
          className="mt-3 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ ...bodyF, color: C.inkSoft }}
        >
          Elk geverifieerd certificaat verhoogt uw vertrouwensniveau. Opdrachtgevers zien
          uitsluitend documenten die door onze verificatie zijn goedgekeurd. Uw documenten blijven
          standaard privé.
        </p>
      </Panel>

      <Panel className="overflow-hidden">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center gap-4 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
              </div>
              <StatusTag status={c.status} />
              {actionable && (
                <button
                  className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...headF,
                    color: C.blue,
                    boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                    ["--tw-ring-color" as string]: C.blue,
                    ["--tw-ring-offset-color" as string]: C.bg,
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
          );
        })}
      </Panel>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Uw werklijst"
        sub="Op urgentie gerangschikt — begin met het bovenste item"
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel
                className="flex items-stretch overflow-hidden"
                style={warn ? { boxShadow: `inset 0 0 0 1px ${C.warn}44` } : undefined}
              >
                <span
                  className="w-1 shrink-0"
                  style={{ background: warn ? C.lint : C.blue }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold tabular-nums"
                    style={
                      warn
                        ? { background: C.warnBg, color: C.warn }
                        : { background: C.blueSoft, color: C.blue }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={18} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium"
                        style={
                          warn
                            ? { background: C.warnBg, color: C.warn }
                            : { background: C.waitBg, color: C.wait }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3 className="text-[16px] font-semibold" style={{ ...headF, color: C.ink }}>
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...headF,
                              background: C.blue,
                              color: "#fff",
                              ["--tw-ring-color" as string]: C.blue,
                              ["--tw-ring-offset-color" as string]: C.bg,
                            }
                          : {
                              ...headF,
                              color: C.blue,
                              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                              ["--tw-ring-color" as string]: C.blue,
                              ["--tw-ring-offset-color" as string]: C.bg,
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
        <SectionHead title="Berichten" sub="Recente correspondentie" />
        <Panel className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ ...headF, background: C.blueSoft, color: C.blue }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold"
                    style={{ ...headF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: C.blueSoft, color: C.blue }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[12px] tabular-nums"
                style={{ ...bodyF, color: C.inkFaint }}
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

// ── Facturen ────────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkFaint, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturenoverzicht" sub="Omzet en openstaande posten" />
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.blue,
            color: "#fff",
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.bgAlt,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Ontvangen (mnd)", v: betaald, accent: true },
          { l: "Openstaande facturen", v: String(open), accent: false },
          { l: "Te factureren", v: "€ 1.350", accent: false },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div
              className="text-[12px] font-medium uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums leading-none"
              style={{ ...headF, color: s.accent ? C.blue : C.ink }}
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
              <tr className="border-b" style={{ borderColor: C.line, background: C.bgAlt }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
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
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f4f6f9]"
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-medium"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}22`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.blue }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.06em]"
                  style={{ ...bodyF, color: "#ffffffcc" }}
                >
                  Totaal ontvangen
                </td>
                <td
                  className="px-4 py-3 text-right text-[16px] font-semibold tabular-nums"
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
