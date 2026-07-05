import { redirect } from "next/navigation";

import {
  getOnboardingContext,
  nextIncompleteStep,
} from "@/lib/navigation/onboarding";

export default async function WorkspacePage() {
  const context = await getOnboardingContext();
  if (!context) {
    redirect("/create-organization");
  }

  const nextStep = nextIncompleteStep(context);
  if (nextStep !== "/onboarding/complete") {
    redirect(nextStep);
  }

  // Milestone 1 resolves the user's role but does not fabricate an operating
  // dashboard. The complete screen renders the authorized landing identity.
  redirect("/onboarding/complete");
}
