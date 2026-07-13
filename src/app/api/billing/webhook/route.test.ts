// Route-tests voor de betaal-webhook. Focus: de rate-limit vóór álle werk (geen provider-call/DB
// bij een flood), keyed op IP, met bewust 200 (geen 429) bij overschrijding zodat de provider niet
// gaat hameren. De activatie-/faal-paden worden door provider.test.ts + de handler-logica gedekt;
// hier verifiëren we dat de rate-limit-poort correct vóór de gezaghebbende status-call zit.

import { describe, it, expect, vi, beforeEach } from "vitest";

const checkMock = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true, remaining: 59, retryAfterMs: 0 })),
);
const resolveWebhookRefMock = vi.hoisted(() => vi.fn(async (): Promise<string | null> => "tr_123"));
const paymentStatusMock = vi.hoisted(() =>
  vi.fn(async (): Promise<"paid" | "open" | "failed"> => "open"),
);
const findFirstMock = vi.hoisted(() =>
  vi.fn(async (): Promise<{ id: string; userId: string; status: string } | null> => null),
);
const updateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/rate-limit", () => ({ billingWebhookRateLimiter: { check: checkMock } }));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findFirst: findFirstMock, update: updateMock },
  },
}));
vi.mock("@/lib/billing/provider", () => ({
  getPaymentProvider: () => ({
    resolveWebhookRef: resolveWebhookRefMock,
    paymentStatus: paymentStatusMock,
  }),
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
  paymentStatusMock.mockReset();
  paymentStatusMock.mockResolvedValue("open");
  findFirstMock.mockReset();
  findFirstMock.mockResolvedValue(null);
  updateMock.mockClear();
  auditMock.mockClear();
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

  it("activeert een PENDING-abonnement bij status 'paid' (audit + update)", async () => {
    findFirstMock.mockResolvedValue({ id: "sub1", userId: "u1", status: "PENDING" });
    paymentStatusMock.mockResolvedValue("paid");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock.mock.calls[0]![0] as Record<string, unknown>).toMatchObject({
      where: { id: "sub1" },
      data: { status: "ACTIVE" },
    });
    expect(auditMock).toHaveBeenCalledTimes(1);
  });

  it("doet geen provider-call wanneer geen abonnement bij de referentie hoort", async () => {
    findFirstMock.mockResolvedValue(null);
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(paymentStatusMock).not.toHaveBeenCalled();
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
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("schrijft geen status via een overgang die de map niet toestaat (bv. 'failed' op een ACTIVE-abonnement)", async () => {
    // ACTIVE is geen bron voor de PENDING→PAST_DUE-tak; de webhook mag hier niets schrijven.
    findFirstMock.mockResolvedValue({ id: "sub3", userId: "u3", status: "ACTIVE" });
    paymentStatusMock.mockResolvedValue("failed");
    const res = await POST(post("{}"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
