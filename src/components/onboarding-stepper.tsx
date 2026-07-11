import Link from "next/link";

import { onboardingSteps, type OnboardingStep } from "@/lib/navigation/onboarding";

type OnboardingStepperProps = {
  completedSteps: ReadonlySet<OnboardingStep>;
  currentStep: OnboardingStep;
};

export function OnboardingStepper({
  completedSteps,
  currentStep,
}: OnboardingStepperProps) {
  const currentIndex = onboardingSteps.findIndex((step) => step.id === currentStep);

  return (
    <ol className="stepper" aria-label="Organization setup progress">
      {onboardingSteps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = completedSteps.has(step.id);
        const canNavigate = isComplete || index <= currentIndex;
        const stateClass = isCurrent
          ? "step-current"
          : isComplete
            ? "step-complete"
            : "";
        const stepContent = (
          <>
            <span className="step-marker" aria-hidden="true">
              {isComplete ? "✓" : index + 1}
            </span>
            <span className="step-label">{step.label}</span>
          </>
        );

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className={stateClass}
            key={step.id}
          >
            {canNavigate ? (
              <Link
                aria-label={`Go to ${step.label} setup`}
                className="step-link"
                href={step.path}
              >
                {stepContent}
              </Link>
            ) : (
              <span className="step-static">{stepContent}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
