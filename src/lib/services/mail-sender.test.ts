import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getMailSender,
  isMailDeliveryConfigured,
  _resetMailSender,
  ResendMailSender,
  type MailMessage,
} from "./mail-sender";
import { HttpTimeoutError } from "./fetch-timeout";

const SMTP_VARS = [
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "EMAIL_SMTP_USER",
  "EMAIL_SMTP_PASS",
  "EMAIL_FROM",
];

afterEach(() => {
  _resetMailSender();
  delete process.env.EMAIL_DRIVER;
  delete process.env.RESEND_API_KEY;
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

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );
  });

  it("geeft een ResendMailSender terug als EMAIL_DRIVER=resend", () => {
    process.env.EMAIL_DRIVER = "resend";
    const sender = getMailSender();
    expect(sender).toBeDefined();
  });

  it("ResendMailSender.send() gooit een fout als RESEND_API_KEY/EMAIL_FROM ontbreken", async () => {
    process.env.EMAIL_DRIVER = "resend";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("Resend-mailkanaal is niet geconfigureerd");
  });

  it("ResendMailSender noemt de ontbrekende variabelen in de foutmelding", async () => {
    process.env.EMAIL_DRIVER = "resend";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("RESEND_API_KEY");
  });

  it("ResendMailSender POST't naar de Resend-API met Bearer-auth en de e-mailvelden", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "abc" }), { status: 200 }));

    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const sender = getMailSender();
    await sender.send({ to: "jan@test.nl", subject: "Hoi", text: "Tekst", html: "<b>Tekst</b>" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({
      from: "ZZP <noreply@test.nl>",
      to: "jan@test.nl",
      subject: "Hoi",
      text: "Tekst",
      html: "<b>Tekst</b>",
    });
  });

  it("ResendMailSender laat html weg als er geen html is meegegeven", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().send({ to: "jan@test.nl", subject: "Hoi", text: "Alleen tekst" });

    const body = JSON.parse(fetchMock.mock.calls[0]![1]?.body as string);
    expect(body).not.toHaveProperty("html");
  });

  it("ResendMailSender gooit een fout bij een non-2xx-respons van de API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid api key", { status: 401 }),
    );

    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_bad";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await expect(getMailSender().send(msg)).rejects.toThrow("status 401");
  });

  it("ResendMailSender gooit HttpTimeoutError als de fetch blijft hangen", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    // Fake fetch die nooit oplost, maar wél op abort reageert met een AbortError — zoals de
    // echte fetch doet wanneer de AbortController van fetchWithTimeout de deadline afdwingt.
    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted.");
          err.name = "AbortError";
          reject(err);
        });
      })) as unknown as typeof fetch;

    const sender = new ResendMailSender(hangingFetch, 20);
    await expect(sender.send(msg)).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("isMailDeliveryConfigured is true voor smtp en resend, false voor noop", () => {
    expect(isMailDeliveryConfigured()).toBe(false);
    process.env.EMAIL_DRIVER = "smtp";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "resend";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "noop";
    expect(isMailDeliveryConfigured()).toBe(false);
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
