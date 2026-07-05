import { describe, expect, it } from "vitest";
import {
  MAX_SAMPLE_LEN,
  MAX_VIOLATIONS_PER_REPORT,
  parseCspReport,
  toBlockedOrigin,
  toDocumentPath,
  toSourceFile,
} from "@/lib/observability/csp-report";

describe("toBlockedOrigin", () => {
  it("reduceert een volledige URL tot alleen de origin", () => {
    expect(toBlockedOrigin("https://evil.example.com/steal?token=abc#x")).toBe(
      "https://evil.example.com",
    );
  });

  it("behoudt de poort in de origin", () => {
    expect(toBlockedOrigin("http://cdn.test:8443/a/b.js")).toBe("http://cdn.test:8443");
  });

  it("laat CSP-tokens zonder scheme heel", () => {
    expect(toBlockedOrigin("inline")).toBe("inline");
    expect(toBlockedOrigin("eval")).toBe("eval");
    expect(toBlockedOrigin("self")).toBe("self");
  });

  it("reduceert opake schema's tot het schema (geen payload)", () => {
    expect(toBlockedOrigin("data:text/html;base64,PHNjcmlwdD4=")).toBe("data");
    expect(toBlockedOrigin("blob:https://x/uuid")).toBe("blob");
    expect(toBlockedOrigin("javascript:alert(1)")).toBe("javascript");
  });

  it("geeft null bij lege of niet-string invoer", () => {
    expect(toBlockedOrigin("")).toBeNull();
    expect(toBlockedOrigin("   ")).toBeNull();
    expect(toBlockedOrigin(42)).toBeNull();
    expect(toBlockedOrigin(undefined)).toBeNull();
  });
});

describe("toDocumentPath", () => {
  it("houdt alleen het pad over (dropt query met tokens)", () => {
    expect(toDocumentPath("https://app.test/dossier/abc?token=SECRET&x=1")).toBe("/dossier/abc");
  });

  it("dropt het fragment", () => {
    expect(toDocumentPath("https://app.test/pagina#section")).toBe("/pagina");
  });

  it("strippt query/fragment ook van een relatief pad", () => {
    expect(toDocumentPath("/deel/xyz?token=SECRET")).toBe("/deel/xyz");
  });

  it("geeft '/' voor een kale origin", () => {
    expect(toDocumentPath("https://app.test")).toBe("/");
  });
});

describe("toSourceFile", () => {
  it("houdt origin + pad, dropt query", () => {
    expect(toSourceFile("https://cdn.test/lib/x.js?v=9")).toBe("https://cdn.test/lib/x.js");
  });
});

describe("parseCspReport — legacy (report-uri)", () => {
  it("normaliseert een klassiek csp-report-object", () => {
    const result = parseCspReport({
      "csp-report": {
        "document-uri": "https://app.test/dossier/abc?token=SECRET",
        referrer: "https://elders.test/pii",
        "violated-directive": "script-src",
        "effective-directive": "script-src-elem",
        "original-policy": "default-src 'self'; script-src 'self'",
        "blocked-uri": "https://evil.example.com/x.js",
        "source-file": "https://app.test/page?token=SECRET",
        "line-number": 42,
        disposition: "enforce",
        "script-sample": "alert(1)",
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      directive: "script-src-elem",
      blockedOrigin: "https://evil.example.com",
      documentPath: "/dossier/abc",
      sourceFile: "https://app.test/page",
      lineNumber: 42,
      disposition: "enforce",
      sample: "alert(1)",
    });
  });

  it("valt terug op violated-directive als effective ontbreekt", () => {
    const [v] = parseCspReport({ "csp-report": { "violated-directive": "img-src" } });
    expect(v?.directive).toBe("img-src");
  });

  it("geeft een lege lijst bij een leeg/onbetekenend rapport", () => {
    expect(parseCspReport({ "csp-report": {} })).toEqual([]);
    expect(parseCspReport({})).toEqual([]);
  });
});

describe("parseCspReport — modern (report-to)", () => {
  it("normaliseert een array van csp-violation-reports", () => {
    const result = parseCspReport([
      {
        type: "csp-violation",
        age: 0,
        url: "https://app.test/x",
        user_agent: "Mozilla/5.0 PII",
        body: {
          documentURL: "https://app.test/pagina?token=SECRET",
          blockedURL: "https://evil.example.com/x.js",
          effectiveDirective: "script-src-elem",
          sourceFile: "https://app.test/a.js?v=1",
          lineNumber: 7,
          disposition: "report",
          sample: "eval('x')",
        },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      directive: "script-src-elem",
      blockedOrigin: "https://evil.example.com",
      documentPath: "/pagina",
      sourceFile: "https://app.test/a.js",
      lineNumber: 7,
      disposition: "report",
      sample: "eval('x')",
    });
  });

  it("negeert non-csp-violation report-types", () => {
    const result = parseCspReport([
      { type: "deprecation", body: { id: "x" } },
      { type: "csp-violation", body: { effectiveDirective: "font-src" } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.directive).toBe("font-src");
  });

  it("kapt af op MAX_VIOLATIONS_PER_REPORT", () => {
    const many = Array.from({ length: MAX_VIOLATIONS_PER_REPORT + 5 }, () => ({
      type: "csp-violation",
      body: { effectiveDirective: "script-src" },
    }));
    expect(parseCspReport(many)).toHaveLength(MAX_VIOLATIONS_PER_REPORT);
  });
});

describe("parseCspReport — robuustheid", () => {
  it("kapt een lange sample af", () => {
    const long = "a".repeat(MAX_SAMPLE_LEN + 50);
    const [v] = parseCspReport({
      "csp-report": { "violated-directive": "script-src", "script-sample": long },
    });
    expect(v?.sample?.length).toBe(MAX_SAMPLE_LEN + 1); // +1 voor het ellipsis-teken
    expect(v?.sample?.endsWith("…")).toBe(true);
  });

  it("geeft een lege lijst bij onzin-invoer", () => {
    expect(parseCspReport(null)).toEqual([]);
    expect(parseCspReport("string")).toEqual([]);
    expect(parseCspReport(123)).toEqual([]);
    expect(parseCspReport([null, 1, "x"])).toEqual([]);
  });
});
