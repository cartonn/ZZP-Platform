"use client";

// Concept 260 — "Lichtbak" · Diapositief & doorlichting op een verlichte lichtbak.
// Signature: a dark room with a backlit light table. Content is framed as 35mm slide mounts
// and filmstrips that glow from behind (translucent film windows lit by a daylight-white
// backlight). Sprocket-hole perforations run along the film edges in amber. Hovering (or
// focusing) a slide triggers a loupe — a circular magnifier that enlarges the frame's key
// figure. The marketplace is a contact sheet: opdrachten laid out as slide frames on the
// light table. Glow is purely decorative; all text sits on dark film for WCAG AA legibility.
// Fonts: JetBrains Mono (technical labels) + Inter (body). Daylight-white glow + amber #f5a623.

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  Sun,
  Film,
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

// Dark light-table palette. Light text on dark film keeps AA; glow is decorative only.
const C = {
  room: "#0d0e11",
  panel: "#15171c",
  film: "#191c22",
  filmLift: "#1f232a",
  mount: "#23272f",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.17)",
  ink: "#f3f5f8",
  inkSoft: "#c6ccd5",
  muted: "#8a919c",
  faint: "#5e646e",
  glow: "#fbfaf3",
  glowSoft: "rgba(251,250,243,0.14)",
  amber: "#f5a623",
  amberText: "#f7b545",
  amberSoft: "rgba(245,166,35,0.16)",
  green: "#63d18d",
  greenSoft: "rgba(99,209,141,0.16)",
  blue: "#7cb8ff",
  blueSoft: "rgba(124,184,255,0.16)",
  red: "#f4756e",
  redSoft: "rgba(244,117,110,0.16)",
};

const mono = { fontFamily: "var(--font-lab-mono)" };
const sans = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0e11]";

// A row of sprocket perforations — the film-edge detail, lit amber from behind the mount.
function Sprockets({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-2.5 shrink-0"
          style={{
            background: C.amberSoft,
            border: `1px solid rgba(245,166,35,0.4)`,
            borderRadius: 1.5,
          }}
        />
      ))}
    </div>
  );
}

// A backlit slide mount: dark plastic frame with sprocket edges and a glowing film window.
function Slide({
  children,
  className,
  style,
  lit = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  lit?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        background: `linear-gradient(180deg, ${C.mount}, ${C.panel})`,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        boxShadow: lit
          ? "0 0 26px -10px rgba(251,250,243,0.22), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      <Sprockets className="px-2 pt-1.5" />
      <div
        className="m-1.5 mb-1 mt-1"
        style={{
          background: lit
            ? `radial-gradient(130% 90% at 50% 0%, ${C.glowSoft}, rgba(251,250,243,0.03) 55%, transparent), ${C.film}`
            : C.film,
          border: `1px solid ${C.lineStrong}`,
          borderRadius: 5,
        }}
      >
        {children}
      </div>
      <Sprockets className="px-2 pb-1.5" />
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.blue, bg: C.blueSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.amberText, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...mono, color: fg, background: bg, border: `1px solid ${fg}` }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Backlit glowing line chart — the trace glows daylight-white above a soft film gradient.
function GlowLine({
  data,
  tone = C.glow,
  height = 34,
}: {
  data: number[];
  tone?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 72 - 14;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={area} fill="rgba(251,250,243,0.07)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 3px rgba(251,250,243,0.7))" }}
      />
    </svg>
  );
}

// The loupe: a circular magnifier that enlarges a slide's headline figure on hover/focus.
function Loupe({ value, label }: { value: string; label: string }) {
  return (
    <span
      className="pointer-events-none absolute -right-3 -top-3 z-10 flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full"
      style={{
        background: `radial-gradient(circle at 50% 35%, ${C.filmLift}, ${C.room})`,
        border: `2px solid ${C.amber}`,
        boxShadow: "0 0 22px -4px rgba(245,166,35,0.55), inset 0 0 14px rgba(251,250,243,0.12)",
      }}
      aria-hidden="true"
    >
      <span
        className="text-[17px] font-bold tabular-nums leading-none"
        style={{ ...mono, color: C.glow }}
      >
        {value}
      </span>
      <span
        className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.amberText }}
      >
        {label}
      </span>
    </span>
  );
}

