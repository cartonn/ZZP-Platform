"use client";

// Concept 336 — "Kinfolk" · fotografisch redactioneel, warm magazine met full-bleed vlakken.
// Kinfolk/Cereal-rust: grote redactionele serif-koppen, royale marges, hairline-regels en bijschrift-
// typografie. Full-bleed "foto"-blokken zijn zachte duotoon-kleurvlakken/gradients — plaatsvervangende
// beelden, geen echte fotobestanden. Warm, editorial en vertrouwenwekkend; verificatie en matching worden
// als redactionele rubrieken gepresenteerd, altijd helder en verklaarbaar. Alles uit mock.ts.
// Fonts: --font-lab-fraunces (redactionele koppen) + --font-lab-franklin (tekst) + --font-lab-mono (bijschriften/labels).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
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

/* ---------- Palet (warm redactioneel, magazine) ---------- */

const C = {
  paper: "#f3efe8",
  surface: "#fbf9f5",
  ink: "#211d18",
  inkSoft: "#463f36",
  sub: "#6b6357",
  faint: "#9d9484",
  line: "#e2dbcd",
  lineSoft: "#ece6da",
  hair: "#211d18",
  accent: "#8a4b2f", // terracotta-editorial
  accentSoft: "#efe1d6",
  ok: "#4c6f42",
  okSoft: "#e4ead9",
  warn: "#9a6a1f",
  warnSoft: "#f1e6cd",
  alert: "#a3412f",
  alertSoft: "#f0dcd4",
  info: "#3f5c7a",
  infoSoft: "#e0e7ee",
  // duotoon "foto"-vlakken
  duoA1: "#c9a98a",
  duoA2: "#6b4a35",
  duoB1: "#a8b0a0",
  duoB2: "#4a5847",
  duoC1: "#c6a6a0",
  duoC2: "#6e4a48",
};

const disp = { fontFamily: "var(--font-lab-fraunces), ui-serif, Georgia, serif" };
const body = { fontFamily: "var(--font-lab-franklin), ui-sans-serif, system-ui" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe8]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Duotoon "foto"-vlak ---------- */

const DUOS: [string, string][] = [
  [C.duoA1, C.duoA2],
  [C.duoB1, C.duoB2],
  [C.duoC1, C.duoC2],
];

function Photo({
  duo = 0,
  className = "",
  children,
  radius = 0,
}: {
  duo?: number;
  className?: string;
  children?: React.ReactNode;
  radius?: number;
}) {
  const [a, b] = DUOS[duo % DUOS.length] ?? [C.duoA1, C.duoA2];
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: radius,
        background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      }}
      aria-hidden={children ? undefined : "true"}
    >
      {/* zachte korrel/lichtval als plaatsvervangend fotolicht */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 20% 15%, rgba(255,255,255,0.28), transparent 55%), radial-gradient(90% 80% at 85% 90%, rgba(0,0,0,0.22), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

/* ---------- Bouwstenen ---------- */

function Hair({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ height: 1, background: C.hair, opacity: 0.5 }}
      aria-hidden="true"
    />
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...mono, color: t.fg, background: t.soft, borderRadius: 2 }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Redactioneel label / rubrieknaam.
function Kicker({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ ...mono, color }}>
      {children}
    </p>
  );
}

