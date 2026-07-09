// Route-tests voor de client-fout-ontvanger. Gedrag: rate-limit vóór parsen, altijd 204 op een
// (on)geldige body, 429 bij overschrijding, en een genormaliseerde/PII-arme fout naar reportError.

import { describe, it, expect, vi, beforeEach } from "vitest";

const reportErrorMock = vi.hoisted(() => vi.fn());
const checkMock = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true, remaining: 19, retryAfterMs: 0 })),
);

vi.mock("@/lib/observability/report", () => ({ reportError: reportErrorMock }));
vi.mock("@/lib/rate-limit", () => ({ clientErrorRateLimiter: { check: checkMock } }));

import { POST } from "@/app/api/client-error/route";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/client-error", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9", ...headers },
    body,
  });
}

beforeEach(() => {
  reportErrorMock.mockClear();
  checkMock.mockReset();
  checkMock.mockResolvedValue({ allowed: true, remaining: 19, retryAfterMs: 0 });
});

describe("POST /api/client-error", () => {
  it("rapporteert een client-fout genormaliseerd en antwoordt 204", async () => {
    const res = await POST(
      post(
        JSON.stringify({
          name: "TypeError",
          message: "x is not a function",
          stack: "TypeError: x\n  at https://app.test/chunk.js?token=SECRET:1:2",
          componentStack: "  at Foo",
          url: "https://app.test/dossier/abc?token=SECRET",
          digest: "d1",
        }),
      ),
    );
    expect(res.status).toBe(204);
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
    const [error, context] = reportErrorMock.mock.calls[0]!;
    expect((error as Error).name).toBe("TypeError");
    expect((error as Error).message).toBe("x is not a function");
    expect(context).toMatchObject({ source: "client-error", requestPath: "/dossier/abc" });
    // Geen PII/tokens doorgelekt naar de reporter.
    expect(JSON.stringify(context)).not.toContain("SECRET");
    expect((error as Error).stack).not.toContain("?token");
  });

  it("rate-limit't vóór het parsen: bij 429 geen rapport en status 429", async () => {
    checkMock.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 5000 });
    const res = await POST(post(JSON.stringify({ message: "boom" })));
    expect(res.status).toBe(429);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it("keyt de rate-limit op het door de vertrouwde proxy toegevoegde (rechter) x-forwarded-for-IP", async () => {
    // Client-gestuurde linkerkant (198.51.100.1) wordt genegeerd; de rechter (Railway-)hop telt.
    await POST(post("{}", { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }));
    expect(checkMock).toHaveBeenCalledWith("10.0.0.1");
  });

  it("antwoordt 204 op onparseerbare JSON zonder te rapporteren", async () => {
    const res = await POST(post("dit-is-geen-json"));
    expect(res.status).toBe(204);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it("antwoordt 204 op een lege body", async () => {
    const res = await POST(post(""));
    expect(res.status).toBe(204);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it("antwoordt 204 op een payload zonder naam én bericht (niets te rapporteren)", async () => {
    const res = await POST(post(JSON.stringify({ url: "https://app.test/x" })));
    expect(res.status).toBe(204);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it("negeert een body groter dan de limiet (geen rapport)", async () => {
    const huge = JSON.stringify({ message: "a".repeat(40 * 1024) });
    const res = await POST(post(huge));
    expect(res.status).toBe(204);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });
});
