import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ModelAgreementCard } from "./model-agreement-card";

vi.mock("./actions", () => ({
  setAgreementTypeAction: vi.fn(),
  signModelAgreementAction: vi.fn(),
}));

function render(signingOpen: boolean, signatures: Array<Date | null>) {
  return renderToStaticMarkup(
    <ModelAgreementCard
      collaborationId="historical-agreement"
      agreementType="GEEN_WERKGEVERSGEZAG"
      recommendation={{ recommended: false, type: null, label: null, reasons: [], note: "" }}
      rows={signatures.map((signedAt, index) => ({
        role: `Partij ${index}`,
        name: "Test",
        signedAt,
      }))}
      signingOpen={signingOpen}
      canSign={false}
      canChooseType={false}
    />,
  );
}

describe("model agreement approval marks", () => {
  const signed = new Date("2026-09-01T12:00:00Z");

  it("shows pending marks while signing is open even when the current viewer cannot sign", () => {
    const html = render(true, [null, null]);
    expect(html).toContain('data-approval="pending"');
    expect(html.match(/hs-seal-pending/g)).toHaveLength(3);
  });

  it("does not present an unsigned historical agreement as pending", () => {
    const html = render(false, [null, null]);
    expect(html).not.toContain("hs-seal-pending");
    expect(html).not.toContain("data-approval");
    expect(html).not.toContain("nog niet ondertekend");
    expect(html).toContain("niet ondertekend");
  });

  it("retains actual historical signatures without a pending mark for the other party", () => {
    const html = render(false, [signed, null]);
    expect(html).not.toContain("hs-seal-pending");
    expect(html).not.toContain("data-approval");
    expect(html.match(/hs-seal-approved/g)).toHaveLength(1);
    expect(html).toContain("akkoord op");
  });

  it("keeps the approved seal for a fully signed historical agreement", () => {
    const html = render(false, [signed, signed]);
    expect(html).toContain('data-approval="approved"');
    expect(html).toContain("Ondertekend");
    expect(html).not.toContain("hs-seal-pending");
  });
});
