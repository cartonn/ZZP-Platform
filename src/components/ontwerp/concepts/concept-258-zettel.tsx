"use client";

// Concept 258 — "Zettelkasten" · Backlinks & kennisgraaf.
// Signatuur: een licht papier-thema waarin het platform als een kennisbank van gekoppelde
// notitie-kaarten leest (à la Obsidian/Roam). Entiteiten — ZZP'er, opdracht, credential,
// opdrachtgever — verwijzen naar elkaar via [[backlinks]] in monospace. Een mini-zijpaneel
// toont de kennisgraaf; bij hover/focus op een backlink lichten de verbonden nodes op.
//
// PARADIGMA (onderscheidend t.o.v. een force-directed graaf): het draait NIET om een
// zwevende bollen-visualisatie, maar om NOTITIE-KAARTEN met TEKSTUELE backlinks als de
// primaire navigatie. De graaflijnen in het zijpaneel zijn PUUR DECORATIEF (aria-hidden);
// de echte navigatie zijn de klikbare [[backlink]]-chips. Match-redenen verschijnen als
// gekoppelde referenties (linked references), niet als losse opsomming.
// Fonts: IBM Plex Mono (link-chips/breadcrumbs) + Inter (body). Accent #7c3aed.

import { useState, type CSSProperties } from "react";
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
  Network,
  CornerDownRight,
  Link2,
  Hash,
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

// Warm paper palette. Ink tones meet WCAG AA on the paper/card surfaces.
const C = {
  paper: "#faf8f3",
  card: "#fffdf8",
  cardAlt: "#f3f0e7",
  ink: "#1c1a17",
  inkSoft: "#4a453d",
  muted: "#6b655a",
  faint: "#8f887b",
  line: "#e6dfd0",
  lineStrong: "#d7cfbc",
  accent: "#7c3aed",
  accentInk: "#5b21b6",
  accentSoft: "#ede8fb",
  green: "#15803d",
  greenSoft: "#dcecdd",
  amber: "#b45309",
  amberSoft: "#f3e6ce",
  red: "#b91c1c",
  redSoft: "#f2dada",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: LayoutDashboard,
};

// --- Knowledge graph model -------------------------------------------------
type NodeKind = "persoon" | "opdracht" | "credential" | "klant";

const KIND: Record<NodeKind, { c: string; label: string }> = {
  persoon: { c: "#7c3aed", label: "ZZP'er" },
  opdracht: { c: "#2563eb", label: "Opdracht" },
  credential: { c: "#15803d", label: "Credential" },
  klant: { c: "#b45309", label: "Opdrachtgever" },
};

type GNode = { id: string; label: string; kind: NodeKind; x: number; y: number };

const GRAPH_NODES: GNode[] = [
  { id: "sanne", label: "Sanne", kind: "persoon", x: 50, y: 50 },
  { id: "opd-2041", label: "OPD-2041", kind: "opdracht", x: 83, y: 27 },
  { id: "linde", label: "De Linde", kind: "klant", x: 86, y: 73 },
  { id: "big", label: "BIG", kind: "credential", x: 17, y: 24 },
  { id: "vog", label: "VOG", kind: "credential", x: 14, y: 70 },
  { id: "vig", label: "VIG", kind: "credential", x: 48, y: 90 },
  { id: "almere", label: "Almere", kind: "klant", x: 50, y: 10 },
];

const GRAPH_EDGES: [string, string][] = [
  ["sanne", "opd-2041"],
  ["sanne", "big"],
  ["sanne", "vog"],
  ["sanne", "vig"],
  ["sanne", "linde"],
  ["sanne", "almere"],
  ["opd-2041", "linde"],
  ["opd-2041", "big"],
  ["almere", "vig"],
];

function neighbours(id: string): Set<string> {
  const s = new Set<string>([id]);
  for (const [a, b] of GRAPH_EDGES) {
    if (a === id) s.add(b);
    if (b === id) s.add(a);
  }
  return s;
}

