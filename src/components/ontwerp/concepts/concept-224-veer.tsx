"use client";

// Concept 224 — "Veer" · ultralicht & luchtig, spring-motion. Heel veel witruimte, zwevende kaarten met
// zachte diffuse schaduw, dunne haarlijnen en een luchtig pastel-accent. Micro-interacties gebruiken een
// spring-easing (overshoot) zodat elementen licht "opliften" bij hover/focus — gevoel van gewichtloosheid
// en rust. Onderscheidt zich van compacte SaaS-concepten door de royale lucht en de veerkrachtige beweging.
// Status = label + icoon (nooit alleen kleur), WCAG-AA-contrast. Fonts: Manrope (koppen) + Inter (tekst).
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen. UI Nederlands, code Engels.

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
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Feather,
  Wind,
  Sparkles,
  Send,
  Bookmark,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — bijna-wit met luchtige pastels; tekst blijft diep leesbaar. ──
const C = {
  bg: "#fbfcfe", // koel bijna-wit
  bgTint: "#f5f7fc", // zweem lucht
  panel: "#ffffff",
  panelHi: "#fafbff",
  ink: "#1d2433", // diep leisteen
  inkSoft: "#5a647a", // secundair
  inkFaint: "#9aa3b8", // labels
  line: "#eef1f7", // haarlijn
  lineSoft: "#f4f6fb",
  sky: "#7c93f5", // hoofd-pastelaccent (lucht)
  skyDeep: "#4f68e0", // leesbaar accent
  skyBg: "#eef1fe", // zacht vlak
  mint: "#63d6b4",
  mintDeep: "#1f9d7c", // leesbaar groen
  mintBg: "#e4f7f1",
  amber: "#f4c14e",
  amberDeep: "#a9781a", // leesbaar amber
  amberBg: "#fdf3d9",
  rose: "#f38aa4",
  roseDeep: "#c73256", // leesbaar rood
  roseBg: "#fde8ee",
  lila: "#b39bf0",
  lilaDeep: "#7b56f0",
  lilaBg: "#f0eafe",
};

