'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPreferences,
  fetchTopicPicker,
  muteTopic,
  saveDeclaredTopics,
  unmuteTopic,
} from '@/lib/api/preferences';
import { useAuthStore } from '@/lib/stores/auth-store';
import { identityCacheKey } from '@/lib/identity/identity-key';

function usePreferenceKeys() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const identityKey = identityCacheKey(userId);
  return {
    picker: ['preferences', identityKey, 'picker'] as const,
    mine: ['preferences', identityKey, 'mine'] as const,
    enabled: Boolean(userId),
  };
}

export function useTopicPicker() {
  const keys = usePreferenceKeys();
  return useQuery({
    queryKey: keys.picker,
    queryFn: fetchTopicPicker,
    enabled: keys.enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreferences(enabled = true) {
  const keys = usePreferenceKeys();
  return useQuery({
    queryKey: keys.mine,
    queryFn: fetchPreferences,
    enabled: enabled && keys.enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useSaveDeclaredTopics() {
  const qc = useQueryClient();
  const keys = usePreferenceKeys();
  return useMutation({
    mutationFn: saveDeclaredTopics,
    onSuccess: (data) => {
      qc.setQueryData(keys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useMuteTopic() {
  const qc = useQueryClient();
  const keys = usePreferenceKeys();
  return useMutation({
    mutationFn: muteTopic,
    onSuccess: (data) => {
      qc.setQueryData(keys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnmuteTopic() {
  const qc = useQueryClient();
  const keys = usePreferenceKeys();
  return useMutation({
    mutationFn: unmuteTopic,
    onSuccess: (data) => {
      qc.setQueryData(keys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
