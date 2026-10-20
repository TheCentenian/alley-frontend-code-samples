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

/**
 * Returns the five workflow booleans and the functions that change them.
 * Guest values are read from local state. Signed-in values are read from
 * account settings and saved with updateUserSettingsAction.
 */
export function useWorkflowPreferences() {
  const user = useAuthStore(state => state.user);
  const guestPreferences = usePrivacySettings();
  const { settings, updateWorkflowDefault, setAllWorkflowDefaults } = useAppSettings();

  const persistWorkflowDefault = useCallback(
    async (key: WorkflowDefaultKey, value: boolean) => {
      // Guest: call the local setter for this key and return. The server is not called.
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

      // Signed-in: update local state, then save this one key.
      // If the request throws, set the value back to its opposite and show an error.
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

  // Sets every workflow switch to the same boolean.
  const persistAllWorkflowDefaults = useCallback(
    async (value: boolean) => {
      if (isGuestUser(user)) {
        guestPreferences.setAllWorkflowDefaults(value);
        return;
      }

      // Update local state, then save all five keys together.
      // A failed request shows an error and leaves the local values in place.
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

  // Guest: return the local booleans and the local setters.
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

  // Signed-in: read each boolean from account settings.
  // Each setter saves that one key through persistWorkflowDefault.
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
