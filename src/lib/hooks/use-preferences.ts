'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPreferences,
  fetchTopicPicker,
  muteTopic,
  saveDeclaredTopics,
  unmuteTopic,
} from '@/lib/api/preferences';

export const preferenceKeys = {
  picker: ['preferences', 'picker'] as const,
  mine: ['preferences', 'mine'] as const,
};

export function useTopicPicker() {
  return useQuery({
    queryKey: preferenceKeys.picker,
    queryFn: fetchTopicPicker,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreferences(enabled = true) {
  return useQuery({
    queryKey: preferenceKeys.mine,
    queryFn: fetchPreferences,
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useSaveDeclaredTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveDeclaredTopics,
    onSuccess: (data) => {
      qc.setQueryData(preferenceKeys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useMuteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: muteTopic,
    onSuccess: (data) => {
      qc.setQueryData(preferenceKeys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnmuteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unmuteTopic,
    onSuccess: (data) => {
      qc.setQueryData(preferenceKeys.mine, data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
