import { expect, it } from "vitest";
import { createRequire } from "node:module";

// Exercise the installed package, without SMTP, DNS, credentials or delivery.
// The app uses dynamic import; Auth.js retains a CommonJS-compatible dependency.
it("constructs an offline message through the actual dynamic Nodemailer import", async () => {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const result = await transport.sendMail({
    from: "Handslag <sender@example.invalid>",
    to: "Testwerker <recipient@example.invalid>",
    subject: "Uren goedgekeurd",
    text: "Je uren zijn goedgekeurd.",
    html: "<p>Je uren zijn goedgekeurd.</p>",
  });
  const message = JSON.parse(result.message);
  expect(result.envelope).toEqual({
    from: "sender@example.invalid",
    to: ["recipient@example.invalid"],
  });
  expect(message).toMatchObject({
    subject: "Uren goedgekeurd",
    text: "Je uren zijn goedgekeurd.",
    html: "<p>Je uren zijn goedgekeurd.</p>",
  });
  transport.close();
});

it("retains the CommonJS createTransport interface without a network transport", async () => {
  const require = createRequire(import.meta.url);
  const nodemailer = require("nodemailer") as typeof import("nodemailer");
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const result = await transport.sendMail({
    from: "sender@example.invalid",
    to: "recipient@example.invalid",
    subject: "Test",
    text: "Synthetisch bericht",
  });
  expect(result.envelope.to).toEqual(["recipient@example.invalid"]);
  expect(JSON.parse(result.message).text).toBe("Synthetisch bericht");
  transport.close();
});
