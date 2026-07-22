import { describe, expect, it } from "vitest";
import {
  CROSS_ORIGIN_RESOURCE_POLICY,
  inlineDisposition,
  privateFileHeaders,
  sandboxedDocumentHeaders,
  sanitizeAttachmentFilename,
} from "./resource-headers";

describe("sanitizeAttachmentFilename", () => {
  it("laat veilige tekens staan", () => {
    expect(sanitizeAttachmentFilename("factuur-2026.01.pdf")).toBe("factuur-2026.01.pdf");
  });

  it("vervangt onveilige tekens (voorkomt Content-Disposition-injectie)", () => {
    expect(sanitizeAttachmentFilename('e"vil\r\nname .pdf')).toBe("e_vil_name_.pdf");
  });

  it("valt terug op 'bestand' bij een lege of volledig gestripte naam", () => {
    expect(sanitizeAttachmentFilename("")).toBe("bestand");
    expect(sanitizeAttachmentFilename("///")).toBe("bestand");
  });

  it("strip omringende underscores zodat er geen kale rand overblijft", () => {
    expect(sanitizeAttachmentFilename("  spaties  ")).toBe("spaties");
  });
});

describe("inlineDisposition", () => {
  it("bouwt een inline-dispositie met gesaneerde naam", () => {
    expect(inlineDisposition("VOG scan.pdf")).toBe('inline; filename="VOG_scan.pdf"');
  });
});

describe("privateFileHeaders", () => {
  const headers = privateFileHeaders("application/pdf", "factuur.pdf");

  it("zet CORP op same-origin (geen cross-origin embedding van privé-bestanden)", () => {
    expect(headers["Cross-Origin-Resource-Policy"]).toBe(CROSS_ORIGIN_RESOURCE_POLICY);
    expect(CROSS_ORIGIN_RESOURCE_POLICY).toBe("same-origin");
  });

  it("verbiedt caching buiten de browser en MIME-sniffing", () => {
    expect(headers["Cache-Control"]).toBe("private, no-store");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("neemt content-type en gesaneerde bestandsnaam over", () => {
    expect(headers["Content-Type"]).toBe("application/pdf");
    expect(headers["Content-Disposition"]).toBe('inline; filename="factuur.pdf"');
  });
});

describe("sandboxedDocumentHeaders", () => {
  const headers = sandboxedDocumentHeaders("image/png", "diploma.png");

  it("erft de privé-bestand-headers (incl. CORP same-origin)", () => {
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    expect(headers["Cache-Control"]).toBe("private, no-store");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Content-Type"]).toBe("image/png");
  });

  it("voegt een strikte sandbox-CSP toe (geen scriptuitvoering bij inline openen)", () => {
    expect(headers["Content-Security-Policy"]).toBe("sandbox; default-src 'none'");
  });
});
