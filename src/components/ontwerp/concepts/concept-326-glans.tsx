"use client";

// Concept 326 — "Glans" · Glossy premium-dark fashion-tech.
// Een hoogglans, bijna-zwart canvas met één warme champagne-goud accentkleur voelt als een
// modeblad op zwart — maar functioneert als échte software. Voor gevoelige documenten,
// verificatie en matching straalt dit ingetogen luxe en vertrouwen uit: de glans is een
// accent (dunne lichtranden, zachte radiale sheen), nooit glare of decoratie.
// Fonts: --font-lab-fraunces (editorial display-koppen) + --font-lab-geist (UI/tekst)
// + --font-lab-geist-mono (cijfers, tarieven, bedragen).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  CalendarDays,
  Wallet,
  TrendingUp,
  TrendingDown,
  Command,
  ChevronDown,
  Bell,
  FileText,
  Send,
  Loader2,
  X,
  CircleDot,
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

// ── Palet · hoogglans bijna-zwart + één champagne-goud accent ───────────────────
const C = {
  ink: "#0a0a0c", // diep hoogglans canvas
  inkRaise: "#111014", // paneel-oppervlak
  inkHi: "#17161b", // hover / verhoogd
  gold: "#d4b483", // champagne-goud (het enige accent)
  goldBright: "#e6cfa0", // opgepoetste goud-highlight
  goldSoft: "rgba(212,180,131,0.42)", // goud rand
  goldFaint: "rgba(212,180,131,0.16)", // faint goud hairline
  ivory: "#f2ede4", // heldere tekst op zwart
  body: "#c4bdb0", // bodytekst (≥ 7:1 op #0a0a0c)
  muted: "#a39c8e", // secundair label (≥ 4.5:1)
  danger: "#e8977a", // waarschuwing/afwijzing (warm, geen puur rood)
  ok: "#9fce9f", // geverifieerd-groen (subtiel, met label+icoon)
  hair: "rgba(255,255,255,0.08)", // neutrale hairline
};

const display = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const ui = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

// Sheen op de bovenrand van een oppervlak: dunne licht-naar-transparant hairline.
const topSheen = "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 22%)";

// Zachte radiale sheen achter hero-cijfers (fashion-magazine-glans).
const heroSheen =
  "radial-gradient(120% 140% at 20% 0%, rgba(212,180,131,0.14), transparent 55%)," +
  "radial-gradient(90% 120% at 90% 10%, rgba(212,180,131,0.06), transparent 50%)";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b483] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]";

// ── Kleine bouwstenen ───────────────────────────────────────────────────────────

