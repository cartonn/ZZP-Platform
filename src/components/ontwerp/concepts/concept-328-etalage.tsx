"use client";

// Concept 328 — "Etalage" · marketplace-forward retail polish.
// De marktplaats is de etalage van een premium winkel: grote, aantrekkelijke opdracht-kaarten met
// het match-% als "aanbeveling", sorteer-/filterchips, een opslaan-interactie en een e-commerce-
// achtige productpagina per opdracht (tarief als prijs, redenen.plus als "voordelen",
// compliance-eisen als specificaties). Fris, licht en uitnodigend met één energiek accent —
// Stripe/Shopify-polish. Verificatie voelt als een keurmerk, wat vertrouwen wekt bij gevoelige documenten.
// Fonts: --font-lab-jakarta (koppen), --font-lab-inter (tekst), --font-lab-geist-mono (prijzen/cijfers).

import { useEffect, useState } from "react";
import {
  Store,
  LayoutGrid,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Heart,
  Star,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ChevronRight,
  MapPin,
  Plus,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  TrendingUp,
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

/* ---------- Retail-palet: licht, fris, één energiek accent ---------- */

const C = {
  canvas: "#f6f6fb",
  surface: "#ffffff",
  surfaceAlt: "#fbfbfe",
  ink: "#16181f",
  sub: "#5b6472",
  faint: "#98a0af",
  line: "#ececf2",
  lineSoft: "#f3f3f8",
  accent: "#6d43f5", // energiek violet
  accentDeep: "#5a31e0",
  accentSoft: "#efeafe",
  coral: "#ff5a4d", // opgeslagen / aanbieding
  coralSoft: "#ffe9e6",
  mint: "#0e9f6e", // match / betaald
  mintSoft: "#e2f6ee",
  amber: "#b7791f",
  amberSoft: "#fbf1dd",
};

const head = { fontFamily: "var(--font-lab-jakarta)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d43f5] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: ShoppingBag,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: ShoppingBag,
  berichten: ShoppingBag,
};

/* ---------- Status → betekenis (label + icoon + kleur) ---------- */

type CredMeta = { label: string; fg: string; bg: string; Icon: LucideIcon };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.mint, bg: C.mintSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.coral, bg: C.coralSoft, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Bouwstenen ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: m.fg, background: m.bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 76;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace(/[^a-z0-9]/gi, "");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`et-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#et-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />}
    </svg>
  );
}

// Aanbeveling: match-% als retail-rating met sterren-gevoel.
function MatchPill({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
      style={{ ...body, background: C.mintSoft, color: C.mint }}
    >
      <Star size={12} strokeWidth={2.4} fill={C.mint} aria-hidden="true" />
      <span className="tabular-nums" style={mono}>
        {value}%
      </span>
      <span className="sr-only">match — aanbevolen</span>
    </span>
  );
}

function SaveButton({
  saved,
  onToggle,
  size = 40,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? "Verwijder uit opgeslagen" : "Opdracht opslaan"}
      className={`flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${RING}`}
      style={{
        width: size,
        height: size,
        background: saved ? C.coralSoft : C.surface,
        border: `1px solid ${saved ? C.coral : C.line}`,
      }}
    >
      <Heart
        size={size * 0.42}
        strokeWidth={2.2}
        aria-hidden="true"
        style={{ color: saved ? C.coral : C.faint }}
        fill={saved ? C.coral : "none"}
      />
    </button>
  );
}

function ScreenHead({
  eyebrow,
  titel,
  sub,
  right,
}: {
  eyebrow: string;
  titel: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ ...body, color: C.accent }}
        >
          {eyebrow}
        </p>
        <h1
          className="mt-1.5 text-[27px] font-extrabold leading-tight tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {titel}
        </h1>
        {sub && (
          <p className="mt-1 text-[13.5px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept328() {
  const [screen, setScreen] = useState<ScreenKey>("marktplaats");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [saved, setSaved] = useState<Record<string, boolean>>({ [OPDRACHTEN[1]?.id ?? ""]: true });
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [screen]);

  const savedCount = Object.values(saved).filter(Boolean).length;
  const toggleSave = (id: string) => setSaved((s) => ({ ...s, [id]: !s[id] }));
  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`
        @keyframes et-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes et-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      `}</style>

      <div className="mx-auto flex min-h-[680px] max-w-[1280px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col border-r md:flex"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})` }}
              aria-hidden="true"
            >
              <Store size={18} strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <p
                className="text-[14px] font-extrabold tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                Etalage
              </p>
              <p className="text-[10.5px]" style={{ color: C.faint }}>
                Opdrachtenmarkt
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 pt-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? C.accent : C.sub,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={on ? 2.5 : 2}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.faint }}
                  />
                  <span className="flex-1 text-left">{s.label}</span>
                  {s.key === "marktplaats" && savedCount > 0 && (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold tabular-nums"
                      style={{ ...mono, background: C.coralSoft, color: C.coral }}
                    >
                      {savedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-3">
            <div
              className="rounded-2xl p-3.5"
              style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{
                    ...mono,
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: C.mint }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex items-center gap-3 border-b px-5 py-4 md:px-8"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="md:hidden">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})` }}
                aria-hidden="true"
              >
                <Store size={16} strokeWidth={2.4} />
              </span>
            </div>
            <div
              className="hidden items-center gap-2 rounded-full px-4 py-2 md:flex"
              style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
            >
              <Search size={15} strokeWidth={2.2} aria-hidden="true" style={{ color: C.faint }} />
              <input
                placeholder="Zoek in de etalage…"
                aria-label="Zoeken"
                className="w-[260px] bg-transparent text-[13px] outline-none placeholder:text-[#98a0af]"
                style={{ color: C.ink }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                onClick={() => setScreen("marktplaats")}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${RING}`}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
                aria-label={`Opgeslagen opdrachten (${savedCount})`}
              >
                <Heart size={17} strokeWidth={2.2} aria-hidden="true" style={{ color: C.coral }} />
                {savedCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white"
                    style={{ ...mono, background: C.coral }}
                  >
                    {savedCount}
                  </span>
                )}
              </button>
              <button
                className={`hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white sm:inline-flex ${RING}`}
                style={{ background: C.accent }}
              >
                <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuw
              </button>
            </div>
          </header>

          {/* Mobiele switcher */}
          <div
            className="flex gap-1.5 overflow-x-auto border-b px-5 py-2.5 md:hidden"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? "#fff" : C.sub,
                    background: on ? C.accent : C.surfaceAlt,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div key={screen} className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
            {loading ? (
              <ScreenSkeleton />
            ) : (
              <div style={{ animation: "et-rise 0.4s ease" }}>
                {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
                {screen === "marktplaats" && (
                  <Marktplaats
                    saved={saved}
                    onSave={toggleSave}
                    onOpen={open}
                    onSelect={setActiveId}
                    activeId={activeId}
                  />
                )}
                {screen === "opdracht" && (
                  <OpdrachtDetail
                    opdracht={active}
                    saved={!!saved[active.id]}
                    onSave={() => toggleSave(active.id)}
                    onBack={() => setScreen("marktplaats")}
                  />
                )}
                {screen === "verificatie" && <Verificatie />}
                {screen === "acties" && <Acties onGo={setScreen} />}
                {screen === "facturen" && <Facturen />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Etalage wordt geladen…</span>
      <div
        className="h-8 w-56 rounded-lg"
        style={{ background: C.lineSoft, animation: "et-pulse 1.2s ease-in-out infinite" }}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-64 rounded-2xl border"
            style={{
              background: C.surface,
              borderColor: C.line,
              animation: "et-pulse 1.2s ease-in-out infinite",
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
  const warn = ACTIES[0];
  return (
    <div>
      <ScreenHead
        eyebrow="Welkom terug"
        titel="Goedemiddag, Sanne"
        sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
        right={
          <button
            onClick={() => onGo("marktplaats")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.accent }}
          >
            <Store size={15} strokeWidth={2.4} aria-hidden="true" /> Naar de etalage
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border p-4"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold" style={{ color: C.sub }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.mint : C.amber }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums leading-none"
              style={{ ...head, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2.5">
              <Spark data={k.spark} color={k.up ? C.accent : C.amber} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2
              className="flex items-center gap-2 text-[16px] font-extrabold"
              style={{ ...head, color: C.ink }}
            >
              <Sparkles
                size={16}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ color: C.accent }}
              />
              Aanbevolen voor jou
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.accent }}
            >
              Alles bekijken <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OPDRACHTEN.slice(0, 2).map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`overflow-hidden rounded-2xl border text-left transition-shadow hover:shadow-lg ${RING}`}
                style={{ background: C.surface, borderColor: C.line }}
              >
                <div
                  className="flex items-center justify-between px-4 pb-3 pt-4"
                  style={{ background: C.accentSoft }}
                >
                  <MatchPill value={o.match} />
                  <span
                    className="text-[15px] font-extrabold tabular-nums"
                    style={{ ...mono, color: C.accentDeep }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[14.5px] font-bold" style={{ color: C.ink }}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-0.5 flex items-center gap-1 text-[12px]"
                    style={{ color: C.sub }}
                  >
                    <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.plaats}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {warn && (
            <div
              className="rounded-2xl border p-4"
              style={{ background: C.amberSoft, borderColor: `${C.amber}44` }}
            >
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.amber }}
              >
                Volgende actie
              </p>
              <p className="mt-1.5 text-[15px] font-bold" style={{ color: C.ink }}>
                {warn.titel}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white ${RING}`}
                style={{ background: C.amber }}
              >
                {warn.cta} <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          <div
            className="rounded-2xl border p-4"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: C.sub }}>
                Vertrouwensniveau
              </p>
              <span
                className="inline-flex items-center gap-1 text-[11.5px] font-bold"
                style={{ color: C.mint }}
              >
                <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> Keurmerk
              </span>
            </div>
            <p className="mt-1.5 text-[19px] font-extrabold" style={{ ...head, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "82%",
                  background: `linear-gradient(90deg, ${C.accent}, ${C.mint})`,
                }}
              />
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: C.faint }}>
              Geverifieerde profielen krijgen tot 3× meer reacties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats (de etalage) ---------- */

