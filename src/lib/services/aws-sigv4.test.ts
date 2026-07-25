import { describe, expect, it } from "vitest";

import { signAwsV4 } from "./aws-sigv4";

// AWS' officiële, gedocumenteerde SigV4-testvector ("Examples of the complete Signature Version 4
// signing process", https://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html).
// Als onze pure signer exact deze bekende signature reproduceert, klopt de canonieke-request-,
// string-to-sign- en HMAC-keten-implementatie — het fundament onder de SES-driver.
const AWS_EXAMPLE = {
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  region: "us-east-1",
  service: "iam",
  date: new Date("2015-08-30T12:36:00Z"),
};

describe("signAwsV4", () => {
  it("reproduceert AWS' officiële testvector (GET iam ListUsers)", () => {
    const result = signAwsV4({
      method: "GET",
      host: "iam.amazonaws.com",
      path: "/",
      query: "Action=ListUsers&Version=2010-05-08",
      body: "",
      extraHeaders: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      ...AWS_EXAMPLE,
    });

    expect(result.amzDate).toBe("20150830T123600Z");
    expect(result.authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/iam/aws4_request, " +
        "SignedHeaders=content-type;host;x-amz-date, " +
        "Signature=5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7",
    );
  });

  it("zet host + x-amz-date + Authorization op de headers en echoot geen secret", () => {
    const result = signAwsV4({
      method: "POST",
      host: "email.eu-west-1.amazonaws.com",
      path: "/v2/email/outbound-emails",
      body: JSON.stringify({ hello: "world" }),
      region: "eu-west-1",
      service: "ses",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "super-secret-value",
      date: new Date("2026-07-25T09:00:00Z"),
      extraHeaders: { "Content-Type": "application/json" },
    });

    expect(result.headers.host).toBe("email.eu-west-1.amazonaws.com");
    expect(result.headers["x-amz-date"]).toBe("20260725T090000Z");
    expect(result.headers.Authorization).toBe(result.authorization);
    // De signature is hex (64 tekens) en de secret komt nergens in de output voor.
    expect(result.authorization).toMatch(/Signature=[0-9a-f]{64}$/);
    expect(JSON.stringify(result)).not.toContain("super-secret-value");
  });

  it("neemt een STS-sessietoken mee in de ondertekende headers", () => {
    const result = signAwsV4({
      method: "POST",
      host: "email.eu-central-1.amazonaws.com",
      path: "/v2/email/outbound-emails",
      body: "{}",
      region: "eu-central-1",
      service: "ses",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      sessionToken: "session-token-123",
      date: new Date("2026-07-25T09:00:00Z"),
      extraHeaders: { "Content-Type": "application/json" },
    });

    expect(result.headers["x-amz-security-token"]).toBe("session-token-123");
    expect(result.authorization).toContain(
      "SignedHeaders=content-type;host;x-amz-date;x-amz-security-token",
    );
  });

  it("is deterministisch voor dezelfde invoer", () => {
    const input = {
      method: "POST" as const,
      host: "email.eu-west-1.amazonaws.com",
      path: "/v2/email/outbound-emails",
      body: "{}",
      region: "eu-west-1",
      service: "ses",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      date: new Date("2026-07-25T09:00:00Z"),
      extraHeaders: { "Content-Type": "application/json" },
    };
    expect(signAwsV4(input).authorization).toBe(signAwsV4(input).authorization);
  });
});
