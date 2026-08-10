"use client";

// Concept 544 — "Postvak" · Inbox / thread-as-OS (Linear-inbox-paradigma). Alles is één te
// verwerken item in een verenigd triage-postvak: matches, verificatie-updates, berichten en
// facturen komen binnen als items. Twee-paneel (lijst + detail), afhandelen/archiveren,
// ongelezen-tellers, sneltoetsen. 2026-trends: keyboard-first triage, dichte graphite-UI,
// command-gevoel, verfijnde micro-interacties met scherpe focus-states.

import {
  useMemo,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import {
  Archive,
  ArrowRight,
  Banknote,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock,
  FileText,
  Filter,
  Hourglass,
  Inbox,
  ListChecks,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  Users,
  X,
  Zap,
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

// ————————————————————————————————— Palet — graphite postvak —————————————————————————————————
const C = {
  bg: "#0e1116",
  rail: "#12161c",
  panel: "#161b22",
  panelSoft: "#1b212b",
  panelHi: "#212936",
  line: "#262d38",
  lineSoft: "#1e242e",
  ink: "#e9edf3",
  inkSoft: "#98a2b1",
  inkFaint: "#606a79",
  accent: "#4ea3ff",
  accentDim: "#1c3a5c",
  accentSoft: "rgba(78,163,255,.14)",
  ok: "#3ddc97",
  okSoft: "rgba(61,220,151,.13)",
  warn: "#f6b352",
  warnSoft: "rgba(246,179,82,.14)",
  danger: "#ff6b6b",
  dangerSoft: "rgba(255,107,107,.14)",
  info: "#7aa2ff",
  infoSoft: "rgba(122,162,255,.14)",
  violet: "#b28bff",
  violetSoft: "rgba(178,139,255,.14)",
};

// ————————————————————————————————— Status-taal (label + icoon) —————————————————————————————————
type StatusMeta = { label: string; icon: LucideIcon; fg: string; bg: string };
function credMeta(status: CredStatus): StatusMeta {
  switch (status) {
    case "VERIFIED":
      return { label: "Geverifieerd", icon: ShieldCheck, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", icon: Hourglass, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", icon: X, fg: C.danger, bg: C.dangerSoft };
  }
}
function factuurMeta(status: string): StatusMeta {
  switch (status) {
    case "Betaald":
      return { label: "Betaald", icon: Check, fg: C.ok, bg: C.okSoft };
    case "Openstaand":
      return { label: "Openstaand", icon: Clock, fg: C.warn, bg: C.warnSoft };
    default:
      return { label: "Concept", icon: FileText, fg: C.inkFaint, bg: C.lineSoft };
  }
}

// ————————————————————————————————— Postvak-item model —————————————————————————————————
type Kind = "match" | "verificatie" | "bericht" | "factuur" | "actie";
type InboxItem = {
  id: string;
  kind: Kind;
  titel: string;
  van: string;
  preview: string;
  tijd: string;
  unread: boolean;
};

const kindMeta: Record<Kind, { label: string; icon: LucideIcon; fg: string; bg: string }> = {
  match: { label: "Match", icon: Sparkles, fg: C.violet, bg: C.violetSoft },
  verificatie: { label: "Verificatie", icon: ShieldCheck, fg: C.ok, bg: C.okSoft },
  bericht: { label: "Bericht", icon: Mail, fg: C.accent, bg: C.accentSoft },
  factuur: { label: "Factuur", icon: Banknote, fg: C.warn, bg: C.warnSoft },
  actie: { label: "Actie", icon: Zap, fg: C.info, bg: C.infoSoft },
};

function buildInbox(): InboxItem[] {
  const items: InboxItem[] = [];
  OPDRACHTEN.forEach((o, i) =>
    items.push({
      id: `m-${o.id}`,
      kind: "match",
      titel: `${o.match}% match — ${o.titel}`,
      van: o.opdrachtgever,
      preview: `${o.tarief} · ${o.uren} · start ${o.start} · ${o.plaats}`,
      tijd: i === 0 ? "10:12" : i === 1 ? "09:40" : "Gisteren",
      unread: i < 2,
    }),
  );
  ACTIES.forEach((a, i) =>
    items.push({
      id: `a-${i}`,
      kind: "actie",
      titel: a.titel,
      van: "Next-action",
      preview: a.detail,
      tijd: a.urgentie === "warning" ? "08:55" : "Ma",
      unread: a.urgentie === "warning",
    }),
  );
  CREDENTIALS.forEach((c, i) => {
    if (c.status === "VERIFIED") return;
    items.push({
      id: `v-${i}`,
      kind: "verificatie",
      titel: `${c.naam} — ${credMeta(c.status).label.toLowerCase()}`,
      van: "Verificatieteam",
      preview: c.detail,
      tijd: c.status === "SUBMITTED" ? "Di" : "Wo",
      unread: c.status === "EXPIRING",
    });
  });
  BERICHTEN.forEach((b, i) =>
    items.push({
      id: `b-${i}`,
      kind: "bericht",
      titel: b.van,
      van: b.van,
      preview: b.preview,
      tijd: b.tijd,
      unread: b.ongelezen,
    }),
  );
  FACTUREN.filter((f) => f.status !== "Betaald").forEach((f) =>
    items.push({
      id: `f-${f.nr}`,
      kind: "factuur",
      titel: `${f.nr} — ${f.status.toLowerCase()}`,
      van: f.klant,
      preview: `${f.bedrag} · ${f.datum === "—" ? "nog te verzenden" : f.datum}`,
      tijd: f.datum === "—" ? "Concept" : f.datum,
      unread: f.status === "Openstaand",
    }),
  );
  return items;
}

// ————————————————————————————————— Kleine primitives —————————————————————————————————
function Chip({ meta, children }: { meta: StatusMeta; children: ReactNode }) {
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.fg,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}

function KindBadge({ kind }: { kind: Kind }) {
  const m = kindMeta[kind];
  const Icon = m.icon;
  return (
    <span
      aria-hidden="true"
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 8,
        background: m.bg,
        color: m.fg,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Icon size={15} strokeWidth={2.2} />
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 6,
        background: C.panelSoft,
        border: `1px solid ${C.line}`,
        color: C.inkSoft,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 5,
        background: C.panelHi,
        border: `1px solid ${C.line}`,
        color: C.inkSoft,
        fontSize: 10.5,
        fontWeight: 700,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        lineHeight: 1,
      }}
    >
      {children}
    </kbd>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : 0;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const tone = value >= 90 ? C.ok : value >= 82 ? C.accent : C.warn;
  return (
    <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
      <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke={C.line} strokeWidth={3.5} />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={3.5}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 700,
          color: C.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ————————————————————————————————— Hoofdcomponent —————————————————————————————————
export function Concept544() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const allItems = useMemo(() => buildInbox(), []);
  const [read, setRead] = useState<Set<string>>(
    () => new Set(allItems.filter((i) => !i.unread).map((i) => i.id)),
  );
  const [archived, setArchived] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(allItems[0]?.id ?? null);
  const [kindFilter, setKindFilter] = useState<Kind | "alle">("alle");

  // Marktplaats-state
  const [openOpdracht, setOpenOpdracht] = useState<Opdracht | null>(OPDRACHTEN[0] ?? null);
  const [zoek, setZoek] = useState("");
  const [alleenTop, setAlleenTop] = useState(false);
  const [dataState, setDataState] = useState<"ok" | "loading" | "error">("ok");

  const inbox = useMemo(
    () =>
      allItems.filter(
        (i) => !archived.has(i.id) && (kindFilter === "alle" || i.kind === kindFilter),
      ),
    [allItems, archived, kindFilter],
  );

  const selected = inbox.find((i) => i.id === selectedId) ?? inbox[0] ?? null;
  const unreadCount = allItems.filter((i) => !archived.has(i.id) && !read.has(i.id)).length;

  const markRead = useCallback((id: string) => {
    setRead((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const archive = useCallback(
    (id: string) => {
      setArchived((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setSelectedId((cur) => {
        if (cur !== id) return cur;
        const rest = inbox.filter((i) => i.id !== id);
        return rest[0]?.id ?? null;
      });
    },
    [inbox],
  );

  const selectItem = useCallback(
    (id: string) => {
      setSelectedId(id);
      markRead(id);
    },
    [markRead],
  );

  const move = useCallback(
    (dir: 1 | -1) => {
      const idx = inbox.findIndex((i) => i.id === selectedId);
      const nextIdx = Math.min(inbox.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + dir));
      const target = inbox[nextIdx];
      if (target) selectItem(target.id);
    },
    [inbox, selectedId, selectItem],
  );

  const onListKey = useCallback(
    (e: KeyboardEvent<HTMLUListElement>) => {
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      } else if ((e.key === "e" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        archive(selectedId);
      } else if (e.key === "r" && selectedId) {
        e.preventDefault();
        markRead(selectedId);
      }
    },
    [move, archive, markRead, selectedId],
  );

  const navScreens = SCREENS;
  const navIcon: Record<ScreenKey, LucideIcon> = {
    dashboard: Inbox,
    marktplaats: Store,
    opdracht: Sparkles,
    verificatie: ShieldCheck,
    documenten: FileText,
    facturen: Banknote,
    berichten: Mail,
    acties: ListChecks,
  };

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter((o) => {
      if (alleenTop && o.match < 88) return false;
      if (!q) return true;
      return (
        o.titel.toLowerCase().includes(q) ||
        o.opdrachtgever.toLowerCase().includes(q) ||
        o.plaats.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [zoek, alleenTop]);

  function openDetail(o: Opdracht) {
    setOpenOpdracht(o);
    setScreen("opdracht");
  }

  return (
    <div
      className="pv544"
      style={{
        background: C.bg,
        color: C.ink,
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        minHeight: 640,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${C.line}`,
        display: "grid",
        gridTemplateColumns: "220px 1fr",
      }}
    >
      <style>{pv544css}</style>

      {/* ————— Navigatie-rail ————— */}
      <nav
        aria-label="Hoofdnavigatie"
        className="pv544-side"
        style={{
          background: C.rail,
          borderRight: `1px solid ${C.line}`,
          padding: "18px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 16px" }}>
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `linear-gradient(140deg, ${C.accent}, ${C.violet})`,
              color: "#0b0f14",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Inbox size={17} strokeWidth={2.4} />
          </span>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.2 }}>Postvak</div>
            <div style={{ fontSize: 10.5, color: C.inkFaint, fontWeight: 500 }}>triage-first</div>
          </div>
        </div>

        {navScreens.map((s) => {
          const Icon = navIcon[s.key];
          const active = screen === s.key;
          const badge =
            s.key === "dashboard" ? unreadCount : s.key === "acties" ? ACTIES.length : 0;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={active ? "page" : undefined}
              className="pv544-navbtn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                background: active ? C.panelHi : "transparent",
                color: active ? C.ink : C.inkSoft,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.4 : 2}
                aria-hidden="true"
                color={active ? C.accent : "currentColor"}
              />
              {s.key === "dashboard" ? "Postvak" : s.label}
              {badge > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: active ? C.ink : C.inkSoft,
                    background: active ? C.accentDim : C.panelSoft,
                    borderRadius: 999,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        <div
          style={{
            marginTop: "auto",
            paddingTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `linear-gradient(140deg, ${C.accent}, ${C.violet})`,
              color: "#0b0f14",
              display: "grid",
              placeItems: "center",
              fontSize: 11.5,
              fontWeight: 800,
            }}
          >
            {PROFIEL.initialen}
          </span>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {PROFIEL.naam}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.inkFaint,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ShieldCheck size={10} color={C.ok} aria-hidden="true" />
              {PROFIEL.trust}
            </div>
          </div>
        </div>
      </nav>

      {/* ————— Hoofdgebied ————— */}
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, background: C.bg }}>
        <header
          className="pv544-topbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 20px",
            borderBottom: `1px solid ${C.line}`,
            background: C.rail,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>
              {screen === "dashboard" ? "Postvak" : navScreens.find((s) => s.key === screen)?.label}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.inkFaint }}>
              {screen === "dashboard" && `${unreadCount} ongelezen · verwerk je items één voor één`}
              {screen === "marktplaats" && "Vind en filter opdrachten"}
              {screen === "opdracht" && "Opdracht-detail"}
              {screen === "verificatie" && "Certificaten & vertrouwensniveau"}
              {screen === "acties" && "Wat vraagt nu je aandacht"}
              {screen === "facturen" && "Facturen & betaalstatus"}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {screen === "dashboard" && (
              <span
                className="pv544-hint"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: C.inkFaint,
                }}
              >
                <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd> navigeer
                </span>
                <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                  <Kbd>E</Kbd> archiveer
                </span>
              </span>
            )}
            <button
              className="pv544-icobtn"
              aria-label={`Meldingen, ${unreadCount} ongelezen`}
              style={icoBtn}
            >
              <Bell size={16} aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: C.accent,
                    border: `1.5px solid ${C.rail}`,
                  }}
                />
              )}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {screen === "dashboard" && (
            <Postvak
              items={inbox}
              selected={selected}
              selectedId={selected?.id ?? null}
              read={read}
              kindFilter={kindFilter}
              setKindFilter={setKindFilter}
              onSelect={selectItem}
              onArchive={archive}
              onMarkRead={markRead}
              onListKey={onListKey}
              onOpenOpdracht={(id) => {
                const o = OPDRACHTEN.find((x) => `m-${x.id}` === id);
                if (o) openDetail(o);
              }}
              gotoScreen={setScreen}
            />
          )}
          <div
            style={{ height: "100%", overflow: "auto", padding: 20 }}
            hidden={screen === "dashboard"}
          >
            {screen === "marktplaats" && (
              <Marktplaats
                zoek={zoek}
                setZoek={setZoek}
                alleenTop={alleenTop}
                setAlleenTop={setAlleenTop}
                dataState={dataState}
                setDataState={setDataState}
                items={gefilterd}
                onOpen={openDetail}
              />
            )}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={openOpdracht} onTerug={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties gotoScreen={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </div>
      </main>
    </div>
  );
}

const icoBtn: CSSProperties = {
  position: "relative",
  width: 33,
  height: 33,
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

// ————————————————————————————————— Postvak (twee-paneel inbox) —————————————————————————————————
function Postvak({
  items,
  selected,
  selectedId,
  read,
  kindFilter,
  setKindFilter,
  onSelect,
  onArchive,
  onMarkRead,
  onListKey,
  onOpenOpdracht,
  gotoScreen,
}: {
  items: InboxItem[];
  selected: InboxItem | null;
  selectedId: string | null;
  read: Set<string>;
  kindFilter: Kind | "alle";
  setKindFilter: (k: Kind | "alle") => void;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkRead: (id: string) => void;
  onListKey: (e: KeyboardEvent<HTMLUListElement>) => void;
  onOpenOpdracht: (id: string) => void;
  gotoScreen: (s: ScreenKey) => void;
}) {
  const filters: { key: Kind | "alle"; label: string }[] = [
    { key: "alle", label: "Alles" },
    { key: "match", label: "Matches" },
    { key: "verificatie", label: "Verificatie" },
    { key: "bericht", label: "Berichten" },
    { key: "factuur", label: "Facturen" },
    { key: "actie", label: "Acties" },
  ];

  return (
    <div
      className="pv544-two"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(300px, 380px) 1fr",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Lijst-paneel */}
      <section
        aria-label="Postvak-items"
        className="pv544-listpane"
        style={{
          borderRight: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: C.rail,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 12px",
            overflowX: "auto",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {filters.map((f) => {
            const active = kindFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setKindFilter(f.key)}
                aria-pressed={active}
                className="pv544-filter"
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: `1px solid ${active ? C.accent : C.line}`,
                  background: active ? C.accentSoft : "transparent",
                  color: active ? C.ink : C.inkSoft,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: C.okSoft,
                  color: C.ok,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                }}
              >
                <CheckCheck size={24} aria-hidden="true" />
              </span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Postvak leeg</div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4, maxWidth: 240 }}>
                Alles verwerkt in deze weergave. Kies een ander filter of geniet van de rust.
              </div>
            </div>
          </div>
        ) : (
          <ul
            tabIndex={0}
            onKeyDown={onListKey}
            aria-label="Items — gebruik pijltjes of J en K om te navigeren"
            className="pv544-list"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 6,
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
          >
            {items.map((it) => {
              const isRead = read.has(it.id);
              const active = it.id === selectedId;
              return (
                <li key={it.id}>
                  <div
                    className="pv544-itemrow"
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 10px",
                      borderRadius: 9,
                      background: active ? C.panelHi : "transparent",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: -1,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: 3,
                          background: C.accent,
                        }}
                      />
                    )}
                    <button
                      onClick={() => onSelect(it.id)}
                      className="pv544-itembtn"
                      aria-label={`Open ${it.titel}`}
                      style={{
                        display: "flex",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                        textAlign: "left",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <KindBadge kind={it.kind} />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {!isRead && (
                            <span
                              aria-hidden="true"
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 999,
                                background: C.accent,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: isRead ? 500 : 700,
                              color: isRead ? C.inkSoft : C.ink,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {it.van}
                          </span>
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10.5,
                              color: C.inkFaint,
                              flexShrink: 0,
                            }}
                          >
                            {it.tijd}
                          </span>
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12.5,
                            fontWeight: isRead ? 500 : 600,
                            color: isRead ? C.inkSoft : C.ink,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {it.titel}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            color: C.inkFaint,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {it.preview}
                        </span>
                      </span>
                    </button>
                    <div
                      className="pv544-rowacts"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        alignSelf: "center",
                      }}
                    >
                      {!isRead && (
                        <button
                          onClick={() => onMarkRead(it.id)}
                          className="pv544-microbtn"
                          aria-label="Markeer als gelezen"
                          style={microBtn}
                        >
                          <Check size={13} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        onClick={() => onArchive(it.id)}
                        className="pv544-microbtn"
                        aria-label="Archiveer item"
                        style={microBtn}
                      >
                        <Archive size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Detail-paneel */}
      <section
        aria-label="Item-detail"
        className="pv544-detailpane"
        style={{ overflowY: "auto", minHeight: 0, background: C.bg }}
      >
        {selected ? (
          <DetailPane
            item={selected}
            isRead={read.has(selected.id)}
            onArchive={() => onArchive(selected.id)}
            onMarkRead={() => onMarkRead(selected.id)}
            onOpenOpdracht={() => onOpenOpdracht(selected.id)}
            gotoScreen={gotoScreen}
          />
        ) : (
          <div style={{ height: "100%", display: "grid", placeItems: "center", color: C.inkFaint }}>
            <div style={{ textAlign: "center" }}>
              <Inbox size={30} aria-hidden="true" style={{ opacity: 0.5 }} />
              <div style={{ marginTop: 10, fontSize: 13 }}>Selecteer een item om te verwerken</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const microBtn: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 7,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

function DetailPane({
  item,
  isRead,
  onArchive,
  onMarkRead,
  onOpenOpdracht,
  gotoScreen,
}: {
  item: InboxItem;
  isRead: boolean;
  onArchive: () => void;
  onMarkRead: () => void;
  onOpenOpdracht: () => void;
  gotoScreen: (s: ScreenKey) => void;
}) {
  const m = kindMeta[item.kind];
  const opdracht =
    item.kind === "match" ? OPDRACHTEN.find((o) => `m-${o.id}` === item.id) : undefined;

  return (
    <div className="pv544-reveal" style={{ padding: 22, maxWidth: 720 }}>
      {/* Actiebalk */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <Chip meta={{ label: m.label, icon: m.icon, fg: m.fg, bg: m.bg }}>{m.label}</Chip>
        <span style={{ fontSize: 11.5, color: C.inkFaint }}>{item.tijd}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {!isRead && (
            <button onClick={onMarkRead} className="pv544-toolbtn" style={toolBtn}>
              <Check size={14} aria-hidden="true" /> Gelezen <Kbd>R</Kbd>
            </button>
          )}
          <button onClick={onArchive} className="pv544-toolbtn" style={toolBtn}>
            <Archive size={14} aria-hidden="true" /> Archiveer <Kbd>E</Kbd>
          </button>
        </div>
      </div>

      <h2
        style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, margin: 0, lineHeight: 1.25 }}
      >
        {item.titel}
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          fontSize: 12.5,
          color: C.inkSoft,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Users size={13} aria-hidden="true" /> {item.van}
        </span>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 12,
          background: C.panel,
          border: `1px solid ${C.line}`,
          fontSize: 13.5,
          color: C.ink,
          lineHeight: 1.55,
        }}
      >
        {item.preview}
      </div>

      {/* Kind-specifieke inhoud */}
      {opdracht && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 12,
            background: C.panel,
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <MatchRing value={opdracht.match} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.inkFaint, marginBottom: 8 }}>
                Waarom deze match
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {opdracht.redenen.plus.map((r) => (
                  <div key={r} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Check
                      size={14}
                      color={C.ok}
                      strokeWidth={2.6}
                      aria-hidden="true"
                      style={{ marginTop: 1, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12.5, color: C.ink }}>{r}</span>
                  </div>
                ))}
                {opdracht.redenen.min.map((r) => (
                  <div key={r} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <TriangleAlert
                      size={14}
                      color={C.warn}
                      strokeWidth={2.4}
                      aria-hidden="true"
                      style={{ marginTop: 1, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12.5, color: C.inkSoft }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenOpdracht}
            className="pv544-primary"
            style={{ ...primaryBtn, marginTop: 16 }}
          >
            Open volledige opdracht <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {item.kind === "verificatie" && (
        <button
          onClick={() => gotoScreen("verificatie")}
          className="pv544-primary"
          style={{ ...primaryBtn, marginTop: 18 }}
        >
          Naar verificatie <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
      {item.kind === "factuur" && (
        <button
          onClick={() => gotoScreen("facturen")}
          className="pv544-primary"
          style={{ ...primaryBtn, marginTop: 18 }}
        >
          Naar facturen <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
      {item.kind === "actie" && (
        <button
          onClick={() => gotoScreen("acties")}
          className="pv544-primary"
          style={{ ...primaryBtn, marginTop: 18 }}
        >
          Naar acties <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
      {item.kind === "bericht" && (
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <input
            aria-label="Antwoord typen"
            placeholder="Typ een antwoord…"
            className="pv544-input"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9,
              border: `1px solid ${C.line}`,
              background: C.panel,
              color: C.ink,
              fontSize: 13,
              outline: "none",
            }}
          />
          <button className="pv544-primary" style={primaryBtn}>
            Versturen
          </button>
        </div>
      )}
    </div>
  );
}

const toolBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 15px",
  borderRadius: 9,
  border: "none",
  background: C.accent,
  color: "#0b0f14",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

// ————————————————————————————————— Marktplaats —————————————————————————————————
function Marktplaats({
  zoek,
  setZoek,
  alleenTop,
  setAlleenTop,
  dataState,
  setDataState,
  items,
  onOpen,
}: {
  zoek: string;
  setZoek: (v: string) => void;
  alleenTop: boolean;
  setAlleenTop: (v: boolean) => void;
  dataState: "ok" | "loading" | "error";
  setDataState: (v: "ok" | "loading" | "error") => void;
  items: Opdracht[];
  onOpen: (o: Opdracht) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search
            size={15}
            color={C.inkFaint}
            aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek opdrachten…"
            aria-label="Zoek opdrachten"
            className="pv544-input"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 9,
              border: `1px solid ${C.line}`,
              background: C.panel,
              fontSize: 13,
              color: C.ink,
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => setAlleenTop(!alleenTop)}
          aria-pressed={alleenTop}
          className="pv544-toggle"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 13px",
            borderRadius: 9,
            border: `1px solid ${alleenTop ? C.accent : C.line}`,
            background: alleenTop ? C.accentSoft : C.panel,
            color: alleenTop ? C.ink : C.inkSoft,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Filter size={14} aria-hidden="true" />
          Top-match 88%+
        </button>
        <div
          role="group"
          aria-label="Weergavestatus demonstreren"
          style={{
            display: "inline-flex",
            gap: 3,
            marginLeft: "auto",
            background: C.panel,
            borderRadius: 9,
            padding: 3,
            border: `1px solid ${C.line}`,
          }}
        >
          {(["ok", "loading", "error"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setDataState(s)}
              aria-pressed={dataState === s}
              className="pv544-seg"
              style={{
                padding: "6px 11px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 700,
                background: dataState === s ? C.panelHi : "transparent",
                color: dataState === s ? C.ink : C.inkFaint,
              }}
            >
              {s === "ok" ? "Data" : s === "loading" ? "Laden" : "Fout"}
            </button>
          ))}
        </div>
      </div>

      {dataState === "loading" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
          aria-busy="true"
          aria-live="polite"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="pv544-skel"
              style={{
                height: 96,
                borderRadius: 12,
                border: `1px solid ${C.line}`,
                background: `linear-gradient(90deg, ${C.panel} 25%, ${C.panelHi} 37%, ${C.panel} 63%)`,
                backgroundSize: "400% 100%",
              }}
            />
          ))}
        </div>
      )}

      {dataState === "error" && (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "44px 20px",
            background: C.panel,
            border: `1px solid ${C.dangerSoft}`,
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: C.dangerSoft,
              color: C.danger,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircleAlert size={22} aria-hidden="true" />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Opdrachten konden niet worden geladen
            </div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>
              Er ging iets mis. Probeer het opnieuw.
            </div>
          </div>
          <button onClick={() => setDataState("ok")} className="pv544-primary" style={primaryBtn}>
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw proberen
          </button>
        </div>
      )}

      {dataState === "ok" && items.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "48px 20px",
            background: C.panel,
            border: `1px dashed ${C.line}`,
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: C.panelHi,
              color: C.inkFaint,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Search size={22} aria-hidden="true" />
          </span>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Geen opdrachten gevonden</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, maxWidth: 320 }}>
            Pas je zoekopdracht aan of zet de filter uit.
          </div>
          <button
            onClick={() => {
              setZoek("");
              setAlleenTop(false);
            }}
            className="pv544-ghost"
            style={ghostBtn}
          >
            Filters wissen
          </button>
        </div>
      )}

      {dataState === "ok" &&
        items.length > 0 &&
        items.map((o) => (
          <button
            key={o.id}
            onClick={() => onOpen(o)}
            className="pv544-oppkaart"
            style={{
              display: "flex",
              gap: 14,
              width: "100%",
              textAlign: "left",
              padding: 15,
              borderRadius: 12,
              border: `1px solid ${C.line}`,
              background: C.panel,
              cursor: "pointer",
            }}
          >
            <MatchRing value={o.match} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>
                  {o.titel}
                </span>
                <span style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>{o.id}</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.inkSoft,
                  marginTop: 3,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Users size={12} aria-hidden="true" /> {o.opdrachtgever}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} aria-hidden="true" /> {o.plaats}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} aria-hidden="true" /> {o.uren}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                {o.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{o.tarief}</div>
              <ChevronRight size={16} color={C.inkFaint} aria-hidden="true" />
            </div>
          </button>
        ))}
    </div>
  );
}

const ghostBtn: CSSProperties = {
  padding: "8px 15px",
  borderRadius: 9,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

// ————————————————————————————————— Opdracht-detail —————————————————————————————————
function OpdrachtDetail({ opdracht, onTerug }: { opdracht: Opdracht | null; onTerug: () => void }) {
  if (!opdracht) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.inkSoft }}>
        Geen opdracht geselecteerd.
      </div>
    );
  }
  const o = opdracht;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
      <button onClick={onTerug} className="pv544-link" style={linkBtn}>
        <ArrowRight size={13} style={{ transform: "rotate(180deg)" }} aria-hidden="true" /> Terug
        naar marktplaats
      </button>

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <MatchRing value={o.match} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: -0.4,
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {o.titel}
            </h2>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 5 }}>
              {o.opdrachtgever} · {o.plaats}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {o.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        </div>

        <dl
          style={{
            margin: "18px 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            paddingTop: 16,
            borderTop: `1px solid ${C.lineSoft}`,
          }}
          className="pv544-feiten"
        >
          <Feit label="Tarief" waarde={o.tarief} />
          <Feit label="Uren" waarde={o.uren} />
          <Feit label="Start" waarde={o.start} />
          <Feit label="Plaats" waarde={o.plaats} />
        </dl>
      </div>

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Sparkles size={15} color={C.violet} aria-hidden="true" />
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Waarom deze match</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {o.redenen.plus.map((r) => (
            <div key={r} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <Check
                size={15}
                color={C.ok}
                strokeWidth={2.6}
                aria-hidden="true"
                style={{ marginTop: 1, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{r}</span>
            </div>
          ))}
          {o.redenen.min.map((r) => (
            <div key={r} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <TriangleAlert
                size={15}
                color={C.warn}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ marginTop: 1, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.4 }}>{r}</span>
            </div>
          ))}
        </div>
        <button className="pv544-primary" style={{ ...primaryBtn, marginTop: 18 }}>
          Reageer op deze opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const linkBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  alignSelf: "flex-start",
  border: "none",
  background: "transparent",
  color: C.accent,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: 6,
};

function Feit({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div>
      <dt style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: "3px 0 0", fontSize: 13.5, fontWeight: 700, color: C.ink }}>{waarde}</dd>
    </div>
  );
}

// ————————————————————————————————— Verificatie —————————————————————————————————
function Verificatie() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.okSoft,
            color: C.ok,
            display: "grid",
            placeItems: "center",
          }}
        >
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{PROFIEL.trust}</div>
          <div style={{ fontSize: 12, color: C.inkSoft }}>2 van 4 certificaten vragen aandacht</div>
        </div>
      </div>

      {CREDENTIALS.map((c) => {
        const m = credMeta(c.status);
        return (
          <div
            key={c.naam}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: m.bg,
                color: m.fg,
                display: "grid",
                placeItems: "center",
              }}
            >
              <m.icon size={17} strokeWidth={2.2} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.naam}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{c.detail}</div>
            </div>
            <Chip meta={m}>{m.label}</Chip>
            {(c.status === "EXPIRING" || c.status === "REJECTED") && (
              <button className="pv544-ghost" style={ghostBtn}>
                {c.status === "EXPIRING" ? "Vernieuwen" : "Opnieuw indienen"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ————————————————————————————————— Acties —————————————————————————————————
function Acties({ gotoScreen }: { gotoScreen: (s: ScreenKey) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
      {ACTIES.map((a, i) => {
        const isOpen = open === i;
        const warn = a.urgentie === "warning";
        const tone = warn ? C.warn : C.info;
        const soft = warn ? C.warnSoft : C.infoSoft;
        return (
          <div
            key={a.titel}
            style={{
              background: C.panel,
              border: `1px solid ${isOpen ? tone + "66" : C.line}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="pv544-accord"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: 9,
                  background: soft,
                  color: tone,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {warn ? <TriangleAlert size={17} /> : <CircleAlert size={17} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{a.titel}</span>
                {!isOpen && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.inkFaint,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.detail}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: tone,
                  background: soft,
                  borderRadius: 999,
                  padding: "3px 9px",
                  flexShrink: 0,
                }}
              >
                {warn ? "Urgent" : "Info"}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 16px 16px 63px" }} className="pv544-reveal">
                <p style={{ margin: "0 0 12px", fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
                  {a.detail}
                </p>
                <button
                  onClick={() => gotoScreen(warn ? "verificatie" : "marktplaats")}
                  className="pv544-primary"
                  style={{ ...primaryBtn, background: tone }}
                >
                  {a.cta} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ————————————————————————————————— Facturen —————————————————————————————————
function Facturen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div
        className="pv544-kpis"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
      >
        {KPIS.map((k) => (
          <div
            key={k.label}
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600, marginBottom: 6 }}>
              {k.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4 }}>{k.value}</span>
              <Sparkline data={k.spark} color={k.up ? C.ok : C.warn} />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 16px",
            borderBottom: `1px solid ${C.lineSoft}`,
          }}
        >
          <Banknote size={15} color={C.warn} aria-hidden="true" />
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Facturen</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr style={{ textAlign: "left", color: C.inkFaint, fontSize: 11 }}>
                <th style={thStyle}>Nummer</th>
                <th style={thStyle}>Klant</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Bedrag</th>
                <th style={thStyle}>Datum</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = factuurMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="pv544-trow"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{f.nr}</td>
                    <td style={{ ...tdStyle, color: C.inkSoft }}>{f.klant}</td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {f.bedrag}
                    </td>
                    <td style={{ ...tdStyle, color: C.inkSoft }}>{f.datum}</td>
                    <td style={tdStyle}>
                      <Chip meta={m}>{m.label}</Chip>
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

const thStyle: CSSProperties = { padding: "10px 16px", fontWeight: 600 };
const tdStyle: CSSProperties = { padding: "12px 16px", fontSize: 12.5, color: C.ink };

// ————————————————————————————————— Scoped CSS —————————————————————————————————
const pv544css = `
.pv544 * { box-sizing: border-box; }
.pv544 button, .pv544 input, .pv544 kbd { font-family: inherit; }
.pv544 :focus-visible {
  outline: 2px solid ${C.accent};
  outline-offset: 2px;
  border-radius: 8px;
}
.pv544 .pv544-list:focus-visible { outline-offset: -2px; }
.pv544 .pv544-navbtn:hover { background: ${C.panelSoft}; color: ${C.ink}; }
.pv544 .pv544-navbtn { transition: background .14s ease, color .14s ease; }
.pv544 .pv544-icobtn:hover { background: ${C.panelSoft}; color: ${C.ink}; }
.pv544 .pv544-itemrow { transition: background .13s ease; }
.pv544 .pv544-itemrow:hover { background: ${C.panelSoft}; }
.pv544 .pv544-rowacts { opacity: 0; transition: opacity .14s ease; }
.pv544 .pv544-itemrow:hover .pv544-rowacts,
.pv544 .pv544-itemrow:focus-within .pv544-rowacts { opacity: 1; }
.pv544 .pv544-microbtn:hover { background: ${C.panelHi}; color: ${C.ink}; border-color: ${C.accent}; }
.pv544 .pv544-toolbtn:hover { background: ${C.panelHi}; color: ${C.ink}; border-color: ${C.line}; }
.pv544 .pv544-filter:hover { border-color: ${C.accent}88; color: ${C.ink}; }
.pv544 .pv544-primary { transition: filter .15s ease, transform .12s ease, box-shadow .18s ease; }
.pv544 .pv544-primary:hover { filter: brightness(1.08); box-shadow: 0 3px 12px rgba(78,163,255,.3); }
.pv544 .pv544-primary:active { transform: translateY(1px); }
.pv544 .pv544-oppkaart { transition: border-color .15s ease, background .15s ease, transform .12s ease; }
.pv544 .pv544-oppkaart:hover { border-color: ${C.accent}77; background: ${C.panelSoft}; transform: translateY(-1px); }
.pv544 .pv544-input:focus { border-color: ${C.accent}; }
.pv544 .pv544-toggle:hover { border-color: ${C.accent}66; }
.pv544 .pv544-seg:hover { color: ${C.ink}; }
.pv544 .pv544-ghost:hover { background: ${C.panelHi}; color: ${C.ink}; border-color: ${C.accent}66; }
.pv544 .pv544-link:hover { opacity: .75; }
.pv544 .pv544-accord:hover { background: ${C.panelSoft}; }
.pv544 .pv544-trow:hover { background: ${C.panelSoft}; }
.pv544 .pv544-reveal { animation: pv544fade .2s ease; }
.pv544 .pv544-skel { animation: pv544shimmer 1.3s ease-in-out infinite; }
.pv544 .pv544-list { scrollbar-width: thin; }
@keyframes pv544fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes pv544shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
@media (max-width: 900px) {
  .pv544 .pv544-two { grid-template-columns: 1fr; }
  .pv544 .pv544-detailpane { display: none; }
  .pv544 .pv544-feiten { grid-template-columns: repeat(2, 1fr) !important; }
  .pv544 .pv544-kpis { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 760px) {
  .pv544 { grid-template-columns: 1fr !important; }
  .pv544 .pv544-side { flex-direction: row; overflow-x: auto; align-items: center; padding: 10px 12px; gap: 6px; }
  .pv544 .pv544-side > div:first-child { padding-bottom: 0; }
  .pv544 .pv544-side > div:last-child { margin-top: 0; padding-top: 0; margin-left: auto; }
  .pv544 .pv544-hint { display: none; }
}
@media (max-width: 520px) {
  .pv544 .pv544-kpis { grid-template-columns: 1fr !important; }
}
@media (prefers-reduced-motion: reduce) {
  .pv544 *, .pv544 *::before, .pv544 *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;
