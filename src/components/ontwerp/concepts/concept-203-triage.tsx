"use client";

// Concept 203 — "Triage" · inbox-zero triage/queue-paradigma (Superhuman / Missive 2026). Alles is één
// doorloopbare wachtrij: nieuwe matches, reacties, verlopende certificaten, open facturen en berichten.
// Split-view — lijst links, preview/detail rechts — met snelle triage-acties (archiveren/plannen/reageren)
// en kbd-hints. Bij een lege queue verschijnt een rustige "inbox zero"-staat. Verklaarbare matching-redenen
// staan in de preview van een match. Deterministisch, UI Nederlands. Fonts: Space Grotesk + Geist + Geist Mono.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  ShieldCheck,
  Archive,
  CalendarClock,
  Reply,
  Inbox,
  Sparkles,
  MessageSquare,
  FileWarning,
  Receipt,
  MapPin,
  Coins,
  CalendarDays,
  TriangleAlert,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  OPDRACHTEN,
  CREDENTIALS,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — rustige triage-werkbank: warm-neutraal licht, één diep violet-accent ──
const C = {
  bg: "#f4f4f7",
  panel: "#ffffff",
  panelHi: "#f6f6fa",
  rail: "#fafafc",
  line: "#e6e6ee",
  lineSoft: "#eeeef4",
  ink: "#191a22",
  inkSoft: "#565a6b",
  inkFaint: "#9195a6",
  accent: "#6b4dff",
  accentDeep: "#5333eb",
  accentBg: "#efeaff",
  onAccent: "#ffffff",
  ok: "#12915a",
  okBg: "#e3f5ec",
  wait: "#2563cf",
  waitBg: "#e6eefb",
  warn: "#b26a06",
  warnBg: "#fbeed6",
  bad: "#c53434",
  badBg: "#fbe4e4",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Queue-model — heterogene items, elk met soort, prioriteit en optionele opdracht ──
type Soort = "match" | "reactie" | "certificaat" | "factuur" | "bericht";
type QItem = {
  id: string;
  soort: Soort;
  titel: string;
  subtitel: string;
  tijd: string;
  ongelezen: boolean;
  urgent?: boolean;
  op?: Opdracht;
  body: string;
};

const SOORT_META: Record<Soort, { label: string; Icon: LucideIcon; fg: string; bg: string }> = {
  match: { label: "Nieuwe match", Icon: Sparkles, fg: C.accent, bg: C.accentBg },
  reactie: { label: "Reactie", Icon: Reply, fg: C.wait, bg: C.waitBg },
  certificaat: { label: "Certificaat", Icon: FileWarning, fg: C.warn, bg: C.warnBg },
  factuur: { label: "Factuur", Icon: Receipt, fg: C.ok, bg: C.okBg },
  bericht: { label: "Bericht", Icon: MessageSquare, fg: C.inkSoft, bg: C.panelHi },
};

const OP0 = OPDRACHTEN[0]!;
const OP2 = OPDRACHTEN[2]!;
const FAC_OPEN = FACTUREN[1]!;
const BER0 = BERICHTEN[0]!;
const BER1 = BERICHTEN[1]!;

const QUEUE: QItem[] = [
  {
    id: "q1",
    soort: "match",
    titel: OP0.titel,
    subtitel: `${OP0.opdrachtgever} · ${OP0.match}% match`,
    tijd: "09:24",
    ongelezen: true,
    op: OP0,
    body: "Deze opdracht past sterk bij je profiel. Bekijk de redenen en reageer vandaag — opdrachtgevers reageren gemiddeld binnen 6 uur.",
  },
  {
    id: "q2",
    soort: "certificaat",
    titel: "VOG (zorg) verloopt over 23 dagen",
    subtitel: "Verificatie · actie vereist",
    tijd: "08:10",
    ongelezen: true,
    urgent: true,
    body: "Je Verklaring Omtrent Gedrag verloopt binnenkort. Vraag een nieuwe aan om verifieerbaar en zichtbaar te blijven voor opdrachtgevers.",
  },
  {
    id: "q3",
    soort: "reactie",
    titel: "Reactie geaccepteerd — avonddienst",
    subtitel: `${BER0.van}`,
    tijd: BER0.tijd,
    ongelezen: true,
    op: OP0,
    body: BER0.preview,
  },
  {
    id: "q4",
    soort: "factuur",
    titel: `${FAC_OPEN.nr} openstaand · ${FAC_OPEN.bedrag}`,
    subtitel: `${FAC_OPEN.klant} · 9 dagen`,
    tijd: "Gisteren",
    ongelezen: false,
    body: "Deze factuur staat 9 dagen open. Stuur een vriendelijke herinnering om de betaaltermijn te bewaken.",
  },
  {
    id: "q5",
    soort: "match",
    titel: OP2.titel,
    subtitel: `${OP2.opdrachtgever} · ${OP2.match}% match`,
    tijd: "Ma",
    ongelezen: false,
    op: OP2,
    body: "Een passende ambulante GGZ-opdracht met korte reistijd. Beoordeel de details en plan of reageer.",
  },
  {
    id: "q6",
    soort: "bericht",
    titel: BER1.van,
    subtitel: BER1.preview,
    tijd: BER1.tijd,
    ongelezen: true,
    body: BER1.preview,
  },
];

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
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

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
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: C.accentBg }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color: C.accent }} />
      </span>
      <div>
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Root ──
export function Concept203() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <header style={{ borderBottom: `1px solid ${C.line}`, background: C.rail }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.accent, color: C.onAccent }}
              aria-hidden="true"
            >
              <Inbox size={19} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.accent }}
              >
                Triage
              </div>
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Wachtrij
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
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: on ? C.accent : C.panel,
                  color: on ? C.onAccent : C.inkSoft,
                  boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.rail,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && <Triage />}
        {screen === "acties" && <Triage />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Triage — de kern: split-view queue met preview en snelle acties ──
function Triage() {
  const [items, setItems] = useState<QItem[]>(QUEUE);
  const [selId, setSelId] = useState<string>(QUEUE[0]!.id);
  const [flash, setFlash] = useState<string>("");

  const selected = items.find((i) => i.id === selId) ?? items[0];

  const triage = (id: string, verb: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const next = prev.filter((i) => i.id !== id);
      const fallback = next[Math.min(idx, next.length - 1)];
      setSelId(fallback ? fallback.id : "");
      return next;
    });
    setFlash(verb);
  };

  const openCount = items.filter((i) => i.ongelezen).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Te behandelen"
          sub={`${items.length} in wachtrij · ${openCount} ongelezen`}
          Icon={Inbox}
        />
        {flash && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
            style={{ ...bodyF, background: C.accentBg, color: C.accentDeep }}
            role="status"
          >
            <Check size={13} strokeWidth={2.6} aria-hidden="true" /> {flash}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <InboxZero onReset={() => setItems(QUEUE)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          {/* Lijst links */}
          <Panel className="overflow-hidden">
            <ul role="listbox" aria-label="Wachtrij" className="max-h-[70vh] overflow-y-auto">
              {items.map((it, i) => {
                const m = SOORT_META[it.soort];
                const on = it.id === selId;
                return (
                  <li
                    key={it.id}
                    role="option"
                    aria-selected={on}
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      onClick={() => setSelId(it.id)}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      style={{
                        background: on ? C.accentBg : "transparent",
                        ["--tw-ring-color" as string]: C.accent,
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: m.bg }}
                        aria-hidden="true"
                      >
                        <m.Icon size={15} strokeWidth={2.2} style={{ color: m.fg }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {it.ongelezen && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: C.accent }}
                              aria-label="Ongelezen"
                            />
                          )}
                          <span
                            className="truncate text-[13px] font-semibold"
                            style={{ ...bodyF, color: C.ink }}
                          >
                            {it.titel}
                          </span>
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {it.subtitel}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em]"
                            style={{ ...mono, background: m.bg, color: m.fg }}
                          >
                            {m.label}
                          </span>
                          {it.urgent && (
                            <span
                              className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase"
                              style={{ ...mono, color: C.warn }}
                            >
                              <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />{" "}
                              urgent
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-[10.5px] tabular-nums"
                        style={{ ...mono, color: C.inkFaint }}
                      >
                        {it.tijd}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Preview rechts */}
          {selected && <Preview item={selected} onTriage={triage} />}
        </div>
      )}
    </div>
  );
}

