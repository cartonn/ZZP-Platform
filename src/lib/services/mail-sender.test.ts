import { describe, it, expect, afterEach, vi } from "vitest";
import { getMailSender, _resetMailSender, type MailMessage } from "./mail-sender";

afterEach(() => {
  _resetMailSender();
  delete process.env.EMAIL_DRIVER;
  delete process.env.EMAIL_SMTP_HOST;
});

const msg: MailMessage = { to: "test@voorbeeld.nl", subject: "Test", text: "Hallo" };

describe("getMailSender", () => {
  it("geeft een NoopMailSender terug als EMAIL_DRIVER niet is ingesteld", () => {
    const sender = getMailSender();
    expect(sender).toBeDefined();
  });

  it("NoopMailSender.send() gooit geen fout", async () => {
    const sender = getMailSender();
    await expect(sender.send(msg)).resolves.toBeUndefined();
  });

  it("retourneert dezelfde singleton bij herhaalde aanroepen", () => {
    const a = getMailSender();
    const b = getMailSender();
    expect(a).toBe(b);
  });

  it("geeft een SmtpMailSender terug als EMAIL_DRIVER=smtp", () => {
    process.env.EMAIL_DRIVER = "smtp";
    const sender = getMailSender();
    expect(sender).toBeDefined();
  });

  it("SmtpMailSender.send() gooit een fout als SMTP-variabelen ontbreken", async () => {
    process.env.EMAIL_DRIVER = "smtp";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("SMTP-mailkanaal is niet geconfigureerd");
  });

  it("SmtpMailSender noemt de ontbrekende variabelen in de foutmelding", async () => {
    process.env.EMAIL_DRIVER = "smtp";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("EMAIL_SMTP_HOST");
  });

  it("NoopMailSender logt buiten testomgeving (NODE_ENV=development)", async () => {
    const originalEnv = process.env.NODE_ENV;
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      (process.env as Record<string, string>).NODE_ENV = "development";
      _resetMailSender();
      delete process.env.EMAIL_DRIVER;
      const sender = getMailSender();
      await sender.send(msg);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("[mail:noop]"));
    } finally {
      (process.env as Record<string, string>).NODE_ENV = originalEnv ?? "test";
      spy.mockRestore();
      _resetMailSender();
    }
  });
});
