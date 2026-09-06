import { describe, it, expect } from "vitest";
import { readLimitedText } from "./read-limited-text";

/** Bouw een Request met een gestreamde body (chunked — géén Content-Length). */
function streamingRequest(chunks: Uint8Array[], headers?: Record<string, string>): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
  return new Request("https://example.test/api/x", {
    method: "POST",
    body: stream,
    headers,
    // Node/undici vereist duplex voor een stream-body.
    // @ts-expect-error duplex is geldig in de fetch-standaard maar ontbreekt in de lib-typing.
    duplex: "half",
  });
}

const enc = (s: string) => new TextEncoder().encode(s);

describe("readLimitedText", () => {
  it("leest een kleine body volledig terug (identiek aan request.text())", async () => {
    const req = new Request("https://example.test/api/x", { method: "POST", body: "hallo" });
    expect(await readLimitedText(req, 1024)).toBe("hallo");
  });

  it("geeft een lege string terug voor een lege body", async () => {
    const req = new Request("https://example.test/api/x", { method: "POST", body: "" });
    const out = await readLimitedText(req, 1024);
    expect(out).toBe("");
  });

  it("wijst een body af waarvan Content-Length de grens overschrijdt", async () => {
    const req = new Request("https://example.test/api/x", {
      method: "POST",
      body: "x".repeat(200),
      headers: { "content-length": "999999" },
    });
    // De pre-check retourneert vóór `body.getReader()` — een overmaatse aangegeven lengte wordt
    // afgewezen op basis van de header alleen.
    expect(await readLimitedText(req, 100)).toBeNull();
  });

  it("kapt een chunked body ZONDER Content-Length af zodra de grens overschreden wordt", async () => {
    // Vier chunks van 10 bytes = 40 bytes totaal; grens 25 → moet null geven en vroeg stoppen.
    let enqueued = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (enqueued >= 4) {
          controller.close();
          return;
        }
        enqueued += 1;
        controller.enqueue(enc("0123456789"));
      },
    });
    const req = new Request("https://example.test/api/x", {
      method: "POST",
      body: stream,
      // @ts-expect-error duplex ontbreekt in de lib-typing.
      duplex: "half",
    });
    expect(await readLimitedText(req, 25)).toBeNull();
    // Na overschrijding (chunk 3 tilt de som naar 30 > 25) wordt de reader gecanceld: chunk 4
    // wordt nooit meer opgevraagd.
    expect(enqueued).toBeLessThan(4);
  });

  it("accepteert een body die exact op de grens zit", async () => {
    const req = streamingRequest([enc("01234")]);
    expect(await readLimitedText(req, 5)).toBe("01234");
  });

  it("wijst een body af die één byte boven de grens zit", async () => {
    const req = streamingRequest([enc("012345")]);
    expect(await readLimitedText(req, 5)).toBeNull();
  });

  it("meet op UTF-8-bytes, niet op string-lengte (code-units)", async () => {
    // "é" = 2 UTF-8-bytes maar 1 code-unit. Drie é's = 6 bytes; grens 5 → afwijzen.
    const req = streamingRequest([enc("ééé")]);
    expect(await readLimitedText(req, 5)).toBeNull();
    // Met een ruimere grens komt de exacte string terug (multibyte correct herassembleerd).
    const req2 = streamingRequest([enc("ééé")]);
    expect(await readLimitedText(req2, 6)).toBe("ééé");
  });

  it("herassembleert een multibyte teken dat over twee chunks is gesplitst", async () => {
    const bytes = enc("€"); // 3 bytes: E2 82 AC
    const req = streamingRequest([bytes.slice(0, 1), bytes.slice(1)]);
    expect(await readLimitedText(req, 16)).toBe("€");
  });

  it("geeft null bij een niet-positieve of niet-eindige grens", async () => {
    const mk = () => new Request("https://example.test/api/x", { method: "POST", body: "x" });
    expect(await readLimitedText(mk(), 0)).toBeNull();
    expect(await readLimitedText(mk(), -1)).toBeNull();
    expect(await readLimitedText(mk(), Number.NaN)).toBeNull();
    expect(await readLimitedText(mk(), Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("behandelt een stream-fout tijdens het lezen als onleesbaar (null)", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("netwerk-blip");
      },
    });
    const req = new Request("https://example.test/api/x", {
      method: "POST",
      body: stream,
      // @ts-expect-error duplex ontbreekt in de lib-typing.
      duplex: "half",
    });
    expect(await readLimitedText(req, 1024)).toBeNull();
  });
});