function Preview({
  item,
  onTriage,
}: {
  item: QItem;
  onTriage: (id: string, verb: string) => void;
}) {
  const m = SOORT_META[item.soort];
  return (
    <Panel className="flex flex-col overflow-hidden">
      <div
        className="flex items-start gap-3 p-5"
        style={{ borderBottom: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
          style={{ background: m.bg }}
          aria-hidden="true"
        >
          <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]"
              style={{ ...mono, background: m.bg, color: m.fg }}
            >
              {m.label}
            </span>
            {item.urgent && (
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                style={{ ...mono, background: C.warnBg, color: C.warn }}
              >
                <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" /> Urgent
              </span>
            )}
          </div>
          <h3
            className="mt-1.5 text-[18px] font-semibold leading-tight tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            {item.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            {item.subtitel} · {item.tijd}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-5">
        <p className="text-[13.5px] leading-relaxed" style={{ ...bodyF, color: C.ink }}>
          {item.body}
        </p>

        {/* Verklaarbare matching-redenen bij een match-item */}
        {item.op && item.soort === "match" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className="rounded-lg p-3.5"
              style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            >
              <div
                className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.ok }}
              >
                Waarom dit past
              </div>
              <ul className="space-y-1.5">
                {item.op.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    <Check
                      size={13}
                      strokeWidth={2.6}
                      style={{ color: C.ok }}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />{" "}
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-lg p-3.5"
              style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            >
              <div
                className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.warn }}
              >
                Om te overwegen
              </div>
              <ul className="space-y-1.5">
                {item.op.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    <TriangleAlert
                      size={13}
                      strokeWidth={2.4}
                      style={{ color: C.warn }}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />{" "}
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {item.op && (
          <dl
            className="grid grid-cols-2 gap-y-2 rounded-lg p-3.5 text-[12px]"
            style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Meta Icon={MapPin} value={item.op.plaats} />
            <Meta Icon={Coins} value={item.op.tarief} />
            <Meta Icon={Clock} value={item.op.uren} />
            <Meta Icon={CalendarDays} value={item.op.start} />
          </dl>
        )}

        {item.soort === "certificaat" && <StatusTag status="EXPIRING" />}
      </div>

      {/* Snelle triage-acties met kbd-hints */}
      <div
        className="flex flex-wrap items-center gap-2 p-4"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.rail }}
      >
        <TriageBtn onClick={() => onTriage(item.id, "Gereageerd")} primary Icon={Reply} kbd="R">
          Reageren
        </TriageBtn>
        <TriageBtn onClick={() => onTriage(item.id, "Ingepland")} Icon={CalendarClock} kbd="S">
          Plannen
        </TriageBtn>
        <TriageBtn onClick={() => onTriage(item.id, "Gearchiveerd")} Icon={Archive} kbd="E">
          Archiveren
        </TriageBtn>
      </div>
    </Panel>
  );
}

