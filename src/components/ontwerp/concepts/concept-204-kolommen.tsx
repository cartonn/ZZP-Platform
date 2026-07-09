"use client";

// Concept 204 — "Kolommen" · een kanban-workflowbord als hoofdstructuur (2026-trend: het board-as-OS,
// Linear/Height). Opdrachten bewegen door een pijplijn (Verkend → Gereageerd → Gesprek → Geplaatst) en
// certificaten door een verificatie-flow (Ingediend → In beoordeling → Geverifieerd). Kaarten dragen een
// match-badge, tags en kleine avatars; kolomkoppen tonen een telling; horizontaal scrollt het bord in een
// eigen container zodat de body nooit horizontaal schuift. Rustig, strak, hoge dichtheid — geen drukte.
// Deterministisch (geen random/Date). UI Nederlands. Fonts: Space Grotesk (kop) + Inter (tekst) + mono (cijfers).

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
  Columns3,
  GripVertical,
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

// ── Palet — bord-neutraal: koele leiblauwe canvas, witte kolommen, één indigo accent per kaart-flow. ──
const C = {
  bg: "#f5f6f9",
  canvas: "#eef1f6", // bord-achtergrond tussen kolommen
  col: "#ffffff", // kolom-oppervlak
  colHead: "#f7f8fb", // kolomkop
  card: "#ffffff",
  cardHi: "#f6f8fc",
  line: "#e3e7ee",
  lineSoft: "#eef1f6",
  ink: "#141a22",
  inkSoft: "#525c6b",
  inkFaint: "#8a94a3",
  accent: "#4f46e5", // indigo
  accentHi: "#7c74f0",
  accentBg: "#ecebfb",
  onAccent: "#ffffff",
  ok: "#0f9d63",
  okBg: "#e3f6ec",
  wait: "#4f46e5",
  waitBg: "#ecebfb",
  warn: "#b8770f",
  warnBg: "#fbf1db",
  bad: "#cf4536",
  badBg: "#fbe7e4",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Status-model — vorm draagt mee (solid/outline/dashed/double) zodat kleur nooit de enige drager is. ──
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
  if (v === "outline") return { border: `1px solid ${color}` };
  return { border: `1px solid ${color}33` };
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

// Kleine avatar-initialen (deterministisch uit de opdrachtgevernaam).
function Avatar({ naam, size = 22 }: { naam: string; size?: number }) {
  const initialen = naam
    .split(" ")
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        ...mono,
        background: C.accentBg,
        color: C.accent,
        boxShadow: `inset 0 0 0 1.5px ${C.col}`,
      }}
      aria-hidden="true"
    >
      {initialen}
    </span>
  );
}

// Match-badge — compacte pil met mono-cijfer, tint schaalt met de score.
function MatchBadge({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
      style={{
        ...mono,
        background: strong ? C.okBg : C.accentBg,
        color: strong ? C.ok : C.accent,
      }}
      aria-label={`Match ${value} procent`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {value}
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
            background: i === data.length - 1 ? C.accent : C.accentBg,
          }}
        />
      ))}
    </div>
  );
}

// ── Bord-primitieven ─────────────────────────────────────────────────────────────
function Column({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex w-[280px] shrink-0 flex-col rounded-2xl"
      style={{ background: C.col, boxShadow: `inset 0 0 0 1px ${C.line}` }}
    >
      <header
        className="flex items-center justify-between gap-2 rounded-t-2xl px-3.5 py-3"
        style={{ background: C.colHead, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: accent }}
            aria-hidden="true"
          />
          <h3
            className="text-[13px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            {title}
          </h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, background: C.lineSoft, color: C.inkSoft }}
        >
          {count}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2.5 p-2.5">{children}</div>
    </section>
  );
}

function BoardScroller({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-x-auto rounded-2xl p-3"
      style={{ background: C.canvas, boxShadow: `inset 0 0 0 1px ${C.line}` }}
      tabIndex={0}
      role="group"
      aria-label="Workflowbord — horizontaal scrollbaar"
    >
      <div className="flex items-start gap-3">{children}</div>
    </div>
  );
}

