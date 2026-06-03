"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDrawer } from "@/components/actions/action-drawer";
import { ReplyComposer } from "@/components/actions/reply-composer";
import {
  CredentialReviewBody,
  InvoiceReviewBody,
  PerformanceReviewBody,
} from "@/components/actions/review-bodies";
import { type PendingTask } from "@/lib/actions/tasks";
import { type DrawerData } from "@/lib/actions/drawer-data";
import { ProfileForm } from "@/app/(protected)/profiel/profile-form";
import { CompanyForm } from "@/app/(protected)/bedrijf/company-form";
import { CredentialForm } from "@/app/(protected)/certificaten/credential-form";
import { IdentityForm } from "@/app/(protected)/account/identity-form";
import { PerformanceForm } from "@/app/(protected)/samenwerkingen/[id]/performance-form";
import { saveCredentialInline } from "@/app/(protected)/certificaten/actions";
import { editAndResubmitPerformanceAction } from "@/app/(protected)/samenwerkingen/[id]/actions";

// Rendert per drawer-taak het bijbehorende bestaande formulier inline in een slide-over. onResolved
// sluit de drawer en draait router.refresh() → de server-pagina herrekent pendingTasks → de
// afgehandelde taak verdwijnt en de volgende staat klaar (auto-advance). Zonder prefetch-data valt
// het terug op een deep-link (nooit een dode knop).
export function DrawerResolver({
  task,
  data,
  label = "Afronden",
}: {
  task: PendingTask;
  data?: DrawerData;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!data) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href={task.href}>
          Openen
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    );
  }

  const onResolved = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ActionDrawer open={open} onClose={() => setOpen(false)} title={task.title}>
        <DrawerBody data={data} onResolved={onResolved} />
      </ActionDrawer>
    </>
  );
}

function DrawerBody({ data, onResolved }: { data: DrawerData; onResolved: () => void }) {
  switch (data.kind) {
    case "profile-complete":
      if (data.section === "identity") return <IdentityForm onResolved={onResolved} />;
      return (
        <ProfileForm
          initial={data.initial}
          skills={data.skills}
          industries={data.industries}
          onResolved={onResolved}
        />
      );
    case "company-complete":
      return (
        <CompanyForm initial={data.initial} industries={data.industries} onResolved={onResolved} />
      );
    case "credential-fix":
      return (
        <CredentialForm
          initial={data.initial}
          action={saveCredentialInline}
          onResolved={onResolved}
        />
      );
    case "performance-resubmit":
      return (
        <PerformanceForm
          collaborationId={data.collabId}
          rateCents={data.rateCents}
          ortProfile={data.ortProfile}
          ortCustomRates={data.ortCustomRates}
          defaults={data.defaults}
          submitLabel="Corrigeer en dien opnieuw in"
          action={editAndResubmitPerformanceAction.bind(null, data.perfId, data.collabId)}
          onResolved={onResolved}
        />
      );
    case "message-reply":
      return (
        <ReplyComposer
          conversationId={data.conversationId}
          messages={data.messages}
          onResolved={onResolved}
        />
      );
    case "admin-verify-credential":
      return <CredentialReviewBody data={data} onResolved={onResolved} />;
    case "invoice-approve":
      return <InvoiceReviewBody data={data} onResolved={onResolved} />;
    case "performance-approve":
      return <PerformanceReviewBody data={data} onResolved={onResolved} />;
  }
}
