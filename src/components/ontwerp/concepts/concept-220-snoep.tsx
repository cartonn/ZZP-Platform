"use client";

// Concept 220 — "Snoep" · kleurrijk-speels, levendig. 2026-trend: tasteful maximalism / candy-kleuren als
// vrolijk tegengif voor grijze SaaS. Snoepkleuren (roze/lila/mint/citroen) op zacht-wit, ronde vormen en
// speelse maar leesbare statuschips. Subtiele "bounce"/scale-hover en blije lege-toestanden. Onderscheidt
// zich van neubrutalisme/memphis door de zachte, ronde vrolijkheid — Gen-Z-vriendelijk, niet hard-geometrisch.
// Blijft functioneel en toegankelijk: voldoende tekstcontrast, status = label + icoon (nooit alleen kleur).
// Fonts: Bricolage Grotesque (koppen) + Plus Jakarta Sans (tekst). UI Nederlands, code Engels.
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen.

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
  Sparkles,
  Candy,
  Heart,
  MessageCircle,
  Send,
  Zap,
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

// ── Palet — snoepkleuren op zacht-wit; tekst blijft donker voor contrast. ──
const C = {
  bg: "#fff8fb", // zacht snoep-wit
  bgAlt: "#fdeef6", // roze zweem
  panel: "#ffffff", // helder paneel
  panelHi: "#fff4fa", // hover
  ink: "#2a2233", // diep pruim-inkt (leesbaar)
  inkSoft: "#6b5f78", // secundair
  inkFaint: "#9a8fab", // labels
  line: "#f4e6ef", // zachte roze rand
  lineStrong: "#ecd6e5", // sterkere rand
  roze: "#ff5da2", // hoofdaccent
  rozeDeep: "#e23e86", // dieper roze (tekst/rand)
  rozeInk: "#5a0f31", // tekst op roze
  rozeBg: "#ffe1ef", // zacht roze vlak
  lila: "#9b7bff", // lila
  lilaDeep: "#7b56f0",
  lilaBg: "#ece4ff", // zacht lila vlak
  mint: "#3fd9b0", // mint (goed)
  mintDeep: "#1f9d7c", // leesbaar mint-groen
  mintBg: "#d8f7ee",
  citroen: "#ffd54a", // citroen (aandacht)
  citroenDeep: "#a9781a", // leesbaar amber
  citroenBg: "#fff2c9",
  bad: "#f2557a", // framboos (afgewezen)
  badDeep: "#c73256",
  badBg: "#ffe0e7",
};

const headF = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.mintDeep, bg: C.mintBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.lilaDeep, bg: C.lilaBg };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.citroenDeep,
        bg: C.citroenBg,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.badDeep, bg: C.badBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={13} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Snoepige, ronde kaart — dikke radii, zachte schaduw, vrolijke rand.
