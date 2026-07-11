import { onboardingSteps, type OnboardingStep } from "@/lib/navigation/onboarding";

type OnboardingStepperProps = {
  completedSteps: ReadonlySet<OnboardingStep>;
  currentStep: OnboardingStep;
};

export function OnboardingStepper({
  completedSteps,
  currentStep,
}: OnboardingStepperProps) {
  return (
    <ol className="stepper" aria-label="Organization setup progress">
      {onboardingSteps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = completedSteps.has(step.id);
        const stateClass = isCurrent
          ? "step-current"
          : isComplete
            ? "step-complete"
            : "";

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className={stateClass}
            key={step.id}
          >
            <span className="step-marker" aria-hidden="true">
              {isComplete ? "✓" : index + 1}
            </span>
            <span className="step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
