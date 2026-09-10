import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CredentialStatusBadge } from "./credential-status-badge";

// Server-side waarheid (CLAUDE.md regel 1): een VERIFIED-certificaat waarvan de vervaldatum is
// gepasseerd is verlopen — óók vóór de expiry-cron de status naar EXPIRED flipt. De badge mag
// dan geen "Geverifieerd" tonen, anders spreekt hij de danger-band/compliance op hetzelfde
// scherm tegen. Deze test bevriest dat de badge door dezelfde `isExpired`-regel loopt.

const DAY = 24 * 60 * 60 * 1000;

describe("CredentialStatusBadge", () => {
  it("toont 'Verlopen' voor een VERIFIED-certificaat waarvan de vervaldatum is gepasseerd", () => {
    const html = renderToStaticMarkup(
      <CredentialStatusBadge status="VERIFIED" expiresAt={new Date(Date.now() - DAY)} />,
    );
    expect(html).toContain("Verlopen");
    expect(html).not.toContain("Geverifieerd");
  });

  it("houdt 'Geverifieerd' groen voor een VERIFIED-certificaat met vervaldatum in de toekomst", () => {
    const html = renderToStaticMarkup(
      <CredentialStatusBadge status="VERIFIED" expiresAt={new Date(Date.now() + DAY)} />,
    );
    expect(html).toContain("Geverifieerd");
  });

  it("houdt 'Geverifieerd' groen voor een VERIFIED-certificaat zonder vervaldatum", () => {
    expect(renderToStaticMarkup(<CredentialStatusBadge status="VERIFIED" />)).toContain(
      "Geverifieerd",
    );
    expect(
      renderToStaticMarkup(<CredentialStatusBadge status="VERIFIED" expiresAt={null} />),
    ).toContain("Geverifieerd");
  });

  it("laat een gepasseerde vervaldatum bij een niet-VERIFIED-status ongemoeid", () => {
    // Alleen een VERIFIED-certificaat kan verlopen (CLAUDE.md verificatieflow stap 5).
    const submitted = renderToStaticMarkup(
      <CredentialStatusBadge status="SUBMITTED" expiresAt={new Date(Date.now() - DAY)} />,
    );
    expect(submitted).toContain("In beoordeling");
    const rejected = renderToStaticMarkup(
      <CredentialStatusBadge status="REJECTED" expiresAt={new Date(Date.now() - DAY)} />,
    );
    expect(rejected).toContain("Afgewezen");
  });

  it("mapt elke ruwe status op zijn eigen label", () => {
    const cases: Array<[Parameters<typeof CredentialStatusBadge>[0]["status"], string]> = [
      ["DRAFT", "Concept"],
      ["SUBMITTED", "In beoordeling"],
      ["VERIFIED", "Geverifieerd"],
      ["REJECTED", "Afgewezen"],
      ["EXPIRED", "Verlopen"],
    ];
    for (const [status, label] of cases) {
      expect(renderToStaticMarkup(<CredentialStatusBadge status={status} />), status).toContain(
        label,
      );
    }
  });
});
