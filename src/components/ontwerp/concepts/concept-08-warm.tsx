"use client";

// Concept 08 — "Warm Onthaal": warm-human, licht. Toegankelijk en vertrouwenwekkend.
// Richting: rond documenten/verificatie hangt spanning — zachte vormen, warme tinten en
// een vriendelijke toon verlagen die spanning zonder kinderachtig te worden. Warme off-white,
// diepe groen-inkt, groen-teal accent + een tweede warme perzik/amber-tint. Grote radii,
// zachte schaduwen, humanist letterwerk (Jakarta) met één zachte serif-accent (Instrument Serif).
// Vriendelijke lege staten en bevestigingen, subtiele en doelgerichte motion (motion-reduce-veilig).
// Frontend-only, mock-data. Zelfstandige mini-app: sidebar + topbar + interne schermtabs.

import { useState } from "react";
import {
  Search,
  Bell,
  Sparkle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Heart,
  Home,
  Compass,
  BadgeCheck,
  ListTodo,
  ReceiptText,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

// --- Palet: warm, menselijk, geruststellend ---
const C = {
  bg: "#fbf7f0",
  card: "#ffffff",
  ink: "#1f2421",
  sub: "#5c655d",
  faint: "#8a948b",
  line: "#ece3d6",
  accent: "#0f9d77",
  accentDark: "#0b7a5d",
  peach: "#e08a4b",
  peachSoft: "#fdf0e3",
  mintSoft: "#e8f5ef",
  rejected: "#c0573f",
};

const sans = { fontFamily: "var(--font-lab-jakarta)" } as const;
const serif = { fontFamily: "var(--font-lab-instrument-serif)" } as const;

const shadow = "shadow-[0_4px_24px_-12px_rgba(31,36,33,0.18)]";
const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f9d77] focus-visible:ring-offset-[#fbf7f0]";

const SCREEN_ICON: Record<ScreenKey, typeof Home> = {
  dashboard: Home,
  marktplaats: Compass,
  opdracht: BadgeCheck,
  verificatie: ShieldCheck,
  documenten: BadgeCheck,
  facturen: ReceiptText,
  berichten: Bell,
  acties: ListTodo,
};

export function Concept08() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, color: C.ink, background: C.bg }}
      className="flex min-h-[640px] w-full text-[14px] antialiased [color-scheme:light]"
    >
      {/* Sidebar */}
      <aside className="hidden w-[232px] shrink-0 flex-col p-3 md:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-base font-bold text-white"
            style={{ background: C.accent }}
          >
            Z
          </span>
          <span className="text-[15px] font-bold tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const active = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(s.key)}
                style={active ? { background: C.card, color: C.ink } : { color: C.sub }}
                className={[
                  "flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-left text-[14px] font-semibold transition-all duration-200 motion-reduce:transition-none",
                  ring,
                  active ? shadow : "hover:bg-white/60",
                ].join(" ")}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: active ? C.accent : C.faint }}
                  aria-hidden
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div
          className={["mt-2 rounded-3xl p-4", shadow].join(" ")}
          style={{ background: C.mintSoft }}
        >
          <div className="flex items-center gap-2">
            <Heart
              className="h-[18px] w-[18px] shrink-0"
              style={{ color: C.accentDark }}
              aria-hidden
            />
            <span className="text-[13px] font-bold">Fijn dat je er bent</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.sub }}>
            Je profiel staat er sterk voor. Nog één klein dingetje om voor te zorgen.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            style={{ color: C.accentDark }}
            className={[
              "mt-2 inline-flex min-h-[40px] items-center gap-1 text-[13px] font-bold",
              ring,
            ].join(" ")}
          >
            Bekijk je acties
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      {/* Rechts */}
      <div className="flex min-w-0 flex-1 flex-col p-3 md:pl-0">
        <div
          className={["flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl", shadow].join(" ")}
          style={{ background: C.card }}
        >
          {/* Topbar */}
          <header
            className="flex items-center gap-3 border-b px-4 py-3 sm:px-5"
            style={{ borderColor: C.line }}
          >
            <button
              type="button"
              style={{ background: C.bg, color: C.faint }}
              className={[
                "flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-full px-4 text-left text-[14px] transition-colors hover:brightness-[0.98] motion-reduce:transition-none sm:max-w-md",
                ring,
              ].join(" ")}
            >
              <Search className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="truncate">Waar ben je naar op zoek?</span>
            </button>

            <button
              type="button"
              aria-label="Meldingen"
              style={{ background: C.bg }}
              className={[
                "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:brightness-[0.98] motion-reduce:transition-none",
                ring,
              ].join(" ")}
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden />
              <span
                className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                style={{ background: C.peach }}
                aria-hidden
              />
            </button>

            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: C.accent }}
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-[14px] font-bold">{PROFIEL.naam}</div>
                <div className="text-[12px]" style={{ color: C.faint }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </header>

          {/* Schermtabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b px-4 py-2 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Schermen"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  style={
                    active
                      ? { background: C.accent, color: "#ffffff" }
                      : { color: C.sub, background: C.bg }
                  }
                  className={[
                    "min-h-[40px] shrink-0 rounded-full px-4 text-[13px] font-bold transition-colors duration-200 motion-reduce:transition-none",
                    ring,
                    active ? "" : "hover:brightness-[0.98]",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Main */}
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6" style={{ background: C.bg }}>
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <Opdracht />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>
    </div>
  );
}

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
      className={["rounded-3xl", shadow, className].join(" ")}
      style={{ background: C.card, ...style }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <p style={serif} className="text-[26px] leading-tight">
          Goedemiddag, {PROFIEL.naam.split(" ")[0]}.
        </p>
        <p className="mt-1 text-[14px]" style={{ color: C.sub }}>
          Drie nieuwe opdrachten passen goed bij je. Neem rustig de tijd om te kijken.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-[13px] font-semibold" style={{ color: C.faint }}>
              {kpi.label}
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold tracking-tight">{kpi.value}</div>
            <div
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{
                color: kpi.up ? C.accentDark : C.peach,
                background: kpi.up ? C.mintSoft : C.peachSoft,
              }}
            >
              <span aria-hidden>{kpi.up ? "↑" : "•"}</span>
              {kpi.trend}
            </div>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-[16px] font-bold tracking-tight">Opdrachten die bij je passen</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {OPDRACHTEN.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className={[
                "flex flex-col rounded-3xl p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none",
                shadow,
                ring,
              ].join(" ")}
              style={{ background: C.card }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                  style={{ background: C.mintSoft, color: C.accentDark }}
                >
                  <Sparkle className="h-3.5 w-3.5" aria-hidden />
                  {o.match}% match
                </span>
              </div>
              <div className="mt-3 text-[15px] font-bold leading-snug">{o.titel}</div>
              <div className="mt-1 text-[13px]" style={{ color: C.sub }}>
                {o.opdrachtgever} · {o.plaats}
              </div>
              <div
                className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ color: C.accentDark }}
              >
                {o.tarief}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[16px] font-bold tracking-tight">Even dit nog</h2>
        <div className="space-y-3">
          {ACTIES.map((a) => {
            const warn = a.urgentie === "warning";
            return (
              <Card key={a.titel} className="flex items-start gap-3 p-4">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: warn ? C.peachSoft : C.mintSoft }}
                >
                  {warn ? (
                    <AlertTriangle className="h-[18px] w-[18px]" style={{ color: C.peach }} />
                  ) : (
                    <Clock className="h-[18px] w-[18px]" style={{ color: C.accentDark }} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold">{a.titel}</div>
                  <p className="mt-0.5 text-[13px] leading-snug" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [actief, setActief] = useState(0);
  const filters = ["Alles", "Beste matches", "Utrecht", "Avond"];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {filters.map((f, i) => {
          const on = i === actief;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActief(i)}
              style={
                on
                  ? { background: C.accent, color: "#ffffff" }
                  : { background: C.card, color: C.sub }
              }
              className={[
                "min-h-[40px] rounded-full px-4 text-[13px] font-bold transition-colors motion-reduce:transition-none",
                shadow,
                ring,
              ].join(" ")}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className={[
              "flex w-full flex-col gap-3 rounded-3xl p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none sm:flex-row sm:items-center",
              shadow,
              ring,
            ].join(" ")}
            style={{ background: C.card }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold">{o.titel}</div>
              <div className="mt-1 text-[13px]" style={{ color: C.sub }}>
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{ background: C.bg, color: C.sub }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-full px-3 py-1.5 text-[13px] font-bold sm:self-center"
              style={{ background: C.mintSoft, color: C.accentDark }}
            >
              <Sparkle className="h-3.5 w-3.5" aria-hidden />
              {o.match}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function Opdracht() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {o.id}
            </span>
            <h2 style={serif} className="mt-1 text-[30px] leading-tight">
              {o.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ color: C.sub }}>
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-3xl px-5 py-4"
            style={{ background: C.mintSoft }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: C.accentDark }}
            >
              Match
            </span>
            <span
              className="text-[30px] font-extrabold leading-none"
              style={{ color: C.accentDark }}
            >
              {o.match}%
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5" style={{ background: C.mintSoft }}>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: C.accentDark }} aria-hidden />
            <h3 className="text-[14px] font-bold">Waarom dit fijn past</h3>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.sub }}>
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: C.accentDark }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5" style={{ background: C.peachSoft }}>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: C.peach }} aria-hidden />
            <h3 className="text-[14px] font-bold">Goed om te weten</h3>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.sub }}>
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: C.peach }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          style={{ background: C.accent }}
          className={[
            "inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#0b7a5d] motion-reduce:transition-none",
            ring,
          ].join(" ")}
        >
          Reageer met een goed gevoel
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          style={{ background: C.card, color: C.ink }}
          className={[
            "inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 text-[14px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none",
            shadow,
            ring,
          ].join(" ")}
        >
          <Heart className="h-5 w-5" aria-hidden />
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const STATUS: Record<
  CredStatus,
  { label: string; color: string; soft: string; Icon: typeof CheckCircle2 }
