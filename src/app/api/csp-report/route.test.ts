// Route-tests voor de CSP-violatie-ontvanger. Gedrag: rate-limit vóór parsen, altijd 204 op een
// (on)geldige body, 429 bij overschrijding, en genormaliseerde/PII-arme velden naar de logger.

import { describe, it, expect, vi, beforeEach } from "vitest";

const warnMock = vi.hoisted(() => vi.fn());
const checkMock = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true, remaining: 29, retryAfterMs: 0 })),
);

vi.mock("@/lib/observability/logger", () => ({ logger: { warn: warnMock } }));
vi.mock("@/lib/rate-limit", () => ({ cspReportRateLimiter: { check: checkMock } }));

import { POST } from "@/app/api/csp-report/route";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/csp-report", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9", ...headers },
    body,
  });
}

beforeEach(() => {
  warnMock.mockClear();
  checkMock.mockReset();
  checkMock.mockResolvedValue({ allowed: true, remaining: 29, retryAfterMs: 0 });
});

describe("POST /api/csp-report", () => {
  it("logt een legacy csp-report genormaliseerd en antwoordt 204", async () => {
    const res = await POST(
      post(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://app.test/dossier/abc?token=SECRET",
            "violated-directive": "script-src",
            "blocked-uri": "https://evil.example.com/x.js",
            "script-sample": "alert(1)",
          },
        }),
      ),
    );
    expect(res.status).toBe(204);
    expect(warnMock).toHaveBeenCalledTimes(1);
    const [msg, fields] = warnMock.mock.calls[0]!;
    expect(msg).toBe("csp-violation");
    expect(fields).toMatchObject({
      directive: "script-src",
      blockedOrigin: "https://evil.example.com",
      documentPath: "/dossier/abc",
      sample: "alert(1)",
    });
    // Geen PII/rauwe URL doorgelekt.
    expect(JSON.stringify(fields)).not.toContain("SECRET");
  });

  it("rate-limit't vóór het parsen: bij 429 geen log en status 429", async () => {
    checkMock.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 5000 });
    const res = await POST(post(JSON.stringify({ "csp-report": { "blocked-uri": "x" } })));
    expect(res.status).toBe(429);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it("keyt de rate-limit op het eerste x-forwarded-for-IP", async () => {
    await POST(post("{}", { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }));
    expect(checkMock).toHaveBeenCalledWith("198.51.100.1");
  });

  it("antwoordt 204 op onparseerbare JSON zonder te loggen", async () => {
    const res = await POST(post("dit-is-geen-json"));
    expect(res.status).toBe(204);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it("antwoordt 204 op een lege body", async () => {
    const res = await POST(post(""));
    expect(res.status).toBe(204);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it("negeert een body groter dan de limiet (geen log)", async () => {
    const huge = JSON.stringify({ "csp-report": { "script-sample": "a".repeat(20 * 1024) } });
    const res = await POST(post(huge));
    expect(res.status).toBe(204);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it("logt elke violatie uit een modern report-array afzonderlijk", async () => {
    const res = await POST(
      post(
        JSON.stringify([
          { type: "csp-violation", body: { effectiveDirective: "img-src" } },
          { type: "csp-violation", body: { effectiveDirective: "font-src" } },
        ]),
      ),
    );
    expect(res.status).toBe(204);
    expect(warnMock).toHaveBeenCalledTimes(2);
  });
});
