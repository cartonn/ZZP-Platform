import { describe, it, expect } from "vitest";
import { authorizeCron } from "./cron-auth";

const SECRET = "s3cr3t-cron-token-with-decent-length";

function req(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://example.test/api/tasks/run-all", { method: "POST", headers });
}

describe("authorizeCron", () => {
  it("accepteert een correcte Bearer CRON_SECRET", () => {
    expect(authorizeCron(req(`Bearer ${SECRET}`), SECRET)).toBe(true);
  });

  it("weigert een fout secret van gelijke lengte", () => {
    const wrong = "x".repeat(SECRET.length);
    expect(authorizeCron(req(`Bearer ${wrong}`), SECRET)).toBe(false);
  });

  it("weigert een fout secret van andere lengte", () => {
    expect(authorizeCron(req("Bearer te-kort"), SECRET)).toBe(false);
    expect(authorizeCron(req(`Bearer ${SECRET}extra`), SECRET)).toBe(false);
  });

  it("weigert een ontbrekende Authorization-header", () => {
    expect(authorizeCron(req(), SECRET)).toBe(false);
  });

  it("weigert een niet-Bearer-schema, ook met het juiste secret", () => {
    expect(authorizeCron(req(`Basic ${SECRET}`), SECRET)).toBe(false);
    expect(authorizeCron(req(SECRET), SECRET)).toBe(false);
  });

  it("is hoofdlettergevoelig op het Bearer-prefix", () => {
    expect(authorizeCron(req(`bearer ${SECRET}`), SECRET)).toBe(false);
  });

  it("weigert altijd wanneer het secret leeg is (geen halve activering)", () => {
    expect(authorizeCron(req("Bearer "), "")).toBe(false);
    expect(authorizeCron(req(), "")).toBe(false);
  });
});