> = {
  VERIFIED: { label: "Geverifieerd", color: C.accentDark, soft: C.mintSoft, Icon: CheckCircle2 },
  EXPIRING: {
    label: "Verloopt binnenkort",
    color: C.peach,
    soft: C.peachSoft,
    Icon: AlertTriangle,
  },
  SUBMITTED: { label: "In beoordeling", color: C.sub, soft: C.bg, Icon: Clock },
  REJECTED: { label: "Vraagt herstel", color: C.rejected, soft: "#f8e9e3", Icon: XCircle },
};

function StatusPill({ status }: { status: CredStatus }) {
  const s = STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
      style={{ color: s.color, background: s.soft }}
    >
      <s.Icon className="h-4 w-4" aria-hidden />
      {s.label}
    </span>
  );
}

function Verificatie() {
  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-4 p-5" style={{ background: C.mintSoft }}>
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.card }}
        >
          <ShieldCheck className="h-6 w-6" style={{ color: C.accentDark }} />
        </span>
        <div className="min-w-0">
          <div className="text-[16px] font-bold">Vertrouwensniveau: Hoog</div>
          <p className="text-[13px]" style={{ color: C.sub }}>
            Mooi werk — je documenten zijn grotendeels in orde. Opdrachtgevers vertrouwen dit.
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const s = STATUS[c.status];
          return (
            <Card key={c.naam} className="flex items-center gap-4 p-4">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: s.soft, color: s.color }}
              >
                <s.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">{c.naam}</div>
                <div className="text-[13px]" style={{ color: C.sub }}>
                  {c.detail}
                </div>
              </div>
              <div className="shrink-0">
                <StatusPill status={c.status} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div>
        <h2 style={serif} className="text-[24px] leading-tight">
          Je volgende stappen
        </h2>
        <p className="text-[13px]" style={{ color: C.sub }}>
          Klein lijstje, rustig af te werken. We helpen je op weg.
        </p>
      </div>
      <div className="space-y-3">
        {ordered.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <Card key={a.titel} className="flex items-start gap-3 p-4">
              <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: warn ? C.peachSoft : C.mintSoft }}
              >
                {warn ? (
                  <AlertTriangle className="h-[18px] w-[18px]" style={{ color: C.peach }} />
                ) : (
                  <Clock className="h-[18px] w-[18px]" style={{ color: C.accentDark }} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">{a.titel}</div>
                <p className="mt-0.5 text-[13px] leading-snug" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                style={{ background: warn ? C.peach : C.accent }}
                className={[
                  "inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-full px-4 text-[13px] font-bold text-white transition-colors hover:brightness-95 motion-reduce:transition-none",
                  ring,
                ].join(" ")}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      {/* Vriendelijke, doelgerichte lege staat als geruststelling */}
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: C.mintSoft }}
        >
          <CheckCircle2 className="h-6 w-6" style={{ color: C.accentDark }} />
        </span>
        <p className="text-[14px] font-bold">Verder ben je helemaal bij</p>
        <p className="max-w-xs text-[13px]" style={{ color: C.sub }}>
          Zodra er iets nieuws is, zie je het hier. Geen verrassingen — beloofd.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FactuurStatus({ status }: { status: string }) {
  const cfg: Record<string, { color: string; soft: string; Icon: typeof CheckCircle2 }> = {
    Betaald: { color: C.accentDark, soft: C.mintSoft, Icon: CheckCircle2 },
    Openstaand: { color: C.peach, soft: C.peachSoft, Icon: Clock },
    Concept: { color: C.sub, soft: C.bg, Icon: ReceiptText },
  };
  const c = cfg[status] ?? { color: C.sub, soft: C.bg, Icon: ReceiptText };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ color: c.color, background: c.soft }}
    >
      <c.Icon className="h-3.5 w-3.5" aria-hidden />
      {status}
    </span>
  );
}

function Facturen() {
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Overzicht van je facturen</caption>
        <thead>
          <tr className="border-b" style={{ borderColor: C.line }}>
            <th
              scope="col"
              className="px-5 py-3 text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              Nummer
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              Klant
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              Datum
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-right text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              Bedrag
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-[12px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f, i) => (
            <tr key={f.nr} className={i > 0 ? "border-t" : ""} style={{ borderColor: C.line }}>
              <td className="px-5 py-4 text-[13px] font-bold tabular-nums">{f.nr}</td>
              <td className="px-5 py-4 text-[14px]">{f.klant}</td>
              <td className="px-5 py-4 text-[13px] tabular-nums" style={{ color: C.sub }}>
                {f.datum}
              </td>
              <td className="px-5 py-4 text-right text-[14px] font-extrabold tabular-nums">
                {f.bedrag}
              </td>
              <td className="px-5 py-4">
                <FactuurStatus status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
