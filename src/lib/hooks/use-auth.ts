'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, registerUser, logoutUser, fetchCurrentUser, changePassword, updateProfile, uploadAvatar } from '@/lib/api';
import { useAuthStore } from '@/lib/stores';
import { isIdentityOwnedQuery } from '@/lib/identity/ownership-policy';

function clearIdentityScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({
    predicate: (query) => isIdentityOwnedQuery(query.queryKey),
  });
}

export function useUser() {
  const { setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const { user } = await fetchCurrentUser();
      const previousUserId = useAuthStore.getState().user?.id ?? null;
      if (previousUserId !== (user?.id ?? null)) {
        clearIdentityScopedQueries(queryClient);
      }
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
      clearIdentityScopedQueries(queryClient);
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
      clearIdentityScopedQueries(queryClient);
      clearUser();
      queryClient.setQueryData(['auth', 'user'], null);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['auth', 'user'], user);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['auth', 'user'], user);
    },
  });
}