const nodeById = (id: string): GNode | undefined => GRAPH_NODES.find((n) => n.id === id);

// --- Primitives ------------------------------------------------------------
function card(radius = 14): CSSProperties {
  return {
    background: C.card,
    borderRadius: radius,
    border: `1px solid ${C.line}`,
    boxShadow: "0 1px 0 rgba(28,26,23,0.03), 0 10px 24px -20px rgba(28,26,23,0.5)",
  };
}

// A [[backlink]] chip — monospace, the primary navigation of this concept. Hovering/focusing
// highlights the connected nodes in the graph via `onActivate`; clicking navigates.
function LinkChip({
  label,
  nodeId,
  onActivate,
  onClick,
  tone = C.accentInk,
  bg = C.accentSoft,
}: {
  label: string;
  nodeId?: string;
  onActivate?: (id: string | null) => void;
  onClick: () => void;
  tone?: string;
  bg?: string;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onActivate?.(nodeId ?? null)}
      onMouseLeave={() => onActivate?.(null)}
      onFocus={() => onActivate?.(nodeId ?? null)}
      onBlur={() => onActivate?.(null)}
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-medium transition-colors hover:brightness-95 ${focusRing}`}
      style={{ ...mono, color: tone, background: bg, border: `1px solid ${C.lineStrong}` }}
    >
      <Link2 size={11} strokeWidth={2.2} aria-hidden="true" />
      <span className="truncate">
        <span aria-hidden="true">[[</span>
        {label}
        <span aria-hidden="true">]]</span>
      </span>
    </button>
  );
}

// Breadcrumb of connections: entity › entity › entity, in monospace.
function ConnectionPath({ nodes }: { nodes: string[] }) {
  return (
    <nav
      aria-label="Verbindingspad"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]"
      style={{ ...mono, color: C.muted }}
    >
      {nodes.map((n, i) => {
        const node = nodeById(n);
        const kind = node ? KIND[node.kind] : null;
        return (
          <span key={n} className="inline-flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" style={{ color: C.faint }}>
                ›
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              {kind && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: kind.c }}
                  aria-hidden="true"
                />
              )}
              {node?.label ?? n}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

// Decorative knowledge-graph panel. aria-hidden: the textual backlinks carry the real nav.
function MiniGraph({ active, title = "Kennisgraaf" }: { active: string | null; title?: string }) {
  const hi = active ? neighbours(active) : null;
  return (
    <div className="p-4" style={card()}>
      <div className="mb-2 flex items-center gap-2">
        <Network size={14} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
        <span className="text-[12px] font-semibold" style={{ ...body, color: C.ink }}>
          {title}
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-[10px]"
        style={{ background: C.cardAlt, aspectRatio: "1 / 0.82" }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 82" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {GRAPH_EDGES.map(([a, b], i) => {
            const na = nodeById(a);
            const nb = nodeById(b);
            if (!na || !nb) return null;
            const lit = hi ? (a === active || b === active) && hi.has(a) && hi.has(b) : false;
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y * 0.82}
                x2={nb.x}
                y2={nb.y * 0.82}
                stroke={lit ? C.accent : C.lineStrong}
                strokeWidth={lit ? 1.4 : 0.7}
                strokeLinecap="round"
                opacity={hi && !lit ? 0.4 : 1}
              />
            );
          })}
          {GRAPH_NODES.map((n) => {
            const isActive = active === n.id;
            const isNear = hi ? hi.has(n.id) : true;
            const kc = KIND[n.kind].c;
            return (
              <g key={n.id} opacity={hi && !isNear ? 0.35 : 1}>
                <circle
                  cx={n.x}
                  cy={n.y * 0.82}
                  r={isActive ? 4.4 : n.kind === "persoon" ? 3.8 : 3}
                  fill={isNear ? kc : C.faint}
                  stroke={C.card}
                  strokeWidth={1}
                />
                <text
                  x={n.x}
                  y={n.y * 0.82 - 5.4}
                  textAnchor="middle"
                  fontSize={4.2}
                  fontWeight={isActive ? 700 : 500}
                  fill={isNear ? C.inkSoft : C.faint}
                  style={mono}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {(Object.keys(KIND) as NodeKind[]).map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1.5 text-[10.5px]"
            style={{ ...body, color: C.muted }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: KIND[k].c }}
              aria-hidden="true"
            />
            {KIND[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}

type StatusMeta = { label: string; Icon: LucideIcon; fg: string; bg: string };

function statusMeta(s: CredStatus): StatusMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accentInk, bg: C.accentSoft };
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function ScreenHead({ title, sub, path }: { title: string; sub?: string; path?: string[] }) {
  return (
    <div className="mb-6">
      {path && (
        <div className="mb-2">
          <ConnectionPath nodes={path} />
        </div>
      )}
      <h1
        className="text-[27px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...body, color: C.ink }}
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

// A linked-references block (Roam-style): each reason is a note-line that back-references a node.
function LinkedReferences({
  heading,
  items,
  tone,
  bg,
  Icon,
  nodeId,
  onActivate,
  onOpen,
}: {
  heading: string;
  items: string[];
  tone: string;
  bg: string;
  Icon: LucideIcon;
  nodeId: string;
  onActivate: (id: string | null) => void;
  onOpen: () => void;
}) {
  return (
    <div className="p-5" style={card()}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: bg, color: tone }}
          aria-hidden="true"
        >
          <Icon size={13} strokeWidth={2.8} />
        </span>
        <span className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
          {heading}
        </span>
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2">
            <CornerDownRight
              size={14}
              strokeWidth={2}
              className="mt-0.5 shrink-0"
              style={{ color: C.faint }}
              aria-hidden="true"
            />
            <span className="text-[13px] leading-snug" style={{ ...body, color: C.inkSoft }}>
              {r}{" "}
              <LinkChip
                label={nodeById(nodeId)?.label ?? nodeId}
                nodeId={nodeId}
                onActivate={onActivate}
                onClick={onOpen}
                tone={tone}
                bg={bg}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({
  go,
  openOpdracht,
}: {
  go: (s: ScreenKey) => void;
  openOpdracht: (o: Opdracht) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <ScreenHead
        title={`Werkbank van ${voornaam}`}
        sub="Alles hangt samen. Volg de backlinks tussen je profiel, opdrachten en credentials."
        path={["sanne"]}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="p-4" style={card()}>
            <div className="flex items-center gap-1.5">
              <Hash size={11} strokeWidth={2.4} style={{ color: C.faint }} aria-hidden="true" />
              <span className="text-[11px] font-medium" style={{ ...mono, color: C.muted }}>
                {k.label}
              </span>
            </div>
            <div
              className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...body, color: C.ink }}
            >
              {k.value}
            </div>
            <div
              className="mt-1.5 text-[11px] font-medium tabular-nums"
              style={{ ...mono, color: k.up ? C.green : C.amber }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <article className="p-5" style={card()}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                notitie ·
              </span>
              <ConnectionPath nodes={["sanne", "opd-2041", "linde"]} />
            </div>
            <button
              onClick={() => openOpdracht(top)}
              className={`group flex w-full items-start gap-4 rounded-[10px] p-1 text-left ${focusRing}`}
            >
              <span
                className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none"
                style={{ background: C.accentSoft, color: C.accentInk }}
                aria-hidden="true"
              >
                <span className="text-[18px] font-semibold tabular-nums" style={body}>
                  {top.match}
                </span>
                <span className="text-[7.5px] font-bold uppercase tracking-wider">match</span>
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[16px] font-semibold leading-tight"
                  style={{ ...body, color: C.ink }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.muted }}>
                  {top.tarief} · {top.uren} · {top.start}
                </div>
              </div>
              <ArrowRight
                size={18}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.accent }}
                aria-hidden="true"
              />
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px]" style={{ ...body, color: C.muted }}>
                Verbonden met:
              </span>
              <LinkChip
                label="De Linde"
                nodeId="linde"
                onActivate={setActive}
                onClick={() => openOpdracht(top)}
                tone={KIND.klant.c}
                bg={C.amberSoft}
              />
              <LinkChip
                label="BIG"
                nodeId="big"
                onActivate={setActive}
                onClick={() => go("verificatie")}
                tone={KIND.credential.c}
                bg={C.greenSoft}
              />
              <LinkChip
                label="OPD-2041"
                nodeId="opd-2041"
                onActivate={setActive}
                onClick={() => openOpdracht(top)}
                tone={KIND.opdracht.c}
                bg="#dbe6fb"
              />
            </div>
          </article>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link2 size={14} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
              <h2 className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                Verwijzingen naar jou
              </h2>
            </div>
            <ul className="space-y-2">
              {ACTIES.map((a) => (
                <li key={a.titel} className="flex items-start gap-3 p-4" style={card()}>
                  <CornerDownRight
                    size={15}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.faint }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
                      {a.titel}
                    </div>
                    <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                      {a.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <MiniGraph active={active} />
          <div className="p-4" style={card()}>
            <div className="mb-2 flex items-center gap-2">
              <BadgeCheck
                size={14}
                strokeWidth={2.4}
                style={{ color: C.green }}
                aria-hidden="true"
              />
              <span className="text-[12px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.trust}
              </span>
            </div>
            <ul className="space-y-1.5">
              {CREDENTIALS.map((c) => (
                <li key={c.naam} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </li>
              ))}
            </ul>
          </div>
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
  go,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  go: (s: ScreenKey) => void;
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
        title="Kaartenbak van opdrachten"
        sub="Elke opdracht is een notitie met backlinks naar opdrachtgever en vereiste credentials."
        path={["sanne", "opd-2041"]}
      />

      <div
        className="mb-5 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={17} className="shrink-0" style={{ color: C.accent }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek notities op titel, plaats of tag…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:text-[#8f887b]"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${focusRing}`}
            style={{ ...mono, color: C.accentInk, background: C.accentSoft }}
          >
            wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" style={card()}>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[18px] font-semibold" style={{ ...body, color: C.ink }}>
            Geen notities gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen backlink voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full px-5 py-2 text-[13px] font-semibold text-white ${focusRing}`}
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
              <article key={o.id} className="flex h-full flex-col p-5" style={card()}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    {o.id}
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar notitie"}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${focusRing}`}
                    style={{
                      background: isSaved ? C.accentSoft : C.cardAlt,
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
                  className="mt-2 text-[16px] font-semibold leading-tight"
                  style={{ ...body, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <LinkChip
                    label={o.opdrachtgever}
                    onClick={() => onOpen(o)}
                    tone={KIND.klant.c}
                    bg={C.amberSoft}
                  />
                  <span
                    className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.accentInk, background: C.accentSoft }}
                  >
                    {o.match}% match
                  </span>
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[6px] px-1.5 py-0.5 text-[10.5px]"
                      style={{ ...mono, background: C.cardAlt, color: C.muted }}
                    >
                      #{t.replace(/\s+/g, "-").toLowerCase()}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-colors ${focusRing}`}
                  style={{ ...body, background: C.accent }}
                >
                  Open notitie
                  <ArrowRight
                    size={14}
                    strokeWidth={2.4}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
                {/* keep go referenced for credential deep-link on tags */}
                <button
                  onClick={() => go("verificatie")}
                  className={`mt-2 inline-flex items-center gap-1 self-start text-[11px] font-medium ${focusRing}`}
                  style={{ ...mono, color: C.accentInk }}
                >
                  <Link2 size={11} strokeWidth={2.2} aria-hidden="true" />
                  bekijk vereiste credentials
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
  go,
  onBack,
}: {
  opdracht: Opdracht;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  go: (s: ScreenKey) => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const [active, setActive] = useState<string | null>("opd-2041");
  const isSaved = saved.has(opdracht.id);
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${focusRing}`}
        style={{ ...body, color: C.inkSoft, background: C.cardAlt }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug naar kaartenbak
      </button>

      <div className="mb-4">
        <ConnectionPath nodes={["sanne", "opd-2041", "linde"]} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="p-6" style={card()}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                  {opdracht.id}
                </span>
                <h2
                  className="mt-1 text-[22px] font-semibold leading-tight tracking-tight"
                  style={{ ...body, color: C.ink }}
                >
                  {opdracht.titel}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <LinkChip
                    label={opdracht.opdrachtgever}
                    nodeId="linde"
                    onActivate={setActive}
                    onClick={() => go("marktplaats")}
                    tone={KIND.klant.c}
                    bg={C.amberSoft}
                  />
                  <span className="text-[12px]" style={{ ...body, color: C.muted }}>
                    · {opdracht.plaats}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleSave(opdracht.id)}
                aria-pressed={isSaved}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold ${focusRing}`}
                style={{
                  ...body,
                  color: isSaved ? C.accent : C.inkSoft,
                  background: isSaved ? C.accentSoft : C.cardAlt,
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
                <div key={m.label} className="rounded-xl p-3" style={{ background: C.cardAlt }}>
                  <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
                  <div
                    className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {m.label}
                  </div>
                  <div className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LinkedReferences
              heading="Waarom deze past"
              items={opdracht.redenen.plus}
              tone={C.green}
              bg={C.greenSoft}
              Icon={Plus}
              nodeId="big"
              onActivate={setActive}
              onOpen={() => go("verificatie")}
            />
            <LinkedReferences
              heading="Even op letten"
              items={opdracht.redenen.min}
              tone={C.amber}
              bg={C.amberSoft}
              Icon={Minus}
              nodeId="vig"
              onActivate={setActive}
              onOpen={() => go("verificatie")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setApplied((v) => !v)}
              aria-pressed={applied}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors ${focusRing}`}
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
                De opdrachtgever reageert gemiddeld binnen 6 uur.
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <MiniGraph active={active} title="Verbonden entiteiten" />
        </div>
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
  const [active, setActive] = useState<string | null>(null);
  return (
    <div>
      <ScreenHead
        title="Credential-notities"
        sub="Elk bewijsstuk is een notitie met backlinks naar de opdrachten die het vereisen."
        path={["sanne", "big"]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const linkNode = c.naam.includes("BIG")
              ? "big"
              : c.naam.includes("VOG")
                ? "vog"
                : c.naam.includes("VIG")
                  ? "vig"
                  : "big";
            return (
              <div key={c.naam} className="flex items-start gap-3 p-4" style={card()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${focusRing}`}
                  style={{
                    border: `1.5px solid ${done ? C.accent : C.lineStrong}`,
                    background: done ? C.accent : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                      {c.naam}
                    </span>
                    <StatusChip status={c.status} />
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px]" style={{ ...body, color: C.faint }}>
                      Vereist door:
                    </span>
                    <LinkChip
                      label="OPD-2041"
                      nodeId="opd-2041"
                      onActivate={setActive}
                      onClick={() => toggleCheck(c.naam)}
                      tone={KIND.opdracht.c}
                      bg="#dbe6fb"
                    />
                    <LinkChip
                      label={linkNode.toUpperCase()}
                      nodeId={linkNode}
                      onActivate={setActive}
                      onClick={() => toggleCheck(c.naam)}
                      tone={KIND.credential.c}
                      bg={C.greenSoft}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <MiniGraph active={active} title="Credential-graaf" />

          <div className="p-4" style={card()}>
            <div className="mb-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 text-[13px] font-semibold"
                style={{ ...body, color: C.ink }}
              >
                <FileText
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                Documenten
              </span>
              <button
                onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${focusRing}`}
                style={{ background: C.cardAlt, color: C.accent }}
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
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${focusRing}`}
                  style={{
                    ...mono,
                    color: feedState === s ? "#fff" : C.muted,
                    background: feedState === s ? C.accent : C.cardAlt,
                  }}
                >
                  {s === "ok" ? "geladen" : s === "loading" ? "laden" : "fout"}
                </button>
              ))}
            </div>

            {feedState === "loading" && (
              <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="rounded-lg p-3" style={{ background: C.cardAlt }}>
                    <div
                      className="h-3 w-2/3 animate-pulse rounded-full"
                      style={{ background: C.line }}
                    />
                    <div
                      className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                      style={{ background: C.line }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {feedState === "error" && (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: C.redSoft, color: C.red }}
                  aria-hidden="true"
                >
                  <CircleAlert size={22} strokeWidth={2} />
                </span>
                <div className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
                  Even niet gelukt
                </div>
                <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                  Kon de documentenkluis niet bereiken.
                </p>
                <button
                  onClick={() => setFeedState("ok")}
                  className={`mt-1 rounded-full px-4 py-1.5 text-[12px] font-semibold text-white ${focusRing}`}
                  style={{ ...body, background: C.accent }}
                >
                  Opnieuw proberen
                </button>
              </div>
            )}

            {feedState === "ok" && (
              <ul className="space-y-2">
                {DOCUMENTEN.map((d) => (
                  <li
                    key={d.naam}
                    className="flex items-center gap-2.5 rounded-lg p-2.5"
                    style={{ background: C.cardAlt }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[8px] font-bold"
                      style={{ ...mono, background: C.card, color: C.accentInk }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div
                        className="text-[10.5px] tabular-nums"
                        style={{ ...mono, color: C.muted }}
                      >
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
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead title="Openstaande verwijzingen" path={["sanne"]} />

      {openCount === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" style={card()}>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...body, color: C.ink }}>
            Geen open verwijzingen
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Alles is verwerkt. Je kaartenbak is bij.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: C.accentSoft }}
          >
            <span
              className="text-[12px] font-semibold tabular-nums"
              style={{ ...mono, color: C.accentInk }}
            >
              {openCount} open
            </span>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={card()}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${focusRing}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14.5px] font-semibold leading-snug"
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
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.amber : C.accentInk,
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
        : { fg: C.muted, bg: C.cardAlt };
  return (
    <div>
      <ScreenHead
        title="Factuur-register"
        sub="Elke factuur linkt terug naar de opdrachtgever-notitie."
        path={["sanne", "linde"]}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.faint },
        ].map((s) => (
          <div key={s.label} className="p-4" style={card()}>
            <div className="text-[11px] font-medium" style={{ ...mono, color: C.muted }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[21px] font-semibold tabular-nums"
              style={{ ...body, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden p-2" style={card()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
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
                    className="transition-colors hover:bg-[#f3f0e7]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.accentInk }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.ink }}>
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
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
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

export function Concept258() {
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
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <Network size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...body, color: C.ink }}
              >
                Zettelkasten
              </div>
              <div className="text-[11px] font-medium" style={{ ...mono, color: C.muted }}>
                backlinks · kennisgraaf
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
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ ...mono, background: C.accentSoft, color: C.accentInk }}
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${focusRing}`}
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
          {screen === "dashboard" && (
            <Dashboard
              go={(s) => setScreen(s)}
              openOpdracht={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "marktplaats" && (
            <Marktplaats
              query={query}
              setQuery={setQuery}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              go={(s) => setScreen(s)}
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
              go={(s) => setScreen(s)}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[11px]"
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5" style={mono}>
            <Link2 size={12} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
            {GRAPH_NODES.length} nodes · {GRAPH_EDGES.length} backlinks
          </span>
          <span>Graaflijnen decoratief · backlinks navigeren</span>
        </footer>
      </div>
    </div>
  );
}
