// Onboarding-logica: berekent de stappen voor nieuwe ZZP'ers.
// Pure functies, getest. Server-side is de waarheid (CLAUDE.md regel 1).

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

export interface OnboardingData {
  profileComplete: boolean; // profile name, bio, skills set
  hasCredential: boolean; // at least one credential uploaded
  hasAvailability: boolean; // at least one availability window
  hasApplied: boolean; // has applied to at least one job
}

export function computeOnboardingSteps(data: OnboardingData): OnboardingStep[] {
  return [
    {
      id: "profile",
      label: "Profiel invullen",
      description: "Voeg je naam, bio en vaardigheden toe zodat opdrachtgevers je kunnen vinden.",
      href: "/profiel/bewerken",
      completed: data.profileComplete,
    },
    {
      id: "credential",
      label: "Certificaat uploaden",
      description: "Upload een diploma of certificaat om je expertise aan te tonen.",
      href: "/certificaten/nieuw",
      completed: data.hasCredential,
    },
    {
      id: "availability",
      label: "Beschikbaarheid instellen",
      description: "Geef aan wanneer je beschikbaar bent voor opdrachten.",
      href: "/beschikbaarheid",
      completed: data.hasAvailability,
    },
    {
      id: "apply",
      label: "Eerste opdracht zoeken",
      description: "Bekijk openstaande opdrachten die bij je passen en reageer.",
      href: "/opdrachten",
      completed: data.hasApplied,
    },
  ];
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((s) => s.completed);
}
