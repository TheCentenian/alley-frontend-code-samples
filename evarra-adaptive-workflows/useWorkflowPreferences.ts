'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { useAppSettings } from '@/components/providers/settings-provider';
import { usePrivacySettings } from '@/lib/domains/features/settings/privacy';
import { isGuestUser } from '@/lib/utils/guestMode';
import { updateUserSettingsAction } from '@/app/actions/settings';
import type { AppAdvancedFeatures } from '@/lib/server/types';

type WorkflowDefaultKey = keyof AppAdvancedFeatures;

export function useWorkflowPreferences() {
  const user = useAuthStore(state => state.user);
  const guestPreferences = usePrivacySettings();
  const { settings, updateWorkflowDefault, setAllWorkflowDefaults } = useAppSettings();

  const persistWorkflowDefault = useCallback(
    async (key: WorkflowDefaultKey, value: boolean) => {
      if (isGuestUser(user)) {
        const guestSetters: Record<WorkflowDefaultKey, (value: boolean) => void> = {
          advanced_goal_panel: guestPreferences.setUseGoalDetailsPanel,
          advanced_goal_creation: guestPreferences.setUseFullGoalCreation,
          advanced_account_menu: guestPreferences.setUseFullAccountMenu,
          advanced_goals_grid: guestPreferences.setUseFocusGoalsView,
          advanced_wallet_panel: guestPreferences.setUseWalletDetailsPanel,
        };
        guestSetters[key](value);
        return;
      }

      updateWorkflowDefault(key, value);
      try {
        await updateUserSettingsAction({
          advanced_features: { [key]: value },
        });
      } catch {
        updateWorkflowDefault(key, !value);
        toast.error('Failed to update setting');
      }
    },
    [guestPreferences, updateWorkflowDefault, user]
  );

  const persistAllWorkflowDefaults = useCallback(
    async (value: boolean) => {
      if (isGuestUser(user)) {
        guestPreferences.setAllWorkflowDefaults(value);
        return;
      }

      setAllWorkflowDefaults(value);
      try {
        await updateUserSettingsAction({
          advanced_features: {
            advanced_goal_panel: value,
            advanced_goal_creation: value,
            advanced_account_menu: value,
            advanced_goals_grid: value,
            advanced_wallet_panel: value,
          },
        });
      } catch {
        toast.error('Failed to update settings');
      }
    },
    [guestPreferences, setAllWorkflowDefaults, user]
  );

  if (isGuestUser(user)) {
    return {
      useGoalDetailsPanel: guestPreferences.useGoalDetailsPanel,
      useFullGoalCreation: guestPreferences.useFullGoalCreation,
      useFullAccountMenu: guestPreferences.useFullAccountMenu,
      useFocusGoalsView: guestPreferences.useFocusGoalsView,
      useWalletDetailsPanel: guestPreferences.useWalletDetailsPanel,
      setUseGoalDetailsPanel: guestPreferences.setUseGoalDetailsPanel,
      setUseFullGoalCreation: guestPreferences.setUseFullGoalCreation,
      setUseFullAccountMenu: guestPreferences.setUseFullAccountMenu,
      setUseFocusGoalsView: guestPreferences.setUseFocusGoalsView,
      setUseWalletDetailsPanel: guestPreferences.setUseWalletDetailsPanel,
      setAllWorkflowDefaults: guestPreferences.setAllWorkflowDefaults,
    };
  }

  const workflowDefaults = settings.advanced_features;

  return {
    useGoalDetailsPanel: workflowDefaults.advanced_goal_panel,
    useFullGoalCreation: workflowDefaults.advanced_goal_creation,
    useFullAccountMenu: workflowDefaults.advanced_account_menu,
    useFocusGoalsView: workflowDefaults.advanced_goals_grid,
    useWalletDetailsPanel: workflowDefaults.advanced_wallet_panel,
    setUseGoalDetailsPanel: (value: boolean) => persistWorkflowDefault('advanced_goal_panel', value),
    setUseFullGoalCreation: (value: boolean) => persistWorkflowDefault('advanced_goal_creation', value),
    setUseFullAccountMenu: (value: boolean) => persistWorkflowDefault('advanced_account_menu', value),
    setUseFocusGoalsView: (value: boolean) => persistWorkflowDefault('advanced_goals_grid', value),
    setUseWalletDetailsPanel: (value: boolean) => persistWorkflowDefault('advanced_wallet_panel', value),
    setAllWorkflowDefaults: persistAllWorkflowDefaults,
  };
}
