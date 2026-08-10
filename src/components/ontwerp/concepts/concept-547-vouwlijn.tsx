"use client";

// Concept 547 — "Vouwlijn" · progressive disclosure / outline-OS. Alles is een inklapbare outline;
// complexiteit onthult zich pas op verzoek. Boom-navigatie, geneste accordions en expand-on-demand
// geven hoge informatiedichtheid zonder rommel, omdat alles standaard gevouwen is. 2026-trends:
// outliner-first interfaces, keyboard-vriendelijke disclosure, dichte "command-surface" met inspringgidsen
// en spring-loaded detail. Deterministisch — geen random/Date.
// Fonts: Geist Mono (structuur/labels) + Geist (body-UI).

import { useMemo, useState } from "react";
import {
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  ListTree,
  Coins,
  MapPin,
  CalendarDays,
  Hash,
  Dot,
  ArrowRight,
  RefreshCw,
  Unplug,
  ChevronsDownUp,
  ChevronsUpDown,
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

// ── Palet — outliner/IDE: helder wit, leigrijze inkt, indigo-accent, gutter-tint ──────
const C = {
  bg: "#f7f8fa",
  panel: "#ffffff",
  gutter: "#f2f3f6",
  ink: "#1a1d24",
  inkSoft: "#5a6070",
  inkFaint: "#9aa0b0",
  line: "#e6e8ee",
  lineStrong: "#d3d7e0",
  guide: "#e0e3ea", // inspringgidsen
  accent: "#4f5bd5", // indigo
  accentSoft: "#eceefb",
  accentDeep: "#3a45b0",
  ok: "#2f855a",
  warn: "#b7791f",
  bad: "#c0392b",
  info: "#2b6cb0",
};

const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const ui = { fontFamily: "var(--font-lab-geist)" };

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.info };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad };
  }
}

function StatusChip({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] font-semibold ${small ? "px-1.5 py-0.5 text-[10.5px]" : "px-2 py-0.5 text-[11px]"}`}
      style={{ background: `${m.tone}14`, color: m.tone, border: `1px solid ${m.tone}33`, ...mono }}
    >
      <m.Icon size={small ? 11 : 12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kernprimitief: een inklapbare outline-tak ────────────────────────────────────────
function Fold({
  id,
  label,
  meta,
  Icon,
  depth = 0,
  defaultOpen = false,
  right,
  children,
}: {
  id: string;
  label: React.ReactNode;
  meta?: string;
  Icon?: LucideIcon;
  depth?: number;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `fold-panel-${id}`;
  const btnId = `fold-btn-${id}`;
  return (
    <div
      style={{
        borderLeft: depth > 0 ? `1px solid ${C.guide}` : undefined,
        marginLeft: depth > 0 ? 10 : 0,
      }}
    >
      <h3 className="m-0">
        <button
          id={btnId}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left transition-colors hover:bg-[#f2f3f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ outlineColor: C.accent }}
        >
          <ChevronRight
            size={14}
            strokeWidth={2.4}
            className="shrink-0 transition-transform"
            style={{ color: C.inkFaint, transform: open ? "rotate(90deg)" : "none" }}
            aria-hidden="true"
          />
          {Icon && (
            <Icon size={14} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
          )}
          <span
            className="min-w-0 flex-1 truncate text-[13.5px] font-semibold"
            style={{ color: C.ink }}
          >
            {label}
          </span>
          {meta && (
            <span
              className="shrink-0 text-[11px] tabular-nums"
              style={{ ...mono, color: C.inkFaint }}
            >
              {meta}
            </span>
          )}
          {right}
        </button>
      </h3>
      {open && (
        <div id={panelId} role="region" aria-labelledby={btnId} className="vl-reveal pb-1 pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0"
      style={{ borderColor: C.line }}
    >
      <span
        className="text-[11.5px] uppercase tracking-[0.06em]"
        style={{ ...mono, color: C.inkFaint }}
      >
        {k}
      </span>
      <span className="text-[13px] font-medium tabular-nums" style={{ color: C.ink }}>
        {v}
      </span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[10px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </section>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept547() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0]!;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes vlReveal { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .vl-reveal { animation: vlReveal 200ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .vl-reveal { animation: none !important; } }
      `}</style>

      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{
          background: "rgba(247,248,250,0.92)",
          borderBottom: `1px solid ${C.lineStrong}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}33` }}
            aria-hidden="true"
          >
            <ListTree size={18} strokeWidth={2} style={{ color: C.accent }} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Vouwlijn</div>
            <div className="text-[10px]" style={{ ...mono, color: C.inkFaint }}>
              outline · alles gevouwen, klap uit wat telt
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
          >
            <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[12px] font-bold"
            style={{ background: C.accent, color: "#fff", ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, idx) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[6px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                color: on ? "#fff" : C.inkSoft,
                background: on ? C.accent : "transparent",
                outlineColor: C.accent,
              }}
            >
              <span
                className="mr-1.5 text-[10px] tabular-nums"
                style={{ ...mono, color: on ? "rgba(255,255,255,0.7)" : C.inkFaint }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-6">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onQueue={() => setScreen("verificatie")}
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
    </div>
  );
}

