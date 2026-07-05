import { redirect } from "next/navigation";

import {
  getOnboardingContext,
  nextIncompleteStep,
} from "@/lib/navigation/onboarding";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const context = await getOnboardingContext();

  if (!context) {
    redirect("/create-organization");
  }

  if (params.error) {
    redirect(`/onboarding/company?error=${encodeURIComponent(String(params.error))}`);
  }

  redirect(nextIncompleteStep(context));
}