type SortKey = "match" | "tarief" | "start";

function Marktplaats({
  saved,
  onSave,
  onOpen,
  onSelect,
  activeId,
}: {
  saved: Record<string, boolean>;
  onSave: (id: string) => void;
  onOpen: (id?: string) => void;
  onSelect: (id: string) => void;
  activeId: string;
}) {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("Alle");
  const [sort, setSort] = useState<SortKey>("match");
  const [onlySaved, setOnlySaved] = useState(false);
  const chips = ["Alle", "BIG", "Avond", "GGZ", "Dagdienst"];
  const sorts: { key: SortKey; label: string }[] = [
    { key: "match", label: "Beste match" },
    { key: "tarief", label: "Hoogste tarief" },
    { key: "start", label: "Snelste start" },
  ];

  const filtered = OPDRACHTEN.filter((o) => {
    const mQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const mC = chip === "Alle" || o.tags.some((t) => t.toLowerCase().includes(chip.toLowerCase()));
    const mS = !onlySaved || !!saved[o.id];
    return mQ && mC && mS;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "match") return b.match - a.match;
    if (sort === "tarief") return digits(b.tarief) - digits(a.tarief);
    return a.start.localeCompare(b.start);
  });

  return (
    <div>
      <ScreenHead
        eyebrow="De etalage"
        titel="Opdrachten voor jou"
        sub="Persoonlijk aanbevolen op basis van je profiel, tarief en beschikbaarheid."
      />

      {/* Zoek + sorteer */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
        style={{ background: C.surface, borderColor: C.line }}
      >
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
        >
          <Search size={16} strokeWidth={2.2} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#98a0af]"
            style={{ color: C.ink }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal
            size={15}
            strokeWidth={2.2}
            aria-hidden="true"
            style={{ color: C.faint }}
          />
          {sorts.map((s) => {
            const on = s.key === sort;
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  color: on ? C.accent : C.sub,
                  background: on ? C.accentSoft : "transparent",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filterchips + opgeslagen-toggle */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const on = c === chip;
          return (
            <button
              key={c}
              onClick={() => setChip(c)}
              aria-pressed={on}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
              style={{
                color: on ? "#fff" : C.sub,
                background: on ? C.ink : C.surface,
                border: `1px solid ${on ? C.ink : C.line}`,
              }}
            >
              {c}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px" style={{ background: C.line }} aria-hidden="true" />
        <button
          onClick={() => setOnlySaved((v) => !v)}
          aria-pressed={onlySaved}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
          style={{
            color: onlySaved ? C.coral : C.sub,
            background: onlySaved ? C.coralSoft : C.surface,
            border: `1px solid ${onlySaved ? C.coral : C.line}`,
          }}
        >
          <Heart
            size={13}
            strokeWidth={2.4}
            aria-hidden="true"
            fill={onlySaved ? C.coral : "none"}
            style={{ color: onlySaved ? C.coral : C.faint }}
          />
          Opgeslagen
        </button>
        <span className="ml-auto text-[12px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {sorted.length} resultaten
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Store size={26} strokeWidth={2} style={{ color: C.accent }} />
          </span>
          <p className="mt-4 text-[17px] font-extrabold" style={{ ...head, color: C.ink }}>
            De etalage is hier leeg
          </p>
          <p className="mt-1 max-w-[320px] text-[13px]" style={{ color: C.sub }}>
            {onlySaved
              ? "Je hebt nog geen opdrachten opgeslagen. Tik op het hartje bij een kaart."
              : "Geen opdracht past bij deze filters. Wis ze en bekijk het hele aanbod."}
          </p>
          <button
            onClick={() => {
              setQ("");
              setChip("Alle");
              setOnlySaved(false);
            }}
            className={`mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold text-white ${RING}`}
            style={{ background: C.accent }}
          >
            Toon alles
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((o) => (
            <ProductCard
              key={o.id}
              opdracht={o}
              saved={!!saved[o.id]}
              onSave={() => onSave(o.id)}
              onOpen={() => onOpen(o.id)}
              onSelect={() => onSelect(o.id)}
              active={o.id === activeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Etalage-kaart met hover-onthulling van de match-redenen.
function ProductCard({
  opdracht,
  saved,
  onSave,
  onOpen,
  onSelect,
  active,
}: {
  opdracht: Opdracht;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  onSelect: () => void;
  active: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-xl"
      style={{
        background: C.surface,
        borderColor: active ? C.accent : C.line,
        boxShadow: active ? `0 0 0 3px ${C.accentSoft}` : undefined,
      }}
    >
      {/* Etalage-"cover" */}
      <div
        className="relative flex h-24 items-end justify-between px-4 pb-3"
        style={{
          background: `linear-gradient(135deg, ${C.accentSoft}, #fdf1ff)`,
        }}
      >
        <span
          className="absolute right-3 top-3"
          style={{ transform: hover ? "scale(1.05)" : "scale(1)", transition: "transform 0.2s" }}
        >
          <SaveButton saved={saved} onToggle={onSave} size={38} />
        </span>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.accentDeep }}
          >
            {opdracht.id}
          </p>
          <MatchPill value={opdracht.match} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button
          onClick={() => {
            onSelect();
            onOpen();
          }}
          className={`text-left ${RING} rounded-md`}
        >
          <p
            className="text-[15.5px] font-extrabold leading-snug"
            style={{ ...head, color: C.ink }}
          >
            {opdracht.titel}
          </p>
        </button>
        <p className="mt-1 flex items-center gap-1 text-[12.5px]" style={{ color: C.sub }}>
          <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {opdracht.opdrachtgever} ·{" "}
          {opdracht.plaats}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {opdracht.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ background: C.lineSoft, color: C.sub }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Hover-onthulling: waarom aanbevolen */}
        <div
          className="grid transition-all duration-300"
          style={{
            gridTemplateRows: hover ? "1fr" : "0fr",
            opacity: hover ? 1 : 0,
            marginTop: hover ? 12 : 0,
          }}
        >
          <div className="overflow-hidden">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...body, color: C.mint }}
            >
              Waarom aanbevolen
            </p>
            <ul className="mt-1.5 space-y-1">
              {opdracht.redenen.plus.slice(0, 2).map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-1.5 text-[12px]"
                  style={{ color: C.sub }}
                >
                  <Check
                    size={13}
                    strokeWidth={2.8}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: C.mint }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            <span
              className="text-[18px] font-extrabold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {opdracht.tarief.replace(" / uur", "")}
            </span>
            <span className="text-[12px]" style={{ color: C.faint }}>
              {" "}
              / uur
            </span>
          </div>
          <button
            onClick={() => {
              onSelect();
              onOpen();
            }}
            className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-bold text-white transition-transform active:scale-[0.97] ${RING}`}
            style={{ background: C.accent }}
          >
            Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail (productpagina) ---------- */

function OpdrachtDetail({
  opdracht,
  saved,
  onSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: boolean;
  onSave: () => void;
  onBack: () => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold ${RING}`}
        style={{ color: C.sub }}
      >
        <ChevronRight size={14} strokeWidth={2.6} className="rotate-180" aria-hidden="true" /> Terug
        naar de etalage
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Linker: product-"gallerij" + omschrijving */}
        <div className="space-y-5">
          <div
            className="overflow-hidden rounded-3xl border"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <div
              className="flex items-center justify-between px-6 py-8"
              style={{ background: `linear-gradient(135deg, ${C.accentSoft}, #fdf1ff)` }}
            >
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.accentDeep }}
                >
                  {opdracht.id}
                </p>
                <h1
                  className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {opdracht.titel}
                </h1>
                <p className="mt-1.5 text-[13.5px]" style={{ color: C.sub }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </p>
              </div>
              <MatchPill value={opdracht.match} />
            </div>
            <div className="flex flex-wrap gap-2 px-6 py-4">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ background: C.lineSoft, color: C.sub }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* "Voordelen" = redenen.plus */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <h2
              className="flex items-center gap-2 text-[15px] font-extrabold"
              style={{ ...head, color: C.ink }}
            >
              <TrendingUp
                size={16}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ color: C.mint }}
              />
              Voordelen van deze opdracht
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-xl p-3 text-[13px]"
                  style={{ background: C.mintSoft, color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={3}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: C.mint }}
                  />
                  {r}
                </li>
              ))}
            </ul>

            <h3
              className="mt-5 flex items-center gap-2 text-[13px] font-bold"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Goed om te weten
            </h3>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.sub }}>
                  <AlertTriangle
                    size={14}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rechter: "koop-blok" — prijs, specs, compliance, reageren */}
        <div className="space-y-5">
          <div
            className="rounded-2xl border p-5"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] font-semibold" style={{ color: C.sub }}>
                  Tarief
                </p>
                <p
                  className="mt-0.5 text-[30px] font-extrabold tabular-nums leading-none"
                  style={{ ...mono, color: C.ink }}
                >
                  {opdracht.tarief.replace(" / uur", "")}
                </p>
                <p className="text-[12px]" style={{ color: C.faint }}>
                  per uur · {opdracht.uren}
                </p>
              </div>
              <SaveButton saved={saved} onToggle={onSave} size={44} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                { l: "Start", v: opdracht.start },
                { l: "Omvang", v: opdracht.uren },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl p-3"
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
                >
                  <dt className="text-[11px] font-semibold" style={{ color: C.faint }}>
                    {s.l}
                  </dt>
                  <dd className="mt-0.5 text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>

            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14.5px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ background: state === "sent" ? C.mint : C.accent }}
            >
              {state === "idle" && (
                <>
                  <ShoppingBag size={17} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={17} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11.5px]" style={{ color: C.faint }}>
              Gemiddelde reactietijd: 6 uur · vrijblijvend
            </p>
          </div>

          {/* Compliance-eisen als "specificaties" */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <h2
              className="flex items-center gap-2 text-[14px] font-extrabold"
              style={{ ...head, color: C.ink }}
            >
              <ShieldCheck
                size={15}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ color: C.accent }}
              />
              Vereiste keurmerken
            </h2>
            <p className="mt-1 text-[12px]" style={{ color: C.sub }}>
              Deze opdracht vraagt geldige, geverifieerde documenten.
            </p>
            <div className="mt-3 space-y-2">
              <SpecRow label="BIG-registratie" status="VERIFIED" />
              <SpecRow label="VOG (zorg)" status="EXPIRING" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, status }: { label: string; status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
    >
      <span
        className="flex items-center gap-2 text-[12.5px] font-semibold"
        style={{ color: C.ink }}
      >
        <Icon size={14} strokeWidth={2.4} aria-hidden="true" style={{ color: m.fg }} />
        {label}
      </span>
      <StatusBadge status={status} />
    </div>
  );
}

