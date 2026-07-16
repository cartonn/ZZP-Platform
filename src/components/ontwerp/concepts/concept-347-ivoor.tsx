"use client";

// Concept 347 — "Ivoor" · ultra-minimaal, monochroom warm-wit/ivoor/bot.
// De luxe van weglaten. Eén rustig ivoor-canvas, haarfijne 1px-lijnen, extreme witruimte en
// een verfijnde editoriale serif (Newsreader) tegen een humanist-sans (Franklin). Kleur is
// zeldzaam: alleen status krijgt een ingetogen, gedempte tint — verder is alles inkt op ivoor.
// De stelling: data-dichtheid en rust sluiten elkaar niet uit. Perfecte typografische ritmiek,
// zetsel-achtige tabellen, cijfers als redactionele numeralen. Geen decoratie, geen ruis —
// alleen hiërarchie, ademruimte en vertrouwen. Verificatie voelt hier als een keurmerk in druk.
// Fonts: --font-lab-newsreader (serif, koppen + numeralen) + --font-lab-franklin (humanist body).

import { useEffect, useState } from "react";
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Command,
  Minus,
  CornerDownLeft,
  Dot,
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

/* ---------- Palet — warm-wit, ivoor, bot. Inkt op papier. ---------- */

const C = {
  canvas: "#f1ece2", // ivoor-papier
  surface: "#faf7f1", // bot-wit blad
  surfaceAlt: "#f4efe6",
  raise: "#ffffff",
  ink: "#211e18", // warme bijna-zwart inkt
  inkSoft: "#413d35",
  sub: "#6b6459", // secundaire tekst (contrast-veilig op bot-wit)
  faint: "#9c9488",
  hair: "#e2dbcd", // haarlijn
  hairSoft: "#ece6da",
  // Status — gedempt, zeldzaam, nooit fel
  ok: "#3f6b4e", // geverifieerd — mos
  okSoft: "#e8efe6",
  info: "#3f5f80", // in beoordeling — leisteen
  infoSoft: "#e7edf3",
  warn: "#8a6018", // verloopt — oker
  warnSoft: "#f3ecdc",
  alert: "#933a2b", // afgewezen — terracotta
  alertSoft: "#f3e4de",
};

const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#211e18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f1]";

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

function factuurTone(status: string): { fg: string; label: string } {
  if (status === "Betaald") return { fg: C.ok, label: "Betaald" };
  if (status === "Openstaand") return { fg: C.warn, label: "Openstaand" };
  return { fg: C.faint, label: "Concept" };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Bouwstenen ---------- */

// Ingetogen statuschip: haarlijn-omtrek + dot + label + icoon. Nooit alleen kleur.
function StatusPill({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const t = credTone(status);
  const Icon = t.Icon;
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sm ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]"}`}
      style={{
        ...sans,
        color: t.fg,
        background: C.surface,
        border: `1px solid ${t.fg}33`,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      <Icon size={sm ? 11 : 12} strokeWidth={1.9} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Kicker: kleine kapitalen met letterspatie — het redactionele label boven een kop.
function Kicker({ children, tone = C.faint }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] uppercase"
      style={{ ...sans, color: tone, letterSpacing: "0.24em", fontWeight: 600 }}
    >
      {children}
    </p>
  );
}

// Haarlijn — de enige scheiding die Ivoor toestaat.
function Rule({ soft = false, className = "" }: { soft?: boolean; className?: string }) {
  return (
    <div
      className={className}
      style={{ height: 1, background: soft ? C.hairSoft : C.hair }}
      aria-hidden="true"
    />
  );
}

// Uiterst dunne sparkline — één haarlijn, geen fill, geen glans.
function ThreadSpark({
  data,
  color = C.ink,
  w = 96,
  h = 26,
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="1.6" fill={color} />}
    </svg>
  );
}

// Dun meet-boogje (verificatie-voortgang) — 1px stroke, monochroom.
function ThinArc({
  value,
  size = 96,
  color = C.ink,
}: {
  value: number;
  size?: number;
  color?: string;
}) {
  const stroke = 1.5;
  const r = size / 2 - stroke - 2;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.hair}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="tabular-nums"
          style={{ ...serif, color: C.ink, fontSize: size >= 90 ? 26 : 18, fontWeight: 500 }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 text-[8px] uppercase"
          style={{ ...sans, color: C.faint, letterSpacing: "0.16em" }}
        >
          %
        </span>
      </span>
    </span>
  );
}

