import { describe, expect, it } from "vitest";

import { isPostgresUrl, parsePoolConfig, resolveDatabaseUrl } from "@/lib/db-connection";

describe("isPostgresUrl", () => {
  it("herkent postgres:// en postgresql://", () => {
    expect(isPostgresUrl("postgres://u:p@h:5432/db")).toBe(true);
    expect(isPostgresUrl("postgresql://u:p@h:5432/db")).toBe(true);
    expect(isPostgresUrl("  POSTGRES://u@h/db  ")).toBe(true);
  });

  it("herkent SQLite/file en overige niet als Postgres", () => {
    expect(isPostgresUrl("file:./dev.db")).toBe(false);
    expect(isPostgresUrl("sqlite://x")).toBe(false);
    expect(isPostgresUrl("mysql://u@h/db")).toBe(false);
  });
});

describe("parsePoolConfig", () => {
  it("leest en clampt de waarden", () => {
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "8" })).toEqual({
      connectionLimit: 8,
    });
    expect(parsePoolConfig({ DATABASE_POOL_TIMEOUT: "0" })).toEqual({ poolTimeout: 0 });
    expect(parsePoolConfig({ DATABASE_PGBOUNCER: "true" })).toEqual({ pgbouncer: true });
    expect(
      parsePoolConfig({
        DATABASE_CONNECTION_LIMIT: "10",
        DATABASE_POOL_TIMEOUT: "15",
        DATABASE_PGBOUNCER: "TRUE",
      }),
    ).toEqual({ connectionLimit: 10, poolTimeout: 15, pgbouncer: true });
  });

  it("clampt buiten bereik naar de grenzen", () => {
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "0" }).connectionLimit).toBe(1);
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "99999" }).connectionLimit).toBe(1000);
    expect(parsePoolConfig({ DATABASE_POOL_TIMEOUT: "99999" }).poolTimeout).toBe(3600);
  });

  it("negeert ongeldige/lege waarden (geen wijziging i.p.v. crash)", () => {
    expect(parsePoolConfig({})).toEqual({});
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "" })).toEqual({});
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "abc" })).toEqual({});
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "-5" })).toEqual({});
    expect(parsePoolConfig({ DATABASE_CONNECTION_LIMIT: "5.5" })).toEqual({});
    expect(parsePoolConfig({ DATABASE_PGBOUNCER: "1" })).toEqual({});
    expect(parsePoolConfig({ DATABASE_PGBOUNCER: "yes" })).toEqual({});
  });
});

describe("resolveDatabaseUrl", () => {
  const pg = "postgresql://u:p@host:5432/db?schema=public";

  it("laat een undefined/lege URL ongemoeid", () => {
    expect(resolveDatabaseUrl(undefined, { DATABASE_CONNECTION_LIMIT: "5" })).toBeUndefined();
  });

  it("raakt een SQLite/file-URL nooit aan", () => {
    const url = "file:./dev.db";
    expect(resolveDatabaseUrl(url, { DATABASE_CONNECTION_LIMIT: "5" })).toBe(url);
  });

  it("laat een Postgres-URL ongewijzigd zonder pool-config (inert-by-default)", () => {
    expect(resolveDatabaseUrl(pg, {})).toBe(pg);
  });

  it("voegt connection_limit toe en behoudt bestaande query-params", () => {
    const out = resolveDatabaseUrl(pg, { DATABASE_CONNECTION_LIMIT: "7" });
    const params = new URL(out!).searchParams;
    expect(params.get("connection_limit")).toBe("7");
    expect(params.get("schema")).toBe("public");
  });

  it("voegt pool_timeout en pgbouncer toe wanneer geconfigureerd", () => {
    const out = resolveDatabaseUrl(pg, {
      DATABASE_POOL_TIMEOUT: "20",
      DATABASE_PGBOUNCER: "true",
    });
    const params = new URL(out!).searchParams;
    expect(params.get("pool_timeout")).toBe("20");
    expect(params.get("pgbouncer")).toBe("true");
  });

  it("overschrijft nooit een parameter die de operator al in de URL zette", () => {
    const explicit = "postgresql://u:p@host:5432/db?connection_limit=3";
    const out = resolveDatabaseUrl(explicit, { DATABASE_CONNECTION_LIMIT: "50" });
    expect(new URL(out!).searchParams.get("connection_limit")).toBe("3");
  });

  it("valt terug op de rauwe URL bij een onparseerbare URL", () => {
    const broken = "postgresql://";
    // new URL("postgresql://") werpt; de functie mag nooit de boot breken.
    expect(() => resolveDatabaseUrl(broken, { DATABASE_CONNECTION_LIMIT: "5" })).not.toThrow();
  });
});
