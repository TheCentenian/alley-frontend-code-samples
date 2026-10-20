/**
 * Excerpt from src/components/features/goals/forms/BasicGoalForm.tsx.
 * Wizard rendering and the action area.
 */

  const {
    currentStep,
    currentStepIndex,
    progress,
    stepDescriptions,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetSteps,
    isFirstStep,
    isLastStep,
  } = useStepNavigation({ onClose, form });

  const { coins } = useFilteredCoins(userTier);

  // When isOpen becomes true, clear the field values and set the step back to name.
  useEffect(() => {
    if (isOpen) {
      resetForm();
      resetSteps();
    }
  }, [isOpen, resetForm, resetSteps]);

  // data.coin is an id. Find that coin and pass it to the submit handler.
  const handleFormSubmitWithCoin = async (data: BasicGoalFormData) => {
    const selectedCoin = coins.find(c => c.id === data.coin);
    await handleFormSubmit(data, selectedCoin);
  };

  // Clear the fields, reset the step, and call the parent's onClose.
  const handleClose = () => {
    resetForm();
    resetSteps();
    onClose();
  };

  // Return the component whose case matches currentStep.
  const currentStepComponent = useMemo(() => {
    const stepInfo = stepDescriptions[currentStep];

    switch (currentStep) {
      case 'name':
        return <BasicGoalStepName form={form} stepInfo={stepInfo} />;
      case 'coin':
        return <BasicGoalStepCoin form={form} stepInfo={stepInfo} userTier={userTier} />;
      case 'current':
        return <BasicGoalStepCurrent form={form} stepInfo={stepInfo} />;
      case 'amount':
        return <BasicGoalStepAmount form={form} stepInfo={stepInfo} />;
      case 'review':
        return <BasicGoalStepReview form={form} stepInfo={stepInfo} userTier={userTier} />;
      default:
        return null;
    }
  }, [currentStep, stepDescriptions, form, userTier]);

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      {/* Draws the step list. onStepClick receives the step id the user clicked. */}
      <BasicGoalStepProgress
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        progress={progress}
        onStepClick={goToStep}
      />

      {/* handleSubmit validates, then calls handleFormSubmitWithCoin with the form values. */}
      <form onSubmit={form.handleSubmit(handleFormSubmitWithCoin)} className="space-y-4">
        {currentStepComponent}
      </form>

      {/* Back, Next, Cancel, and Submit. isFirstStep and isLastStep decide which of those render. */}
      <BasicGoalStepActions
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        onPrevious={goToPreviousStep}
        onNext={goToNextStep}
        onCancel={handleClose}
        onSubmit={form.handleSubmit(handleFormSubmitWithCoin)}
      />
    </div>
  );
