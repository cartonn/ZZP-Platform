import { beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { type Actor } from "@/lib/authz";
import { SigningEvidenceErasedError } from "@/lib/signing-contract";

const state = vi.hoisted(() => ({
  actor: vi.fn(),
  access: vi.fn(),
  view: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireActor: state.actor }));
vi.mock("@/lib/signing-service", () => ({
  canAccessSigningPage: state.access,
  loadSigningView: state.view,
}));
vi.mock("@/lib/audit", () => ({ audit: state.audit }));
vi.mock("./actions", () => ({ signAgreement: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("HTTP_NOT_FOUND");
  },
}));
import SigningPage from "./page";
import { SigningSkeleton } from "@/components/contracts/signing-skeleton";

const actor: Actor = { id: "client", role: "CLIENT", status: "ACTIVE" };
const params = Promise.resolve({ id: "contract" });
type ContentProps = { actor: Actor; id: string };
type Boundary = ReactElement<{ fallback: ReactElement; children: ReactElement<ContentProps> }>;
function content(boundary: Boundary) {
  const child = boundary.props.children;
  const render = child.type as (props: ContentProps) => Promise<ReactElement>;
  return render(child.props);
}

beforeEach(() => {
  vi.clearAllMocks();
  state.actor.mockResolvedValue(actor);
  state.access.mockResolvedValue(true);
  state.view.mockResolvedValue(null);
});

describe("signing loading preserves the authorization and HTTP boundary", () => {
  it("does not return a fallback while initial ownership is unresolved", async () => {
    let allow!: (value: boolean) => void;
    state.access.mockReturnValue(
      new Promise<boolean>((resolve) => {
        allow = resolve;
      }),
    );
    let returned = false;
    const page = SigningPage({ params }).then((value) => {
      returned = true;
      return value;
    });
    await vi.waitFor(() => expect(state.access).toHaveBeenCalledWith(actor, "contract"));
    expect(returned).toBe(false);
    expect(state.view).not.toHaveBeenCalled();
    allow(true);
    expect((await page).type).toBe(Suspense);
  });

  it("denies the request before returning Suspense or reading private document content", async () => {
    state.access.mockResolvedValue(false);
    await expect(SigningPage({ params })).rejects.toThrow("HTTP_NOT_FOUND");
    expect(state.view).not.toHaveBeenCalled();
    expect(state.audit).not.toHaveBeenCalled();
  });

  it("authentication failure precedes even the ownership lookup", async () => {
    state.actor.mockRejectedValue(new Error("LOGIN_REQUIRED"));
    await expect(SigningPage({ params })).rejects.toThrow("LOGIN_REQUIRED");
    expect(state.access).not.toHaveBeenCalled();
    expect(state.view).not.toHaveBeenCalled();
  });

  it("an authorized boundary exposes a neutral fallback while the full read is pending", async () => {
    let finish!: (value: null) => void;
    state.view.mockReturnValue(
      new Promise<null>((resolve) => {
        finish = resolve;
      }),
    );
    const boundary = (await SigningPage({ params })) as Boundary;
    expect(boundary.type).toBe(Suspense);
    let finished = false;
    const reading = content(boundary).then((value) => {
      finished = true;
      return value;
    });
    expect(state.view).toHaveBeenCalledWith(actor, "contract");
    expect(finished).toBe(false);
    const fallback = renderToStaticMarkup(boundary.props.fallback);
    expect(fallback).toContain('role="status"');
    expect(fallback).toContain("Je overeenkomst wordt geladen");
    expect(fallback).not.toContain("documentHash");
    expect(fallback).not.toContain("data-seal");
    expect(fallback).not.toContain("client");
    finish(null);
    const unavailable = renderToStaticMarkup(await reading);
    expect(unavailable).toContain("Overeenkomst niet meer beschikbaar");
    expect(unavailable).not.toContain("Volledige overeenkomst");
    expect(unavailable).not.toContain("<form");
    expect(state.audit).not.toHaveBeenCalled();
  });

  it("erasure during the second read cannot reconstruct a document or offer a signature", async () => {
    state.view.mockRejectedValue(new SigningEvidenceErasedError());
    const boundary = (await SigningPage({ params })) as Boundary;
    const html = renderToStaticMarkup(await content(boundary));
    expect(html).toContain("Ondertekenbewijs verwijderd");
    expect(html).not.toContain("Volledige overeenkomst");
    expect(html).not.toContain("<form");
    expect(state.audit).not.toHaveBeenCalled();
  });

  it("loading placeholders have relative widths, reduced motion and no active form controls", () => {
    const html = renderToStaticMarkup(<SigningSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("w-full min-w-0");
    expect(html).not.toMatch(/<(input|button|form)\b/);
  });
});
