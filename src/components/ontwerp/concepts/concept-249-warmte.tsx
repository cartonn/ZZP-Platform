"use client";

// Concept 249 — "Warmte" · Warm-menselijk, mens & vertrouwen centraal.
// Signatuur: menselijk en geruststellend rond gevoelige documenten en zorg-werk. Warme
// aardetinten (zand, klei, zacht-terracotta), ronde vriendelijke vormen, zachte diffuse
// schaduw. Mens-centrale elementen: avatar-initialen met warme ringen, prominente trust-
// signalen, persoonlijke geruststellende microcopy (NL) — feiten uit de mock. Warm én
// professioneel/premium, niet kinderlijk. Contrast blijft WCAG AA ondanks warme tinten.
// Fonts: Fraunces (koppen) + Manrope (body). Cijfers tabular-nums.

import { useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Heart,
  HeartHandshake,
  Bookmark,
  BookmarkCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  Plus,
  Minus,
  ShieldCheck as ShieldIcon,
  MessageSquare,
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

// Warm earth palette. Deep clay ink keeps text AA on the sand surfaces.
const C = {
  sand: "#f6efe4",
  cream: "#fdf9f2",
  card: "#fffdf9",
  cardSoft: "#f3ead9",
  line: "rgba(92,63,42,0.12)",
  lineStrong: "rgba(92,63,42,0.2)",
  ink: "#3a2a1e",
  inkSoft: "#6b5847",
  muted: "#8a7461",
  faint: "#a89583",
  accent: "#b4552f", // soft terracotta — AA on cream for large/semibold text
  accentDeep: "#8f3f20",
  accentSoft: "#f6e2d6",
  green: "#4f6f3a",
  greenSoft: "#e7efdc",
  amber: "#996515",
  amberSoft: "#f6e9cf",
  red: "#a83a34",
  redSoft: "#f6ddd8",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accentDeep, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11.5px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Warm avatar with a soft ring — the human-central motif of this concept.
function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        ...body,
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: C.accentSoft,
        color: C.accentDeep,
        boxShadow: `0 0 0 3px ${C.cream}, 0 0 0 4.5px ${C.accent}`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

const softShadow = "0 14px 40px -22px rgba(92,63,42,0.4)";

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cream : C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 22,
    boxShadow: softShadow,
  };
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1
        className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
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
      <div className="mb-6 flex items-center gap-4">
        <Avatar initials={PROFIEL.initialen} size={52} />
        <div>
          <h1
            className="text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]"
            style={{ ...display, color: C.ink }}
          >
            Fijn je te zien, {voornaam}
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ ...body, color: C.muted }}>
            Je staat er goed voor. Eén ding vraagt vandaag even je aandacht.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="p-4" style={cardStyle()}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-medium" style={{ ...body, color: C.muted }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...body, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={12} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[25px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} tone={C.accent} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Heart size={16} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
            <h2 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Een match die bij je past
            </h2>
          </div>
          <button
            onClick={onOpen}
            className="group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f] focus-visible:ring-offset-2"
            style={cardStyle()}
          >
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
              style={{ background: C.accentSoft, color: C.accentDeep }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-semibold tabular-nums" style={display}>
                {top.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[18px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-0.5 text-[11px] font-medium"
                    style={{ ...body, background: C.cardSoft, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.accent }}
              aria-hidden="true"
            />
          </button>

          <div className="mt-6 flex items-start gap-4 p-5" style={cardStyle(true)}>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <HeartHandshake size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...body, color: C.inkSoft }}>
                Opdrachtgevers zien meteen dat jouw documenten kloppen. Dat geeft rust — voor jou en
                voor hen.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare
              size={16}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            <h2 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Persoonlijke berichten
            </h2>
          </div>
          <ul className="space-y-2.5">
            {BERICHTEN.map((b) => (
              <li key={b.van} className="flex items-center gap-3 p-3.5" style={cardStyle()}>
                <Avatar initials={b.initialen} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.accent }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="truncate text-[12.5px]" style={{ ...body, color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...body, color: C.faint }}
                >
                  {b.tijd}
                </span>
              </li>
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
        title="Opdrachten die bij je passen"
        sub="We tonen eerlijk waarom een opdracht past — en waar je even op moet letten."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.accent }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
            style={{ ...body, color: C.accentDeep, background: C.accentSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={cardStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Nog niets gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — we blijven
            meekijken.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-5 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
                style={cardStyle()}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
                    style={{ background: C.accentSoft, color: C.accentDeep }}
                    aria-hidden="true"
                  >
                    <span className="text-[17px] font-semibold tabular-nums" style={display}>
                      {o.match}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider">match</span>
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
                    style={{
                      background: isSaved ? C.accentSoft : C.cardSoft,
                      color: isSaved ? C.accent : C.muted,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[16.5px] font-semibold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...body, color: C.inkSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...body, background: C.accent }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2.4}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </article>
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
        className="mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
        style={{ ...body, color: C.inkSoft, background: C.cardSoft }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="p-6" style={cardStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
              style={{ background: C.accentSoft, color: C.accentDeep }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-semibold tabular-nums" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div>
              <h2
                className="text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
            style={{
              ...body,
              color: isSaved ? C.accent : C.inkSoft,
              background: isSaved ? C.accentSoft : C.cardSoft,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
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
            <div key={m.label} className="rounded-2xl p-3" style={{ background: C.cardSoft }}>
              <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={cardStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={cardStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, background: applied ? C.green : C.accent }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Je reactie is verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.muted }}>
            Fijn — de opdrachtgever reageert gemiddeld binnen 6 uur.
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
        title="Jouw documenten, veilig bewaard"
        sub="Alles wat je gevoelige papieren betreft, houden we privé en zorgvuldig bij."
      />

      <div className="mb-6 flex items-center gap-4 p-5" style={cardStyle(true)}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft, color: C.green }}
          aria-hidden="true"
        >
          <ShieldIcon size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={cardStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
                  style={{
                    border: `1.5px solid ${done ? C.accent : C.lineStrong}`,
                    background: done ? C.accent : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...display, color: C.ink }}
            >
              <FileText
                size={17}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
              style={{ background: C.cardSoft, color: C.accent }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.accent : C.cardSoft,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={cardStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.cardSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.cardSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={cardStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...body, background: C.accent }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={cardStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                    style={{ ...body, background: C.cardSoft, color: C.accentDeep }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...body, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} />
                </li>
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
      <ScreenHead title="Wat vraagt vandaag je aandacht" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={cardStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Heart size={30} strokeWidth={2} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Je bent helemaal bij
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Niets meer te doen vandaag. Neem gerust even rust.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: C.accentSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...body, background: C.accent }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.accentDeep }}>
              {openCount} {openCount === 1 ? "puntje" : "puntjes"} voor vandaag
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={cardStyle()}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        ...body,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...body, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.amber : C.accentDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.accentSoft,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.cardSoft };
  return (
    <div>
      <ScreenHead
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={cardStyle()}>
            <div className="text-[11.5px] font-medium" style={{ ...body, color: C.muted }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden p-2" style={cardStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...body, color: C.muted }}
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
                    className="transition-colors hover:bg-[#f6efe4]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...body, color: C.accentDeep }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...body, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold"
                        style={{ ...body, color: t.fg, background: t.bg }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={3} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2.6} aria-hidden="true" />
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
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept249() {
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
      style={{ ...body, color: C.ink, background: C.sand }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <HeartHandshake size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Warmte
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ ...body, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <Avatar initials={PROFIEL.initialen} size={44} />
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4552f]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.accent : C.card,
                  border: `1px solid ${on ? C.accent : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
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
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare
              size={12}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen ·{" "}
            <Bell size={11} strokeWidth={2.2} className="inline" aria-hidden="true" />{" "}
            {ACTIES.length} acties
          </span>
          <span>Met zorg gemaakt</span>
        </footer>
      </div>
    </div>
  );
}
