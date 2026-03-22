'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, registerUser, logoutUser, fetchCurrentUser } from '@/lib/api';
import { useAuthStore } from '@/lib/stores';

export function useUser() {
  const { setUser, clearUser } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const { user } = await fetchCurrentUser();
      if (user) {
        setUser(user);
      } else {
        clearUser();
      }
      return user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password, username }: { email: string; password: string; username?: string }) =>
      registerUser(email, password, username),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearUser } = useAuthStore();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearUser();
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