// Redactionele paginakop: serif-titel, kicker, ondertitel. Veel lucht.
function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 px-6 pb-6 pt-8 sm:px-10 lg:pt-12">
      <div className="min-w-0 max-w-2xl">
        <Kicker>{kicker}</Kicker>
        <h1
          className="mt-3 text-[34px] leading-[1.05] tracking-[-0.01em] sm:text-[42px]"
          style={{ ...serif, color: C.ink, fontWeight: 500 }}
        >
          {title}
        </h1>
        {sub && (
          <p
            className="mt-3 max-w-xl text-[14px] leading-relaxed"
            style={{ ...sans, color: C.sub }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept347() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [cmd, setCmd] = useState(false);
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
      style={{ ...sans, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes iv-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes iv-pulse{0%,100%{opacity:.45}50%{opacity:.8}}
      @keyframes iv-in{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}`}</style>

      <div className="mx-auto flex min-h-[680px] max-w-[1180px] flex-col lg:flex-row">
        {/* Zij-rail — stil, verticaal, redactioneel register */}
        <aside
          className="shrink-0 border-b lg:w-[236px] lg:border-b-0 lg:border-r"
          style={{ borderColor: C.hair, background: C.surface }}
        >
          <div className="flex items-center gap-3 px-6 pb-4 pt-6">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
              style={{ ...serif, border: `1px solid ${C.ink}`, color: C.ink, fontWeight: 500 }}
              aria-hidden="true"
            >
              Z
            </span>
            <div className="leading-tight">
              <p className="text-[15px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                Ivoor
              </p>
              <p
                className="text-[10px] uppercase"
                style={{ ...sans, color: C.faint, letterSpacing: "0.2em" }}
              >
                Zelfstandig register
              </p>
            </div>
          </div>

          <Rule className="mx-6" />

          <nav
            className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-0.5 lg:px-3 lg:py-4"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.ink : C.sub,
                    background: on ? C.surfaceAlt : "transparent",
                  }}
                >
                  <span
                    className="text-[10.5px] tabular-nums"
                    style={{ ...sans, color: on ? C.ink : C.faint, letterSpacing: "0.08em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontWeight: on ? 600 : 400 }}>{s.label}</span>
                  {on && (
                    <span
                      className="ml-auto hidden h-1 w-1 rounded-full lg:block"
                      style={{ background: C.ink }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden px-6 lg:block">
            <Rule />
            <button
              onClick={() => setCmd(true)}
              className={`mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] transition-colors hover:bg-[#f4efe6] ${RING}`}
              style={{ border: `1px solid ${C.hair}`, color: C.sub }}
            >
              <Command size={13} aria-hidden="true" />
              Snel zoeken
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] tabular-nums"
                style={{ border: `1px solid ${C.hair}`, color: C.faint }}
              >
                ⌘K
              </span>
            </button>

            <div className="mt-6 flex items-center gap-3 pb-6">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px]"
                style={{
                  ...serif,
                  background: C.surfaceAlt,
                  color: C.ink,
                  border: `1px solid ${C.hair}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[12.5px]" style={{ color: C.ink, fontWeight: 600 }}>
                  {PROFIEL.naam}
                </p>
                <p className="flex items-center gap-1 text-[10.5px]" style={{ color: C.ok }}>
                  <BadgeCheck size={11} strokeWidth={1.9} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Blad */}
        <main className="min-w-0 flex-1" style={{ background: C.canvas }}>
          <div key={screen} style={{ animation: "iv-fade 0.36s ease" }}>
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
        </main>
      </div>

      {cmd && (
        <CommandPalette
          onClose={() => setCmd(false)}
          onGo={(k) => {
            setScreen(k);
            setCmd(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Command-palet ---------- */

function CommandPalette({ onClose, onGo }: { onClose: () => void; onGo: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
      style={{ background: "rgba(33,30,24,0.28)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Snel zoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl"
        style={{
          background: C.surface,
          border: `1px solid ${C.hair}`,
          animation: "iv-in 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          <Search size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar…"
            aria-label="Zoek een scherm"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ ...serif, color: C.ink }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[9.5px]"
            style={{ border: `1px solid ${C.hair}`, color: C.faint }}
          >
            esc
          </kbd>
        </div>
        <ul className="max-h-64 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.faint }}>
              Niets gevonden voor “{q}”.
            </li>
          ) : (
            results.map((s, i) => (
              <li key={s.key}>
                <button
                  onClick={() => onGo(s.key)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-[#f4efe6] ${RING}`}
                  style={{ color: C.ink }}
                >
                  <span className="text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                  <CornerDownLeft
                    size={13}
                    className="ml-auto opacity-0 group-hover:opacity-100"
                    style={{ color: C.faint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-10 sm:px-10" role="status" aria-live="polite">
      <span className="sr-only">Blad wordt geladen…</span>
      <div
        className="h-3 w-24 rounded"
        style={{ background: C.hairSoft, animation: "iv-pulse 1.3s infinite" }}
      />
      <div
        className="mt-4 h-9 w-72 rounded"
        style={{ background: C.hairSoft, animation: "iv-pulse 1.3s infinite" }}
      />
      <div
        className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg lg:grid-cols-4"
        style={{ background: C.hair }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28" style={{ background: C.surface }}>
            <div
              className="m-4 h-3 w-16 rounded"
              style={{ background: C.hairSoft, animation: "iv-pulse 1.3s infinite" }}
            />
            <div
              className="mx-4 h-6 w-20 rounded"
              style={{ background: C.hairSoft, animation: "iv-pulse 1.3s infinite" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg"
            style={{
              background: C.surface,
              border: `1px solid ${C.hair}`,
              animation: "iv-pulse 1.3s infinite",
            }}
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
  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };
  const first = PROFIEL.naam.split(" ")[0];

  return (
    <div>
      <PageHead
        kicker="Overzicht · vrijdag"
        title={`Goedemorgen, ${first}`}
        sub="Een rustig register van je praktijk. Alleen wat telt — de cijfers, de kansen en het ene bewijsstuk dat aandacht vraagt."
        right={
          <div className="text-right">
            <p
              className="text-[10.5px] uppercase"
              style={{ ...sans, color: C.faint, letterSpacing: "0.2em" }}
            >
              Vertrouwensniveau
            </p>
            <p
              className="mt-1 flex items-center justify-end gap-1.5 text-[15px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              <BadgeCheck size={16} strokeWidth={1.9} style={{ color: C.ok }} aria-hidden="true" />{" "}
              {PROFIEL.trust}
            </p>
          </div>
        }
      />

      <div className="px-6 sm:px-10">
        <Rule />

        {/* KPI-register — zetsel-grid met haarlijnen ertussen */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="py-6"
              style={{
                borderRight: i % 4 !== 3 ? `1px solid ${C.hairSoft}` : "none",
                borderBottom: i < 2 ? `1px solid ${C.hairSoft}` : "none",
                paddingLeft: i % 4 === 0 ? 0 : 20,
                paddingRight: 20,
              }}
            >
              <p className="text-[11px]" style={{ ...sans, color: C.sub, letterSpacing: "0.02em" }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[30px] tabular-nums leading-none"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-[11px] tabular-nums"
                  style={{ ...sans, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <ThreadSpark data={k.spark} color={C.inkSoft} />
              </div>
            </div>
          ))}
        </div>

        <Rule />
      </div>

      <div className="grid grid-cols-1 gap-px px-6 py-8 sm:px-10 lg:grid-cols-3">
        {/* Attentie — het enige stuk met (gedempte) kleur */}
        <div className="lg:col-span-2">
          {warn && (
            <div
              className="rounded-xl p-6"
              style={{ background: C.warnSoft, border: `1px solid ${C.warn}2e` }}
              role="alert"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={15}
                  strokeWidth={1.9}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                <Kicker tone={C.warn}>Vraagt aandacht</Kicker>
              </div>
              <h2
                className="mt-3 text-[22px] leading-snug"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {warn.titel}
              </h2>
              <p
                className="mt-2 max-w-md text-[13.5px] leading-relaxed"
                style={{ ...sans, color: C.sub }}
              >
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] transition-colors ${RING}`}
                style={{ background: C.ink, color: C.surface, fontWeight: 500 }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Beste matches — als redactionele lijst */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[17px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                Sterkste koppelingen
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 text-[12.5px] transition-colors hover:opacity-70 ${RING}`}
                style={{ color: C.sub }}
              >
                Marktplaats <ChevronRight size={13} aria-hidden="true" />
              </button>
            </div>
            <Rule className="mt-4" />
            <ul>
              {OPDRACHTEN.map((o) => (
                <li key={o.id} style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`group flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-[#f4efe6] ${RING}`}
                  >
                    <span
                      className="w-10 shrink-0 text-[22px] tabular-nums"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px]"
                        style={{ ...serif, color: C.ink, fontWeight: 500 }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                        style={{ ...sans, color: C.sub }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span
                      className="hidden shrink-0 text-right text-[13px] tabular-nums sm:block"
                      style={{ ...serif, color: C.ink }}
                    >
                      {o.tarief}
                    </span>
                    <ArrowRight
                      size={15}
                      strokeWidth={1.6}
                      className="shrink-0 opacity-30 transition-opacity group-hover:opacity-100"
                      style={{ color: C.ink }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Zijkolom — bericht (error→loading→ok) + verificatie-vinger */}
        <div className="lg:pl-2">
          <div
            className="rounded-xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.hair}` }}
          >
            <Kicker>Nieuwste bericht</Kicker>
            <div className="mt-4">
              {feed === "error" && (
                <div className="py-4 text-center" role="alert">
                  <XCircle
                    size={18}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
                    Berichten konden niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[#f4efe6] ${RING}`}
                    style={{ border: `1px solid ${C.hair}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2 py-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded"
                    style={{
                      background: C.hairSoft,
                      width: "70%",
                      animation: "iv-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded"
                    style={{
                      background: C.hairSoft,
                      width: "90%",
                      animation: "iv-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded"
                    style={{
                      background: C.hairSoft,
                      width: "55%",
                      animation: "iv-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && BERICHTEN[0] && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10.5px]"
                      style={{
                        ...sans,
                        background: C.surfaceAlt,
                        color: C.inkSoft,
                        border: `1px solid ${C.hair}`,
                        fontWeight: 600,
                      }}
                      aria-hidden="true"
                    >
                      {BERICHTEN[0].initialen}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[12.5px]" style={{ color: C.ink, fontWeight: 600 }}>
                        {BERICHTEN[0].van}
                      </p>
                      <p className="text-[10.5px]" style={{ color: C.faint }}>
                        {BERICHTEN[0].tijd}
                      </p>
                    </div>
                  </div>
                  <p
                    className="mt-3 text-[13px] leading-relaxed"
                    style={{ ...serif, color: C.inkSoft }}
                  >
                    “{BERICHTEN[0].preview}”
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className="mt-4 flex items-center gap-4 rounded-xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.hair}` }}
          >
            <ThinArc value={75} size={72} />
            <div className="min-w-0">
              <Kicker>Verificatie</Kicker>
              <p className="mt-1.5 text-[13.5px] leading-snug" style={{ ...sans, color: C.sub }}>
                Drie van de vier bewijsstukken geverifieerd.
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-2 inline-flex items-center gap-1 text-[12.5px] transition-colors hover:opacity-70 ${RING}`}
                style={{ color: C.ink, fontWeight: 500 }}
              >
                Bekijk register <ChevronRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
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
        kicker="Register · open opdrachten"
        title="Marktplaats"
        sub="Opdrachten geordend naar de kracht van de koppeling met je geverifieerde profiel. Rustig te lezen, van boven naar beneden."
      />

      <div className="px-6 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
          <div
            className="flex min-w-[220px] flex-1 items-center gap-2.5 pb-2"
            style={{ borderBottom: `1px solid ${C.hair}` }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ ...serif, color: C.ink }}
            />
          </div>
          <div className="inline-flex items-center gap-4" role="tablist" aria-label="Sorteren">
            <span
              className="text-[11px] uppercase"
              style={{ ...sans, color: C.faint, letterSpacing: "0.16em" }}
            >
              Sorteer
            </span>
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`pb-2 text-[13px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.ink : C.sub,
                    borderBottom: `1px solid ${on ? C.ink : "transparent"}`,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        </div>

        <Rule />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ border: `1px solid ${C.hair}` }}
              aria-hidden="true"
            >
              <Search size={18} style={{ color: C.faint }} />
            </span>
            <p className="mt-5 text-[18px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1.5 max-w-xs text-[13px]" style={{ ...sans, color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht en probeer opnieuw.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-5 rounded-full px-5 py-2 text-[12.5px] transition-colors ${RING}`}
              style={{ border: `1px solid ${C.hair}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="pb-10">
            {filtered.map((o, i) => (
              <li key={o.id} style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3 py-6 sm:flex-nowrap">
                  {/* Match als groot redactioneel cijfer */}
                  <div className="flex w-16 shrink-0 flex-col">
                    <span
                      className="text-[40px] tabular-nums leading-none"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[9.5px] uppercase"
                      style={{ ...sans, color: C.faint, letterSpacing: "0.14em" }}
                    >
                      match
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className="text-[10.5px] tabular-nums"
                        style={{ ...sans, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <Minus size={10} style={{ color: C.hair }} aria-hidden="true" />
                      {o.tags.map((t, ti) => (
                        <span
                          key={t}
                          className="flex items-center gap-2 text-[11px]"
                          style={{ ...sans, color: C.sub }}
                        >
                          {ti > 0 && (
                            <Dot size={10} style={{ color: C.faint }} aria-hidden="true" />
                          )}
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3
                      className="mt-1.5 text-[19px] leading-snug"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {o.titel}
                    </h3>
                    <p
                      className="mt-1 flex items-center gap-1.5 text-[12.5px]"
                      style={{ ...sans, color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div
                      className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px]"
                      style={{ ...sans, color: C.sub }}
                    >
                      <span style={{ color: C.ink }}>{o.tarief}</span>
                      <span>{o.uren}</span>
                      <span>{o.start}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 self-center">
                    <span
                      className="hidden h-8 w-8 items-center justify-center rounded-full text-[11px] tabular-nums sm:flex"
                      style={{ ...sans, border: `1px solid ${C.hair}`, color: C.faint }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] transition-colors hover:opacity-90 ${RING}`}
                      style={{ background: C.ink, color: C.surface, fontWeight: 500 }}
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={1.9} aria-hidden="true" />
                    </button>
                  </div>
                </div>
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
      <div className="px-6 pt-8 sm:px-10 lg:pt-12">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-[12.5px] transition-colors hover:opacity-70 ${RING}`}
          style={{ color: C.sub }}
        >
          <ChevronLeft size={14} aria-hidden="true" /> Marktplaats
        </button>
      </div>

      <PageHead
        kicker={`${opdracht.id} · ${opdracht.opdrachtgever}`}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats} · ${opdracht.start}`}
        right={
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] transition-colors disabled:opacity-90 ${RING}`}
            style={{
              background: state === "sent" ? C.ok : C.ink,
              color: C.surface,
              fontWeight: 500,
            }}
          >
            {state === "idle" && (
              <>
                <Send size={15} strokeWidth={1.9} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={2.4} aria-hidden="true" /> Verstuurd
              </>
            )}
          </button>
        }
      />

      <div className="px-6 sm:px-10">
        <Rule />
        {/* Kerncijfers als zetsel-register */}
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="py-6"
              style={{
                borderRight: i % 4 !== 3 ? `1px solid ${C.hairSoft}` : "none",
                paddingLeft: i % 4 === 0 ? 0 : 20,
                paddingRight: 20,
              }}
            >
              <p
                className="text-[10.5px] uppercase"
                style={{ ...sans, color: C.faint, letterSpacing: "0.14em" }}
              >
                {m.l}
              </p>
              <p
                className="mt-2 text-[24px] tabular-nums leading-none"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
        <Rule />
      </div>

      <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:px-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-[19px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
            Waarom deze koppeling
          </h3>
          <p className="mt-1.5 text-[13px]" style={{ ...sans, color: C.sub }}>
            Transparant onderbouwd op basis van je geverifieerde profiel — geen zwarte doos.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Check size={13} strokeWidth={2.2} style={{ color: C.ok }} aria-hidden="true" />
                <Kicker tone={C.ok}>In je voordeel</Kicker>
              </div>
              <ul className="mt-4 space-y-4">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 text-[14px] leading-snug"
                    style={{ ...serif, color: C.inkSoft }}
                  >
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: C.ok }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={13}
                  strokeWidth={1.9}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                <Kicker tone={C.warn}>Aandachtspunten</Kicker>
              </div>
              <ul className="mt-4 space-y-4">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 text-[14px] leading-snug"
                    style={{ ...serif, color: C.sub }}
                  >
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full"
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

        <div>
          <div
            className="rounded-xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.hair}` }}
          >
            <div className="flex items-center gap-4">
              <ThinArc value={opdracht.match} size={78} />
              <div>
                <Kicker>Koppelingsscore</Kicker>
                <p className="mt-1.5 text-[13px] leading-snug" style={{ ...sans, color: C.sub }}>
                  Sterke aansluiting op je profiel. Reageer op je gemak.
                </p>
              </div>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.hair}` }}
          >
            <Kicker>Vereiste bewijsstukken</Kicker>
            <p className="mt-2 text-[12.5px]" style={{ ...sans, color: C.sub }}>
              Je voldoet aan de kern-eisen voor deze opdracht.
            </p>
            <ul className="mt-4 space-y-3.5">
              {CREDENTIALS.slice(0, 3).map((c) => (
                <li key={c.naam} className="flex items-center justify-between gap-3">
                  <span
                    className="min-w-0 flex-1 truncate text-[13px]"
                    style={{ ...serif, color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <StatusPill status={c.status} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        </div>
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
        kicker="Register · bewijsstukken"
        title="Verificatie"
        sub="Elk geverifieerd bewijsstuk verhoogt je vertrouwensniveau. Een keurmerk, rustig bijgehouden."
      />

      <div className="px-6 sm:px-10">
        <Rule />
        <div className="flex flex-wrap items-center gap-8 py-8">
          <ThinArc value={pct} size={104} />
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-2">
              <BadgeCheck size={15} strokeWidth={1.9} style={{ color: C.ok }} aria-hidden="true" />
              <Kicker tone={C.ok}>{PROFIEL.trust}</Kicker>
            </div>
            <p
              className="mt-2 text-[28px] tabular-nums leading-none"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              {verified} van {total} geverifieerd
            </p>
            <p
              className="mt-2 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.sub }}
            >
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledig register. Opdrachtgevers zien alleen je vertrouwensniveau, nooit je
              documenten.
            </p>
          </div>
        </div>
        <Rule />
      </div>

      <div className="px-6 py-8 sm:px-10">
        {expiring && (
          <div
            className="mb-8 flex flex-wrap items-center gap-5 rounded-xl p-5"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}2e` }}
            role="alert"
          >
            <AlertTriangle
              size={18}
              strokeWidth={1.9}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[200px] flex-1">
              <p className="text-[14px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] transition-colors ${RING}`}
              style={{ background: C.ink, color: C.surface, fontWeight: 500 }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>
        )}

        <div
          className="overflow-hidden rounded-xl"
          style={{ border: `1px solid ${C.hair}`, background: C.surface }}
        >
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ border: `1px solid ${t.fg}33`, color: t.fg, background: C.surface }}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                    {c.naam}
                  </p>
                  <p className="mt-0.5 text-[12px]" style={{ ...sans, color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Register · te doen"
        title="Volgende acties"
        sub="Wat er nu telt, op volgorde van urgentie. Kort, concreet, af te vinken."
      />

      <div className="px-6 sm:px-10">
        <Rule />
        <ol>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.warn : C.info;
            return (
              <li key={a.titel} style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4 py-7">
                  <span
                    className="w-10 shrink-0 text-[28px] tabular-nums leading-none"
                    style={{ ...serif, color: C.faint, fontWeight: 400 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[10.5px] uppercase"
                        style={{ ...sans, color: tone, letterSpacing: "0.16em", fontWeight: 600 }}
                      >
                        {warn ? "Waarschuwing" : "Kans"}
                      </span>
                    </div>
                    <h3
                      className="mt-2 text-[19px] leading-snug"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {a.titel}
                    </h3>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ ...sans, color: C.sub }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className={`inline-flex items-center gap-2 self-center rounded-full px-4 py-2 text-[12.5px] transition-colors hover:opacity-90 ${RING}`}
                    style={{
                      background: warn ? C.ink : C.surface,
                      color: warn ? C.surface : C.ink,
                      border: warn ? "none" : `1px solid ${C.hair}`,
                      fontWeight: 500,
                    }}
                  >
                    {a.cta} <ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center gap-3 py-8">
          <Check size={15} strokeWidth={1.9} style={{ color: C.ok }} aria-hidden="true" />
          <p className="text-[13.5px]" style={{ ...serif, color: C.sub }}>
            Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
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
  const concept = FACTUREN.filter((f) => f.status === "Concept").length;

  return (
    <div>
      <PageHead
        kicker="Register · omzet"
        title="Facturen"
        sub="Wat binnen is en wat nog onderweg is. Overzichtelijk, in het net."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] transition-colors hover:opacity-90 ${RING}`}
            style={{ background: C.ink, color: C.surface, fontWeight: 500 }}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="px-6 sm:px-10">
        <Rule />
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {[
            { l: "Ontvangen", v: `€ ${betaald.toLocaleString("nl-NL")}`, tone: C.ok },
            { l: "Openstaand", v: `€ ${open.toLocaleString("nl-NL")}`, tone: C.warn },
            { l: "In concept", v: `${concept}`, tone: C.faint },
          ].map((m, i) => (
            <div
              key={m.l}
              className="py-7"
              style={{
                borderRight: i !== 2 ? `1px solid ${C.hairSoft}` : "none",
                paddingLeft: i === 0 ? 0 : 24,
                paddingRight: 24,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: m.tone }}
                  aria-hidden="true"
                />
                <p
                  className="text-[10.5px] uppercase"
                  style={{ ...sans, color: C.faint, letterSpacing: "0.16em" }}
                >
                  {m.l}
                </p>
              </div>
              <p
                className="mt-2.5 text-[30px] tabular-nums leading-none"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
        <Rule />
      </div>

      <div className="px-6 py-8 sm:px-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                className="text-[10.5px] uppercase"
                style={{ ...sans, color: C.faint, letterSpacing: "0.12em" }}
              >
                <th className="pb-3 pr-4 font-medium">Nummer</th>
                <th className="pb-3 pr-4 font-medium">Klant</th>
                <th className="hidden pb-3 pr-4 font-medium sm:table-cell">Datum</th>
                <th className="pb-3 pr-4 text-right font-medium">Bedrag</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = factuurTone(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: `1px solid ${C.hairSoft}` }}>
                    <td
                      className="py-4 pr-4 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="py-4 pr-4 text-[14px]" style={{ ...serif, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden py-4 pr-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ ...sans, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="py-4 pr-4 text-right text-[14px] tabular-nums"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 text-[12px]"
                        style={{ ...sans, color: t.fg }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {t.label}
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