const headF = { fontFamily: "var(--font-lab-manrope)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
// Veerkrachtige spring-easing (lichte overshoot) — signatuur van dit concept.
const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ── Status-model — vorm + icoon + label; nooit alleen kleur. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.mintDeep, bg: C.mintBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.skyDeep, bg: C.skyBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.amberDeep, bg: C.amberBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.roseDeep, bg: C.roseBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Zwevende kaart — dunne haarlijn, zachte diffuse schaduw, veerkrachtige lift bij hover.
function Float({
  children,
  className = "",
  style,
  lift = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  lift?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] ${lift ? "hover:-translate-y-1" : ""} ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 24px 48px -32px rgba(29,36,51,0.28), 0 2px 6px -3px rgba(29,36,51,0.06)",
        transition: `transform 420ms ${spring}, box-shadow 420ms ${spring}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  sub,
  Icon,
  tint = C.sky,
  tintBg = C.skyBg,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
  tintBg?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: tintBg }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-extrabold leading-tight tracking-tight"
          style={{ ...headF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value, tint }: { Icon: LucideIcon; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={15} strokeWidth={2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Luchtige sparkline — dunne lijn met zachte vulling.
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 22 - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,28 ${line} 100,28`;
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polygon points={area} fill={color} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Match-ring — dunne open ring met percentage, luchtig.
function MatchRing({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 92 : size === "sm" ? 46 : 64;
  const r = dim / 2 - 6;
  const circ = 2 * Math.PI * r;
  const num = size === "lg" ? "text-[26px]" : size === "sm" ? "text-[13px]" : "text-[18px]";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" aria-hidden="true">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={C.line} strokeWidth="4" />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={C.sky}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className={`${num} font-extrabold tabular-nums`} style={{ ...headF, color: C.ink }}>
          {value}
        </span>
        {size !== "sm" && (
          <span
            className="text-[8px] font-bold uppercase tracking-[0.16em]"
            style={{ ...headF, color: C.inkFaint }}
          >
            match
          </span>
        )}
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept224() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* luchtige sfeer: heel zachte pastelvlekken hoog in beeld */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(720px 420px at 12% -8%, ${C.skyBg}, transparent 62%), radial-gradient(680px 400px at 92% -4%, ${C.lilaBg}, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header
          className="sticky top-0 z-30"
          style={{ background: `${C.bg}e6`, backdropFilter: "blur(14px)" }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-10">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  boxShadow: "0 12px 24px -16px rgba(79,104,224,0.7)",
                }}
                aria-hidden="true"
              >
                <Feather size={20} strokeWidth={2} style={{ color: C.skyDeep }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[19px] font-extrabold tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  Veer
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  Licht en overzichtelijk, {PROFIEL.naam.split(" ")[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: C.mintBg, color: C.mintDeep }}
              >
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{
                  ...headF,
                  background: C.skyBg,
                  color: C.skyDeep,
                  border: `1px solid ${C.line}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          <nav
            className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-10"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...headF,
                    background: on ? C.ink : C.panel,
                    color: on ? "#fff" : C.inkSoft,
                    border: `1px solid ${on ? C.ink : C.line}`,
                    transition: `transform 320ms ${spring}, background 200ms`,
                    ["--tw-ring-color" as string]: C.sky,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-12">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-14 md:px-10">
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t pt-8 text-center text-[12px]"
            style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
          >
            <Wind size={13} strokeWidth={2} style={{ color: C.sky }} aria-hidden="true" /> Ruimte om
            te ademen — elke status draagt een woord én een icoon, dus niets hangt alleen aan kleur.
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
  const sparkColors = [C.sky, C.lila, C.mintDeep, C.amberDeep];

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Float lift style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.skyBg})` }}>
          <div className="p-7 sm:p-10">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
              style={{
                ...bodyF,
                background: C.panel,
                color: C.skyDeep,
                border: `1px solid ${C.line}`,
              }}
            >
              <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-6 text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[40px]"
              style={{ ...headF, color: C.ink }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
              <br />
              <span style={{ color: C.skyDeep }}>Drie matches</span> zweven klaar.
            </h1>
            <p
              className="mt-4 max-w-md text-[15px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Rustige week. Eén ding vraagt aandacht — je VOG verloopt binnenkort — de rest staat
              netjes op groen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.ink,
                  color: "#fff",
                  transition: `transform 380ms ${spring}`,
                  ["--tw-ring-color" as string]: C.sky,
                  ["--tw-ring-offset-color" as string]: C.skyBg,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.panel,
                  color: C.ink,
                  border: `1px solid ${C.line}`,
                  transition: `transform 380ms ${spring}`,
                  ["--tw-ring-color" as string]: C.sky,
                  ["--tw-ring-offset-color" as string]: C.skyBg,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.amberDeep }}
                  aria-hidden="true"
                />{" "}
                Regel je VOG
              </button>
            </div>
          </div>
        </Float>

        <Float lift>
          <div className="flex flex-col items-center justify-center gap-4 p-7 text-center">
            <MatchRing value={dek} size="lg" />
            <StatusChip status="VERIFIED" />
            <p className="text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn gecontroleerd. Opdrachtgevers
              zien alleen geverifieerde documenten.
            </p>
          </div>
        </Float>
      </section>

      <section className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Float key={k.label} lift className="p-6">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: k.up ? C.mintBg : C.amberBg,
                  color: k.up ? C.mintDeep : C.amberDeep,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-4 text-[26px] font-extrabold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-4">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.sky} />
            </div>
          </Float>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-5">
          <SectionHead
            title="Voor jou geselecteerd"
            sub="Opdrachten die passen"
            Icon={Sparkles}
            tint={C.lila}
            tintBg={C.lilaBg}
          />
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Float key={o.id} lift className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-5 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.sky }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-extrabold tracking-tight"
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
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                          style={{ ...bodyF, background: C.mintBg, color: C.mintDeep }}
                        >
                          <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Float>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHead
            title="Vraagt aandacht"
            sub="Snel geregeld"
            Icon={Wind}
            tint={C.amberDeep}
            tintBg={C.amberBg}
          />
          <Float lift style={{ background: `linear-gradient(160deg, ${C.amberBg}, ${C.panel})` }}>
            <div className="p-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...headF, background: C.amberDeep, color: "#fff" }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3.5 text-[18px] font-extrabold leading-tight tracking-tight"
                style={{ ...headF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.ink,
                  color: "#fff",
                  transition: `transform 360ms ${spring}`,
                  ["--tw-ring-color" as string]: C.amberDeep,
                  ["--tw-ring-offset-color" as string]: C.amberBg,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Float>

          <Float className="p-6">
            <div className="flex items-center gap-2">
              <BadgeCheck
                size={16}
                strokeWidth={2}
                style={{ color: C.mintDeep }}
                aria-hidden="true"
              />
              <span
                className="text-[14px] font-extrabold tracking-tight"
                style={{ ...headF, color: C.ink }}
              >
                Vertrouwensniveau
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Je profiel staat op{" "}
              <strong style={{ color: C.mintDeep }}>{PROFIEL.trust.toLowerCase()}</strong>. Dat
              betekent voorrang bij nieuwe matches en snellere reacties van opdrachtgevers.
            </p>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.line }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${dek}%`, background: C.mint }}
              />
            </div>
          </Float>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const metaTints = [C.sky, C.lila, C.mintDeep, C.amberDeep] as const;

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
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHead
          title="Marktplaats"
          sub="Alle open opdrachten, luchtig gerangschikt"
          Icon={Search}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={16} style={{ color: C.sky }} aria-hidden="true" />
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
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.sky,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.sky }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[20px] p-4"
          role="alert"
          style={{ background: C.roseBg, border: `1px solid ${C.rose}55` }}
        >
          <XCircle size={20} strokeWidth={2.2} style={{ color: C.roseDeep }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold" style={{ ...headF, color: C.ink }}>
              Niet alles kon laden
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten lieten op zich wachten. Ververs gerust om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.roseDeep, ["--tw-ring-color" as string]: C.rose }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Float key={i} className="p-6">
              <div className="flex items-center gap-4">
                <span
                  className="h-16 w-16 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.skyBg }}
                />
                <div className="flex-1 space-y-2.5">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-full"
                    style={{ background: C.lilaBg }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-full"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                <span
                  className="block h-3 w-full animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
            </Float>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Float className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(150deg, ${C.skyBg}, ${C.lilaBg})` }}
            aria-hidden="true"
          >
            <Feather size={34} strokeWidth={1.6} style={{ color: C.sky }} />
          </span>
          <p
            className="text-[20px] font-extrabold tracking-tight"
            style={{ ...headF, color: C.ink }}
          >
            Niets gevonden
          </p>
          <p
            className="max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het veld, dan
            staan alle opdrachten er weer.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.ink,
              color: "#fff",
              transition: `transform 360ms ${spring}`,
              ["--tw-ring-color" as string]: C.sky,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Float>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Float key={o.id} lift className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-6 pt-6">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                  style={{ ...bodyF, background: C.bgTint, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <MatchRing value={o.match} size="sm" />
              </div>
              <div className="px-6 pb-3 pt-3">
                <h3
                  className="text-[17px] font-extrabold leading-tight tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-y-3">
                  <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                  <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                  <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                  <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                      style={{ ...bodyF, background: C.skyBg, color: C.skyDeep }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-6 py-4 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.skyDeep,
                  ["--tw-ring-color" as string]: C.sky,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Float>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string; tintBg: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.skyDeep, tintBg: C.skyBg },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.lilaDeep, tintBg: C.lilaBg },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.mintDeep, tintBg: C.mintBg },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.amberDeep, tintBg: C.amberBg },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1px solid ${C.line}`,
          transition: `transform 320ms ${spring}`,
          ["--tw-ring-color" as string]: C.sky,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Float style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.skyBg})` }}>
        <div className="flex flex-wrap items-center justify-between gap-6 p-7 sm:p-9">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: C.panel,
                  color: C.skyDeep,
                  border: `1px solid ${C.line}`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[26px] font-extrabold leading-[1.1] tracking-tight sm:text-[34px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size="lg" />
        </div>
      </Float>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Float key={f.l} lift className="p-6">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: f.tintBg }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3.5 text-[17px] font-extrabold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...headF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Float>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.mintDeep} tintBg={C.mintBg} />
          <Float className="p-6">
            <ul className="space-y-4">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.mintBg }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.6} style={{ color: C.mintDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Float>
        </section>
        <section className="space-y-4">
          <SectionHead
            title="Om te overwegen"
            Icon={TriangleAlert}
            tint={C.amberDeep}
            tintBg={C.amberBg}
          />
          <Float className="p-6">
            <ul className="space-y-4">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.4} style={{ color: C.amberDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Float>
        </section>
      </div>

      <Float className="p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2} style={{ color: C.mintDeep }} aria-hidden="true" />
          <span
            className="text-[15px] font-extrabold tracking-tight"
            style={{ ...headF, color: C.ink }}
          >
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{ ...bodyF, background: C.skyBg, color: C.skyDeep }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </Float>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...headF,
            background: applied ? C.mintBg : C.ink,
            color: applied ? C.mintDeep : "#fff",
            transition: `transform 380ms ${spring}`,
            ["--tw-ring-color" as string]: C.sky,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.skyBg : C.panel,
            color: C.ink,
            border: `1px solid ${saved ? C.sky : C.line}`,
            transition: `transform 300ms ${spring}`,
            ["--tw-ring-color" as string]: C.sky,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark
            size={16}
            strokeWidth={2.2}
            style={{ color: C.skyDeep }}
            fill={saved ? C.sky : "none"}
            aria-hidden="true"
          />
          {saved ? "Bewaard" : "Bewaar"}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je betrouwbaar maken"
          Icon={ShieldCheck}
          tint={C.mintDeep}
          tintBg={C.mintBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.ink,
            color: "#fff",
            transition: `transform 340ms ${spring}`,
            ["--tw-ring-color" as string]: C.sky,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Float style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.mintBg})` }}>
        <div className="flex flex-wrap items-center gap-7 p-7 sm:p-9">
          <MatchRing value={dek} size="lg" />
          <div className="max-w-sm">
            <div
              className="text-[20px] font-extrabold tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-2 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat maakt je profiel sterker. Je bent bijna rond — nog even
              en alles staat op groen.
            </p>
            <span
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...bodyF,
                background: C.panel,
                color: C.mintDeep,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Float>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Float key={c.naam} lift className="flex items-center gap-4 p-6">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-extrabold tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...headF,
                        background: C.bgTint,
                        color: C.skyDeep,
                        ["--tw-ring-color" as string]: C.sky,
                        ["--tw-ring-offset-color" as string]: C.panel,
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
              </div>
            </Float>
          );
        })}
      </div>

      <section className="space-y-4">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé bewaard"
          Icon={FileText}
          tint={C.lila}
          tintBg={C.lilaBg}
        />
        <Float className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgTint }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...headF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: C.skyBg }}
                          aria-hidden="true"
                        >
                          <FileText size={15} strokeWidth={2} style={{ color: C.skyDeep }} />
                        </span>
                        <span
                          className="text-[13.5px] font-semibold"
                          style={{ ...headF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-6 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-6 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Float>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHead
          title="Vandaag voor jou"
          sub="Van belangrijk naar minder — vink af"
          Icon={Wind}
          tint={C.lila}
          tintBg={C.lilaBg}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.mintBg : C.amberBg,
            color: openCount === 0 ? C.mintDeep : C.amberDeep,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>{openCount} open</>
          )}
        </span>
      </div>

      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.amberDeep : C.lilaDeep;
          const tintBg = warn ? C.amberBg : C.lilaBg;
          return (
            <li key={a.titel}>
              <Float lift className="overflow-hidden" style={isDone ? { opacity: 0.7 } : undefined}>
                <div className="flex items-start gap-4 p-6">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold tabular-nums"
                    style={{
                      ...headF,
                      background: isDone ? C.mintBg : tintBg,
                      color: isDone ? C.mintDeep : tint,
                    }}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <Check size={20} strokeWidth={2.6} />
                    ) : warn ? (
                      <TriangleAlert size={19} strokeWidth={2.2} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]"
                        style={{ ...headF, background: tintBg, color: tint }}
                      >
                        {warn ? (
                          <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Sparkles size={11} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Aandacht" : "Kans"}
                      </span>
                      <h3
                        className={`text-[16px] font-extrabold tracking-tight ${isDone ? "line-through" : ""}`}
                        style={{ ...headF, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-2 text-[13.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...headF,
                          background: warn ? C.ink : C.bgTint,
                          color: warn ? "#fff" : C.skyDeep,
                          transition: `transform 340ms ${spring}`,
                          ["--tw-ring-color" as string]: C.sky,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...headF,
                          background: "transparent",
                          color: isDone ? C.inkFaint : C.mintDeep,
                          ["--tw-ring-color" as string]: C.mint,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        <Check size={14} strokeWidth={2.6} aria-hidden="true" />{" "}
                        {isDone ? "Ongedaan maken" : "Klaar"}
                      </button>
                    </div>
                  </div>
                </div>
              </Float>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Float className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(150deg, ${C.mintBg}, ${C.lilaBg})` }}
            aria-hidden="true"
          >
            <Feather size={28} strokeWidth={2} style={{ color: C.mintDeep }} />
          </span>
          <p
            className="text-[18px] font-extrabold tracking-tight"
            style={{ ...headF, color: C.ink }}
          >
            Helemaal klaar
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Float>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.mintDeep, bg: C.mintBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amberDeep, bg: C.amberBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgTint };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHead
          title="Je facturen"
          sub="Luchtig overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.amberDeep}
          tintBg={C.amberBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.ink,
            color: "#fff",
            transition: `transform 340ms ${spring}`,
            ["--tw-ring-color" as string]: C.sky,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.mintDeep, tintBg: C.mintBg },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.amberDeep, tintBg: C.amberBg },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Send, tint: C.skyDeep, tintBg: C.skyBg },
        ].map((s) => (
          <Float key={s.l} lift className="p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: s.tintBg }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.2} style={{ color: s.tint }} />
              </span>
              <div className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-4 text-[26px] font-extrabold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {s.v}
            </div>
          </Float>
        ))}
      </div>

      <Float className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.bgTint }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-6 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...headF, color: C.inkFaint }}
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
                      className="px-6 py-4 text-[13.5px] font-extrabold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-6 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-6 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-right text-[15px] font-extrabold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.bgTint }}>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...headF, color: C.inkSoft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-6 py-4 text-right text-[17px] font-extrabold tabular-nums"
                  style={{ ...headF, color: C.mintDeep }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Float>
    </div>
  );
}