// ── Dashboard — één grote outline ────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Overzicht</h1>
          <p className="text-[12.5px]" style={{ ...mono, color: C.inkFaint }}>
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>

      <Card className="p-2">
        <Fold
          id="dash-kpi"
          label="Kerncijfers"
          Icon={Hash}
          meta={`${KPIS.length} items`}
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2 py-2 sm:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-[8px] px-3 py-3"
                style={{ background: C.gutter, border: `1px solid ${C.line}` }}
              >
                <div className="text-[11px]" style={{ color: C.inkFaint }}>
                  {k.label}
                </div>
                <div
                  className="mt-1 text-[20px] font-semibold tabular-nums leading-none"
                  style={mono}
                >
                  {k.value}
                </div>
                <div
                  className="mt-1.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </div>
              </div>
            ))}
          </div>
        </Fold>

        <Fold
          id="dash-matches"
          label="Beste matches"
          Icon={ListTree}
          meta={`${OPDRACHTEN.length} open`}
          defaultOpen
        >
          <div className="space-y-1 py-1">
            {OPDRACHTEN.map((o) => (
              <Fold
                key={o.id}
                id={`dash-m-${o.id}`}
                depth={1}
                label={o.titel}
                meta={`${o.match}%`}
                Icon={MapPin}
              >
                <div className="space-y-2 py-2">
                  <div className="grid grid-cols-2 gap-x-4">
                    <KV k="Opdrachtgever" v={o.opdrachtgever} />
                    <KV k="Plaats" v={o.plaats} />
                    <KV k="Tarief" v={o.tarief} />
                    <KV k="Omvang" v={o.uren} />
                  </div>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ background: C.accent, outlineColor: C.accent }}
                  >
                    Volledig openen <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Fold>
            ))}
          </div>
        </Fold>

        <Fold
          id="dash-acties"
          label="Acties die aandacht vragen"
          Icon={AlertTriangle}
          meta={`${ACTIES.length} open`}
          defaultOpen
        >
          <div className="space-y-1 py-1">
            {ACTIES.map((a, i) => {
              const tone = a.urgentie === "warning" ? C.warn : C.info;
              return (
                <div
                  key={a.titel}
                  className="flex items-start gap-2 rounded-[8px] px-2 py-2"
                  style={{ background: i === 0 ? `${C.warn}0d` : "transparent" }}
                >
                  <Dot
                    size={18}
                    strokeWidth={4}
                    className="mt-0.5 shrink-0"
                    style={{ color: tone }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{a.titel}</div>
                    <div className="text-[12px]" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </div>
                  </div>
                  <button
                    onClick={onQueue}
                    className="shrink-0 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{
                      background: C.accentSoft,
                      color: C.accentDeep,
                      outlineColor: C.accent,
                    }}
                  >
                    {a.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </Fold>

        <Fold
          id="dash-verif"
          label="Verificatiestatus"
          Icon={ShieldCheck}
          meta={`${verified}/${CREDENTIALS.length}`}
        >
          <div className="space-y-1 py-2">
            {CREDENTIALS.map((c) => (
              <div key={c.naam} className="flex items-center justify-between gap-2 py-1">
                <span className="truncate text-[12.5px]">{c.naam}</span>
                <StatusChip status={c.status} small />
              </div>
            ))}
          </div>
        </Fold>
      </Card>
    </div>
  );
}

// ── Marktplaats — elke opdracht een uitklapbare tak; met loading/empty/error ──────────
type Laadstatus = "gereed" | "laden" | "fout";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [laad, setLaad] = useState<Laadstatus>("gereed");
  const [allOpen, setAllOpen] = useState(false);
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter((o) => {
        const t = q.toLowerCase();
        return (
          !t ||
          o.titel.toLowerCase().includes(t) ||
          o.plaats.toLowerCase().includes(t) ||
          o.opdrachtgever.toLowerCase().includes(t)
        );
      }),
    [q],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Marktplaats</h1>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[8px] px-3 py-2"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="filter…"
              aria-label="Opdrachten filteren"
              className="w-36 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...mono, color: C.ink }}
            />
          </div>
          <button
            onClick={() => setAllOpen((v) => !v)}
            aria-pressed={allOpen}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              background: C.panel,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              outlineColor: C.accent,
            }}
          >
            {allOpen ? (
              <ChevronsDownUp size={14} aria-hidden="true" />
            ) : (
              <ChevronsUpDown size={14} aria-hidden="true" />
            )}
            {allOpen ? "Alles vouwen" : "Alles uitklappen"}
          </button>
        </div>
      </div>

      {/* Demo-status-schakelaar */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Weergavestatus">
        {(["gereed", "laden", "fout"] as Laadstatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setLaad(s)}
            aria-pressed={laad === s}
            className="rounded-[6px] px-3 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              ...mono,
              background: laad === s ? C.ink : C.panel,
              color: laad === s ? "#fff" : C.inkSoft,
              border: `1px solid ${laad === s ? C.ink : C.line}`,
              outlineColor: C.accent,
            }}
          >
            {s === "gereed" ? "gereed" : s === "laden" ? "laden" : "fout"}
          </button>
        ))}
      </div>

      {laad === "laden" ? (
        <Card className="p-2">
          <div
            className="flex items-center gap-2 px-2 py-3 text-[12.5px]"
            style={{ color: C.inkFaint }}
            aria-busy="true"
            aria-live="polite"
          >
            <RefreshCw size={14} className="vl-spin" aria-hidden="true" /> Outline opbouwen…
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2.5">
              <ChevronRight size={14} style={{ color: C.line }} aria-hidden="true" />
              <div
                className="h-3.5 rounded"
                style={{ width: `${60 - i * 12}%`, background: C.line }}
              />
            </div>
          ))}
          <style>{`@keyframes vlSpin { to { transform: rotate(360deg); } } .vl-spin { animation: vlSpin 1s linear infinite; } @media (prefers-reduced-motion: reduce) { .vl-spin { animation: none !important; } }`}</style>
        </Card>
      ) : laad === "fout" ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: `${C.bad}12`, color: C.bad }}
            aria-hidden="true"
          >
            <Unplug size={24} />
          </span>
          <p className="text-[14px] font-semibold">Kon opdrachten niet laden</p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
            De verbinding werd onderbroken. Probeer de outline opnieuw op te bouwen.
          </p>
          <button
            onClick={() => setLaad("gereed")}
            className="mt-1 inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.accent, outlineColor: C.accent }}
          >
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw laden
          </button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: C.gutter, color: C.inkFaint }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="text-[14px] font-semibold">Geen takken gevonden</p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
            Geen resultaat voor “{q}”. Pas je filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[8px] px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.accent, outlineColor: C.accent }}
          >
            Filter wissen
          </button>
        </Card>
      ) : (
        <Card className="p-2">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {filtered.length} opdracht{filtered.length === 1 ? "" : "en"}
            </span>
            <span className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
              klap uit voor details
            </span>
          </div>
          <div className="space-y-1">
            {filtered.map((o) => (
              <Fold
                key={o.id}
                id={`mkt-${o.id}-${allOpen ? "o" : "c"}`}
                label={o.titel}
                Icon={MapPin}
                defaultOpen={allOpen}
                right={
                  <span
                    className="ml-2 shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
                  >
                    {o.match}%
                  </span>
                }
              >
                <div className="space-y-3 py-2">
                  <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
                    <KV k="Tarief" v={o.tarief} />
                    <KV k="Omvang" v={o.uren} />
                    <KV k="Start" v={o.start} />
                    <KV k="Plaats" v={o.plaats} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-[5px] px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          ...mono,
                          background: C.gutter,
                          color: C.inkSoft,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Fold
                    id={`mkt-why-${o.id}`}
                    depth={1}
                    label="Waarom deze match"
                    Icon={Check}
                    meta={`${o.redenen.plus.length}+ / ${o.redenen.min.length}−`}
                  >
                    <div className="space-y-1.5 py-2">
                      {o.redenen.plus.map((r) => (
                        <div
                          key={r}
                          className="flex items-start gap-2 text-[12.5px]"
                          style={{ color: C.inkSoft }}
                        >
                          <Check
                            size={13}
                            strokeWidth={2.6}
                            className="mt-0.5 shrink-0"
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </div>
                      ))}
                      {o.redenen.min.map((r) => (
                        <div
                          key={r}
                          className="flex items-start gap-2 text-[12.5px]"
                          style={{ color: C.inkSoft }}
                        >
                          <AlertTriangle
                            size={13}
                            strokeWidth={2.6}
                            className="mt-0.5 shrink-0"
                            style={{ color: C.warn }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </div>
                      ))}
                    </div>
                  </Fold>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ background: C.accent, outlineColor: C.accent }}
                  >
                    Detailscherm openen <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Fold>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Opdracht-detail — geneste outline ────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ ...mono, color: C.inkSoft, outlineColor: C.accent }}
      >
        <ChevronRight size={14} className="rotate-180" aria-hidden="true" /> terug
      </button>

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {opdracht.id}
            </span>
            <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.01em] sm:text-[25px]">
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="rounded-[8px] px-3 py-2 text-[22px] font-bold tabular-nums"
            style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
          >
            {opdracht.match}%
          </span>
        </div>
      </Card>

      <Card className="p-2">
        <Fold id="det-feiten" label="Kernfeiten" Icon={Hash} defaultOpen>
          <div className="grid grid-cols-1 gap-x-6 py-2 sm:grid-cols-2">
            <KV k="Tarief" v={opdracht.tarief} />
            <KV k="Omvang" v={opdracht.uren} />
            <KV k="Startdatum" v={opdracht.start} />
            <KV k="Plaats" v={opdracht.plaats} />
          </div>
        </Fold>

        <Fold
          id="det-plus"
          label="Waarom passend"
          Icon={Check}
          meta={`${opdracht.redenen.plus.length}`}
          defaultOpen
        >
          <ul className="space-y-2 py-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={14}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ok }}
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Fold>

        <Fold
          id="det-min"
          label="Aandachtspunten"
          Icon={AlertTriangle}
          meta={`${opdracht.redenen.min.length}`}
        >
          <ul className="space-y-2 py-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Fold>

        <Fold id="det-tags" label="Kenmerken" Icon={ListTree} meta={`${opdracht.tags.length}`}>
          <div className="flex flex-wrap gap-1.5 py-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[5px] px-2 py-0.5 text-[11.5px] font-medium"
                style={{
                  ...mono,
                  background: C.gutter,
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Fold>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] px-6 py-3 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accent, outlineColor: C.accent }}
        >
          Reageren op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            background: C.panel,
            color: C.ink,
            border: `1px solid ${C.lineStrong}`,
            outlineColor: C.accent,
          }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — elk certificaat een uitklapbare tak ────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[19px] font-semibold tracking-[-0.01em]">
          Verificatie &amp; certificaten
        </h1>
        <span
          className="rounded-[6px] px-2.5 py-1 text-[12px] font-bold tabular-nums"
          style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
        >
          {pct}% geverifieerd
        </span>
      </div>
      <Card className="p-2">
        {CREDENTIALS.map((c) => {
          const actionable = c.status !== "VERIFIED";
          return (
            <Fold
              key={c.naam}
              id={`ver-${c.naam}`}
              label={c.naam}
              Icon={ShieldCheck}
              right={
                <span className="ml-2 shrink-0">
                  <StatusChip status={c.status} small />
                </span>
              }
            >
              <div className="space-y-3 py-2">
                <KV k="Status" v={credMeta(c.status).label} />
                <KV k="Detail" v={c.detail} />
                <button
                  disabled={!actionable}
                  className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: actionable ? C.accent : C.gutter,
                    color: actionable ? "#fff" : C.inkFaint,
                    border: `1px solid ${actionable ? C.accent : C.line}`,
                    outlineColor: C.accent,
                  }}
                >
                  {actionable ? "Behandelen" : "Afgehandeld"}
                </button>
              </div>
            </Fold>
          );
        })}
      </Card>
    </div>
  );
}

