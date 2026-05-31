import { describe, it, expect, afterEach, vi } from "vitest";
import { getMailSender, _resetMailSender, type MailMessage } from "./mail-sender";

const SMTP_VARS = ["EMAIL_SMTP_HOST", "EMAIL_SMTP_PORT", "EMAIL_SMTP_USER", "EMAIL_SMTP_PASS", "EMAIL_FROM"];

afterEach(() => {
  _resetMailSender();
  delete process.env.EMAIL_DRIVER;
  for (const v of SMTP_VARS) delete process.env[v];
  vi.restoreAllMocks();
  vi.resetModules();
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

  it("SmtpMailSender verzendt via nodemailer als alles geconfigureerd is", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "x" });
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    vi.doMock("nodemailer", () => ({ default: { createTransport }, createTransport }));

    process.env.EMAIL_DRIVER = "smtp";
    process.env.EMAIL_SMTP_HOST = "smtp.test";
    process.env.EMAIL_SMTP_PORT = "587";
    process.env.EMAIL_SMTP_USER = "user";
    process.env.EMAIL_SMTP_PASS = "pass";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    // Verse module-instantie zodat de gemockte nodemailer wordt geladen.
    _resetMailSender();
    const { getMailSender: freshGet } = await import("./mail-sender");
    const sender = freshGet();
    await sender.send({ to: "jan@test.nl", subject: "Hoi", text: "Tekst", html: "<b>Tekst</b>" });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.test", port: 587, secure: false }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "ZZP <noreply@test.nl>", to: "jan@test.nl", subject: "Hoi" }),
    );
  });

  it("SmtpMailSender gebruikt secure TLS op poort 465", async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    vi.doMock("nodemailer", () => ({ default: { createTransport }, createTransport }));

    process.env.EMAIL_DRIVER = "smtp";
    process.env.EMAIL_SMTP_HOST = "smtp.test";
    process.env.EMAIL_SMTP_PORT = "465";
    process.env.EMAIL_SMTP_USER = "user";
    process.env.EMAIL_SMTP_PASS = "pass";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    _resetMailSender();
    const { getMailSender: freshGet } = await import("./mail-sender");
    await freshGet().send({ to: "jan@test.nl", subject: "Hoi", text: "Tekst" });

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true }));
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