/* ---------- Verificatie (keurmerken) ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <ScreenHead
        eyebrow="Vertrouwen"
        titel="Jouw keurmerken"
        sub="Veilig en privé bewaard. Geverifieerde documenten laten opdrachtgevers je sneller kiezen."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        <div
          className="rounded-2xl border p-5"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <p className="text-[12.5px] font-semibold" style={{ color: C.sub }}>
            Verificatiegraad
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span
              className="text-[34px] font-extrabold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {pct}%
            </span>
            <span
              className="pb-1 text-[13px] font-semibold tabular-nums"
              style={{ ...mono, color: C.sub }}
            >
              {verified}/{total}
            </span>
          </div>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full"
            style={{ background: C.lineSoft }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.mint})`,
              }}
            />
          </div>

          {expiring && (
            <div
              className="mt-4 rounded-xl border p-3.5"
              style={{ background: C.amberSoft, borderColor: `${C.amber}44` }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[12.5px] font-bold"
                style={{ color: C.amber }}
              >
                <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" />
                {expiring.naam} verloopt
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je keurmerk te behouden.
              </p>
              <button
                className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white ${RING}`}
                style={{ background: C.amber }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const Icon = m.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-2xl border p-4"
                style={{ background: C.surface, borderColor: C.line }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg }}
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusBadge status={c.status} />
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
      <ScreenHead
        eyebrow="Prioriteiten"
        titel="Volgende acties"
        sub="Gerangschikt op urgentie — rond af wat je zichtbaarheid vergroot."
      />
      <ul className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.amber : C.accent;
          const accentSoft = warn ? C.amberSoft : C.accentSoft;
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-2xl border p-4"
              style={{ background: C.surface, borderColor: C.line }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-extrabold tabular-nums"
                style={{ ...mono, background: accentSoft, color: accent }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...body, color: accent }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-0.5 text-[14.5px] font-bold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`shrink-0 self-center rounded-full px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? C.amber : C.accent,
                  color: "#fff",
                }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-4 flex items-center gap-2 rounded-2xl border p-4"
        style={{ background: C.mintSoft, borderColor: `${C.mint}33` }}
      >
        <Check size={15} strokeWidth={2.6} aria-hidden="true" style={{ color: C.mint }} />
        <p className="text-[12.5px]" style={{ color: C.sub }}>
          Verder is alles bijgewerkt. Nieuwe kansen verschijnen vanzelf in je etalage.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const tone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.mint, bg: C.mintSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.faint, bg: C.lineSoft },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div>
      <ScreenHead
        eyebrow="Kassa"
        titel="Facturen"
        right={
          <button
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-white ${RING}`}
            style={{ background: C.accent }}
          >
            <Plus size={16} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div
          className="rounded-2xl border p-4"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: C.mint }}>
            Ontvangen
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: C.ink }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.amber }}
          >
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: C.ink }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="col-span-2 rounded-2xl border p-4 sm:col-span-1"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Facturen
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: C.ink }}
          >
            {FACTUREN.length}
          </p>
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-2xl border"
        style={{ background: C.surface, borderColor: C.line }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10px] uppercase tracking-[0.12em]"
                style={{ borderColor: C.line, color: C.faint }}
              >
                <th className="px-4 py-3 font-semibold">Nummer</th>
                <th className="px-4 py-3 font-semibold">Klant</th>
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = tone[f.status] ?? { fg: C.faint, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-0 hover:bg-[#fbfbfe]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
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