// ── Acties — genummerde outline op prioriteit ────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Volgende beste acties</h1>
      <Card className="p-2">
        {sorted.map((a, i) => {
          const tone = a.urgentie === "warning" ? C.warn : C.info;
          return (
            <Fold
              key={a.titel}
              id={`act-${i}`}
              label={a.titel}
              defaultOpen={i === 0}
              right={
                <span
                  className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                  style={{
                    ...mono,
                    background: `${tone}16`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                  }}
                >
                  {a.urgentie === "warning" ? "urgent" : "kans"}
                </span>
              }
            >
              <div className="space-y-3 py-2">
                <p className="text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
                <button
                  className="inline-flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ background: C.accent, outlineColor: C.accent }}
                >
                  {a.cta} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Fold>
          );
        })}
      </Card>
    </div>
  );
}

// ── Facturen — samenvatting + uitklapbare regels ─────────────────────────────────────
function Facturen() {
  const tone = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.inkFaint;
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="space-y-4">
      <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Facturen</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", t: C.ok },
          { l: "Openstaand", v: `${open}`, t: C.warn },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            t: C.inkFaint,
          },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <div
              className="text-[11px] uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-1 text-[21px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.t }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-2">
        {FACTUREN.map((f) => (
          <Fold
            key={f.nr}
            id={`fac-${f.nr}`}
            label={f.klant}
            meta={f.bedrag}
            Icon={Coins}
            right={
              <span
                className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  ...mono,
                  background: `${tone(f.status)}16`,
                  color: tone(f.status),
                  border: `1px solid ${tone(f.status)}33`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tone(f.status) }}
                  aria-hidden="true"
                />
                {f.status}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-x-6 py-2 sm:grid-cols-4">
              <KV k="Nummer" v={f.nr} />
              <KV k="Bedrag" v={f.bedrag} />
              <KV k="Status" v={f.status} />
              <KV k="Datum" v={f.datum} />
            </div>
            <div className="flex items-center gap-2 py-1">
              <button
                className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: C.accentSoft, color: C.accentDeep, outlineColor: C.accent }}
              >
                <CalendarDays size={13} aria-hidden="true" /> Openen
              </button>
            </div>
          </Fold>
        ))}
      </Card>
    </div>
  );
}