function Panel({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: C.inkRaise,
        border: `1px solid ${glow ? C.goldSoft : C.hair}`,
        boxShadow: glow
          ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.55)"
          : "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.45)",
      }}
    >
      {/* bovenrand-sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16"
        style={{ backgroundImage: topSheen }}
      />
      {children}
    </div>
  );
}

// Editorial kop met eyebrow en fijne gouden hairline.
function Kop({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <div
        className="mb-2 text-[11px] font-medium uppercase tracking-[0.36em]"
        style={{ ...ui, color: C.gold }}
      >
        {eyebrow}
      </div>
      <h2
        className="text-[30px] font-light leading-[1.02] tracking-[-0.01em] sm:text-[40px]"
        style={{ ...display, color: C.ivory }}
      >
        {title}
      </h2>
      <div className="mt-4 flex items-center gap-2" aria-hidden="true">
        <span
          className="h-px w-14"
          style={{ background: `linear-gradient(90deg, ${C.goldBright}, transparent)` }}
        />
        <span className="h-1 w-1 rotate-45" style={{ background: C.gold }} />
      </div>
    </div>
  );
}

// Sparkline in champagne-goud.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.gold}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Verificatiestatus → label + icoon + tint (status nooit alleen op kleur).
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.gold };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.danger };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.danger };
  }
}

function Chip({ status }: { status: CredStatus }) {
  const { label, Icon, tone } = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        ...ui,
        color: tone,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${tone}`,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Match-ring: percentagemeter met goud-arc.
function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke={C.hair} strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute text-[13px] font-medium" style={{ ...mono, color: C.goldBright }}>
        {value}
      </span>
    </span>
  );
}

// ── Facturen-berekening (server-of-truth-nabootsing: parse cijfers uit bedrag) ───
function parseBedrag(s: string): number {
  const digits = s.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}
function euro(n: number): string {
  const s = Math.round(n).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) parts.unshift(s.slice(Math.max(0, i - 3), i));
  return `€ ${parts.join(".")}`;
}

// ── Shell ────────────────────────────────────────────────────────────────────────

export function Concept326() {
  const [screen, setScreenRaw] = useState<ScreenKey>("dashboard");
  const [loading, setLoading] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  // Screenwissel toont kort een skeleton (deterministische delay, geen random/tijd).
  function go(next: ScreenKey) {
    setCmdOpen(false);
    if (next === screen) return;
    setLoading(true);
    setScreenRaw(next);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...ui, background: C.ink, color: C.body }}
    >
      {/* Achtergrond-sheen over het hele canvas */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: heroSheen }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-0 px-4 py-6 md:flex-row md:gap-8 md:px-8 md:py-10">
        {/* ── Zijnavigatie / merk ── */}
        <aside className="md:w-56 md:shrink-0">
          <div className="flex items-center justify-between md:block">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(140deg, ${C.goldBright}, #b7965f)`,
                  color: C.ink,
                  boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.35)",
                }}
                aria-hidden="true"
              >
                <CircleDot size={18} strokeWidth={2.2} />
              </span>
              <div className="leading-none">
                <div
                  className="text-[22px] font-light tracking-[0.02em]"
                  style={{ ...display, color: C.ivory }}
                >
                  Glans
                </div>
                <div
                  className="mt-1 text-[9px] uppercase tracking-[0.34em]"
                  style={{ color: C.muted }}
                >
                  ZZP · Platform
                </div>
              </div>
            </div>

            {/* Command-knop (mobiel zichtbaar naast merk) */}
            <button
              onClick={() => setCmdOpen(true)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] md:hidden ${focusRing}`}
              style={{ color: C.body, border: `1px solid ${C.hair}` }}
            >
              <Command size={14} aria-hidden="true" /> Menu
            </button>
          </div>

          {/* Navigatielijst (desktop verticaal, mobiel horizontaal scrollend) */}
          <nav
            aria-label="Hoofdnavigatie"
            className="mt-5 flex gap-1 overflow-x-auto md:mt-8 md:flex-col md:gap-1.5 md:overflow-visible"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => go(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group relative shrink-0 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] transition-colors ${focusRing}`}
                  style={{
                    color: on ? C.ink : C.body,
                    fontWeight: on ? 600 : 450,
                    background: on
                      ? `linear-gradient(135deg, ${C.goldBright}, ${C.gold})`
                      : "transparent",
                    boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Command-knop desktop */}
          <button
            onClick={() => setCmdOpen(true)}
            className={`mt-8 hidden w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[12.5px] md:flex ${focusRing}`}
            style={{ color: C.body, border: `1px solid ${C.hair}`, background: C.inkRaise }}
          >
            <span className="flex items-center gap-2">
              <Command size={14} aria-hidden="true" /> Snel zoeken
            </span>
            <kbd
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ ...mono, color: C.muted, border: `1px solid ${C.hair}` }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Profielkaart met vertrouwensniveau */}
          <div
            className="mt-4 flex items-center gap-3 rounded-xl p-3"
            style={{ border: `1px solid ${C.hair}`, background: C.inkRaise }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
              style={{
                ...display,
                background: C.inkHi,
                color: C.goldBright,
                border: `1px solid ${C.goldSoft}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium" style={{ color: C.ivory }}>
                {PROFIEL.naam}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: C.gold }}>
                <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Werkgebied ── */}
        <main className="mt-8 min-w-0 flex-1 md:mt-0">
          {loading ? (
            <ScreenSkeleton />
          ) : (
            <>
              {screen === "dashboard" && (
                <Dashboard onOpen={() => go("opdracht")} onActies={() => go("acties")} />
              )}
              {screen === "marktplaats" && <Marktplaats onOpen={() => go("opdracht")} />}
              {screen === "opdracht" && (
                <OpdrachtDetail opdracht={active} onBack={() => go("marktplaats")} />
              )}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties onOpen={() => go("opdracht")} />}
              {screen === "facturen" && <Facturen />}
            </>
          )}
        </main>
      </div>

      {cmdOpen && <CommandMenu onClose={() => setCmdOpen(false)} onPick={go} />}
    </div>
  );
}

// ── Command-menu (echte interactie: filter + navigeer) ───────────────────────────

function CommandMenu({ onClose, onPick }: { onClose: () => void; onPick: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(5,5,7,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Snel zoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          background: C.inkRaise,
          border: `1px solid ${C.goldSoft}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.hair}` }}
        >
          <Search size={16} style={{ color: C.gold }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm…"
            aria-label="Zoek een scherm"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a8478]"
            style={{ ...ui, color: C.ivory }}
          />
          <button
            onClick={onClose}
            className={`rounded-md p-1 ${focusRing}`}
            style={{ color: C.muted }}
            aria-label="Sluiten"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px]" style={{ color: C.muted }}>
              Geen scherm gevonden voor “{q}”.
            </li>
          ) : (
            results.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => onPick(s.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] transition-colors hover:bg-[#17161b] ${focusRing}`}
                  style={{ color: C.body }}
                >
                  {s.label}
                  <ArrowRight size={14} style={{ color: C.gold }} aria-hidden="true" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

// ── Skeleton (laadstaat bij schermwissel) ────────────────────────────────────────

function ScreenSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-2 h-3 w-24 rounded" style={{ background: C.inkHi }} />
      <div className="mb-8 h-9 w-64 rounded" style={{ background: C.inkHi }} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: C.inkRaise }} />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-20 rounded-2xl" style={{ background: C.inkRaise }} />
        <div className="h-20 rounded-2xl" style={{ background: C.inkRaise }} />
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div>
      <Kop eyebrow="Overzicht" title="Goedemorgen, Sanne" />

      {/* KPI-tegels met sheen achter cijfers + sparklines */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: heroSheen, opacity: 0.5 }}
            />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                {k.label}
              </div>
              <div
                className="mt-2 text-[26px] font-light leading-none"
                style={{ ...display, color: C.ivory }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
              <div
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
                style={{ color: k.up ? C.gold : C.muted }}
              >
                {k.up ? (
                  <TrendingUp size={12} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <TrendingDown size={12} strokeWidth={2.2} aria-hidden="true" />
                )}
                <span style={mono}>{k.trend}</span>
                <span style={{ color: C.muted }}>t.o.v. vorige maand</span>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Volgende actie — prominent */}
        <Panel glow className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]"
                style={{ color: C.gold }}
              >
                <Bell size={12} strokeWidth={2.2} aria-hidden="true" /> Volgende beste actie
              </div>
              <h3
                className="text-[22px] font-light leading-tight"
                style={{ ...display, color: C.ivory }}
              >
                {primair.titel}
              </h3>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.body }}>
                {primair.detail}
              </p>
            </div>
            <span
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex"
              style={{ background: C.inkHi, color: C.danger, border: `1px solid ${C.danger}` }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} strokeWidth={2} />
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <GoldButton onClick={onActies}>{primair.cta}</GoldButton>
            <GhostButton onClick={onActies}>Alle acties</GhostButton>
          </div>
        </Panel>

        {/* Aanbevolen opdracht */}
        <Panel className="p-5">
          <div className="mb-3 text-[11px] uppercase tracking-[0.28em]" style={{ color: C.muted }}>
            Beste match vandaag
          </div>
          <div className="flex items-center gap-3">
            <MatchRing value={(OPDRACHTEN[0] as Opdracht).match} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium" style={{ color: C.ivory }}>
                {(OPDRACHTEN[0] as Opdracht).titel}
              </div>
              <div className="truncate text-[12px]" style={{ color: C.muted }}>
                {(OPDRACHTEN[0] as Opdracht).opdrachtgever}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[12.5px]" style={{ color: C.body }}>
            <Wallet size={13} style={{ color: C.gold }} aria-hidden="true" />
            <span style={mono}>{(OPDRACHTEN[0] as Opdracht).tarief}</span>
          </div>
          <button
            onClick={onOpen}
            className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium ${focusRing} rounded-md`}
            style={{ color: C.goldBright }}
          >
            Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Panel>
      </div>

      {/* Recente berichten */}
      <Panel className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.muted }}>
            Recente berichten
          </div>
        </div>
        <ul className="divide-y" style={{ borderColor: C.hair }}>
          {BERICHTEN.map((b) => (
            <li key={b.van} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                style={{ background: C.inkHi, color: C.gold, border: `1px solid ${C.hair}` }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-medium" style={{ color: C.ivory }}>
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                      style={{ color: C.gold, border: `1px solid ${C.goldSoft}` }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <div className="truncate text-[12.5px]" style={{ color: C.body }}>
                  {b.preview}
                </div>
              </div>
              <span className="shrink-0 text-[11px]" style={{ ...mono, color: C.muted }}>
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = useMemo(
    () =>
      OPDRACHTEN.filter((o) => {
        const t = q.trim().toLowerCase();
        if (!t) return true;
        return (
          o.titel.toLowerCase().includes(t) ||
          o.opdrachtgever.toLowerCase().includes(t) ||
          o.plaats.toLowerCase().includes(t) ||
          o.tags.some((tag) => tag.toLowerCase().includes(t))
        );
      }),
    [q],
  );

  return (
    <div>
      <Kop eyebrow="Marktplaats" title="Opdrachten voor jou" />

      {/* Zoekbalk */}
      <div
        className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.inkRaise, border: `1px solid ${C.hair}` }}
      >
        <Search size={16} style={{ color: C.gold }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of certificaat…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a8478]"
          style={{ ...ui, color: C.ivory }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className={`rounded-md p-1 ${focusRing}`}
            style={{ color: C.muted }}
            aria-label="Zoekopdracht wissen"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Geen opdrachten gevonden"
          detail={`We vonden niets voor “${q}”. Pas je zoekterm aan of verruim je filters.`}
          onReset={() => setQ("")}
        />
      ) : (
        <div className="space-y-4">
          {results.map((o) => {
            const open = expanded === o.id;
            return (
              <Panel key={o.id} className="p-5">
                <div className="flex items-start gap-4">
                  <MatchRing value={o.match} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3
                        className="text-[19px] font-light leading-tight"
                        style={{ ...display, color: C.ivory }}
                      >
                        {o.titel}
                      </h3>
                      <span className="text-[12.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever}
                      </span>
                    </div>

                    <div
                      className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]"
                      style={{ color: C.body }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} style={{ color: C.gold }} aria-hidden="true" />
                        {o.plaats}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet size={13} style={{ color: C.gold }} aria-hidden="true" />
                        <span style={mono}>{o.tarief}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} style={{ color: C.gold }} aria-hidden="true" />
                        {o.uren}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} style={{ color: C.gold }} aria-hidden="true" />
                        {o.start}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-1 text-[11px]"
                          style={{
                            color: C.body,
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${C.hair}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verklaarbare matching — uitklapbaar */}
                <button
                  onClick={() => setExpanded(open ? null : o.id)}
                  aria-expanded={open}
                  className={`mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium ${focusRing} rounded-md`}
                  style={{ color: C.goldBright }}
                >
                  Waarom deze match?
                  <ChevronDown
                    size={14}
                    className="transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : "none" }}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div
                    className="mt-4 grid gap-4 rounded-xl p-4 sm:grid-cols-2"
                    style={{ background: C.ink, border: `1px solid ${C.hair}` }}
                  >
                    <ReasonList title="Sterke punten" items={o.redenen.plus} positive />
                    <ReasonList title="Let op" items={o.redenen.min} positive={false} />
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <GoldButton onClick={onOpen}>Bekijk & reageer</GoldButton>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReasonList({
  title,
  items,
  positive,
}: {
  title: string;
  items: string[];
  positive: boolean;
}) {
  return (
    <div>
      <div
        className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: positive ? C.gold : C.danger }}
      >
        {positive ? (
          <Check size={12} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
        )}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-[13px]" style={{ color: C.body }}>
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: positive ? C.gold : C.danger }}
              aria-hidden="true"
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Opdracht (detail) met reageer-flow ───────────────────────────────────────────

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  function apply() {
    if (state !== "idle") return;
    setState("loading");
    const t = setTimeout(() => setState("done"), 900);
    return () => clearTimeout(t);
  }

  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 text-[12.5px] ${focusRing} rounded-md`}
        style={{ color: C.muted }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.28em]" style={{ color: C.gold }}>
            {opdracht.id} · {opdracht.opdrachtgever}
          </div>
          <h2
            className="max-w-xl text-[30px] font-light leading-[1.05] tracking-[-0.01em] sm:text-[38px]"
            style={{ ...display, color: C.ivory }}
          >
            {opdracht.titel}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <MatchRing value={opdracht.match} size={60} />
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>
              Match
            </div>
            <div className="text-[13px]" style={{ color: C.gold }}>
              Sterk profiel
            </div>
          </div>
        </div>
      </div>

      {/* Feiten-strook */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact icon={Wallet} label="Tarief" value={opdracht.tarief} mono />
        <Fact icon={Clock} label="Inzet" value={opdracht.uren} />
        <Fact icon={CalendarDays} label="Start" value={opdracht.start} />
        <Fact icon={MapPin} label="Plaats" value={opdracht.plaats} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <div className="mb-4 text-[11px] uppercase tracking-[0.28em]" style={{ color: C.muted }}>
            Waarom deze match
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ReasonList title="Sterke punten" items={opdracht.redenen.plus} positive />
            <ReasonList title="Let op" items={opdracht.redenen.min} positive={false} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px]"
                style={{
                  color: C.body,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.hair}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Panel>

        {/* Compliance + reageer-actie */}
        <Panel glow className="p-5">
          <div className="mb-3 text-[11px] uppercase tracking-[0.28em]" style={{ color: C.gold }}>
            Vereiste certificaten
          </div>
          <ul className="space-y-3">
            {CREDENTIALS.slice(0, 3).map((c) => (
              <li key={c.naam} className="flex items-center justify-between gap-2">
                <span className="text-[13px]" style={{ color: C.ivory }}>
                  {c.naam}
                </span>
                <Chip status={c.status} />
              </li>
            ))}
          </ul>

          <div
            className="mt-5 rounded-xl p-3 text-[12px] leading-relaxed"
            style={{ background: C.ink, border: `1px solid ${C.goldFaint}`, color: C.body }}
          >
            Je BIG-registratie en diploma zijn geverifieerd — je voldoet aan de harde eisen voor
            deze opdracht.
          </div>

          <div className="mt-5">
            {state === "done" ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium"
                style={{
                  background: "rgba(159,206,159,0.1)",
                  color: C.ok,
                  border: `1px solid ${C.ok}`,
                }}
                role="status"
              >
                <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                Reactie verstuurd — de opdrachtgever ontvangt je profiel.
              </div>
            ) : (
              <GoldButton onClick={apply} disabled={state === "loading"} full>
                {state === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Versturen…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Send size={15} aria-hidden="true" /> Reageer op opdracht
                  </span>
                )}
              </GoldButton>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  mono: isMono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Panel className="p-4">
      <div
        className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide"
        style={{ color: C.muted }}
      >
        <Icon size={12} style={{ color: C.gold }} aria-hidden="true" />
        {label}
      </div>
      <div className="text-[16px] font-medium" style={{ ...(isMono ? mono : ui), color: C.ivory }}>
        {value}
      </div>
    </Panel>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────

function Verificatie() {
  return (
    <div>
      <Kop eyebrow="Verificatie" title="Certificaten & documenten" />

      {/* Waarschuwing wanneer iets bijna verloopt */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl p-4"
        style={{ background: "rgba(232,151,122,0.08)", border: `1px solid ${C.danger}` }}
        role="alert"
      >
        <AlertTriangle
          size={18}
          style={{ color: C.danger }}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <div className="text-[13.5px] font-medium" style={{ color: C.ivory }}>
            Je VOG (zorg) verloopt over 23 dagen
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.body }}>
            Vernieuw op tijd om verifieerbaar te blijven voor opdrachtgevers.
          </p>
          <button
            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${focusRing}`}
            style={{ color: C.ink, background: C.gold }}
          >
            <Plus size={13} strokeWidth={2.4} aria-hidden="true" /> VOG vernieuwen
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const { tone } = credMeta(c.status);
          const needsAction = c.status === "EXPIRING" || c.status === "REJECTED";
          return (
            <Panel key={c.naam} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: C.inkHi, color: tone, border: `1px solid ${C.hair}` }}
                    aria-hidden="true"
                  >
                    <FileText size={17} strokeWidth={1.9} />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-medium" style={{ color: C.ivory }}>
                      {c.naam}
                    </div>
                    <div className="text-[12.5px]" style={{ color: C.body }}>
                      {c.detail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip status={c.status} />
                  {needsAction && (
                    <button
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${focusRing}`}
                      style={{ color: C.goldBright, border: `1px solid ${C.goldSoft}` }}
                    >
                      {c.status === "EXPIRING" ? "Vernieuwen" : "Opnieuw indienen"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Documentenkluis */}
      <Panel className="mt-6 overflow-hidden p-0">
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.hair}` }}>
          <div className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.muted }}>
            Documentenkluis · privé
          </div>
        </div>
        <ul>
          {DOCUMENTEN.map((d, i) => (
            <li
              key={d.naam}
              className="flex items-center justify-between gap-3 px-5 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold"
                  style={{
                    ...mono,
                    background: C.inkHi,
                    color: C.gold,
                    border: `1px solid ${C.hair}`,
                  }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px]" style={{ color: C.ivory }}>
                    {d.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {d.grootte} · bijgewerkt {d.bijgewerkt}
                  </div>
                </div>
              </div>
              <Chip status={d.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties (next-action-engine) ──────────────────────────────────────────────────

function Acties({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <Kop eyebrow="Acties" title="Wat vraagt nu je aandacht" />
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.danger : C.gold;
          return (
            <Panel key={a.titel} glow={warn} className="p-5">
              <div className="flex items-start gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.inkHi, color: tone, border: `1px solid ${tone}` }}
                  aria-hidden="true"
                >
                  {warn ? (
                    <AlertTriangle size={19} strokeWidth={2} />
                  ) : (
                    <ArrowRight size={19} strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-medium" style={{ color: C.ivory }}>
                      {a.titel}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: tone, border: `1px solid ${tone}` }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <CircleDot size={10} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.body }}>
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    {warn ? (
                      <GoldButton onClick={onOpen}>{a.cta}</GoldButton>
                    ) : (
                      <GhostButton onClick={onOpen}>{a.cta}</GhostButton>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + parseBedrag(f.bedrag),
    0,
  );
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + parseBedrag(f.bedrag),
    0,
  );
  const concept = FACTUREN.filter((f) => f.status === "Concept").length;

  return (
    <div>
      <Kop eyebrow="Facturen" title="Omzet & betalingen" />

      {/* Totalen */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TotalTile label="Ontvangen" value={euro(betaald)} tone={C.ok} />
        <TotalTile label="Openstaand" value={euro(openstaand)} tone={C.danger} />
        <TotalTile label="Concepten" value={String(concept)} tone={C.gold} />
      </div>

      {/* Foutbanner: concept kan niet worden verstuurd zonder bedrag */}
      {concept > 0 && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl p-4"
          style={{ background: "rgba(232,151,122,0.08)", border: `1px solid ${C.danger}` }}
          role="alert"
        >
          <XCircle
            size={17}
            style={{ color: C.danger }}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="text-[12.5px] leading-relaxed" style={{ color: C.body }}>
            <span className="font-medium" style={{ color: C.ivory }}>
              1 concept kan nog niet worden verstuurd.
            </span>{" "}
            Vul een datum in bij FAC-2025-109 om te versturen.
          </div>
        </div>
      )}

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
                    style={{ color: C.muted }}
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => (
                <tr
                  key={f.nr}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
                  className="transition-colors hover:bg-[#17161b]"
                >
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ ...mono, color: C.ivory }}>
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: C.body }}>
                    {f.klant}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-medium sm:text-left"
                    style={{ ...mono, color: C.ivory }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <InvoiceStatus status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function TotalTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Panel className="p-4">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: heroSheen, opacity: 0.4 }}
      />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
          {label}
        </div>
        <div className="mt-1.5 text-[24px] font-light" style={{ ...display, color: C.ivory }}>
          {value}
        </div>
        <span
          className="mt-2 inline-block h-1 w-8 rounded-full"
          style={{ background: tone }}
          aria-hidden="true"
        />
      </div>
    </Panel>
  );
}

function InvoiceStatus({ status }: { status: string }) {
  const map: Record<string, { tone: string; Icon: LucideIcon }> = {
    Betaald: { tone: C.ok, Icon: Check },
    Openstaand: { tone: C.danger, Icon: Clock },
    Concept: { tone: C.muted, Icon: FileText },
  };
  const { tone, Icon } = map[status] ?? { tone: C.muted, Icon: FileText };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ color: tone, border: `1px solid ${tone}`, background: "rgba(255,255,255,0.03)" }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {status}
    </span>
  );
}

// ── Gedeelde knoppen & lege staat ────────────────────────────────────────────────

function GoldButton({
  children,
  onClick,
  disabled = false,
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60 ${
        full ? "w-full" : ""
      } ${focusRing}`}
      style={{
        color: C.ink,
        background: `linear-gradient(135deg, ${C.goldBright}, ${C.gold})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px rgba(212,180,131,0.18)",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-[#17161b] ${focusRing}`}
      style={{ color: C.body, border: `1px solid ${C.hair}` }}
    >
      {children}
    </button>
  );
}

function EmptyState({
  title,
  detail,
  onReset,
}: {
  title: string;
  detail: string;
  onReset: () => void;
}) {
  return (
    <Panel className="p-10 text-center">
      <span
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: C.inkHi, color: C.gold, border: `1px solid ${C.goldSoft}` }}
        aria-hidden="true"
      >
        <Search size={20} />
      </span>
      <h3 className="text-[18px] font-light" style={{ ...display, color: C.ivory }}>
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.body }}>
        {detail}
      </p>
      <div className="mt-5">
        <GhostButton onClick={onReset}>Filters wissen</GhostButton>
      </div>
    </Panel>
  );
}
