import { redirect } from "next/navigation";

import {
  getOnboardingContext,
  nextIncompleteStep,
} from "@/lib/navigation/onboarding";
import { workspacePathForRole } from "@/lib/navigation/workspace";

export default async function WorkspacePage() {
  const context = await getOnboardingContext();
  if (!context) {
    redirect("/create-organization");
  }

  const nextStep = nextIncompleteStep(context);
  if (nextStep !== "/onboarding/complete") {
    redirect(nextStep);
  }

  redirect(workspacePathForRole(context.membership.role));
}
