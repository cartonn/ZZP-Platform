import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode } from "./base32";

describe("base32", () => {
  // RFC 4648 §10 testvectoren (zonder padding, hoofdletters).
  const vectors: Array<[string, string]> = [
    ["", ""],
    ["f", "MY"],
    ["fo", "MZXQ"],
    ["foo", "MZXW6"],
    ["foob", "MZXW6YQ"],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI"],
  ];

  it.each(vectors)("codeert %j → %j (RFC 4648)", (plain, encoded) => {
    expect(base32Encode(Buffer.from(plain, "utf8"))).toBe(encoded);
  });

  it.each(vectors)("decodeert %j terug (round-trip)", (plain, encoded) => {
    expect(base32Decode(encoded).toString("utf8")).toBe(plain);
  });

  it("is tolerant voor spaties, kleine letters en padding", () => {
    expect(base32Decode("mz xw 6y tb oi=").toString("utf8")).toBe("foobar");
  });

  it("werpt op een teken buiten het alfabet (geen stille corruptie)", () => {
    expect(() => base32Decode("MZXW0!")).toThrow();
  });

  it("round-trip op willekeurige bytes", () => {
    const bytes = Buffer.from([0, 255, 16, 32, 200, 7, 99, 128, 1]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });
});
