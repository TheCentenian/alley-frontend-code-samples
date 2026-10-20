/**
 * Excerpt from src/components/features/goals/forms/hooks/useStepNavigation.ts.
 * Step list and the functions that move between steps. Not imported by the app.
 */
import { useState, useCallback } from 'react';
import { findExistingGoalByName } from '@/lib/domains/goals/utils/clientGoalActions';
import { useAuthStore } from '@/lib/store/auth';

export type Step = 'name' | 'coin' | 'current' | 'amount' | 'review';

// Ordered list of steps. The wizard starts at index 0 and moves by index.
export const steps: { id: Step; title: string }[] = [
  { id: 'name', title: 'Goal Name' },
  { id: 'coin', title: 'Select Coin' },
  { id: 'current', title: 'Current Holdings' },
  { id: 'amount', title: 'Target Amount' },
  { id: 'review', title: 'Review' },
];

// Copy shown on each step: a heading, a short description, and the tooltip text.
export const stepDescriptions: Record<Step, { title: string; description: string; tooltip: string }> = {
  name: {
    title: 'Name Your Goal',
    description: 'Give your goal a memorable name that reflects what you want to achieve.',
    tooltip: 'A good goal name helps you stay motivated and track your progress. For example: "My First Bitcoin" or "Ethereum Dream"',
  },
  current: {
    title: 'Current Holdings',
    description: 'Enter how much of this cryptocurrency you currently own.',
    tooltip: 'If you have added wallets in the Wallets page, you can check your current holdings there. You can always update this amount later.',
  },
  amount: {
    title: 'Set Your Target',
    description: 'Decide how much cryptocurrency you want to accumulate.',
    tooltip: 'Choose an amount that is challenging but achievable. Consider your current savings and investment timeline.',
  },
  coin: {
    title: 'Choose Your Coin',
    description: 'Select which cryptocurrency you want to save for.',
    tooltip: 'Different coins have different characteristics. Bitcoin is the most established, while others might offer different opportunities.',
  },
  review: {
    title: 'Review Your Goal',
    description: 'Double-check your goal details before creating it.',
    tooltip: 'Make sure everything looks correct. You can always edit your goal later if needed.',
  },
};

interface UseStepNavigationProps {
  onClose: () => void;
  form?: any; // React Hook Form instance for validation
}

export function useStepNavigation({ onClose, form }: UseStepNavigationProps) {
  // The id of the step currently rendered. Starts at name.
  const [currentStep, setCurrentStep] = useState<Step>('name');
  // Flipped after a failed check so the form re-renders with the new error.
  const [, setRerender] = useState(false);

  // Position of currentStep in the steps array.
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  // 0–100 value for the progress indicator. Step 1 of 5 is 20.
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check the current step, then move forward one index. Return early when the check fails.
  const goToNextStep = useCallback(async () => {
    if (form) {
      let isValid = true;
      let fieldName: string | null = null;

      // Each step checks one field. Review has no field, so fieldName stays null.
      switch (currentStep) {
        case 'name':
          fieldName = 'name';
          break;
        case 'coin':
          fieldName = 'coin';
          break;
        case 'current':
          fieldName = 'currentAmount';
          break;
        case 'amount':
          fieldName = 'targetAmount';
          break;
        default:
          fieldName = null;
      }

      if (fieldName) {
        // Run the schema for fieldName. On failure, focus that field and do not change the step.
        isValid = await form.trigger(fieldName);
        if (!isValid) {
          form.setFocus(fieldName);
          // form.trigger updates error state after this tick, so re-render once.
          setTimeout(() => setRerender(r => !r), 0);
          return;
        }
      }

      // On the name step, search this user's saved goals for the same name.
      // A match sets an error on the name field and does not change the step.
      if (currentStep === 'name') {
        const name = form.getValues('name');
        const userId = useAuthStore.getState().user?.id;
        if (name && userId) {
          const duplicate = findExistingGoalByName(name, userId);
          if (duplicate) {
            form.setError('name', { type: 'manual', message: 'A goal with this name already exists' });
            form.setFocus('name');
            setTimeout(() => setRerender(r => !r), 0);
            return;
          }
        }
      }
    }

    // Move to the next entry in `steps`. No-op on the last step.
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].id);
    }
  }, [currentStepIndex, currentStep, form]);

  // Move to the previous entry in `steps`. No-op on the first step.
  const goToPreviousStep = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id);
    }
  }, [currentStepIndex]);

  // Jump straight to a step. Used by the progress indicator.
  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
  }, []);

  // Put the wizard back on the name step.
  const resetSteps = useCallback(() => {
    setCurrentStep('name');
  }, []);

  // The action buttons use these to hide Back on the first step and show Submit on the last.
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return {
    currentStep,
    currentStepIndex,
    progress,
    steps,
    stepDescriptions,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetSteps,
    isFirstStep,
    isLastStep,
  };
}
