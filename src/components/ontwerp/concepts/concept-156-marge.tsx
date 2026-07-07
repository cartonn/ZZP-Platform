"use client";

// Concept 156 — "Marge" · editorial minimalisme met dramatische witruimte & groot type ("slow UI").
// Enorme marges, één ding per keer centraal, grote display-typografie (Fraunces), rustige luxe.
// Bijna monochroom papier-palet + één subtiel klei-accent, veel lucht — elk scherm ademt. Geen
// gradient-kalmte maar TYPOGRAFIE-gedreven editorial ruimte. Status nooit kleur-alleen: altijd
// label + icoon. Deterministisch — geen random/Date. Fonts: Fraunces (display) + Franklin (tekst).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — bijna monochroom papier + één subtiel klei-accent ────────────────────
const C = {
  paper: "#faf8f4", // warm papier
  paperDeep: "#f2efe8", // subtiel dieper vlak
  ink: "#1c1a16", // bijna-zwart, warm
  inkSoft: "#57534a", // gedempte tekst
  inkFaint: "#8f897d", // heel licht
  line: "#e4e0d7", // haarlijn
  lineSoft: "#eeeae2",
  accent: "#9c5a3c", // klei / terracotta, gedempt
  accentSoft: "#f0e5dd",
  green: "#5c6f52", // olijf (geverifieerd)
  greenSoft: "#e8ece2",
  amber: "#a07a2e", // oker (verloopt)
  amberSoft: "#f2ebd9",
  red: "#8f4a3f", // gedempt rood (afgewezen)
  redSoft: "#f0e2de",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyFont = { fontFamily: "var(--font-lab-franklin)" };

// ── Status-model — nooit kleur-alleen (icoon + label + subtiele tint) ────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
      style={{ ...bodyFont, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Kolofon-label: kleine, gespatieerde bovenkop (editorial rubriek).
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...bodyFont, color: C.inkFaint }}
    >
      {children}
    </div>
  );
}

