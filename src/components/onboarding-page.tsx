import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import {
  getOnboardingContext,
  type OnboardingContext,
  type OnboardingStep,
} from "@/lib/navigation/onboarding";
import { redirect } from "next/navigation";

type OnboardingPageProps = {
  children: (context: OnboardingContext) => ReactNode;
  currentStep: OnboardingStep;
  description: string;
  eyebrow?: string;
  title: string;
};

export async function OnboardingPage({
  children,
  currentStep,
  description,
  eyebrow = "Organization setup",
  title,
}: OnboardingPageProps) {
  const context = await getOnboardingContext();
  if (!context) {
    redirect("/create-organization");
  }

  const completedSteps = new Set<OnboardingStep>(
    context.checklists
      .filter((item) => ["completed", "skipped"].includes(item.status))
      .map((item) => item.step),
  );

  return (
    <AppShell
      email={context.user.email}
      organizationName={context.organization.name}
      role={context.membership.role}
    >
      <OnboardingStepper
        completedSteps={completedSteps}
        currentStep={currentStep}
      />
      <header className="page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </header>
      {children(context)}
    </AppShell>
  );
}
