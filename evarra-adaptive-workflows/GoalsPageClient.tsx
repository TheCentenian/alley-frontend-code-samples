/**
 * Excerpt from src/components/features/goals/GoalsPageClient.tsx.
 * The Quick / Full creation flow. Not imported by the app.
 */

  const { useFullGoalCreation, setUseFullGoalCreation } = useSettings();

  // Both handlers save an active regular goal for the current user.
  const basicFormOnSubmit = useCallback(async (data: any) => {
    if (!user) return;
    const newGoal = {
      ...data,
      userId: user.id,
      status: 'active',
      goalType: 'regular' as const,
    };
    await addGoal(newGoal);
  }, [user, addGoal]);

  const fullFormOnSubmit = useCallback(async (data: any) => {
    if (!user) return;
    const newGoal = {
      ...data,
      userId: user.id,
      status: 'active',
      goalType: 'regular' as const,
    };
    await addGoal(newGoal);
  }, [user, addGoal]);

  // Basic form renders in the page, so scroll it into view when it opens.
  const basicFormManager = useFormManager({
    shouldScrollIntoView: true,
    onSubmit: basicFormOnSubmit,
  });
  const fullFormManager = useFormManager({
    onSubmit: fullFormOnSubmit,
  });
  const formManagers = { basicForm: basicFormManager, fullForm: fullFormManager };

  // Open the full form when useFullGoalCreation is true. Otherwise open the basic form.
  const handleCreateGoalClick = useCallback(() => {
    if (useFullGoalCreation) {
      formManagers.fullForm.handleOpen();
    } else {
      formManagers.basicForm.handleOpen();
    }
  }, [useFullGoalCreation, formManagers.fullForm, formManagers.basicForm]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      createIntentHandledRef.current = false;
      return;
    }

    if (createIntentHandledRef.current) {
      return;
    }

    createIntentHandledRef.current = true;
    // The URL asked to create a goal. Open the selected form once, then drop the query param.
    handleCreateGoalClick();
    router.replace('/goals', { scroll: false });
  }, [searchParams, handleCreateGoalClick, router]);

  // Inside the page header:
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    {/* "full" when useFullGoalCreation is true, otherwise "quick". Changing it saves that boolean. */}
    <SegmentedControl
      label="New goal"
      value={useFullGoalCreation ? 'full' : 'quick'}
      options={[
        { value: 'quick', label: 'Quick' },
        { value: 'full', label: 'Full' },
      ]}
      onValueChange={value => void setUseFullGoalCreation(value === 'full')}
    />
    <CreateGoalButton onClick={handleCreateGoalClick}>Create Goal</CreateGoalButton>
  </div>

  {/* Quick mode: render the basic wizard when its form manager is open. */}
  {!useFullGoalCreation && formManagers.basicForm.isOpen && (
    <DynamicBasicGoalForm
      isOpen={formManagers.basicForm.isOpen}
      onClose={formManagers.basicForm.handleClose}
      onSubmit={formManagers.basicForm.handleSubmit}
      userTier={user?.tier || 'free'}
    />
  )}

  {/* Full mode: render the advanced form when its form manager is open. */}
  {useFullGoalCreation && formManagers.fullForm.isOpen && (
    <DynamicAdvancedGoalForm
      isOpen={formManagers.fullForm.isOpen}
      onClose={formManagers.fullForm.handleClose}
      onSubmit={formManagers.fullForm.handleSubmit}
      userTier={user?.tier || 'free'}
    />
  )}
