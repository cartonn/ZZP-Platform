import { BrandMark } from "@/components/ui/brand-mark";
import { type Metadata } from "next";
import Link from "next/link";
import { currentActor } from "@/lib/authz";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = { title: "ZZP-profiel · Handslag" };

/**
 * Standalone publieke profielpagina (deelbaar, ook zonder login zichtbaar bij PUBLIC).
 * De weergave zelf is gedeeld met "Mijn profiel" (/profiel) — zie ProfileScreen.
 */
export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const viewer = await currentActor();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-sm font-semibold">Handslag</span>
          </Link>
          {!viewer && (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Inloggen
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ProfileScreen profileId={id} tab={tab} basePath={`/zzp/${id}`} />
      </main>
    </div>
  );
}
