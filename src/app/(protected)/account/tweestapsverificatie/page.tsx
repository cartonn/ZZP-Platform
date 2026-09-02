import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { getTwoFactorSetup } from "./actions";
import { TwoFactorPanel } from "./two-factor-panel";

export const metadata: Metadata = { title: "Tweestapsverificatie · Handslag" };

export default async function TwoFactorPage() {
  await requireActor();
  const setup = await getTwoFactorSetup();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Tweestapsverificatie"
        description="Voeg een extra beveiligingslaag toe met een eenmalige code uit je authenticator-app."
      />

      <TwoFactorPanel status={setup.status} otpauthUri={setup.otpauthUri} secret={setup.secret} />
    </div>
  );
}
