// Route-tests voor de betaal-webhook. Focus: (1) de rate-limit vóór álle werk (geen provider-call/DB
// bij een flood), keyed op IP, met bewust 200 (geen 429); (2) de overgangsmap-poort op status-
// schrijvers; (3) de idempotentie-grendel (exact-één-keer per event via de ProcessedWebhookEvent-
// ledger, atomair met de mutatie). De activatie-/faal-paden worden mede door provider.test.ts gedekt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const checkMock = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true, remaining: 59, retryAfterMs: 0 })),
);
const resolveWebhookRefMock = vi.hoisted(() => vi.fn(async (): Promise<string | null> => "tr_123"));
const classifyWebhookAuthMock = vi.hoisted(() =>
  vi.fn(async (): Promise<"ok" | "invalid" | "not-applicable"> => "ok"),
);
const recordWebhookAuthOutcomeMock = vi.hoisted(() => vi.fn(async () => {}));
const paymentStatusMock = vi.hoisted(() =>
  vi.fn(async (): Promise<"paid" | "open" | "failed"> => "open"),
);
const findFirstMock = vi.hoisted(() =>
  vi.fn(async (): Promise<{ id: string; userId: string; status: string } | null> => null),
);
const updateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
const auditCreateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
// De ledger-insert. Standaard succes; een test laat 'm een P2002 (duplicaat) gooien.
const ledgerCreateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
// $transaction(fn) roept de callback met een tx-client die dezelfde mocks deelt, en laat een fout
// (bv. de P2002 uit ledgerCreateMock) propageren zoals Prisma dat ook doet.
const transactionMock = vi.hoisted(() =>
  vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      processedWebhookEvent: { create: ledgerCreateMock },
      subscription: { update: updateMock },
      auditLog: { create: auditCreateMock },
    }),
  ),
);

vi.mock("@/lib/rate-limit", () => ({ billingWebhookRateLimiter: { check: checkMock } }));
vi.mock("@/lib/audit", () => ({ auditData: (entry: unknown) => entry }));
vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findFirst: findFirstMock, update: updateMock },
    $transaction: transactionMock,
  },
}));
vi.mock("@/lib/billing/provider", () => ({
  getPaymentProvider: () => ({
    name: "stripe",
    resolveWebhookRef: resolveWebhookRefMock,
    classifyWebhookAuth: classifyWebhookAuthMock,
    paymentStatus: paymentStatusMock,
  }),
}));
vi.mock("@/lib/observability/billing-webhook-auth-heartbeat", () => ({
  recordWebhookAuthOutcome: recordWebhookAuthOutcomeMock,
}));

import { POST } from "@/app/api/billing/webhook/route";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/billing/webhook", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9", ...headers },
    body,
  });
}

beforeEach(() => {
  checkMock.mockReset();
  checkMock.mockResolvedValue({ allowed: true, remaining: 59, retryAfterMs: 0 });
  resolveWebhookRefMock.mockReset();
  resolveWebhookRefMock.mockResolvedValue("tr_123");
  classifyWebhookAuthMock.mockReset();
  classifyWebhookAuthMock.mockResolvedValue("ok");
  recordWebhookAuthOutcomeMock.mockClear();
  paymentStatusMock.mockReset();
  paymentStatusMock.mockResolvedValue("open");
  findFirstMock.mockReset();
  findFirstMock.mockResolvedValue(null);
  updateMock.mockClear();
  auditCreateMock.mockClear();
  ledgerCreateMock.mockReset();
  ledgerCreateMock.mockResolvedValue({});
  transactionMock.mockClear();
});

