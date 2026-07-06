import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadValidationError } from "@/lib/services/storage";
import {
  assertUploadClean,
  ClamAvUploadScanner,
  CLAMAV_DEFAULT_PORT,
  getUploadScanner,
  interpretClamAvResponse,
  NoopUploadScanner,
  resetUploadScannerForTest,
  resolveClamdTarget,
  uploadScanFailOpen,
  type UploadScanner,
} from "@/lib/services/upload-scanner";

const target = { mimeType: "application/pdf", size: 1234 };
const bytes = Buffer.from("%PDF-1.4 hello");

afterEach(() => {
  resetUploadScannerForTest();
  delete process.env.UPLOAD_SCANNER;
  delete process.env.UPLOAD_SCAN_FAIL_OPEN;
  delete process.env.CLAMAV_HOST;
  delete process.env.CLAMAV_PORT;
});

describe("interpretClamAvResponse", () => {
  it("herkent een schoon bestand", () => {
    expect(interpretClamAvResponse("stream: OK\0")).toEqual({
      verdict: "clean",
      scanner: "clamav",
    });
  });

  it("herkent een besmet bestand met signatuur", () => {
    expect(interpretClamAvResponse("stream: Eicar-Test-Signature FOUND\0")).toEqual({
      verdict: "infected",
      scanner: "clamav",
      signature: "Eicar-Test-Signature",
    });
  });

  it("markeert een ERROR-respons als error", () => {
    const r = interpretClamAvResponse("INSTREAM size limit exceeded ERROR\0");
    expect(r.verdict).toBe("error");
  });

  it("markeert een lege respons als error", () => {
    expect(interpretClamAvResponse("\0\0").verdict).toBe("error");
  });
});

describe("resolveClamdTarget", () => {
  it("valt terug op de standaardpoort bij een ontbrekende/ongeldige waarde", () => {
    process.env.CLAMAV_HOST = "clamd.internal";
    expect(resolveClamdTarget()).toEqual({ host: "clamd.internal", port: CLAMAV_DEFAULT_PORT });
    process.env.CLAMAV_PORT = "nonsense";
    expect(resolveClamdTarget().port).toBe(CLAMAV_DEFAULT_PORT);
    process.env.CLAMAV_PORT = "3320";
    expect(resolveClamdTarget().port).toBe(3320);
  });
});

describe("NoopUploadScanner", () => {
  it("slaat de scan over", async () => {
    expect(await new NoopUploadScanner().scan(bytes)).toEqual({
      verdict: "skipped",
      scanner: "noop",
    });
  });
});

describe("ClamAvUploadScanner", () => {
  it("delegeert naar het transport en interpreteert de respons", async () => {
    const transport = vi.fn().mockResolvedValue("stream: OK\0");
    const scanner = new ClamAvUploadScanner(transport);
    expect(await scanner.scan(bytes)).toEqual({ verdict: "clean", scanner: "clamav" });
    expect(transport).toHaveBeenCalledWith(bytes);
  });
});

describe("getUploadScanner", () => {
  it("kiest noop by default en clamav achter de vlag", () => {
    expect(getUploadScanner().name).toBe("noop");
    resetUploadScannerForTest();
    process.env.UPLOAD_SCANNER = "clamav";
    expect(getUploadScanner().name).toBe("clamav");
  });
});

describe("uploadScanFailOpen", () => {
  it("faalt standaard gesloten", () => {
    expect(uploadScanFailOpen()).toBe(false);
    process.env.UPLOAD_SCAN_FAIL_OPEN = "true";
    expect(uploadScanFailOpen()).toBe(true);
  });
});

describe("assertUploadClean", () => {
  const scannerReturning = (result: unknown): UploadScanner => ({
    name: "test",
    scan: async () => result as never,
  });
  const scannerThrowing = (): UploadScanner => ({
    name: "test",
    scan: async () => {
      throw new Error("clamd onbereikbaar");
    },
  });

  it("laat een schoon bestand door", async () => {
    await expect(
      assertUploadClean(bytes, target, scannerReturning({ verdict: "clean", scanner: "test" })),
    ).resolves.toBeUndefined();
  });

  it("laat een overgeslagen scan door (noop)", async () => {
    await expect(
      assertUploadClean(bytes, target, scannerReturning({ verdict: "skipped", scanner: "noop" })),
    ).resolves.toBeUndefined();
  });

  it("weigert een besmet bestand met een UploadValidationError", async () => {
    await expect(
      assertUploadClean(
        bytes,
        target,
        scannerReturning({ verdict: "infected", scanner: "test", signature: "X" }),
      ),
    ).rejects.toBeInstanceOf(UploadValidationError);
  });

  it("weigert bij een onbereikbare scanner (fail-closed default)", async () => {
    await expect(assertUploadClean(bytes, target, scannerThrowing())).rejects.toBeInstanceOf(
      UploadValidationError,
    );
  });

  it("laat door bij een onbereikbare scanner als fail-open aan staat", async () => {
    process.env.UPLOAD_SCAN_FAIL_OPEN = "true";
    await expect(assertUploadClean(bytes, target, scannerThrowing())).resolves.toBeUndefined();
  });
});