function TriageBtn({
  children,
  onClick,
  Icon,
  kbd,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  Icon: LucideIcon;
  kbd: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        ...bodyF,
        background: primary ? C.accent : C.panel,
        color: primary ? C.onAccent : C.ink,
        boxShadow: primary ? "none" : `inset 0 0 0 1px ${C.line}`,
        ["--tw-ring-color" as string]: C.accent,
        ["--tw-ring-offset-color" as string]: C.rail,
      }}
    >
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" /> {children}
      <span
        className="ml-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded px-1 py-0.5 text-[9.5px] font-bold leading-none"
        style={{
          ...mono,
          background: primary ? "rgba(255,255,255,0.22)" : C.panelHi,
          color: primary ? C.onAccent : C.inkFaint,
        }}
      >
        {kbd}
      </span>
    </button>
  );
}

function InboxZero({ onReset }: { onReset: () => void }) {
  return (
    <Panel className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: C.okBg }}
        aria-hidden="true"
      >
        <Check size={40} strokeWidth={2} style={{ color: C.ok }} />
      </span>
      <h3 className="text-[24px] font-semibold tracking-tight" style={{ ...display, color: C.ink }}>
        Inbox zero
      </h3>
      <p className="max-w-sm text-[13.5px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
        Alles behandeld. Geen openstaande matches, reacties of facturen meer in de wachtrij. Kom
        later terug of vul de queue opnieuw.
      </p>
      <button
        onClick={onReset}
        className="mt-1 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.accent,
          color: C.onAccent,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <Inbox size={14} aria-hidden="true" /> Wachtrij herstellen
      </button>
    </Panel>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Marktplaats ──
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
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Sparkles} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…"
          aria-label="Opdrachten filteren"
          className="rounded-lg px-3 py-2 text-[12.5px] outline-none placeholder:opacity-50 focus-visible:ring-2"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        />
      </div>
      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 p-12 text-center">
          <Sparkles size={26} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p className="text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets voor &ldquo;{q}&rdquo;.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col">
              <div className="flex items-center gap-3 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg"
                  style={{ background: C.accentBg }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[14px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.accent }}
                  >
                    {o.match}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.accent,
                  ["--tw-ring-color" as string]: C.accent,
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

// ── Opdracht-detail ──
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug
      </button>

      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="rounded px-2 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.accentBg, color: C.accent }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
            style={{ background: C.accentBg }}
            aria-hidden="true"
          >
            <span
              className="text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.accent }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[8px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              match
            </span>
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-semibold tabular-nums leading-none"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Waarom dit past
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  style={{ color: C.ok }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Om te overwegen
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.warn }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.accent,
          color: C.onAccent,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Verificatie ──
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <SectionHead title="Verificatie" sub="Certificaten en documenten" Icon={ShieldCheck} />
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.ink }}>
            Dekking · {verified}/{CREDENTIALS.length} geverifieerd
          </div>
          <span
            className="text-[26px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accent }}
          >
            {dek}%
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.panelHi }}
          aria-hidden="true"
        >
          <div className="h-full rounded-full" style={{ width: `${dek}%`, background: C.accent }} />
        </div>
      </Panel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}33` }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2">
                  <StatusTag status={c.status} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Facturen ──
function Facturen() {
  const factMeta = (s: string) => {
    if (s === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (s === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: Receipt, fg: C.inkSoft, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <SectionHead title="Facturen" sub="Omzet en openstaand" Icon={Receipt} />
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
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
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
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
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
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
              <tr style={{ background: C.panelHi }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...mono, color: C.accent }}
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