// Verplaatsbare-ogende kaart voor de opdracht-pijplijn.
function OpdrachtCard({ o, onOpen }: { o: Opdracht; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group/card block w-full rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        ...bodyF,
        background: C.card,
        boxShadow: `0 1px 2px rgba(20,26,34,0.05), inset 0 0 0 1px ${C.line}`,
        ["--tw-ring-color" as string]: C.accent,
        ["--tw-ring-offset-color" as string]: C.col,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{ ...mono, color: C.inkFaint }}
        >
          {o.id}
        </span>
        <div className="flex items-center gap-1.5">
          <MatchBadge value={o.match} />
          <GripVertical size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
        </div>
      </div>
      <h4
        className="mt-1.5 text-[13.5px] font-semibold leading-snug tracking-tight"
        style={{ ...display, color: C.ink }}
      >
        {o.titel}
      </h4>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]" style={{ color: C.inkSoft }}>
        <MapPin size={11} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
        {o.plaats} · {o.tarief}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {o.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: C.lineSoft, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>
      <div
        className="mt-2.5 flex items-center justify-between border-t pt-2"
        style={{ borderColor: C.lineSoft }}
      >
        <Avatar naam={o.opdrachtgever} />
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold opacity-0 transition-opacity group-hover/card:opacity-100"
          style={{ color: C.accent }}
        >
          Open <ChevronRight size={12} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

function CredCard({ naam, detail, status }: { naam: string; detail: string; status: CredStatus }) {
  const m = credMeta(status);
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: C.card,
        boxShadow: `0 1px 2px rgba(20,26,34,0.05), inset 0 0 0 1px ${C.line}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: m.bg, ...borderFor(m.variant, m.fg) }}
          aria-hidden="true"
        >
          <m.Icon size={15} strokeWidth={2.2} style={{ color: m.fg }} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            {naam}
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: C.inkSoft }}>
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept204() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <header
        className="sticky top-0 z-20"
        style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.accent, boxShadow: `0 8px 20px -8px ${C.accent}` }}
              aria-hidden="true"
            >
              <Columns3 size={19} strokeWidth={2} style={{ color: C.onAccent }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.accent }}
              >
                Kolommen
              </div>
              <div
                className="text-[20px] font-semibold leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Werkbord
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
                boxShadow: `inset 0 0 0 1px ${C.ok}33`,
              }}
            >
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ ...mono, background: C.accent, color: C.onAccent }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2.5 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: on ? C.accentBg : "transparent",
                  color: on ? C.accent : C.inkSoft,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
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

      <footer className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
        <div
          className="flex items-center justify-center gap-2 border-t pt-5 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
        >
          <Columns3 size={12} aria-hidden="true" /> Elke kaart kent één stadium — het bord toont
          waar alles staat.
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard — de pijplijn als bord + KPI-strook ─────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-4"
            style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Columns3 size={16} style={{ color: C.accent }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Opdracht-pijplijn
            </h2>
            <span className="text-[12px]" style={{ color: C.inkFaint }}>
              sleep kaarten door de stadia
            </span>
          </div>
          <BoardScroller>
            <Column title="Verkend" count={2} accent={C.inkFaint}>
              <OpdrachtCard o={OPDRACHTEN[1]!} onOpen={onOpen} />
              <OpdrachtCard o={OPDRACHTEN[2]!} onOpen={onOpen} />
            </Column>
            <Column title="Gereageerd" count={1} accent={C.accent}>
              <OpdrachtCard o={OPDRACHTEN[0]!} onOpen={onOpen} />
            </Column>
            <Column title="Gesprek" count={0} accent={C.warn}>
              <EmptyColumn label="Nog geen gesprek" />
            </Column>
            <Column title="Geplaatst" count={0} accent={C.ok}>
              <EmptyColumn label="Nog niets geplaatst" />
            </Column>
          </BoardScroller>
        </section>

        <aside className="space-y-3">
          <div
            className="rounded-2xl p-5"
            style={{ background: C.accent, boxShadow: `0 20px 40px -22px ${C.accent}` }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, background: "rgba(255,255,255,0.18)", color: C.onAccent }}
            >
              <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[18px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.onAccent }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.onAccent,
                color: C.accent,
                ["--tw-ring-color" as string]: C.onAccent,
                ["--tw-ring-offset-color" as string]: C.accent,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
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
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-8 text-center"
      style={{ border: `1.5px dashed ${C.line}` }}
    >
      <Inbox size={20} strokeWidth={1.6} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="text-[11.5px]" style={{ color: C.inkFaint }}>
        {label}
      </span>
    </div>
  );
}

// ── Marktplaats — bord met zoek + skeleton + empty ────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          Marktplaats
        </h2>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <Search size={15} style={{ color: C.accent }} aria-hidden="true" />
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
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl p-16 text-center"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentBg }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.6} style={{ color: C.accent }} />
          </span>
          <p
            className="text-[18px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen kaart gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en het bord vult zich opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.accent,
              color: C.onAccent,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </div>
      ) : (
        <BoardScroller>
          <Column title="Nieuw" count={filtered.length} accent={C.accent}>
            {filtered.map((o) => (
              <OpdrachtCard key={o.id} o={o} onOpen={onOpen} />
            ))}
          </Column>
          <Column title="Bewaard" count={1} accent={C.warn}>
            <OpdrachtCard o={OPDRACHTEN[2]!} onOpen={onOpen} />
          </Column>
          <Column title="Verborgen" count={0} accent={C.inkFaint}>
            <EmptyColumn label="Niets verborgen" />
          </Column>
        </BoardScroller>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const stadia = ["Verkend", "Gereageerd", "Gesprek", "Geplaatst"];
  const huidig = 1;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar bord
      </button>

      <div
        className="rounded-2xl p-6"
        style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ ...mono, background: C.accentBg, color: C.accent }}
              >
                {opdracht.id}
              </span>
              <MatchBadge value={opdracht.match} />
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13.5px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <Avatar naam={opdracht.opdrachtgever} size={44} />
        </div>

        {/* Stadium-indicator — waar deze kaart op het bord staat */}
        <div className="mt-5 flex items-center gap-1.5" aria-label="Stadium op het bord">
          {stadia.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <div className="flex-1">
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{ background: i <= huidig ? C.accent : C.lineSoft }}
                />
                <span
                  className="mt-1.5 block text-[10.5px] font-semibold"
                  style={{ color: i === huidig ? C.accent : i < huidig ? C.ink : C.inkFaint }}
                >
                  {i === huidig && "▸ "}
                  {s}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <div
            key={f.l}
            className="rounded-2xl p-4"
            style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.accentBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} />
            </span>
            <div
              className="mt-2.5 text-[16px] font-semibold tabular-nums leading-none"
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          className="rounded-2xl p-5"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <h3
            className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            <Check size={15} strokeWidth={2.4} style={{ color: C.ok }} aria-hidden="true" /> Waarom
            dit past
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
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
        </section>
        <section
          className="rounded-2xl p-5"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <h3
            className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            <TriangleAlert
              size={15}
              strokeWidth={2.4}
              style={{ color: C.warn }}
              aria-hidden="true"
            />{" "}
            Om te overwegen
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
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
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.accent,
            color: C.onAccent,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Verplaats naar Gesprek <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — flow als bord (Ingediend → In beoordeling → Geverifieerd) ──────
function Verificatie() {
  const ingediend = CREDENTIALS.filter((c) => c.status === "REJECTED" || c.status === "EXPIRING");
  const beoordeling = CREDENTIALS.filter((c) => c.status === "SUBMITTED");
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="flex items-center gap-2 text-[18px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          <ShieldCheck size={18} style={{ color: C.accent }} aria-hidden="true" /> Verificatie-flow
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.accent,
            color: C.onAccent,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
        </button>
      </div>

      <BoardScroller>
        <Column title="Ingediend" count={ingediend.length} accent={C.warn}>
          {ingediend.length === 0 ? (
            <EmptyColumn label="Niets in te dienen" />
          ) : (
            ingediend.map((c) => (
              <CredCard key={c.naam} naam={c.naam} detail={c.detail} status={c.status} />
            ))
          )}
        </Column>
        <Column title="In beoordeling" count={beoordeling.length} accent={C.accent}>
          {beoordeling.length === 0 ? (
            <EmptyColumn label="Niets in beoordeling" />
          ) : (
            beoordeling.map((c) => (
              <CredCard key={c.naam} naam={c.naam} detail={c.detail} status={c.status} />
            ))
          )}
        </Column>
        <Column title="Geverifieerd" count={geverifieerd.length} accent={C.ok}>
          {geverifieerd.map((c) => (
            <CredCard key={c.naam} naam={c.naam} detail={c.detail} status={c.status} />
          ))}
        </Column>
      </BoardScroller>
    </div>
  );
}

// ── Acties (next-action) ──────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <h2 className="text-[18px] font-semibold tracking-tight" style={{ ...display, color: C.ink }}>
        Volgende beste acties
      </h2>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="flex items-stretch overflow-hidden rounded-2xl"
              style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            >
              <span
                className="w-1.5 shrink-0"
                style={{ background: warn ? C.warn : C.accent }}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: warn ? C.warnBg : C.accentBg,
                    color: warn ? C.warn : C.accent,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={18} strokeWidth={2.2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.warnBg : C.accentBg,
                        color: warn ? C.warn : C.accent,
                      }}
                    >
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-semibold tracking-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...bodyF,
                            background: C.warn,
                            color: C.onAccent,
                            ["--tw-ring-color" as string]: C.warn,
                            ["--tw-ring-offset-color" as string]: C.card,
                          }
                        : {
                            ...bodyF,
                            background: C.accentBg,
                            color: C.accent,
                            ["--tw-ring-color" as string]: C.accent,
                            ["--tw-ring-offset-color" as string]: C.card,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <h3
          className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          <FileText size={15} style={{ color: C.accent }} aria-hidden="true" /> Berichten
        </h3>
        <div
          className="rounded-2xl"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <Avatar naam={b.van} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent }}
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
        </div>
      </section>
    </div>
  );
}

// ── Facturen — kolommen per betaalstatus + tabel ──────────────────────────────────
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          Facturen
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.accent,
            color: C.onAccent,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${FACTUREN.filter((f) => f.status === "Openstaand").length}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl p-4"
            style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.colHead }}>
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
                          border: m.dashed ? `1.5px dashed ${m.fg}` : `1px solid ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.accent }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.8)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[16px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onAccent }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