// Dunne scheidingslijn — de enige "chrome" die dit concept toestaat.
function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`h-px w-full ${className}`} style={{ background: C.line }} aria-hidden="true" />
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept156() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const idx = SCREENS.findIndex((s) => s.key === screen);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyFont, background: C.paper, color: C.ink }}
    >
      {/* Kop — luchtig, editorial masthead */}
      <header className="mx-auto max-w-5xl px-6 pt-10 md:px-10 md:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-[19px] font-semibold tracking-[-0.01em]" style={display}>
              Marge
            </span>
            <span className="text-[12px]" style={{ color: C.inkFaint }}>
              {PROFIEL.rol}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="hidden items-center gap-1.5 text-[12px] font-medium sm:inline-flex"
              style={{ color: C.green }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ background: C.paperDeep, color: C.ink, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
      </header>

      {/* Scherm-switcher — tekstueel, onderstreept (inhoudsopgave-gevoel) */}
      <nav className="mx-auto mt-8 max-w-5xl overflow-x-auto px-6 md:px-10" aria-label="Schermen">
        <div
          className="flex items-center gap-7 pb-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative shrink-0 pb-3 text-[13px] font-medium transition-colors focus-visible:outline-none"
                style={{ color: on ? C.ink : C.inkFaint }}
              >
                <span className="mr-1.5 text-[11px] tabular-nums" style={{ color: C.inkFaint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
                <span
                  className="absolute -bottom-[13px] left-0 h-[2px] transition-all duration-500"
                  style={{ width: on ? "100%" : "0%", background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
        {/* Paginanummer — editorial folio */}
        <div className="mb-10 flex items-center justify-between">
          <Kicker>
            {String(idx + 1).padStart(2, "0")} — {SCREENS[idx]?.label}
          </Kicker>
          <span className="text-[11px] tabular-nums" style={{ color: C.inkFaint }}>
            {String(idx + 1).padStart(2, "0")} / {String(SCREENS.length).padStart(2, "0")}
          </span>
        </div>

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

      <footer className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        <Rule />
        <div
          className="mt-4 flex items-center justify-between text-[11px]"
          style={{ color: C.inkFaint }}
        >
          <span>ZZP · {PROFIEL.naam}</span>
          <span style={display}>Marge</span>
        </div>
      </footer>
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
    <div className="space-y-24">
      {/* Openingsstatement — één groot ding centraal */}
      <section>
        <Kicker>Vandaag</Kicker>
        <h1
          className="mt-6 max-w-3xl text-[40px] font-light leading-[1.08] tracking-[-0.02em] sm:text-[56px]"
          style={display}
        >
          Drie matches boven vijfentachtig procent.{" "}
          <span style={{ color: C.accent, fontStyle: "italic" }}>De omzet stijgt.</span>
        </h1>
        <p className="mt-8 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
          Eén taak vraagt je aandacht — je VOG verloopt binnenkort. Handel het rustig af en blijf
          verifieerbaar.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.ink,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Bekijk matches <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            onClick={onActies}
            className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: C.ink,
              border: `1px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.paper,
            }}
          >
            Los actie op
          </button>
        </div>
      </section>

      {/* Cijfers — royaal gespatieerd, grote getallen */}
      <section>
        <Kicker>In cijfers</Kicker>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label}>
              <div
                className="text-[38px] font-light leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[12px]" style={{ color: C.inkSoft }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium"
                  style={{ color: k.up ? C.green : C.amber }}
                >
                  <ArrowUpRight size={11} className={k.up ? "" : "rotate-90"} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matches — als editorial lijst met veel lucht */}
      <section>
        <div className="flex items-baseline justify-between">
          <Kicker>Aanbevolen</Kicker>
          <button
            onClick={onOpen}
            className="text-[12px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
            style={{ color: C.accent }}
          >
            Alles bekijken →
          </button>
        </div>
        <div className="mt-6">
          {OPDRACHTEN.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group block w-full py-8 text-left transition-colors focus-visible:outline-none"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <h3
                    className="text-[24px] font-normal leading-tight tracking-[-0.01em] transition-colors group-hover:text-[#9c5a3c] sm:text-[28px]"
                    style={display}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 text-[12px]"
                        style={{ color: C.inkFaint }}
                      >
                        <Check
                          size={12}
                          strokeWidth={2.4}
                          style={{ color: C.green }}
                          aria-hidden="true"
                        />{" "}
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className="text-[34px] font-light tabular-nums leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="mt-1 text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: C.inkFaint }}
                  >
                    match
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Vertrouwen + prioriteit — twee rustige kolommen */}
      <section className="grid grid-cols-1 gap-16 md:grid-cols-2">
        <div>
          <Kicker>Vertrouwen</Kicker>
          <div className="mt-6 flex items-baseline gap-3">
            <span
              className="text-[64px] font-light leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}
            </span>
            <span className="text-[22px] font-light" style={{ ...display, color: C.inkFaint }}>
              %
            </span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Certificaatdekking · {verified} van {CREDENTIALS.length} geverifieerd. Opdrachtgevers
            zien alleen geverifieerde certificaten.
          </p>
          <div className="mt-5">
            <StatusTag status="VERIFIED" />
          </div>
        </div>
        <div>
          <Kicker>Prioriteit</Kicker>
          <h3 className="mt-6 text-[24px] font-normal leading-tight" style={display}>
            {warn.titel}
          </h3>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {warn.detail}
          </p>
          <button
            onClick={onActies}
            className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
            style={{ color: C.accent }}
          >
            {warn.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
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
    <div className="space-y-12">
      <section>
        <Kicker>Marktplaats</Kicker>
        <h1
          className="mt-6 max-w-2xl text-[40px] font-light leading-[1.05] tracking-[-0.02em] sm:text-[52px]"
          style={display}
        >
          Open opdrachten
        </h1>
        <div
          className="mt-8 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 12 }}
        >
          <Search size={18} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[16px] outline-none placeholder:opacity-50"
            style={{ color: C.ink }}
          />
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <span className="text-[13px] uppercase tracking-[0.2em]" style={{ color: C.inkFaint }}>
            Niets gevonden
          </span>
          <p className="max-w-md text-[26px] font-light leading-snug" style={display}>
            Geen opdracht komt overeen met “{q}”.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
            style={{ color: C.accent }}
          >
            Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </section>
      ) : (
        <section>
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group block w-full py-10 text-left transition-colors focus-visible:outline-none"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 max-w-xl">
                  <div
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: C.inkFaint }}
                  >
                    {o.id}
                  </div>
                  <h3
                    className="mt-2 text-[26px] font-normal leading-tight tracking-[-0.01em] transition-colors group-hover:text-[#9c5a3c] sm:text-[32px]"
                    style={display}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                  <dl
                    className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                </div>
                <div className="flex shrink-0 items-baseline gap-3">
                  <span
                    className="text-[40px] font-light tabular-nums leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-[0.15em]"
                    style={{ color: C.inkFaint }}
                  >
                    match
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} strokeWidth={2} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span>{value}</span>
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
    <div className="space-y-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
        style={{ color: C.inkSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Titelblok — groot, luchtig */}
      <section>
        <Kicker>{opdracht.id}</Kicker>
        <h1
          className="mt-6 max-w-3xl text-[42px] font-light leading-[1.06] tracking-[-0.02em] sm:text-[58px]"
          style={display}
        >
          {opdracht.titel}
        </h1>
        <div className="mt-6 flex flex-wrap items-baseline gap-4">
          <p className="text-[16px]" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <span className="flex items-baseline gap-2">
            <span
              className="text-[28px] font-light tabular-nums leading-none"
              style={{ ...display, color: C.accent }}
            >
              {opdracht.match}%
            </span>
            <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: C.inkFaint }}>
              match
            </span>
          </span>
        </div>
      </section>

      {/* Feiten — royale definitielijst */}
      <section>
        <Rule />
        <dl className="grid grid-cols-2 gap-y-10 py-10 md:grid-cols-4">
          {feiten.map((f) => (
            <div key={f.l}>
              <dt
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]"
                style={{ color: C.inkFaint }}
              >
                <f.Icon size={12} strokeWidth={2} aria-hidden="true" /> {f.l}
              </dt>
              <dd
                className="mt-3 text-[22px] font-light leading-none"
                style={{ ...display, color: C.ink }}
              >
                {f.v}
              </dd>
            </div>
          ))}
        </dl>
        <Rule />
      </section>

      {/* Redenen — twee kolommen prozaïsch */}
      <section className="grid grid-cols-1 gap-14 md:grid-cols-2">
        <div>
          <Kicker>Waarom dit past</Kicker>
          <ul className="mt-6 space-y-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[16px] leading-relaxed"
                style={{ color: C.ink }}
              >
                <Check
                  size={17}
                  strokeWidth={2.2}
                  className="mt-1 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Kicker>Om te overwegen</Kicker>
          <ul className="mt-6 space-y-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[16px] leading-relaxed"
                style={{ color: C.ink }}
              >
                <AlertTriangle
                  size={16}
                  strokeWidth={2.2}
                  className="mt-1 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row">
        <button
          className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-[14px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.ink,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: C.ink,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.paper,
          }}
        >
          Bewaar
        </button>
      </section>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-16">
      <section>
        <Kicker>Verificatie</Kicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h1
            className="max-w-xl text-[40px] font-light leading-[1.06] tracking-[-0.02em] sm:text-[52px]"
            style={display}
          >
            Certificaten &amp; diploma&apos;s
          </h1>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[56px] font-light leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}
            </span>
            <span className="text-[20px] font-light" style={{ ...display, color: C.inkFaint }}>
              % gedekt
            </span>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          {verified} van {CREDENTIALS.length} geverifieerd. Opdrachtgevers zien alleen geverifieerde
          certificaten — hogere dekking betekent meer vertrouwen.
        </p>
      </section>

      <section>
        <Rule />
        {CREDENTIALS.map((c) => {
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center justify-between gap-6 py-8"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="min-w-0">
                <h3
                  className="text-[22px] font-normal leading-tight tracking-[-0.01em]"
                  style={display}
                >
                  {c.naam}
                </h3>
                <p className="mt-1.5 text-[13px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusTag status={c.status} />
                {actionable && (
                  <button
                    className="text-[13px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
                    style={{ color: C.accent }}
                  >
                    {c.status === "EXPIRING"
                      ? "Vernieuwen →"
                      : c.status === "REJECTED"
                        ? "Opnieuw indienen →"
                        : "Bekijk →"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-14">
      <section>
        <Kicker>Volgende beste acties</Kicker>
        <h1
          className="mt-6 max-w-2xl text-[40px] font-light leading-[1.06] tracking-[-0.02em] sm:text-[52px]"
          style={display}
        >
          Eén ding tegelijk.
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — begin bovenaan en werk rustig naar beneden.
        </p>
      </section>

      <section>
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-6 py-10"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="text-[44px] font-light tabular-nums leading-none"
                style={{ ...display, color: C.inkFaint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: warn ? C.accent : C.inkFaint }}
                >
                  {warn ? (
                    <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Kans"}
                </span>
                <h3
                  className="mt-3 text-[26px] font-normal leading-tight tracking-[-0.01em]"
                  style={display}
                >
                  {a.titel}
                </h3>
                <p
                  className="mt-2 max-w-xl text-[15px] leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:opacity-70 focus-visible:underline focus-visible:outline-none"
                  style={{ color: warn ? C.accent : C.ink }}
                >
                  {a.cta} <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  type FStatus = { label: string; Icon: LucideIcon; fg: string };
  const factMeta = (status: string): FStatus => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.green };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.amber };
    return { label: "Concept", Icon: AlertTriangle, fg: C.inkFaint };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-14">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker>Facturen</Kicker>
          <h1
            className="mt-6 text-[40px] font-light leading-[1.06] tracking-[-0.02em] sm:text-[52px]"
            style={display}
          >
            Omzet &amp; open posten
          </h1>
        </div>
        <div className="flex items-baseline gap-8">
          <div>
            <div
              className="text-[32px] font-light tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {betaald}
            </div>
            <div
              className="mt-2 text-[12px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint }}
            >
              Betaald deze maand
            </div>
          </div>
          <div>
            <div
              className="text-[32px] font-light tabular-nums leading-none"
              style={{ ...display, color: C.accent }}
            >
              {open}
            </div>
            <div
              className="mt-2 text-[12px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint }}
            >
              Openstaand
            </div>
          </div>
        </div>
      </section>

      <section>
        <Rule />
        {FACTUREN.map((f) => {
          const m = factMeta(f.status);
          return (
            <div
              key={f.nr}
              className="flex flex-wrap items-center justify-between gap-6 py-7"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="min-w-0">
                <div className="text-[18px] font-normal tracking-[-0.01em]" style={display}>
                  {f.nr}
                </div>
                <div className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
                  {f.klant} · {f.datum}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                  style={{ color: m.fg }}
                >
                  <m.Icon size={13} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[20px] font-light tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
