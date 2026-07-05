"use client";

// Concept 95 — "Bubbel" · berichten-first / chat-shell (iMessage/WhatsApp-grade, strak-premium).
// Alles is een thread: opdrachtgevers, verificatie-updates en systeemnotificaties verschijnen als
// chatbubbels met tijdstempels, lees-bevestiging (dubbele vink) en een statische typ-indicator.
// Het dashboard is een inbox met threads + gepinde acties; een opdracht-detail is een gesprek met de
// opdrachtgever met een rijke opdracht-kaart in de stream en quick-replies onderaan. Licht, vriendelijk,
// maar zakelijk: alle platform-complexiteit wordt een rustige conversatie.
// Fonts: --font-lab-jakarta (kop/UI, vriendelijk-geometrisch) + --font-lab-inter (body).

import { useState } from "react";
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Pin,
  Search,
  Paperclip,
  MapPin,
  ArrowRight,
  Plus,
  FileText,
  Upload,
  Bell,
  Store,
  Wallet,
  LayoutGrid,
  Sparkles,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;
void KPIS;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#eef1f5",
  panel: "#ffffff",
  rail: "#f7f9fb",
  ink: "#0b1220",
  sub: "#5a6473",
  faint: "#8b95a4",
  accent: "#2563eb",
  accentDeep: "#1d4ed8",
  bubbleThem: "#eceff3",
  line: "rgba(11,18,32,0.09)",
  lineSoft: "rgba(11,18,32,0.05)",
  ok: "#178a4e",
  warn: "#b0791f",
  alert: "#c23b30",
  info: "#3f6ea5",
};

