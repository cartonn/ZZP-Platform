import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getMailSender,
  isMailDeliveryConfigured,
  MailConnectivityError,
  _resetMailSender,
  ResendMailSender,
  PostmarkMailSender,
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
  delete process.env.POSTMARK_SERVER_TOKEN;
  delete process.env.POSTMARK_MESSAGE_STREAM;
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

  it("NoopMailSender.checkConnectivity() resolvet (niets te controleren)", async () => {
    const sender = getMailSender();
    await expect(sender.checkConnectivity()).resolves.toBeUndefined();
  });

  it("SmtpMailSender.checkConnectivity() roept transporter.verify() aan zonder mail te sturen", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const sendMail = vi.fn().mockResolvedValue({});
    const createTransport = vi.fn().mockReturnValue({ sendMail, verify });
    vi.doMock("nodemailer", () => ({ default: { createTransport }, createTransport }));

    process.env.EMAIL_DRIVER = "smtp";
    process.env.EMAIL_SMTP_HOST = "smtp.test";
    process.env.EMAIL_SMTP_PORT = "587";
    process.env.EMAIL_SMTP_USER = "user";
    process.env.EMAIL_SMTP_PASS = "pass";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    _resetMailSender();
    const { getMailSender: freshGet } = await import("./mail-sender");
    await freshGet().checkConnectivity();

    expect(verify).toHaveBeenCalledTimes(1);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("SmtpMailSender.checkConnectivity() werpt als SMTP-variabelen ontbreken", async () => {
    process.env.EMAIL_DRIVER = "smtp";
    await expect(getMailSender().checkConnectivity()).rejects.toThrow(
      "SMTP-mailkanaal is niet geconfigureerd",
    );
  });

  it("ResendMailSender.checkConnectivity() doet een read-only GET /domains met Bearer-auth", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().checkConnectivity();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/domains");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
  });

  it("ResendMailSender.checkConnectivity() werpt MailConnectivityError met alleen de status bij een non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid api key details", { status: 401 }),
    );

    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_bad";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const err = await getMailSender()
      .checkConnectivity()
      .catch((e) => e);
    expect(err).toBeInstanceOf(MailConnectivityError);
    expect((err as Error).message).toContain("status 401");
    // De responsbody (kan accountdetails bevatten) mag niet lekken.
    expect((err as Error).message).not.toContain("invalid api key details");
  });

  it("ResendMailSender.checkConnectivity() werpt MailConnectivityError als de sleutel ontbreekt", async () => {
    process.env.EMAIL_DRIVER = "resend";
    await expect(getMailSender().checkConnectivity()).rejects.toBeInstanceOf(MailConnectivityError);
  });

  it("isMailDeliveryConfigured is true voor smtp, resend en postmark, false voor noop", () => {
    expect(isMailDeliveryConfigured()).toBe(false);
    process.env.EMAIL_DRIVER = "smtp";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "resend";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "postmark";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "noop";
    expect(isMailDeliveryConfigured()).toBe(false);
  });

  it("geeft een PostmarkMailSender terug als EMAIL_DRIVER=postmark", () => {
    process.env.EMAIL_DRIVER = "postmark";
    expect(getMailSender()).toBeInstanceOf(PostmarkMailSender);
  });

  it("PostmarkMailSender.send() gooit een fout als POSTMARK_SERVER_TOKEN/EMAIL_FROM ontbreken", async () => {
    process.env.EMAIL_DRIVER = "postmark";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("Postmark-mailkanaal is niet geconfigureerd");
  });

  it("PostmarkMailSender noemt de ontbrekende variabelen in de foutmelding", async () => {
    process.env.EMAIL_DRIVER = "postmark";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    const sender = getMailSender();
    await expect(sender.send(msg)).rejects.toThrow("POSTMARK_SERVER_TOKEN");
  });

  it("PostmarkMailSender POST't naar de Postmark-API met server-token-header en de e-mailvelden", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ MessageID: "abc" }), { status: 200 }));

    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_test_token";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const sender = getMailSender();
    await sender.send({ to: "jan@test.nl", subject: "Hoi", text: "Tekst", html: "<b>Tekst</b>" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.postmarkapp.com/email");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["X-Postmark-Server-Token"]).toBe(
      "pm_test_token",
    );
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({
      From: "ZZP <noreply@test.nl>",
      To: "jan@test.nl",
      Subject: "Hoi",
      TextBody: "Tekst",
      HtmlBody: "<b>Tekst</b>",
      MessageStream: "outbound",
    });
  });

  it("PostmarkMailSender laat HtmlBody weg als er geen html is meegegeven en respecteert POSTMARK_MESSAGE_STREAM", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_test_token";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    process.env.POSTMARK_MESSAGE_STREAM = "broadcasts";

    await getMailSender().send({ to: "jan@test.nl", subject: "Hoi", text: "Alleen tekst" });

    const body = JSON.parse(fetchMock.mock.calls[0]![1]?.body as string);
    expect(body).not.toHaveProperty("HtmlBody");
    expect(body.MessageStream).toBe("broadcasts");
  });

  it("PostmarkMailSender gooit een fout bij een non-2xx-respons van de API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("invalid token", { status: 422 }));

    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_bad";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await expect(getMailSender().send(msg)).rejects.toThrow("status 422");
  });

  it("PostmarkMailSender gooit HttpTimeoutError als de fetch blijft hangen", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "pm_test_token";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted.");
          err.name = "AbortError";
          reject(err);
        });
      })) as unknown as typeof fetch;

    const sender = new PostmarkMailSender(hangingFetch, 20);
    await expect(sender.send(msg)).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("PostmarkMailSender.checkConnectivity() doet een read-only GET /server met server-token-header", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ID: 1 }), { status: 200 }));

    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_test_token";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().checkConnectivity();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.postmarkapp.com/server");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>)["X-Postmark-Server-Token"]).toBe(
      "pm_test_token",
    );
  });

  it("PostmarkMailSender.checkConnectivity() werpt MailConnectivityError met alleen de status bij een non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("account details leak", { status: 401 }),
    );

    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_bad";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const err = await getMailSender()
      .checkConnectivity()
      .catch((e) => e);
    expect(err).toBeInstanceOf(MailConnectivityError);
    expect((err as Error).message).toContain("status 401");
    expect((err as Error).message).not.toContain("account details leak");
  });

  it("PostmarkMailSender.checkConnectivity() werpt MailConnectivityError als het token ontbreekt", async () => {
    process.env.EMAIL_DRIVER = "postmark";
    await expect(getMailSender().checkConnectivity()).rejects.toBeInstanceOf(MailConnectivityError);
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
