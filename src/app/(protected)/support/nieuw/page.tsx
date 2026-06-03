import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewTicketForm } from "./new-ticket-form";

export const metadata: Metadata = { title: "Nieuwe vraag · ZZP Platform" };

export default async function NewTicketPage() {
  await requireActor();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Nieuwe vraag"
        description="Beschrijf je vraag zo concreet mogelijk. Vaak krijg je meteen antwoord; lukt dat niet, dan pakt de helpdesk het op."
      />
      <Card>
        <CardContent className="py-5">
          <NewTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