const heading = { fontFamily: "var(--font-lab-jakarta)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]";

/* ---------- Status → betekenis ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.info, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const SCREEN_ICON: Record<ScreenKey, typeof MessageCircle> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: MessageCircle,
  verificatie: ShieldCheck,
  acties: Bell,
  facturen: Wallet,
  documenten: FileText,
  berichten: MessageCircle,
};

/* ---------- Chat-bouwstenen ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}14`,
        border: `1px solid ${m.color}33`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Avatar({ initials, tint = C.accent }: { initials: string; tint?: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
      style={{ ...heading, color: tint, background: `${tint}18` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function ReadReceipt({ read }: { read: boolean }) {
  return read ? (
    <CheckCheck size={13} strokeWidth={2.4} color={C.accent} aria-label="Gelezen" />
  ) : (
    <Check size={13} strokeWidth={2.4} color={C.faint} aria-label="Verzonden" />
  );
}

function Bubble({
  from,
  time,
  read,
  children,
  tone = "default",
}: {
  from: "them" | "me" | "system";
  time?: string;
  read?: boolean;
  children: React.ReactNode;
  tone?: "default" | "warn" | "ok";
}) {
  if (from === "system") {
    const color = tone === "warn" ? C.warn : tone === "ok" ? C.ok : C.info;
    return (
      <div className="my-3 flex justify-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium"
          style={{ ...body, color, background: `${color}12`, border: `1px solid ${color}2a` }}
        >
          {children}
          {time && <span style={{ color: C.faint }}> · {time}</span>}
        </span>
      </div>
    );
  }
  const me = from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[78%]">
        <div
          className={`px-4 py-2.5 text-[14px] leading-relaxed ${
            me ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
          }`}
          style={
            me
              ? { ...body, background: C.accent, color: "#fff" }
              : { ...body, background: C.bubbleThem, color: C.ink }
          }
        >
          {children}
        </div>
        {time && (
          <div
            className={`mt-1 flex items-center gap-1 text-[11px] ${me ? "justify-end" : "justify-start"}`}
            style={{ color: C.faint }}
          >
            <span>{time}</span>
            {me && <ReadReceipt read={!!read} />}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${name} is aan het typen`}>
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-md px-3.5 py-3"
        style={{ background: C.bubbleThem }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: C.faint,
              animation: `bubbelDot 1.2s ${i * 0.18}s infinite ease-in-out`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-[11.5px]" style={{ color: C.faint }}>
        {name} typt…
      </span>
      <style>{`@keyframes bubbelDot{0%,60%,100%{opacity:0.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-2px)}}`}</style>
    </div>
  );
}

function QuickReplies({ options, onPick }: { options: string[]; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-[#2563eb] hover:text-white ${RING}`}
          style={{
            ...body,
            color: C.accentDeep,
            background: `${C.accent}12`,
            border: `1px solid ${C.accent}33`,
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------- Rijke opdracht-kaart in de stream (handtekening-element) ---------- */

function OpdrachtCard({ o, onOpen }: { o: Opdracht; onOpen?: (id: string) => void }) {
  return (
    <div
      className="w-full max-w-[86%] overflow-hidden rounded-2xl"
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 14px 30px -26px rgba(11,18,32,0.5)",
      }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <span className="text-[11.5px] font-semibold tracking-wide" style={{ color: C.accent }}>
            {o.id}
          </span>
          <p className="mt-0.5 truncate text-[15px] font-bold" style={{ ...heading, color: C.ink }}>
            {o.titel}
          </p>
          <p
            className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
            style={{ color: C.sub }}
          >
            <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
          </p>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[14px] font-bold tabular-nums"
          style={{ ...heading, color: C.accentDeep, background: `${C.accent}14` }}
          aria-label={`Match ${o.match} procent`}
        >
          {o.match}
          <span className="text-[8px] font-semibold" style={{ color: C.accent }} aria-hidden="true">
            match
          </span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px" style={{ background: C.lineSoft }}>
        {[
          { l: "Tarief", v: o.tarief },
          { l: "Omvang", v: o.uren },
          { l: "Start", v: o.start },
        ].map((m) => (
          <div key={m.l} className="p-3 text-center" style={{ background: C.panel }}>
            <p
              className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold tabular-nums" style={{ color: C.ink }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={() => onOpen(o.id)}
          className={`flex w-full items-center justify-center gap-1.5 py-3 text-[13px] font-semibold transition-colors hover:bg-[#f0f4fb] ${RING}`}
          style={{ ...body, color: C.accentDeep, borderTop: `1px solid ${C.lineSoft}` }}
        >
          Open gesprek <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- Composer ---------- */

function Composer({
  placeholder = "Typ een bericht…",
  onSend,
  quick,
  onQuick,
}: {
  placeholder?: string;
  onSend?: () => void;
  quick?: string[];
  onQuick?: (v: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div
      className="space-y-3 border-t p-3.5"
      style={{ borderColor: C.lineSoft, background: C.panel }}
    >
      {quick && quick.length > 0 && onQuick && <QuickReplies options={quick} onPick={onQuick} />}
      <div
        className="flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5"
        style={{ background: C.rail, border: `1px solid ${C.line}` }}
      >
        <button
          type="button"
          aria-label="Bijlage toevoegen"
          className={`shrink-0 rounded-full p-1.5 transition-colors hover:bg-black/5 ${RING}`}
          style={{ color: C.faint }}
        >
          <Paperclip size={17} strokeWidth={2} aria-hidden="true" />
        </button>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          aria-label="Bericht typen"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8b95a4]"
          style={{ ...body, color: C.ink }}
        />
        <button
          type="button"
          onClick={() => {
            setVal("");
            onSend?.();
          }}
          aria-label="Verstuur bericht"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${RING}`}
          style={{ background: C.accent, color: "#fff" }}
        >
          <Send size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Thread-header ---------- */

function ThreadHeader({
  title,
  subtitle,
  initials,
  tint = C.accent,
  online,
}: {
  title: string;
  subtitle: string;
  initials: string;
  tint?: string;
  online?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{ borderColor: C.lineSoft, background: C.panel }}
    >
      <div className="relative">
        <Avatar initials={initials} tint={tint} />
        {online && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
            style={{ background: C.ok, borderColor: C.panel }}
            aria-label="Online"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold" style={{ ...heading, color: C.ink }}>
          {title}
        </p>
        <p className="truncate text-[12px]" style={{ color: online ? C.ok : C.faint }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept95() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id: string) => {
    setActiveId(id);
    setScreen("opdracht");
  };

  const threadMeta: Record<
    ScreenKey,
    { title: string; preview: string; time: string; unread: number }
  > = {
    dashboard: { title: "Inbox", preview: "Overzicht van je gesprekken", time: "nu", unread: 0 },
    marktplaats: {
      title: "Marktplaats",
      preview: `${OPDRACHTEN.length} nieuwe opdrachten voor je`,
      time: "09:40",
      unread: OPDRACHTEN.length,
    },
    opdracht: { title: active.opdrachtgever, preview: active.titel, time: "09:24", unread: 1 },
    verificatie: {
      title: "Verificatie",
      preview: "Je VOG verloopt over 23 dagen",
      time: "08:10",
      unread: 1,
    },
    acties: {
      title: "Acties",
      preview: `${ACTIES.length} dingen vragen je aandacht`,
      time: "Vandaag",
      unread: 2,
    },
    facturen: {
      title: "Facturatie",
      preview: "FAC-2025-118 staat nog open",
      time: "Ma",
      unread: 0,
    },
    documenten: { title: "Documenten", preview: "", time: "", unread: 0 },
    berichten: { title: "Berichten", preview: "", time: "", unread: 0 },
  };

  return (
    <div
      className="relative flex min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* Inbox-rail */}
      <aside
        className="hidden w-[280px] shrink-0 flex-col md:flex"
        style={{ background: C.rail, borderRight: `1px solid ${C.line}` }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{ background: C.accent }}
            aria-hidden="true"
          >
            <MessageCircle size={18} strokeWidth={2.2} color="#fff" />
          </span>
          <div className="min-w-0">
            <p
              className="text-[15px] font-bold tracking-tight"
              style={{ ...heading, color: C.ink }}
            >
              Bubbel
            </p>
            <p className="text-[11px]" style={{ color: C.faint }}>
              {PROFIEL.naam}
            </p>
          </div>
        </div>

        <div className="px-3 pt-3">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={15} strokeWidth={2} color={C.faint} aria-hidden="true" />
            <span className="text-[13px]" style={{ color: C.faint }}>
              Zoek in gesprekken
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2" aria-label="Gesprekken">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const meta = threadMeta[s.key];
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors ${RING}`}
                style={{
                  background: on ? C.panel : "transparent",
                  boxShadow: on ? "0 8px 20px -18px rgba(11,18,32,0.6)" : "none",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: on ? `${C.accent}14` : C.bubbleThem }}
                  aria-hidden="true"
                >
                  <Icon size={18} strokeWidth={2} color={on ? C.accent : C.sub} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
                      {meta.title}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                      {meta.time}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px]" style={{ color: C.sub }}>
                      {meta.preview}
                    </span>
                    {meta.unread > 0 && (
                      <span
                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold text-white"
                        style={{ background: C.accent }}
                        aria-label={`${meta.unread} ongelezen`}
                      >
                        {meta.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 border-t p-3" style={{ borderColor: C.lineSoft }}>
          <Avatar initials={PROFIEL.initialen} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </p>
            <p className="flex items-center gap-1 text-[11px]" style={{ color: C.ok }}>
              <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </p>
          </div>
        </div>
      </aside>

      {/* Conversatie-pane */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobiele screen-switcher */}
        <div
          className="flex gap-1 overflow-x-auto border-b p-2 md:hidden"
          style={{ borderColor: C.lineSoft, background: C.panel }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${RING}`}
                style={{ color: on ? "#fff" : C.sub, background: on ? C.accent : C.rail }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {screen === "dashboard" && (
          <InboxHome onGo={setScreen} onOpen={openOpdracht} threadMeta={threadMeta} />
        )}
        {screen === "marktplaats" && <MarktplaatsThread onOpen={openOpdracht} />}
        {screen === "opdracht" && <OpdrachtThread opdracht={active} />}
        {screen === "verificatie" && <VerificatieThread />}
        {screen === "acties" && <ActiesThread onGo={setScreen} />}
        {screen === "facturen" && <FacturenThread />}
      </main>
    </div>
  );
}

/* ---------- Dashboard = inbox-home met gepinde acties ---------- */

function InboxHome({
  onGo,
  onOpen,
  threadMeta,
}: {
  onGo: (k: ScreenKey) => void;
  onOpen: (id: string) => void;
  threadMeta: Record<ScreenKey, { title: string; preview: string; time: string; unread: number }>;
}) {
  const pinned = ACTIES[0];
  const voornaam = PROFIEL.naam.split(" ")[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Inbox"
        subtitle={`Hoi ${voornaam} · ${PROFIEL.trust}`}
        initials={PROFIEL.initialen}
        online
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Gepinde actie */}
        {pinned && (
          <div
            className="rounded-2xl p-4"
            style={{ background: `${C.warn}0f`, border: `1px solid ${C.warn}33` }}
          >
            <div className="flex items-center gap-2">
              <Pin size={14} strokeWidth={2.4} color={C.warn} aria-hidden="true" />
              <span
                className="text-[11.5px] font-bold uppercase tracking-wide"
                style={{ color: C.warn }}
              >
                Gepind
              </span>
            </div>
            <p className="mt-2 text-[15px] font-bold" style={{ ...heading, color: C.ink }}>
              {pinned.titel}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
              {pinned.detail}
            </p>
            <button
              type="button"
              onClick={() => onGo("verificatie")}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white ${RING}`}
              style={{ background: C.warn }}
            >
              {pinned.cta} <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Weekcijfers als kaart-bubbel */}
        <div
          className="rounded-2xl p-4"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <p
            className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide"
            style={{ color: C.accent }}
          >
            <Sparkles size={13} strokeWidth={2.4} aria-hidden="true" /> Je week in cijfers
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.label}>
                <p className="text-[11px] font-medium leading-tight" style={{ color: C.faint }}>
                  {k.label}
                </p>
                <p
                  className="mt-1 text-[19px] font-bold tabular-nums tracking-tight"
                  style={{ ...heading, color: C.ink }}
                >
                  {k.value}
                </p>
                <p className="text-[11.5px] font-semibold" style={{ color: k.up ? C.ok : C.warn }}>
                  {k.up ? "▲" : "▼"} {k.trend}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recente threads */}
        <div>
          <p
            className="mb-2 px-1 text-[11.5px] font-bold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            Gesprekken
          </p>
          <ul className="space-y-1.5">
            {BERICHTEN.map((b) => (
              <li key={b.van}>
                <button
                  type="button"
                  onClick={() => onOpen(OPDRACHTEN[0]?.id ?? "")}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-[#f3f6fa] ${RING}`}
                  style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}
                >
                  <Avatar initials={b.initialen} tint={b.ongelezen ? C.accent : C.faint} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[13.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[11px] tabular-nums"
                        style={{ color: C.faint }}
                      >
                        {b.tijd}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px]" style={{ color: C.sub }}>
                        {b.preview}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Snel naar */}
        <div className="grid grid-cols-2 gap-2">
          {(["marktplaats", "facturen"] as ScreenKey[]).map((k) => {
            const Icon = SCREEN_ICON[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => onGo(k)}
                className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-left ${RING}`}
                style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: `${C.accent}12` }}
                  aria-hidden="true"
                >
                  <Icon size={17} strokeWidth={2} color={C.accent} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold" style={{ color: C.ink }}>
                    {threadMeta[k].title}
                  </span>
                  <span className="block truncate text-[11.5px]" style={{ color: C.sub }}>
                    {threadMeta[k].preview}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats-thread ---------- */

function MarktplaatsThread({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Marktplaats"
        subtitle={`${OPDRACHTEN.length} passende opdrachten`}
        initials="MP"
        tint={C.info}
        online
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Bubble from="system" tone="default">
          Nieuwe matches op basis van je profiel
        </Bubble>
        <Bubble from="them">
          Hoi! Ik heb {OPDRACHTEN.length} opdrachten gevonden die goed bij je passen. 👇
        </Bubble>
        {OPDRACHTEN.map((o, i) => (
          <div key={o.id} className="flex justify-start">
            <OpdrachtCard o={o} onOpen={onOpen} />
            {i === OPDRACHTEN.length - 1 && null}
          </div>
        ))}
        <TypingIndicator name="Marktplaats" />
      </div>
      <Composer
        placeholder="Vraag om meer opdrachten…"
        quick={["Toon alleen boven 90%", "Alleen in de buurt", "Meer laden"]}
        onQuick={() => undefined}
      />
    </div>
  );
}

/* ---------- Opdracht-thread — gesprek met opdrachtgever ---------- */

type Msg = { from: "them" | "me"; text: string; time: string; read?: boolean };

function OpdrachtThread({ opdracht }: { opdracht: Opdracht }) {
  const [extra, setExtra] = useState<Msg[]>([]);
  const [replied, setReplied] = useState(false);

  const reply = (text: string) => {
    setExtra((prev) => [...prev, { from: "me", text, time: "09:41", read: true }]);
    setReplied(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title={opdracht.opdrachtgever}
        subtitle="Online · reageert meestal snel"
        initials={opdracht.opdrachtgever.slice(0, 2).toUpperCase()}
        online
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Bubble from="system" tone="default">
          Gesprek gestart · {opdracht.id}
        </Bubble>
        <Bubble from="them" time="09:20">
          Hoi {PROFIEL.naam.split(" ")[0]}! We zoeken iemand voor onze opdracht. Ik stuur je de
          details.
        </Bubble>
        <div className="flex justify-start">
          <OpdrachtCard o={opdracht} />
        </div>
        <Bubble from="them" time="09:22">
          Zou dit iets voor je zijn? Je match is {opdracht.match}%.
        </Bubble>

        {/* Waarom-past-het als bubbel */}
        <Bubble from="them" time="09:22" tone="ok">
          <span className="mb-1 flex items-center gap-1.5 font-semibold" style={{ color: C.ok }}>
            <Check size={13} strokeWidth={3} aria-hidden="true" /> Waarom dit past
          </span>
          <ul className="space-y-1">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-1.5">
                <Check
                  size={13}
                  strokeWidth={2.4}
                  color={C.ok}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Bubble>

        {extra.map((m, i) => (
          <Bubble key={i} from={m.from} time={m.time} read={m.read}>
            {m.text}
          </Bubble>
        ))}

        {replied ? (
          <Bubble from="them" time="09:42">
            Top! Ik zet je voorlopig in de planning en kom snel bij je terug. 🙌
          </Bubble>
        ) : (
          <TypingIndicator name={opdracht.opdrachtgever} />
        )}
      </div>
      <Composer
        placeholder="Schrijf een reactie…"
        onSend={() => reply("Ja, dit past goed bij me. Ik reageer graag!")}
        quick={
          replied
            ? ["Wanneer kan ik starten?", "Bedankt!"]
            : ["Ja, ik reageer graag!", "Ik wil eerst meer weten", "Wat is de reistijd?"]
        }
        onQuick={(v) => reply(v)}
      />
    </div>
  );
}

/* ---------- Verificatie-thread — status-updates + upload ---------- */

function VerificatieThread() {
  const [uploads, setUploads] = useState<Record<string, "idle" | "uploading" | "done">>({});
  const setU = (naam: string, s: "idle" | "uploading" | "done") =>
    setUploads((p) => ({ ...p, [naam]: s }));

  const startUpload = (naam: string) => {
    if (uploads[naam] === "uploading" || uploads[naam] === "done") return;
    setU(naam, "uploading");
    window.setTimeout(() => setU(naam, "done"), 950);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Verificatie"
        subtitle="Je certificaten & bewijsstukken"
        initials="VF"
        tint={C.ok}
        online
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Bubble from="system" tone="default">
          Je bewijsstukken worden veilig en privé bewaard
        </Bubble>
        <Bubble from="them" time="08:10">
          Hoi! Zo staat je verificatie ervoor. Ik houd je op de hoogte van elke wijziging.
        </Bubble>

        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const state = uploads[c.naam] ?? "idle";
          const canUpload = c.status === "EXPIRING" || c.status === "REJECTED";
          const doc = DOCUMENTEN.find((d) => d.status === c.status);
          return (
            <div key={c.naam} className="flex justify-start">
              <div
                className="w-full max-w-[86%] rounded-2xl p-4"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: `${m.color}14` }}
                      aria-hidden="true"
                    >
                      <m.Icon size={17} strokeWidth={2} color={m.color} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold" style={{ color: C.ink }}>
                        {c.naam}
                      </p>
                      <p className="truncate text-[12px]" style={{ color: C.sub }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                {canUpload && (
                  <div className="mt-3">
                    {state === "done" ? (
                      <div
                        className="flex items-center gap-2 rounded-xl p-2.5 text-[12.5px]"
                        style={{ background: `${C.ok}12`, color: C.ink }}
                        role="status"
                      >
                        <Check size={15} strokeWidth={2.6} color={C.ok} aria-hidden="true" />
                        {doc ? doc.naam : "Nieuw bewijs"} toegevoegd — in beoordeling.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startUpload(c.naam)}
                        disabled={state === "uploading"}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-70 ${RING}`}
                        style={{ color: "#fff", background: C.accent }}
                      >
                        {state === "uploading" ? (
                          <>
                            <span
                              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                              aria-hidden="true"
                            />
                            Uploaden…
                          </>
                        ) : (
                          <>
                            <Upload size={15} strokeWidth={2.2} aria-hidden="true" /> Nieuw bewijs
                            uploaden
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Bubble from="system" tone="warn" time="net">
          <AlertTriangle size={12} strokeWidth={2.4} className="mr-1 inline" aria-hidden="true" />
          Je VOG verloopt over 23 dagen
        </Bubble>
      </div>
      <Composer
        placeholder="Stel een vraag over je verificatie…"
        quick={["Hoe vraag ik een VOG aan?", "Hoe lang duurt beoordeling?"]}
        onQuick={() => undefined}
      />
    </div>
  );
}

/* ---------- Acties-thread ---------- */

function ActiesThread({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Acties"
        subtitle={`${ACTIES.length} dingen vragen je aandacht`}
        initials="AC"
        tint={C.warn}
        online
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Bubble from="them" time="Vandaag">
          Goedemorgen! Dit zou ik vandaag als eerste oppakken. 👇
        </Bubble>
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          return (
            <div key={a.titel} className="flex justify-start">
              <div
                className="w-full max-w-[86%] rounded-2xl p-4"
                style={{ background: C.panel, border: `1px solid ${warn ? color + "33" : C.line}` }}
              >
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ color }}
                >
                  {warn ? (
                    <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" />
                  )}
                  {warn ? "Belangrijk" : "Kans"}
                </span>
                <p className="mt-1.5 text-[14.5px] font-bold" style={{ ...heading, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
                <button
                  type="button"
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold ${RING}`}
                  style={{
                    color: warn ? "#fff" : C.accentDeep,
                    background: warn ? C.warn : `${C.accent}12`,
                    border: warn ? "none" : `1px solid ${C.accent}33`,
                  }}
                >
                  {a.cta} <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
        <Bubble from="system" tone="ok">
          <Check size={12} strokeWidth={3} className="mr-1 inline" aria-hidden="true" /> Verder ben
          je helemaal bij
        </Bubble>
      </div>
      <Composer
        placeholder="Vraag om je volgende stap…"
        quick={["Wat is nu het belangrijkst?", "Toon alleen urgente"]}
        onQuick={() => undefined}
      />
    </div>
  );
}

/* ---------- Facturen-thread ---------- */

function FacturenThread() {
  const statusMeta: Record<string, { color: string }> = {
    Betaald: { color: C.ok },
    Openstaand: { color: C.warn },
    Concept: { color: C.faint },
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
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Facturatie"
        subtitle="Je facturen & betalingen"
        initials="FA"
        tint={C.accent}
        online
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Bubble from="them" time="Ma">
          Hoi! Dit is de stand van je facturen. Eén factuur staat nog open.
        </Bubble>

        <div className="flex justify-start">
          <div className="grid w-full max-w-[86%] grid-cols-2 gap-2">
            <div
              className="rounded-2xl p-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[11.5px] font-medium uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...heading, color: C.ok }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[11.5px] font-medium uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...heading, color: C.warn }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>

        {FACTUREN.map((f) => {
          const color = statusMeta[f.status]?.color ?? C.faint;
          return (
            <div key={f.nr} className="flex justify-start">
              <div
                className="flex w-full max-w-[86%] items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: C.rail }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} color={C.sub} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13.5px] font-semibold tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {f.nr}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: C.sub }}>
                    {f.klant} · {f.datum}
                  </p>
                </div>
                <span
                  className="text-[14px] font-bold tabular-nums"
                  style={{ ...heading, color: C.ink }}
                >
                  {f.bedrag}
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color, background: `${color}14` }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: color }}
                    aria-hidden="true"
                  />{" "}
                  {f.status}
                </span>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white ${RING}`}
            style={{ background: C.accent }}
          >
            <Plus size={15} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
          </button>
        </div>
      </div>
      <Composer
        placeholder="Vraag over je facturen…"
        quick={["Stuur herinnering voor FAC-2025-118", "Maak nieuwe factuur"]}
        onQuick={() => undefined}
      />
    </div>
  );
}
