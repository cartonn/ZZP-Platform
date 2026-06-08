import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateEnv } from "@/lib/env";

const ORIGINAL = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL };
});
afterEach(() => {
  process.env = ORIGINAL;
});

describe("validateEnv", () => {
  it("accepteert een geldige lokale configuratie", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.STORAGE_DRIVER = "local";
    expect(() => validateEnv()).not.toThrow();
  });

  it("weigert een ontbrekende/zwakke AUTH_SECRET", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.AUTH_SECRET = "kort";
    expect(() => validateEnv()).toThrow(/AUTH_SECRET/);
  });

  it("vereist een bucket bij STORAGE_DRIVER=s3", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.STORAGE_DRIVER = "s3";
    delete process.env.STORAGE_S3_BUCKET;
    expect(() => validateEnv()).toThrow(/STORAGE_S3_BUCKET/);
  });

  it("vereist een Geoapify-key bij echte routing", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.ROUTING_PROVIDER = "geoapify";
    delete process.env.GEOAPIFY_API_KEY;
    expect(() => validateEnv()).toThrow(/GEOAPIFY_API_KEY/);
  });
});
