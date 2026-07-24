import { describe, expect, it } from "vitest";
// Drift-poort tussen de upload-ceiling (MAX_UPLOAD_BYTES) en de server-action-body-limiet die
// next.config.mjs op Next.js zet (experimental.serverActions.bodySizeLimit). Uploads lopen via
// server actions; Next kapt de request-body standaard op 1 MB af. Zakt de geconfigureerde limiet
// onder de ceiling, dan wordt een grote (maar geldige) VOG-/diploma-PDF stil geweigerd vóór
// validateUpload draait. Deze test faalt zodra iemand MAX_UPLOAD_BYTES optrekt zonder de config mee
// te tillen (of de config-override per ongeluk verwijdert).
import nextConfig from "../../../next.config.mjs";
import { MAX_UPLOAD_BYTES } from "./storage";

type ExperimentalConfig = {
  experimental?: { serverActions?: { bodySizeLimit?: string | number } };
};

/** Zet "12mb" / "512kb" / een kaal bytegetal om naar bytes. */
function parseBodySizeLimit(value: string | number): number {
  if (typeof value === "number") return value;
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i.exec(value.trim());
  if (!match) throw new Error(`onparseerbare bodySizeLimit: ${value}`);
  const amount = Number(match[1]);
  const unit = (match[2] ?? "b").toLowerCase();
  const multiplier =
    unit === "gb" ? 1024 ** 3 : unit === "mb" ? 1024 ** 2 : unit === "kb" ? 1024 : 1;
  return amount * multiplier;
}

describe("server-action body-limiet vs. upload-ceiling", () => {
  const configured = (nextConfig as ExperimentalConfig).experimental?.serverActions?.bodySizeLimit;

  it("zet een expliciete serverActions.bodySizeLimit (Next default 1 MB is te klein)", () => {
    expect(configured).toBeDefined();
    // De Next-default van 1 MB zou onze 10 MB-uploads breken; de override moet er dus zijn.
    expect(parseBodySizeLimit(configured!)).toBeGreaterThan(1024 * 1024);
  });

  it("staat de volledige upload-ceiling toe", () => {
    expect(parseBodySizeLimit(configured!)).toBeGreaterThanOrEqual(MAX_UPLOAD_BYTES);
  });

  it("houdt headroom boven de ceiling voor multipart-boundaries en form-velden", () => {
    // Minstens 1 MB speling zodat de multipart-envelope (boundaries + overige form-velden) rond een
    // maximaal bestand niet alsnog de limiet raakt.
    expect(parseBodySizeLimit(configured!)).toBeGreaterThanOrEqual(MAX_UPLOAD_BYTES + 1024 * 1024);
  });

  it("parseert eenheden correct (zelfcheck van de helper)", () => {
    expect(parseBodySizeLimit("1mb")).toBe(1024 * 1024);
    expect(parseBodySizeLimit("512kb")).toBe(512 * 1024);
    expect(parseBodySizeLimit(2048)).toBe(2048);
  });
});