function PageHead({
  issue,
  title,
  standfirst,
  right,
}: {
  issue: string;
  title: string;
  standfirst?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-6 pt-8 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <Kicker>{issue}</Kicker>
          <h1
            className="mt-2 text-[40px] leading-[0.98] sm:text-[46px]"
            style={{ ...disp, color: C.ink, fontWeight: 400, letterSpacing: "-0.015em" }}
          >
            {title}
          </h1>
          {standfirst && (
            <p
              className="mt-3 max-w-xl text-[15px] leading-relaxed"
              style={{ ...body, color: C.sub }}
            >
              {standfirst}
            </p>
          )}
        </div>
        {right}
      </div>
      <Hair className="mt-5" />
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept336() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <style>{`@keyframes kf-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes kf-pulse{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>

      {/* Masthead */}
      <header className="px-6 sm:px-10" style={{ background: C.paper }}>
        <div className="flex h-16 items-center gap-4">
          <span
            className="text-[24px] leading-none"
            style={{ ...disp, color: C.ink, fontWeight: 500, letterSpacing: "0.02em" }}
          >
            KINFOLK
          </span>
          <span
            className="hidden text-[11px] uppercase tracking-[0.3em] sm:inline"
            style={{ ...mono, color: C.faint }}
          >
            voor zelfstandigen
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`p-2 transition-colors hover:bg-[#ece6da] ${RING}`}
              style={{ color: C.sub, borderRadius: 2 }}
            >
              <Search size={16} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative p-2 transition-colors hover:bg-[#ece6da] ${RING}`}
              style={{ color: C.sub, borderRadius: 2 }}
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <Photo duo={0} radius={999} className="h-9 w-9">
                <span
                  className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ ...mono }}
                >
                  {PROFIEL.initialen}
                </span>
              </Photo>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px]"
                  style={{ ...mono, color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Hair />

        {/* Rubriek-navigatie */}
        <nav className="flex gap-5 overflow-x-auto py-3" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-1.5 pb-0.5 text-[12.5px] uppercase tracking-[0.14em] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.ink : C.faint,
                  borderBottom: `2px solid ${on ? C.accent : "transparent"}`,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={13} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
        <Hair />
      </header>

      {/* Content */}
      <div
        key={screen}
        className="mx-auto max-w-6xl pb-8"
        style={{ animation: "kf-fade 0.36s ease" }}
      >
        {!ready ? (
          <ScreenSkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-8 sm:px-10" role="status" aria-live="polite">
      <span className="sr-only">Editie wordt geladen…</span>
      <div
        className="h-10 w-64"
        style={{ background: C.surface, animation: "kf-pulse 1.4s infinite" }}
      />
      <div
        className="mt-6 h-56"
        style={{ background: C.surface, animation: "kf-pulse 1.4s infinite" }}
      />
      <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24"
            style={{ background: C.surface, animation: "kf-pulse 1.4s infinite" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        issue="Editie · Deze week"
        title={`Het werk van ${PROFIEL.naam.split(" ")[0]}`}
        standfirst="Een rustig redactioneel overzicht van je praktijk: je cijfers, je volgende zet en de opdrachten die het lezen waard zijn."
      />

      {/* Full-bleed openingsfoto met cover-lijn */}
      <div className="px-6 pt-6 sm:px-10">
        <Photo duo={0} radius={4} className="min-h-[220px]">
          <div className="relative flex min-h-[220px] flex-col justify-end p-7 sm:p-9">
            <Kicker color="rgba(255,255,255,0.85)">Coververhaal</Kicker>
            <div className="mt-2 flex flex-wrap items-end gap-6">
              <p
                className="text-[72px] leading-[0.8] text-white sm:text-[92px]"
                style={{ ...disp, fontWeight: 400 }}
              >
                {matchAvg}
                <span className="text-[32px]">%</span>
              </p>
              <p
                className="mb-2 max-w-md text-[15px] leading-relaxed text-white/90"
                style={{ ...body }}
              >
                Je gemiddelde match ligt hoog. Je geverifieerde profiel opent deuren — reageer op
                wat je aanspreekt.
              </p>
            </div>
          </div>
        </Photo>
      </div>

      {/* KPI-rubriek */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-6 py-7 sm:px-10 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div key={k.label} className="relative">
            {i > 0 && (
              <span
                className="absolute -left-4 top-1 hidden h-full w-px lg:block"
                style={{ background: C.line }}
                aria-hidden="true"
              />
            )}
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.faint }}
            >
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[34px] leading-none"
              style={{ ...disp, color: C.ink, fontWeight: 400 }}
            >
              {k.value}
            </p>
            <p
              className="mt-1 flex items-center gap-1 text-[12px]"
              style={{ ...mono, color: k.up ? C.ok : C.warn }}
            >
              {k.up ? (
                <ArrowUpRight size={12} aria-hidden="true" />
              ) : (
                <ArrowRight size={12} aria-hidden="true" />
              )}
              {k.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="px-6 sm:px-10">
        <Hair />
      </div>

      <div className="grid grid-cols-1 gap-8 px-6 py-7 sm:px-10 lg:grid-cols-3">
        {/* Hoofdartikel: volgende zet */}
        {warn && (
          <article className="lg:col-span-2">
            <Kicker>Redactioneel · Je volgende zet</Kicker>
            <h2
              className="mt-2 text-[30px] leading-tight"
              style={{ ...disp, color: C.ink, fontWeight: 400 }}
            >
              {warn.titel}
            </h2>
            <Photo duo={1} radius={4} className="mt-4 min-h-[150px]" />
            <p
              className="mt-4 max-w-lg text-[15px] leading-relaxed"
              style={{ ...body, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className={`mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] uppercase tracking-[0.12em] text-white transition-transform active:scale-[0.98] ${RING}`}
              style={{ ...mono, background: C.ink, borderRadius: 2 }}
            >
              {warn.cta} <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </article>
        )}

        {/* Zijkolom: berichten met error → loading → ok */}
        <aside>
          <Kicker>Ingezonden</Kicker>
          <div className="mt-3">
            {feed === "error" && (
              <div className="text-center" role="alert">
                <AlertTriangle
                  size={20}
                  className="mx-auto"
                  style={{ color: C.alert }}
                  aria-hidden="true"
                />
                <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                  De post kon niet geladen worden.
                </p>
                <button
                  onClick={retry}
                  className={`mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] uppercase tracking-[0.1em] transition-colors hover:bg-[#ece6da] ${RING}`}
                  style={{ ...mono, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 2 }}
                >
                  <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "loading" && (
              <div className="space-y-3" role="status" aria-live="polite">
                <span className="sr-only">Laden…</span>
                {[70, 90, 55].map((w, i) => (
                  <span
                    key={i}
                    className="block h-3"
                    style={{
                      width: `${w}%`,
                      background: C.lineSoft,
                      animation: "kf-pulse 1.4s infinite",
                    }}
                  />
                ))}
              </div>
            )}
            {feed === "ok" && (
              <ul className="space-y-4">
                {BERICHTEN.slice(0, 3).map((b, i) => (
                  <li key={b.van}>
                    {i > 0 && <Hair className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <Photo duo={i} radius={999} className="h-8 w-8">
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white"
                          style={{ ...mono }}
                        >
                          {b.initialen}
                        </span>
                      </Photo>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                          {b.van}
                        </p>
                        <p className="text-[11.5px] leading-snug" style={{ ...body, color: C.sub }}>
                          {b.preview}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <div className="px-6 sm:px-10">
        <Hair />
      </div>

      {/* Rubriek: opdrachten */}
      <div className="px-6 py-7 sm:px-10">
        <div className="mb-5 flex items-center justify-between">
          <Kicker>Uitgelicht · Opdrachten</Kicker>
          <button
            onClick={() => onGo("marktplaats")}
            className={`inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.1em] ${RING}`}
            style={{ ...mono, color: C.accent }}
          >
            Alles <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {OPDRACHTEN.map((o, i) => (
            <button key={o.id} onClick={() => onOpen(o.id)} className={`group text-left ${RING}`}>
              <Photo duo={i} radius={4} className="min-h-[150px]">
                <div
                  className="absolute right-3 top-3 px-2 py-1 text-[11px] font-semibold text-white"
                  style={{ ...mono, background: "rgba(0,0,0,0.35)", borderRadius: 2 }}
                >
                  {o.match}% match
                </div>
              </Photo>
              <p
                className="mt-3 text-[10.5px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.faint }}
              >
                {o.id} · {o.plaats}
              </p>
              <p
                className="mt-1 text-[20px] leading-snug transition-colors group-hover:text-[#8a4b2f]"
                style={{ ...disp, color: C.ink, fontWeight: 400 }}
              >
                {o.titel}
              </p>
              <p className="mt-1 text-[13px]" style={{ ...body, color: C.sub }}>
                {o.opdrachtgever}
              </p>
              <div
                className="mt-2 flex items-center gap-3 text-[12.5px]"
                style={{ ...mono, color: C.inkSoft }}
              >
                <span style={{ color: C.accent }}>{o.tarief}</span>
                <span style={{ color: C.faint }}>{o.uren}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        issue="Rubriek · De markt"
        title="Marktplaats"
        standfirst="Alle opdrachten redactioneel gerangschikt op je match — de sterkste verhalen bovenaan."
        right={
          <div className="inline-flex items-center gap-1" role="tablist" aria-label="Sorteren">
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 text-[11.5px] uppercase tracking-[0.12em] transition-colors ${RING}`}
                  style={{
                    ...mono,
                    color: on ? C.ink : C.faint,
                    borderBottom: `2px solid ${on ? C.accent : "transparent"}`,
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-7 sm:px-10">
        <div
          className="mb-6 flex items-center gap-2.5 px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 2 }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ ...body, color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center px-6 py-16 text-center"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center"
              style={{ background: C.accentSoft, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.accent }} />
            </span>
            <p className="mt-4 text-[24px]" style={{ ...disp, color: C.ink, fontWeight: 400 }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[13px]" style={{ ...body, color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 px-4 py-2 text-[12px] uppercase tracking-[0.1em] transition-colors hover:bg-[#ece6da] ${RING}`}
              style={{ ...mono, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 2 }}
            >
              Wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-8">
            {filtered.map((o, i) => (
              <li key={o.id}>
                {i > 0 && <Hair className="mb-8" />}
                <article className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
                  <Photo duo={i} radius={4} className="min-h-[150px]">
                    <div
                      className="absolute left-3 top-3 px-2 py-1 text-[11px] font-semibold text-white"
                      style={{ ...mono, background: "rgba(0,0,0,0.35)", borderRadius: 2 }}
                    >
                      {o.match}% match
                    </div>
                  </Photo>
                  <div className="min-w-0">
                    <p
                      className="text-[10.5px] uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id} · {o.plaats} · {o.start}
                    </p>
                    <p
                      className="mt-1.5 text-[26px] leading-tight"
                      style={{ ...disp, color: C.ink, fontWeight: 400 }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-1 flex items-center gap-1 text-[13px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <MapPin size={13} aria-hidden="true" /> {o.opdrachtgever}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px] uppercase tracking-[0.08em]"
                          style={{
                            ...mono,
                            background: C.lineSoft,
                            color: C.inkSoft,
                            borderRadius: 2,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-[13px]" style={{ ...mono }}>
                        <span style={{ color: C.accent }}>{o.tarief}</span>
                        <span style={{ color: C.sub }}>{o.uren}</span>
                      </div>
                      <button
                        onClick={() => onOpen(o.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11.5px] uppercase tracking-[0.12em] text-white transition-transform active:scale-[0.98] ${RING}`}
                        style={{ ...mono, background: C.ink, borderRadius: 2 }}
                      >
                        Lees verder <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        issue={`Dossier · ${opdracht.id}`}
        title={opdracht.titel}
        standfirst={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors hover:bg-[#ece6da] ${RING}`}
              style={{ ...mono, border: `1px solid ${C.line}`, color: C.sub, borderRadius: 2 }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-5 py-2 text-[11.5px] uppercase tracking-[0.12em] text-white transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ ...mono, background: state === "sent" ? C.ok : C.ink, borderRadius: 2 }}
            >
              {state === "idle" && (
                <>
                  <Send size={14} strokeWidth={2.2} aria-hidden="true" /> Reageer
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="px-6 pt-6 sm:px-10">
        <Photo duo={2} radius={4} className="min-h-[200px]">
          <div className="relative flex min-h-[200px] items-end p-7">
            <div>
              <Kicker color="rgba(255,255,255,0.85)">Match-score</Kicker>
              <p
                className="mt-1 text-[64px] leading-none text-white"
                style={{ ...disp, fontWeight: 400 }}
              >
                {opdracht.match}%
              </p>
            </div>
          </div>
        </Photo>
      </div>

      <div className="grid grid-cols-1 gap-8 px-6 py-7 sm:px-10 lg:grid-cols-3">
        <div className="space-y-7 lg:col-span-2">
          {/* Kerncijfers als redactionele feiten */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l}>
                <p
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[20px]" style={{ ...disp, color: C.ink, fontWeight: 400 }}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          <Hair />

          {/* Verklaarbare match */}
          <div>
            <Kicker>Achtergrond · Waarom deze match</Kicker>
            <p
              className="mt-2 max-w-lg text-[14px] leading-relaxed"
              style={{ ...body, color: C.sub }}
            >
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[14px]"
                      style={{ ...body, color: C.ink }}
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.ok }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[14px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.warn }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <Kicker>Redactie</Kicker>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ ...body, color: C.inkSoft }}>
              Sterke koppeling met je profiel — reageer nu voor de beste kans op deze opdracht.
            </p>
          </div>
          <Hair />
          <div>
            <Kicker>Compliance-eis</Kicker>
            <p className="mt-2 text-[13px]" style={{ ...body, color: C.sub }}>
              Vereiste credentials. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-3">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ background: t.soft, borderRadius: 2 }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ ...body, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        issue="Dossier · Vertrouwen"
        title="Verificatie"
        standfirst="Elk geverifieerd bewijsstuk maakt je profiel geloofwaardiger en zichtbaarder."
      />

      <div className="px-6 pt-6 sm:px-10">
        <Photo duo={1} radius={4} className="min-h-[200px]">
          <div className="relative flex min-h-[200px] flex-col justify-end p-7 sm:p-9">
            <Kicker color="rgba(255,255,255,0.85)">{PROFIEL.trust}</Kicker>
            <div className="mt-2 flex flex-wrap items-end gap-6">
              <p
                className="text-[72px] leading-[0.8] text-white"
                style={{ ...disp, fontWeight: 400 }}
              >
                {pct}%
              </p>
              <p className="mb-3 max-w-sm text-[15px] text-white/90" style={{ ...body }}>
                {verified} van {total} bewijsstukken geverifieerd. Nog {total - verified} te gaan
                voor een volledige score.
              </p>
            </div>
          </div>
        </Photo>
      </div>

      <div className="px-6 py-7 sm:px-10">
        {expiring && (
          <div
            className="mb-6 flex flex-wrap items-center gap-4 p-5"
            style={{ background: C.warnSoft, borderLeft: `3px solid ${C.warn}` }}
          >
            <span role="alert" className="contents">
              <AlertTriangle
                size={22}
                style={{ color: C.warn }}
                className="shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-[180px] flex-1">
                <p className="text-[16px]" style={{ ...disp, color: C.ink, fontWeight: 400 }}>
                  {expiring.naam} verloopt binnenkort
                </p>
                <p className="mt-0.5 text-[13px]" style={{ ...body, color: C.inkSoft }}>
                  {expiring.detail}. Vernieuw op tijd om je score te behouden.
                </p>
              </div>
              <button
                onClick={() => onGo("acties")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{ ...mono, background: C.warn, borderRadius: 2 }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </span>
          </div>
        )}

        <Kicker>Register · Bewijsstukken</Kicker>
        <ul className="mt-4">
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <li key={c.naam}>
                {i > 0 && <Hair />}
                <div className="flex items-center gap-4 py-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    style={{ background: t.soft, borderRadius: 2 }}
                  >
                    <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px]" style={{ ...disp, color: C.ink, fontWeight: 400 }}>
                      {c.naam}
                    </p>
                    <p className="text-[12px]" style={{ ...mono, color: C.sub }}>
                      {c.detail}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        issue="Agenda · Deze week"
        title="Volgende acties"
        standfirst="Redactioneel geordend op urgentie — rond af en houd je dossier op orde."
      />
      <div className="px-6 py-7 sm:px-10">
        <ul>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const fg = warn ? C.accent : C.info;
            return (
              <li key={a.titel}>
                {i > 0 && <Hair />}
                <div className="flex flex-wrap items-start gap-5 py-5">
                  <span
                    className="text-[40px] leading-none"
                    style={{ ...disp, color: C.line, fontWeight: 400 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p
                      className="text-[10px] uppercase tracking-[0.16em]"
                      style={{ ...mono, color: fg }}
                    >
                      {warn ? "Waarschuwing" : "Kans"}
                    </p>
                    <p
                      className="mt-0.5 text-[20px]"
                      style={{ ...disp, color: C.ink, fontWeight: 400 }}
                    >
                      {a.titel}
                    </p>
                    <p className="mt-1 text-[14px]" style={{ ...body, color: C.sub }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className={`inline-flex items-center gap-1.5 self-center px-4 py-2 text-[11.5px] uppercase tracking-[0.12em] text-white transition-transform active:scale-[0.98] ${RING}`}
                    style={{ ...mono, background: warn ? C.accent : C.ink, borderRadius: 2 }}
                  >
                    {a.cta} <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div
          className="mt-4 flex items-center gap-3 p-5"
          style={{ background: C.okSoft, borderLeft: `3px solid ${C.ok}` }}
        >
          <Check size={18} strokeWidth={2.4} style={{ color: C.ok }} aria-hidden="true" />
          <p className="text-[13.5px]" style={{ ...body, color: C.inkSoft }}>
            Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf in de volgende
            editie.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );

  return (
    <div>
      <PageHead
        issue="Boekhouding · Overzicht"
        title="Facturen"
        standfirst="Je omzet redactioneel bijgehouden — wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 px-4 py-2 text-[11.5px] uppercase tracking-[0.12em] text-white transition-transform active:scale-[0.98] ${RING}`}
            style={{ ...mono, background: C.ink, borderRadius: 2 }}
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="px-6 py-7 sm:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.ok }}
            >
              Ontvangen
            </p>
            <p
              className="mt-1 text-[44px] leading-none"
              style={{ ...disp, color: C.ink, fontWeight: 400 }}
            >
              € {betaald.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="relative">
            <span
              className="absolute -left-4 top-1 hidden h-full w-px sm:block"
              style={{ background: C.line }}
              aria-hidden="true"
            />
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.warn }}
            >
              Openstaand
            </p>
            <p
              className="mt-1 text-[44px] leading-none"
              style={{ ...disp, color: C.ink, fontWeight: 400 }}
            >
              € {open.toLocaleString("nl-NL")}
            </p>
          </div>
        </div>

        <Hair className="my-7" />

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.faint }}
              >
                <th className="pb-3 pr-4">Nummer</th>
                <th className="pb-3 pr-4">Klant</th>
                <th className="hidden pb-3 pr-4 sm:table-cell">Datum</th>
                <th className="pb-3 pr-4 text-right">Bedrag</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = factuurTone(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    <td className="py-4 pr-4 text-[12px]" style={{ ...mono, color: C.sub }}>
                      {f.nr}
                    </td>
                    <td className="py-4 pr-4 text-[14px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden py-4 pr-4 text-[12px] sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="py-4 pr-4 text-right text-[16px]"
                      style={{ ...disp, color: C.ink, fontWeight: 400 }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...mono, color: t.fg, background: t.soft, borderRadius: 2 }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