describe("POST /api/billing/webhook", () => {
  it("blokkeert bij rate-limit-overschrijding met 200 en zonder provider-/DB-werk", async () => {
    checkMock.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 5000 });
    const res = await POST(post("{}"));
    expect(res.status).toBe(200); // bewust geen 429: geen retry-storm/throttle-info
    expect(resolveWebhookRefMock).not.toHaveBeenCalled();
    expect(paymentStatusMock).not.toHaveBeenCalled();
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("keyt de rate-limit op het door de vertrouwde proxy toegevoegde (rechter) x-forwarded-for-IP", async () => {
    // Client-gestuurde linkerkant (198.51.100.1) wordt genegeerd; de rechter (Railway-)hop telt.
    await POST(post("{}", { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }));
    expect(checkMock).toHaveBeenCalledWith("10.0.0.1");
  });

  it("valt terug op x-real-ip zonder x-forwarded-for", async () => {
    const req = new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      headers: { "x-real-ip": "192.0.2.7" },
      body: "{}",
    });
    await POST(req);
    expect(checkMock).toHaveBeenCalledWith("192.0.2.7");
  });

  it("laat een toegestane ping door naar de provider-referentie-resolutie", async () => {
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(resolveWebhookRefMock).toHaveBeenCalledTimes(1);
  });

  it("registreert de handtekening-uitkomst in de webhook-auth-heartbeat (instrumentatie)", async () => {
    classifyWebhookAuthMock.mockResolvedValue("invalid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(classifyWebhookAuthMock).toHaveBeenCalledTimes(1);
    expect(recordWebhookAuthOutcomeMock).toHaveBeenCalledWith("invalid", "stripe");
  });

  it("een falende instrumentatie verandert de verwerking niet (fail-open, 200 + resolutie loopt door)", async () => {
    classifyWebhookAuthMock.mockRejectedValue(new Error("boom"));
    findFirstMock.mockResolvedValue({ id: "sub1", userId: "u1", status: "PENDING" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(resolveWebhookRefMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1); // de echte verwerking blijft ongemoeid
  });

  // OWASP A05 / CWE-400: het endpoint is publiek + ongeauthenticeerd. Een overmaatse body wordt
  // geweigerd vóór de (geheugen-bufferende) handtekeningverificatie, ook al is de count-rate-limit
  // nog niet geraakt. Zonder de byte-grens zou resolveWebhookRef op de volledige body worden aangeroepen.
  it("weigert een body boven de byte-grens via de Content-Length-header zonder provider-werk", async () => {
    const res = await POST(post("{}", { "content-length": String(64 * 1024 + 1) }));
    expect(res.status).toBe(200); // bewust 200, consistent met de rest van de route
    expect(resolveWebhookRefMock).not.toHaveBeenCalled();
  });

  it("weigert een te grote werkelijke body (defense-in-depth naast de header-check)", async () => {
    const huge = "x".repeat(64 * 1024 + 1);
    const res = await POST(post(huge));
    expect(res.status).toBe(200);
    expect(resolveWebhookRefMock).not.toHaveBeenCalled();
  });

  it("laat een payload precies op de grens gewoon door", async () => {
    const atLimit = "y".repeat(64 * 1024);
    const res = await POST(post(atLimit));
    expect(res.status).toBe(200);
    expect(resolveWebhookRefMock).toHaveBeenCalledTimes(1);
  });

  it("activeert een PENDING-abonnement bij status 'paid' (audit + update, atomair)", async () => {
    findFirstMock.mockResolvedValue({ id: "sub1", userId: "u1", status: "PENDING" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(ledgerCreateMock).toHaveBeenCalledTimes(1);
    expect(ledgerCreateMock.mock.calls[0]![0] as Record<string, unknown>).toMatchObject({
      data: { provider: "stripe", eventKey: "tr_123:paid" },
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock.mock.calls[0]![0] as Record<string, unknown>).toMatchObject({
      where: { id: "sub1" },
      data: { status: "ACTIVE" },
    });
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("doet geen provider-call wanneer geen abonnement bij de referentie hoort", async () => {
    findFirstMock.mockResolvedValue(null);
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(paymentStatusMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  // CLAUDE.md regel 3: statusovergangen via de expliciete map. De webhook mag geen status schrijven
  // die de map niet toestaat, ook niet als de rauwe provider-status daar los van "paid"/"failed" is.
  it("activeert bij 'paid' een PAST_DUE-abonnement (geldige overgang PAST_DUE→ACTIVE)", async () => {
    findFirstMock.mockResolvedValue({ id: "sub2", userId: "u2", status: "PAST_DUE" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock.mock.calls[0]![0] as Record<string, unknown>).toMatchObject({
      data: { status: "ACTIVE" },
    });
  });

  it("heractiveert GEEN CANCELLED-abonnement bij een herspeelde 'paid'-referentie (revenue-integriteit)", async () => {
    // De expiry-taak zet een verlopen abonnement op CANCELLED zonder de providerRef te wissen. Een
    // ongesigneerde Mollie-webhook die de oude, permanent-"paid" referentie herspeelt, mag het
    // abonnement niet gratis heractiveren: CANCELLED → ACTIVE staat niet meer in de overgangsmap.
    findFirstMock.mockResolvedValue({ id: "sub4", userId: "u4", status: "CANCELLED" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("schrijft geen status via een overgang die de map niet toestaat (bv. 'failed' op een ACTIVE-abonnement)", async () => {
    // ACTIVE is geen bron voor de PENDING→PAST_DUE-tak; de webhook mag hier niets schrijven.
    findFirstMock.mockResolvedValue({ id: "sub3", userId: "u3", status: "ACTIVE" });
    paymentStatusMock.mockResolvedValue("failed");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  // Idempotentie-grendel: een herspeeld/dubbel-afgeleverd event schendt de unieke constraint op de
  // ledger; de transactie rolt terug en de webhook slaat inert over — geen tweede mutatie/audit.
  it("slaat een reeds verwerkt event inert over (P2002 op de ledger, geen dubbele mutatie)", async () => {
    findFirstMock.mockResolvedValue({ id: "sub1", userId: "u1", status: "PENDING" });
    paymentStatusMock.mockResolvedValue("paid");
    ledgerCreateMock.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled(); // rollback: geen tweede activatie
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  // Een echte (transiënte) DB-fout mag NIET als verwerkt gelden: de webhook laat 'm propageren zodat
  // de provider het event opnieuw aflevert (de transactie rolde terug, de ledger is nog schoon).
  it("laat een niet-P2002 DB-fout propageren (provider mag opnieuw proberen)", async () => {
    findFirstMock.mockResolvedValue({ id: "sub1", userId: "u1", status: "PENDING" });
    paymentStatusMock.mockResolvedValue("paid");
    ledgerCreateMock.mockRejectedValue(Object.assign(new Error("db down"), { code: "P1001" }));
    await expect(POST(post("{}"))).rejects.toThrow("db down");
  });

  it("legt ook een 'no-op'-event vast (paid op een reeds ACTIVE-abonnement) zodat replay inert blijft", async () => {
    // Geen statusmutatie nodig, maar het event wordt wél als verwerkt vastgelegd — een tweede
    // aflevering van hetzelfde event vindt de ledger-rij en doet niets.
    findFirstMock.mockResolvedValue({ id: "sub5", userId: "u5", status: "ACTIVE" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(ledgerCreateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
