import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  getMailSender,
  isMailDeliveryConfigured,
  MailConnectivityError,
  _resetMailSender,
  ResendMailSender,
  PostmarkMailSender,
  SesMailSender,
  RecordingMailSender,
  type MailMessage,
} from "./mail-sender";
import { HttpTimeoutError } from "./fetch-timeout";
import {
  recordMailDeliverySuccess,
  recordMailDeliveryFailure,
} from "@/lib/observability/mail-delivery-heartbeat";

// De aflever-heartbeat (dead-man's-switch) schrijft naar de DB; in unit-tests mocken we 'm zodat de
// verzendtests niet op prisma leunen en we de registratie-oproepen kunnen asserten.
vi.mock("@/lib/observability/mail-delivery-heartbeat", () => ({
  recordMailDeliverySuccess: vi.fn(async () => {}),
  recordMailDeliveryFailure: vi.fn(async () => {}),
}));

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
  delete process.env.SES_REGION;
  delete process.env.SES_ACCESS_KEY_ID;
  delete process.env.SES_SECRET_ACCESS_KEY;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_SESSION_TOKEN;
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

  it("isMailDeliveryConfigured is true voor smtp, resend, postmark en ses, false voor noop", () => {
    expect(isMailDeliveryConfigured()).toBe(false);
    process.env.EMAIL_DRIVER = "smtp";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "resend";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "postmark";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "ses";
    expect(isMailDeliveryConfigured()).toBe(true);
    process.env.EMAIL_DRIVER = "noop";
    expect(isMailDeliveryConfigured()).toBe(false);
  });

  it("geeft een PostmarkMailSender terug als EMAIL_DRIVER=postmark", () => {
    process.env.EMAIL_DRIVER = "postmark";
    const sender = getMailSender();
    expect(sender).toBeInstanceOf(RecordingMailSender);
    expect((sender as RecordingMailSender).inner).toBeInstanceOf(PostmarkMailSender);
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

  it("geeft een SesMailSender terug als EMAIL_DRIVER=ses", () => {
    process.env.EMAIL_DRIVER = "ses";
    const sender = getMailSender();
    expect(sender).toBeInstanceOf(RecordingMailSender);
    expect((sender as RecordingMailSender).inner).toBeInstanceOf(SesMailSender);
  });

  it("SesMailSender.send() gooit een fout als SES_REGION/EMAIL_FROM ontbreken", async () => {
    process.env.EMAIL_DRIVER = "ses";
    await expect(getMailSender().send(msg)).rejects.toThrow(
      "SES-mailkanaal is niet geconfigureerd",
    );
  });

  it("SesMailSender.send() gooit een fout als de credentials ontbreken", async () => {
    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    await expect(getMailSender().send(msg)).rejects.toThrow("Ontbrekende credentials");
  });

  it("SesMailSender POST't SigV4-ondertekend naar de SES v2-API met de e-mailvelden", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ MessageId: "abc" }), { status: 200 }));

    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().send({
      to: "jan@test.nl",
      subject: "Hoi",
      text: "Tekst",
      html: "<b>Tekst</b>",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    // SigV4-ondertekend: Authorization + x-amz-date aanwezig, en geen secret in de headers.
    expect(headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIA_TEST\//);
    expect(headers["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
    expect(JSON.stringify(headers)).not.toContain("secret");
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({
      FromEmailAddress: "ZZP <noreply@test.nl>",
      Destination: { ToAddresses: ["jan@test.nl"] },
      Content: {
        Simple: {
          Subject: { Data: "Hoi" },
          Body: { Text: { Data: "Tekst" }, Html: { Data: "<b>Tekst</b>" } },
        },
      },
    });
  });

  it("SesMailSender valt terug op AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY en laat Html weg zonder html", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-central-1";
    process.env.AWS_ACCESS_KEY_ID = "AKIA_AWS_FALLBACK";
    process.env.AWS_SECRET_ACCESS_KEY = "aws-secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().send({ to: "jan@test.nl", subject: "Hoi", text: "Alleen tekst" });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://email.eu-central-1.amazonaws.com/v2/email/outbound-emails");
    expect((init?.headers as Record<string, string>).Authorization).toContain("AKIA_AWS_FALLBACK");
    const body = JSON.parse(init?.body as string);
    expect(body.Content.Simple.Body).not.toHaveProperty("Html");
  });

  it("SesMailSender gooit een fout bij een non-2xx-respons van de API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("MessageRejected", { status: 400 }),
    );

    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await expect(getMailSender().send(msg)).rejects.toThrow("status 400");
  });

  it("SesMailSender gooit HttpTimeoutError als de fetch blijft hangen", async () => {
    process.env.SES_REGION = "eu-west-1";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted.");
          err.name = "AbortError";
          reject(err);
        });
      })) as unknown as typeof fetch;

    const sender = new SesMailSender(hangingFetch, 20);
    await expect(sender.send(msg)).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("SesMailSender.checkConnectivity() doet een read-only SigV4-ondertekende GET /v2/email/account", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ SendingEnabled: true }), { status: 200 }));

    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().checkConnectivity();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://email.eu-west-1.amazonaws.com/v2/email/account");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toMatch(/^AWS4-HMAC-SHA256 /);
  });

  it("SesMailSender.checkConnectivity() werpt MailConnectivityError met alleen de status bij een non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("account details leak", { status: 403 }),
    );

    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    const err = await getMailSender()
      .checkConnectivity()
      .catch((e) => e);
    expect(err).toBeInstanceOf(MailConnectivityError);
    expect((err as Error).message).toContain("status 403");
    expect((err as Error).message).not.toContain("account details leak");
  });

  it("SesMailSender.checkConnectivity() werpt MailConnectivityError als regio of credentials ontbreken", async () => {
    process.env.EMAIL_DRIVER = "ses";
    // Geen SES_REGION → connectiviteitsfout
    await expect(getMailSender().checkConnectivity()).rejects.toBeInstanceOf(MailConnectivityError);
    _resetMailSender();
    process.env.SES_REGION = "eu-west-1";
    // Regio maar geen credentials → connectiviteitsfout
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

describe("RecordingMailSender — aflever-heartbeat (dead-man's-switch)", () => {
  beforeEach(() => {
    // Wis de call-historie van de gemockte heartbeat-registratie tussen deze tests (vi.mock-fabriek-
    // mocks worden niet door restoreAllMocks gereset), zodat not.toHaveBeenCalled() betrouwbaar is.
    vi.mocked(recordMailDeliverySuccess).mockClear();
    vi.mocked(recordMailDeliveryFailure).mockClear();
  });

  it("registreert een geslaagde verzending via een echte driver met de driver-modus", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().send(msg);

    expect(recordMailDeliverySuccess).toHaveBeenCalledWith("resend");
    expect(recordMailDeliveryFailure).not.toHaveBeenCalled();
  });

  it("registreert een mislukte verzending én gooit de originele fout door", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid api key", { status: 401 }),
    );
    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_bad";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await expect(getMailSender().send(msg)).rejects.toThrow("status 401");

    expect(recordMailDeliveryFailure).toHaveBeenCalledWith("resend");
    expect(recordMailDeliverySuccess).not.toHaveBeenCalled();
  });

  it("registreert niets voor de noop-driver (er wordt niets afgeleverd)", async () => {
    delete process.env.EMAIL_DRIVER;
    await getMailSender().send(msg);

    expect(recordMailDeliverySuccess).not.toHaveBeenCalled();
    expect(recordMailDeliveryFailure).not.toHaveBeenCalled();
  });

  it("checkConnectivity gaat ongewijzigd door (read-only, geen aflevering → geen registratie)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";

    await getMailSender().checkConnectivity();

    expect(recordMailDeliverySuccess).not.toHaveBeenCalled();
    expect(recordMailDeliveryFailure).not.toHaveBeenCalled();
  });
});
