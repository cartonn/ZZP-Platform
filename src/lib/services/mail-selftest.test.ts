import { describe, expect, it } from "vitest";
import type { MailMessage, MailSender } from "@/lib/services/mail-sender";
import {
  buildMailSelfTestMessage,
  isValidRecipient,
  runMailSelfTest,
} from "@/lib/services/mail-selftest";

/** Test-MailSender die de laatste boodschap onthoudt of op verzoek werpt. */
class RecordingSender implements MailSender {
  sent: MailMessage[] = [];
  constructor(private readonly failWith?: Error) {}
  async send(message: MailMessage): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(message);
  }
}

describe("isValidRecipient", () => {
  it("accepteert gewone adressen", () => {
    expect(isValidRecipient("jan@voorbeeld.nl")).toBe(true);
    expect(isValidRecipient("  test.user+tag@sub.example.co.uk  ")).toBe(true);
  });

  it("weigert evidente typefouten", () => {
    expect(isValidRecipient("")).toBe(false);
    expect(isValidRecipient("geen-apenstaart")).toBe(false);
    expect(isValidRecipient("twee@@apenstaarten.nl")).toBe(false);
    expect(isValidRecipient("geen@domein")).toBe(false);
    expect(isValidRecipient("spatie in@adres.nl")).toBe(false);
    expect(isValidRecipient("naam <jan@voorbeeld.nl>")).toBe(false);
    expect(isValidRecipient(`${"a".repeat(250)}@voorbeeld.nl`)).toBe(false);
  });
});

describe("buildMailSelfTestMessage", () => {
  it("bevat het token in onderwerp + tekst en trimt de ontvanger", () => {
    const msg = buildMailSelfTestMessage("  jan@voorbeeld.nl ", "abc123");
    expect(msg.to).toBe("jan@voorbeeld.nl");
    expect(msg.subject).toContain("abc123");
    expect(msg.text).toContain("abc123");
    expect(msg.html).toContain("abc123");
  });
});

describe("runMailSelfTest", () => {
  it("levert af via een echte driver en verstuurt precies één bericht", async () => {
    const sender = new RecordingSender();
    const report = await runMailSelfTest({
      sender,
      driverMode: "resend",
      recipient: "jan@voorbeeld.nl",
      token: "tok1",
    });
    expect(report.ok).toBe(true);
    expect(report.delivered).toBe(true);
    expect(report.recipient).toBe("jan@voorbeeld.nl");
    expect(report.detail).toBeUndefined();
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]?.subject).toContain("tok1");
  });

  it("meldt bij noop dat er niets is verzonden (ok maar niet delivered)", async () => {
    const sender = new RecordingSender();
    const report = await runMailSelfTest({
      sender,
      driverMode: "noop",
      recipient: "jan@voorbeeld.nl",
      token: "tok2",
    });
    expect(report.ok).toBe(true);
    expect(report.delivered).toBe(false);
    expect(report.detail).toContain("noop");
  });

  it("vangt een verzendfout en geeft alleen de error-NAAM terug (geen PII/secret)", async () => {
    const sender = new RecordingSender(
      Object.assign(new Error("Resend: mislukte, sleutel sk_live_geheim"), {
        name: "ResendError",
      }),
    );
    const report = await runMailSelfTest({
      sender,
      driverMode: "resend",
      recipient: "jan@voorbeeld.nl",
      token: "tok3",
    });
    expect(report.ok).toBe(false);
    expect(report.delivered).toBe(false);
    expect(report.detail).toBe("ResendError");
    expect(report.detail).not.toContain("sk_live");
  });

  it("weigert een ongeldig adres zónder de driver aan te roepen", async () => {
    const sender = new RecordingSender(new Error("mag niet aangeroepen worden"));
    const report = await runMailSelfTest({
      sender,
      driverMode: "resend",
      recipient: "kapot-adres",
      token: "tok4",
    });
    expect(report.ok).toBe(false);
    expect(report.delivered).toBe(false);
    expect(report.detail).toBe("Ongeldig e-mailadres.");
    expect(sender.sent).toHaveLength(0);
  });
});