function ScreenHead({ title, sub, code }: { title: string; sub?: string; code?: string }) {
  return (
    <div className="mb-6">
      {code && (
        <div
          className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.amberText }}
        >
          <Film size={12} strokeWidth={2} aria-hidden="true" />
          {code}
        </div>
      )}
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...sans, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-6">
        <div
          className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.amberText }}
        >
          Lichtbak · {PROFIEL.plaats}
        </div>
        <h1
          className="text-[26px] font-semibold leading-none tracking-tight sm:text-[30px]"
          style={{ ...sans, color: C.ink }}
        >
          Welkom terug, {voornaam}
        </h1>
        <p className="mt-2 text-[13px]" style={{ ...sans, color: C.muted }}>
          Je week ligt op de lichtbak. Eén dia vraagt vandaag om aandacht.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Slide key={k.label}>
              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amberText }}
                  >
                    <Trend size={11} strokeWidth={2} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
                  style={{ ...sans, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-2">
                  <GlowLine data={k.spark} />
                </div>
              </div>
            </Slide>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <ZoomIn size={15} strokeWidth={2} style={{ color: C.amberText }} aria-hidden="true" />
            <h2
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              Uitgelichte dia
            </h2>
          </div>
          <Slide>
            <button
              onClick={onOpen}
              className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            >
              <span
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg leading-none"
                style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}
                aria-hidden="true"
              >
                <span
                  className="text-[20px] font-bold tabular-nums"
                  style={{ ...mono, color: C.amberText }}
                >
                  {top.match}
                </span>
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.amberText }}
                >
                  match
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[17px] font-semibold leading-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{ ...sans, color: C.inkSoft, border: `1px solid ${C.line}` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight
                size={19}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.amberText }}
                aria-hidden="true"
              />
            </button>
          </Slide>

          <Slide className="mt-6">
            <div className="flex items-start gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
                aria-hidden="true"
              >
                <ShieldCheck size={22} strokeWidth={2} />
              </span>
              <div>
                <div className="inline-flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {PROFIEL.trust}
                  </span>
                  <BadgeCheck
                    size={15}
                    strokeWidth={2}
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className="mt-1 text-[13px] leading-relaxed"
                  style={{ ...sans, color: C.inkSoft }}
                >
                  Je documenten zijn doorgelicht en geverifieerd — opdrachtgevers zien meteen dat
                  het klopt.
                </p>
              </div>
            </div>
          </Slide>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2} style={{ color: C.amberText }} aria-hidden="true" />
            <h2
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              Op de lichtbak
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Slide key={a.titel}>
                <div className="flex items-start gap-2.5 p-3.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: a.urgentie === "warning" ? C.amber : C.blue,
                      boxShadow: `0 0 8px ${a.urgentie === "warning" ? "rgba(245,166,35,0.7)" : "rgba(124,184,255,0.7)"}`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[12.5px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.amberText }}>
                      {a.cta}
                    </div>
                  </div>
                </div>
              </Slide>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({
  query,
  setQuery,
  saved,
  toggleSave,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const [loupe, setLoupe] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q) ||
      o.opdrachtgever.toLowerCase().includes(q) ||
      o.plaats.toLowerCase().includes(q) ||
      o.tags.some((t) => t.toLowerCase().includes(q)),
  );
  return (
    <div>
      <ScreenHead
        code="Contactafdruk · opdrachten"
        title="Contact sheet"
        sub="De opdrachten liggen als dia's op de lichtbak. Beweeg over een dia om te vergroten met de loep."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-lg px-4 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.amberText }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${RING}`}
            style={{
              ...mono,
              color: C.amberText,
              background: C.amberSoft,
              border: `1px solid ${C.amber}`,
            }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Slide className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.amberSoft, color: C.amberText, border: `1px solid ${C.amber}` }}
            aria-hidden="true"
          >
            <Film size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[18px] font-semibold" style={{ ...sans, color: C.ink }}>
            Geen dia gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets op de lichtbak voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-lg px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...sans, background: C.amber, color: C.room }}
          >
            Filter wissen
          </button>
        </Slide>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const lit = loupe === o.id;
            return (
              <div
                key={o.id}
                className="relative"
                onMouseEnter={() => setLoupe(o.id)}
                onMouseLeave={() => setLoupe((v) => (v === o.id ? null : v))}
              >
                {lit && <Loupe value={String(o.match)} label="match" />}
                <Slide
                  className="h-full transition-transform"
                  style={{ transform: lit ? "translateY(-2px)" : undefined }}
                >
                  <div
                    className="flex h-full flex-col p-4"
                    onFocusCapture={() => setLoupe(o.id)}
                    onBlurCapture={() => setLoupe((v) => (v === o.id ? null : v))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="text-[10px] font-medium uppercase tracking-[0.16em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${RING}`}
                        style={{
                          background: isSaved ? C.amberSoft : "transparent",
                          color: isSaved ? C.amberText : C.muted,
                          border: `1px solid ${isSaved ? C.amber : C.line}`,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <h3
                      className="mt-2 text-[15.5px] font-semibold leading-tight"
                      style={{ ...sans, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.muted }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                      style={{ ...sans, color: C.inkSoft }}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {o.plaats}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {o.tarief}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {o.uren}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {o.start}
                      </div>
                    </dl>
                    <p
                      className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-snug"
                      style={{ ...sans, color: lit ? C.amberText : C.muted }}
                    >
                      <ZoomIn
                        size={13}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {o.redenen.plus[0]}
                    </p>
                    <button
                      onClick={() => onOpen(o)}
                      className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold ${RING}`}
                      style={{ ...sans, background: C.amber, color: C.room }}
                    >
                      Bekijk dia
                      <ArrowRight
                        size={14}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Slide>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const isSaved = saved.has(opdracht.id);
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...mono, color: C.inkSoft, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug naar contact sheet
      </button>

      <Slide>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg leading-none"
                style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}
                aria-hidden="true"
              >
                <span
                  className="text-[20px] font-bold tabular-nums"
                  style={{ ...mono, color: C.amberText }}
                >
                  {opdracht.match}
                </span>
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.amberText }}
                >
                  match
                </span>
              </span>
              <div>
                <div
                  className="text-[10px] font-medium uppercase tracking-[0.2em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {opdracht.id}
                </div>
                <h2
                  className="text-[22px] font-semibold leading-tight tracking-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {opdracht.titel}
                </h2>
                <div className="mt-1 text-[13.5px]" style={{ ...sans, color: C.muted }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSave(opdracht.id)}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold ${RING}`}
              style={{
                ...mono,
                color: isSaved ? C.amberText : C.inkSoft,
                background: isSaved ? C.amberSoft : C.panel,
                border: `1px solid ${isSaved ? C.amber : C.line}`,
              }}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-3"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <m.Icon
                  size={14}
                  strokeWidth={2}
                  style={{ color: C.amberText }}
                  aria-hidden="true"
                />
                <div
                  className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[13.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Slide>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
                aria-hidden="true"
              >
                <Plus size={13} strokeWidth={2.4} />
              </span>
              <span
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkSoft }}
              >
                Waarom deze past
              </span>
            </div>
            <ul className="space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ ...sans, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Slide>
        <Slide>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{
                  background: C.amberSoft,
                  color: C.amberText,
                  border: `1px solid ${C.amber}`,
                }}
                aria-hidden="true"
              >
                <Minus size={13} strokeWidth={2.4} />
              </span>
              <span
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkSoft }}
              >
                Even op letten
              </span>
            </div>
            <ul className="space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ ...sans, color: C.inkSoft }}
                >
                  <TriangleAlert
                    size={15}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amberText }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Slide>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold ${RING}`}
          style={{ ...sans, background: applied ? C.green : C.amber, color: C.room }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div>
      <ScreenHead
        code="Doorlichting · privé & versleuteld"
        title="Documenten, doorgelicht"
        sub="Alles wat je gevoelige papieren betreft houden we privé en zorgvuldig bij."
      />

      <Slide className="mb-6">
        <div className="flex items-center gap-4 p-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </Slide>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Slide key={c.naam}>
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.amber : C.lineStrong}`,
                      background: done ? C.amber : "transparent",
                      color: C.room,
                    }}
                  >
                    {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...mono, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              </Slide>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              <FileText
                size={16}
                strokeWidth={2}
                style={{ color: C.amberText }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${RING}`}
              style={{ background: C.panel, color: C.amberText, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? C.room : C.muted,
                  background: feedState === s ? C.amber : C.panel,
                  border: `1px solid ${feedState === s ? C.amber : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Slide key={i} lit={false}>
                  <div className="p-3.5">
                    <div
                      className="h-3 w-2/3 animate-pulse rounded-full"
                      style={{ background: C.mount }}
                    />
                    <div
                      className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                      style={{ background: C.mount }}
                    />
                  </div>
                </Slide>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Slide className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.red}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{ ...sans, background: C.amber, color: C.room }}
              >
                Opnieuw proberen
              </button>
            </Slide>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Slide key={d.naam}>
                  <div className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: C.panel,
                        color: C.amberText,
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusChip status={d.status} />
                  </div>
                </Slide>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead code="Acties · takenlijst" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Slide className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...sans, color: C.ink }}>
            De lichtbak is leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Alle dia&apos;s zijn bekeken.
          </p>
        </Slide>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-3.5 py-2"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.amber, color: C.room }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...mono, color: C.amberText }}>
              {openCount} {openCount === 1 ? "dia" : "dia's"} nog te bekijken
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Slide key={a.titel}>
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                        background: isDone ? C.green : "transparent",
                        color: C.room,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...sans,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...sans, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{
                            ...mono,
                            color: a.urgentie === "warning" ? C.amberText : C.blue,
                            background: a.urgentie === "warning" ? C.amberSoft : C.blueSoft,
                            border: `1px solid ${a.urgentie === "warning" ? C.amber : C.blue}`,
                          }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Slide>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amberText, bg: C.amberSoft }
        : { fg: C.muted, bg: C.panel };
  return (
    <div>
      <ScreenHead
        code="Facturen · doorgelicht overzicht"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amberText },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Slide key={s.label}>
              <div className="p-4">
                <div
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1 text-[21px] font-semibold tabular-nums"
                  style={{ ...sans, color: s.tone }}
                >
                  {s.value}
                </div>
              </div>
            </Slide>
          ))}
        </div>
        <Slide>
          <div className="flex h-full flex-col justify-between p-4">
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.muted }}
            >
              Bedrag per factuur
            </div>
            <GlowLine data={trend} tone={C.amber} height={44} />
          </div>
        </Slide>
      </div>

      <Slide>
        <div className="overflow-hidden p-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f) => {
                  const t = badgeTone(f.status);
                  return (
                    <tr
                      key={f.nr}
                      className="transition-colors hover:bg-[#1f232a]"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <td
                        className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                        style={{ ...mono, color: C.amberText }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-3 py-3 text-[13px]" style={{ ...sans, color: C.ink }}>
                        {f.klant}
                      </td>
                      <td
                        className="px-3 py-3 text-[12.5px] tabular-nums"
                        style={{ ...mono, color: C.muted }}
                      >
                        {f.datum}
                      </td>
                      <td
                        className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                        style={{ ...sans, color: C.ink }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            ...mono,
                            color: t.fg,
                            background: t.bg,
                            border: `1px solid ${t.fg}`,
                          }}
                        >
                          {f.status === "Betaald" ? (
                            <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={11} strokeWidth={2} aria-hidden="true" />
                          ) : (
                            <FileText size={11} strokeWidth={2} aria-hidden="true" />
                          )}
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
      </Slide>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept260() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.room }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{
                background: C.amberSoft,
                color: C.amberText,
                border: `1px solid ${C.amber}`,
                boxShadow: "0 0 18px -6px rgba(245,166,35,0.6)",
              }}
              aria-hidden="true"
            >
              <Sun size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Lichtbak
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{
                ...mono,
                background: C.panel,
                color: C.amberText,
                border: `1px solid ${C.amber}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.room : C.inkSoft,
                  background: on ? C.amber : C.panel,
                  border: `1px solid ${on ? C.amber : C.line}`,
                  boxShadow: on ? "0 0 16px -6px rgba(245,166,35,0.6)" : undefined,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && (
            <Marktplaats
              query={query}
              setQuery={setQuery}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail
              opdracht={active}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onBack={() => setScreen("marktplaats")}
            />
          )}
          {screen === "verificatie" && (
            <Verificatie
              checked={checked}
              toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
              feedState={feedState}
              setFeedState={setFeedState}
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Sun size={12} strokeWidth={2} style={{ color: C.amberText }} aria-hidden="true" />
            Backlit · {ACTIES.length} dia&apos;s op de lichtbak
          </span>
          <span>Doorgelicht met zorg</span>
        </footer>
      </div>
    </div>
  );
}
