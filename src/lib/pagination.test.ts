import { describe, expect, it, afterEach } from "vitest";
import { pageArgs, splitPage, getPageSize } from "@/lib/pagination";

const PAGE = 3; // kleine paginagrootte voor overzichtelijke tests

describe("getPageSize", () => {
  const original = process.env.LIST_PAGE_SIZE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.LIST_PAGE_SIZE;
    } else {
      process.env.LIST_PAGE_SIZE = original;
    }
  });

  it("geeft 50 terug als LIST_PAGE_SIZE niet gezet is", () => {
    delete process.env.LIST_PAGE_SIZE;
    expect(getPageSize()).toBe(50);
  });

  it("leest LIST_PAGE_SIZE uit de omgeving", () => {
    process.env.LIST_PAGE_SIZE = "5";
    expect(getPageSize()).toBe(5);
  });

  it("valt terug op 50 bij ongeldige waarde", () => {
    process.env.LIST_PAGE_SIZE = "nope";
    expect(getPageSize()).toBe(50);
  });

  it("valt terug op 50 bij 0", () => {
    process.env.LIST_PAGE_SIZE = "0";
    expect(getPageSize()).toBe(50);
  });
});

describe("pageArgs", () => {
  it("pagina 1: geen cursor — take = pageSize + 1, geen cursor/skip", () => {
    expect(pageArgs(null, PAGE)).toEqual({ take: PAGE + 1 });
  });

  it("pagina 1 met undefined cursor", () => {
    expect(pageArgs(undefined, PAGE)).toEqual({ take: PAGE + 1 });
  });

  it("volgende pagina: cursor aanwezig — take = pageSize + 1, cursor + skip: 1", () => {
    expect(pageArgs("id-abc", PAGE)).toEqual({
      take: PAGE + 1,
      cursor: { id: "id-abc" },
      skip: 1,
    });
  });

  it("lege cursor-string gedraagt zich als geen cursor", () => {
    expect(pageArgs("", PAGE)).toEqual({ take: PAGE + 1 });
  });
});

describe("splitPage", () => {
  const row = (id: string) => ({ id });

  it("volledige pagina + overschot → items max pageSize, nextCursor aanwezig", () => {
    const rows = Array.from({ length: PAGE + 1 }, (_, i) => row(`id-${i}`));
    const { items, nextCursor } = splitPage(rows, PAGE);
    expect(items).toHaveLength(PAGE);
    // nextCursor is het id van de laatste item die we tonen (pageSize - 1)
    expect(nextCursor).toBe(`id-${PAGE - 1}`);
  });

  it("minder dan pageSize rijen → geen nextCursor", () => {
    const rows = Array.from({ length: PAGE - 1 }, (_, i) => row(`id-${i}`));
    const { items, nextCursor } = splitPage(rows, PAGE);
    expect(items).toHaveLength(PAGE - 1);
    expect(nextCursor).toBeNull();
  });

  it("exacte paginagrens (= pageSize rijen) → geen nextCursor", () => {
    const rows = Array.from({ length: PAGE }, (_, i) => row(`id-${i}`));
    const { items, nextCursor } = splitPage(rows, PAGE);
    expect(items).toHaveLength(PAGE);
    expect(nextCursor).toBeNull();
  });

  it("lege lijst → geen items, geen nextCursor", () => {
    const { items, nextCursor } = splitPage([], PAGE);
    expect(items).toHaveLength(0);
    expect(nextCursor).toBeNull();
  });

  it("take+1-mechaniek: pageSize+1 rijen → nextCursor is items[pageSize-1].id", () => {
    const rows = Array.from({ length: PAGE + 1 }, (_, i) => row(`x${i}`));
    const { items, nextCursor } = splitPage(rows, PAGE);
    // Laatste zichtbare item heeft index pageSize-1
    expect(items[PAGE - 1]!.id).toBe(nextCursor);
    // De extra rij wordt nooit teruggegeven aan de gebruiker
    expect(items).not.toContainEqual(rows[PAGE]);
  });
});