function Card({
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
      className={`rounded-[28px] ${className}`}
      style={{
        background: C.panel,
        boxShadow: `0 14px 34px -24px ${C.rozeDeep}55`,
        border: `1.5px solid ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — rond snoep-icoonvlak + speelse titel.
function SectionHead({
  title,
  sub,
  Icon,
  tint = C.roze,
  tintBg = C.rozeBg,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
  tintBg?: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
        style={{ background: tintBg }}
        aria-hidden="true"
      >
        <Icon size={19} strokeWidth={2.4} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[20px] font-extrabold leading-tight" style={{ ...headF, color: C.ink }}>
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
      <Icon size={15} strokeWidth={2.2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Speelse sparkline met zachte vulling (deterministisch uit de mock-reeks).
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
      <polygon points={area} fill={color} opacity={0.14} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ronde match-snoepje — gradiënt-bol met "%".
function MatchDrop({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? { box: "h-24 w-24", num: "text-[32px]", lbl: "text-[10px]" }
      : size === "sm"
        ? { box: "h-12 w-12", num: "text-[15px]", lbl: "text-[8px]" }
        : { box: "h-16 w-16", num: "text-[21px]", lbl: "text-[9px]" };
  return (
    <span
      className={`flex ${dims.box} shrink-0 flex-col items-center justify-center rounded-full`}
      style={{
        background: `linear-gradient(140deg, ${C.roze}, ${C.lila})`,
        boxShadow: `0 10px 22px -10px ${C.rozeDeep}`,
      }}
      aria-hidden="true"
    >
      <span
        className={`${dims.num} font-extrabold tabular-nums leading-none`}
        style={{ ...headF, color: "#fff" }}
      >
        {value}
      </span>
      <span
        className={`${dims.lbl} font-bold uppercase tracking-[0.14em]`}
        style={{ ...headF, color: "#ffffffdd" }}
      >
        match
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept220() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* snoep-confetti sfeer: zachte kleurvlekken, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(680px 420px at 8% -6%, ${C.rozeBg}, transparent 60%), radial-gradient(620px 420px at 98% 2%, ${C.lilaBg}, transparent 62%), radial-gradient(560px 380px at 50% 108%, ${C.mintBg}88, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop */}
        <header
          className="sticky top-0 z-30"
          style={{ background: `${C.bg}f2`, backdropFilter: "blur(10px)" }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
                style={{
                  background: `linear-gradient(140deg, ${C.roze}, ${C.lila})`,
                  boxShadow: `0 10px 22px -8px ${C.rozeDeep}`,
                }}
                aria-hidden="true"
              >
                <Candy size={22} strokeWidth={2.4} style={{ color: "#fff" }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[20px] font-extrabold leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  Snoep
                </div>
                <div className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  Hoi {PROFIEL.naam.split(" ")[0]}, leuk je te zien
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold sm:inline-flex"
                style={{ ...bodyF, background: C.mintBg, color: C.mintDeep }}
              >
                <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-extrabold"
                style={{
                  ...headF,
                  background: `linear-gradient(140deg, ${C.citroen}, ${C.roze})`,
                  color: "#fff",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — snoep-pills */}
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
                  className="shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...headF,
                          background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
                          color: "#fff",
                          boxShadow: `0 8px 18px -8px ${C.rozeDeep}`,
                          ["--tw-ring-color" as string]: C.roze,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                      : {
                          ...headF,
                          background: C.panel,
                          color: C.inkSoft,
                          border: `1.5px solid ${C.line}`,
                          ["--tw-ring-color" as string]: C.roze,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                  }
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
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t pt-6 text-center text-[12px]"
            style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
          >
            <Candy size={13} strokeWidth={2.4} style={{ color: C.roze }} aria-hidden="true" />{" "}
            Vrolijk en helder — elke status draagt een woord én een icoon, dus niets hangt alleen
            aan kleur.
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
  const sparkColors = [C.roze, C.lila, C.mintDeep, C.citroenDeep];

  return (
    <div className="space-y-8">
      {/* Vrolijk welkomstpaneel */}
      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.rozeBg}, ${C.lilaBg})`, border: "none" }}
      >
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
              style={{ ...bodyF, background: C.panel, color: C.rozeDeep }}
            >
              <Sparkles size={14} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-5 text-[30px] font-extrabold leading-[1.06] sm:text-[42px]"
              style={{ ...headF, color: C.ink }}
            >
              Hoi {PROFIEL.naam.split(" ")[0]}!
              <br />
              <span style={{ color: C.rozeDeep }}>Drie zoete matches</span> voor je uitgekozen.
            </h1>
            <p
              className="mt-4 max-w-lg text-[15px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Je week ziet er goed uit. Eén dingetje vraagt aandacht — je VOG verloopt binnenkort —
              en de rest is lekker geregeld. Klaar om te kiezen?
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-extrabold transition-all hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
                  color: "#fff",
                  boxShadow: `0 12px 24px -10px ${C.rozeDeep}`,
                  ["--tw-ring-color" as string]: C.roze,
                  ["--tw-ring-offset-color" as string]: C.rozeBg,
                }}
              >
                Bekijk je matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-extrabold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.panel,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.roze,
                  ["--tw-ring-offset-color" as string]: C.rozeBg,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.citroenDeep }}
                  aria-hidden="true"
                />{" "}
                Regel dat ene ding
              </button>
            </div>
          </div>

          {/* Vertrouwens-ring */}
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-[24px] p-6 text-center"
            style={{ background: C.panel }}
          >
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="c220-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={C.mint} />
                    <stop offset="1" stopColor={C.lila} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke={C.line} strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#c220-ring)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(dek / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className="text-[30px] font-extrabold tabular-nums leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  {dek}%
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...headF, color: C.inkFaint }}
                >
                  dekking
                </span>
              </div>
            </div>
            <StatusChip status="VERIFIED" />
            <p className="text-[12.5px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Opdrachtgevers
              zien alleen gecontroleerde documenten.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI-snoepjes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  ...bodyF,
                  background: k.up ? C.mintBg : C.citroenBg,
                  color: k.up ? C.mintDeep : C.citroenDeep,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.roze} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Voor jou uitgezocht"
            sub="Opdrachten die lekker passen"
            Icon={Sparkles}
            tint={C.lila}
            tintBg={C.lilaBg}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-all hover:scale-[1.005] hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hov" as string]: C.panelHi, ["--tw-ring-color" as string]: C.roze }}
                >
                  <MatchDrop value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-extrabold"
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
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
                          style={{ ...bodyF, background: C.mintBg, color: C.mintDeep }}
                        >
                          <Check size={12} strokeWidth={2.8} aria-hidden="true" /> {r}
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
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead
            title="Vraagt aandacht"
            sub="Snel geregeld"
            Icon={Zap}
            tint={C.citroenDeep}
            tintBg={C.citroenBg}
          />
          <Card
            className="relative overflow-hidden"
            style={{ background: `linear-gradient(150deg, ${C.citroenBg}, ${C.panelHi})` }}
          >
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
                style={{ ...headF, background: C.citroenDeep, color: "#fff" }}
              >
                <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[18px] font-extrabold leading-tight"
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
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.ink,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.citroenDeep,
                  ["--tw-ring-offset-color" as string]: C.citroenBg,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4">
              <MessageCircle
                size={16}
                strokeWidth={2.4}
                style={{ color: C.lila }}
                aria-hidden="true"
              />
              <span className="text-[15px] font-extrabold" style={{ ...headF, color: C.ink }}>
                Berichtjes
              </span>
            </div>
            <div className="mt-2">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                    style={{ ...headF, background: C.lilaBg, color: C.lilaDeep }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13.5px] font-extrabold"
                        style={{ ...headF, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: C.roze }}
                          aria-label="Ongelezen bericht"
                        />
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-[12px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ ...bodyF, color: C.inkFaint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </Card>
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
  const metaTints = [C.roze, C.lila, C.mintDeep, C.citroenDeep] as const;

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
        <SectionHead title="Marktplaats" sub="Alle open opdrachten op een rijtje" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.panel, border: `1.5px solid ${C.line}` }}
          >
            <Search size={16} style={{ color: C.roze }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1.5px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.roze,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.roze }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[22px] p-4"
          role="alert"
          style={{ background: C.badBg, border: `1.5px solid ${C.bad}55` }}
        >
          <XCircle size={20} strokeWidth={2.4} style={{ color: C.badDeep }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold" style={{ ...headF, color: C.ink }}>
              Oeps, niet alles geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten lieten even op zich wachten. Ververs gerust om het opnieuw te
              proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.badDeep, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-16 w-16 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.rozeBg }}
                />
                <div className="flex-1 space-y-2">
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
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(140deg, ${C.rozeBg}, ${C.lilaBg})` }}
            aria-hidden="true"
          >
            <Candy size={34} strokeWidth={1.8} style={{ color: C.roze }} />
          </span>
          <p className="text-[20px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Hier nog niks te snoepen
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
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-extrabold transition-all hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
              color: "#fff",
              ["--tw-ring-color" as string]: C.roze,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ ...bodyF, background: C.bgAlt, color: C.rozeDeep }}
                >
                  {o.id}
                </span>
                <MatchDrop value={o.match} size="sm" />
              </div>
              <div className="px-5 pb-2 pt-3">
                <h3
                  className="text-[17px] font-extrabold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2.5">
                  <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                  <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                  <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                  <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t, ti) => {
                    const chips = [
                      { bg: C.rozeBg, fg: C.rozeDeep },
                      { bg: C.lilaBg, fg: C.lilaDeep },
                      { bg: C.mintBg, fg: C.mintDeep },
                    ];
                    const cc = chips[ti % chips.length] ?? { bg: C.rozeBg, fg: C.rozeDeep };
                    return (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                        style={{ ...bodyF, background: cc.bg, color: cc.fg }}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-4 text-[13px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.rozeDeep,
                  ["--tw-ring-color" as string]: C.roze,
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
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string; tintBg: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.rozeDeep, tintBg: C.rozeBg },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.lilaDeep, tintBg: C.lilaBg },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.mintDeep, tintBg: C.mintBg },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.citroenDeep, tintBg: C.citroenBg },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1.5px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.roze,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.rozeBg}, ${C.lilaBg})`, border: "none" }}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ ...bodyF, background: C.panel, color: C.rozeDeep }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-extrabold leading-[1.1] sm:text-[34px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchDrop value={opdracht.match} size="lg" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[14px]"
              style={{ background: f.tintBg }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2.2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3 text-[17px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...headF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.mintDeep} tintBg={C.mintBg} />
          <Card className="p-5">
            <ul className="space-y-3">
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
                    <Check size={13} strokeWidth={2.8} style={{ color: C.mintDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead
            title="Om te overwegen"
            Icon={TriangleAlert}
            tint={C.citroenDeep}
            tintBg={C.citroenBg}
          />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.citroenBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.6} style={{ color: C.citroenDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={16}
            strokeWidth={2.4}
            style={{ color: C.mintDeep }}
            aria-hidden="true"
          />
          <span className="text-[15px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t, ti) => {
            const chips = [
              { bg: C.rozeBg, fg: C.rozeDeep },
              { bg: C.lilaBg, fg: C.lilaDeep },
              { bg: C.mintBg, fg: C.mintDeep },
            ];
            const cc = chips[ti % chips.length] ?? { bg: C.rozeBg, fg: C.rozeDeep };
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ ...bodyF, background: cc.bg, color: cc.fg }}
              >
                <BadgeCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {t}
              </span>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-extrabold transition-all hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:scale-100"
          style={{
            ...headF,
            background: applied ? C.mintBg : `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
            color: applied ? C.mintDeep : "#fff",
            boxShadow: applied ? "none" : `0 14px 26px -12px ${C.rozeDeep}`,
            ["--tw-ring-color" as string]: C.roze,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.8} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.rozeBg : C.panel,
            color: C.ink,
            border: `1.5px solid ${saved ? C.roze : C.line}`,
            ["--tw-ring-color" as string]: C.roze,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Heart
            size={16}
            strokeWidth={2.4}
            style={{ color: C.roze }}
            fill={saved ? C.roze : "none"}
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je betrouwbaar maken"
          Icon={ShieldCheck}
          tint={C.mintDeep}
          tintBg={C.mintBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
            color: "#fff",
            ["--tw-ring-color" as string]: C.roze,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.mintBg}, ${C.lilaBg})`, border: "none" }}
      >
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="c220-verif" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={C.mint} />
                  <stop offset="1" stopColor={C.roze} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ffffff88" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#c220-verif)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(dek / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span
                className="text-[28px] font-extrabold tabular-nums leading-none"
                style={{ ...headF, color: C.ink }}
              >
                {dek}%
              </span>
            </div>
          </div>
          <div className="max-w-sm">
            <div className="text-[20px] font-extrabold" style={{ ...headF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat maakt je profiel sterker en vrolijker. Je bent al bijna
              rond — nog even en alles staat op groen.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
              style={{ ...bodyF, background: C.panel, color: C.mintDeep }}
            >
              <BadgeCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-extrabold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-3 py-1 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...headF,
                        background: C.bgAlt,
                        color: C.rozeDeep,
                        ["--tw-ring-color" as string]: C.roze,
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
            </Card>
          );
        })}
      </div>

      {/* Documenten */}
      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé bewaard"
          Icon={FileText}
          tint={C.lila}
          tintBg={C.lilaBg}
        />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgAlt }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
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
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl"
                          style={{ background: C.rozeBg }}
                          aria-hidden="true"
                        >
                          <FileText size={15} strokeWidth={2.2} style={{ color: C.rozeDeep }} />
                        </span>
                        <span
                          className="text-[13.5px] font-bold"
                          style={{ ...headF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Vandaag voor jou"
          sub="Vink lekker af, van belangrijk naar minder"
          Icon={Zap}
          tint={C.lila}
          tintBg={C.lilaBg}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.mintBg : C.citroenBg,
            color: openCount === 0 ? C.mintDeep : C.citroenDeep,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.8} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "puntje" : "puntjes"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.citroenDeep : C.lilaDeep;
          const tintBg = warn ? C.citroenBg : C.lilaBg;
          const bar = isDone ? C.mint : warn ? C.citroen : C.lila;
          return (
            <li key={a.titel}>
              <Card className="overflow-hidden" style={isDone ? { opacity: 0.72 } : undefined}>
                <div className="flex items-stretch">
                  <span className="w-1.5 shrink-0" style={{ background: bar }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-[16px] font-extrabold tabular-nums"
                      style={{
                        ...headF,
                        background: isDone ? C.mintBg : tintBg,
                        color: isDone ? C.mintDeep : tint,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={20} strokeWidth={2.8} />
                      ) : warn ? (
                        <TriangleAlert size={19} strokeWidth={2.4} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.05em]"
                          style={{ ...headF, background: tintBg, color: tint }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                          ) : (
                            <Star size={11} strokeWidth={2.6} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-extrabold ${isDone ? "line-through" : ""}`}
                          style={{ ...headF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13.5px] leading-relaxed"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...headF,
                                  background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
                                  color: "#fff",
                                  ["--tw-ring-color" as string]: C.roze,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                              : {
                                  ...headF,
                                  background: C.bgAlt,
                                  color: C.rozeDeep,
                                  ["--tw-ring-color" as string]: C.roze,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.mintDeep,
                            ["--tw-ring-color" as string]: C.mint,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.8} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(140deg, ${C.mintBg}, ${C.lilaBg})` }}
            aria-hidden="true"
          >
            <Sparkles size={28} strokeWidth={2.2} style={{ color: C.mintDeep }} />
          </span>
          <p className="text-[18px] font-extrabold" style={{ ...headF, color: C.ink }}>
            Helemaal klaar!
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. Geniet van je dag — we laten het weten zodra er iets leuks binnenkomt.
          </p>
        </Card>
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
      return { label: "Openstaand", Icon: Clock, fg: C.citroenDeep, bg: C.citroenBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Vrolijk overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.citroenDeep}
          tintBg={C.citroenBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: `linear-gradient(135deg, ${C.roze}, ${C.lila})`,
            color: "#fff",
            ["--tw-ring-color" as string]: C.roze,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.mintDeep, tintBg: C.mintBg },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.citroenDeep, tintBg: C.citroenBg },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Send, tint: C.rozeDeep, tintBg: C.rozeBg },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[14px]"
                style={{ background: s.tintBg }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.4} style={{ color: s.tint }} />
              </span>
              <div className="text-[12px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[26px] font-extrabold tabular-nums leading-none"
              style={{ ...headF, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
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
                      className="px-5 py-4 text-[13.5px] font-extrabold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-extrabold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: `linear-gradient(90deg, ${C.roze}, ${C.lila})` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[12px] font-extrabold uppercase tracking-[0.08em]"
                  style={{ ...headF, color: "#fff" }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-extrabold tabular-nums"
                  style={{ ...headF, color: "#fff" }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
