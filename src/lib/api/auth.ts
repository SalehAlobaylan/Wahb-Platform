import type { AuthUser } from '@/types';
import { refreshSession } from '@/lib/auth/session-coordinator';

export async function loginUser(email: string, password: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(err.message || 'Login failed');
  }

  return res.json();
}

export async function registerUser(
  email: string,
  password: string,
  username?: string,
): Promise<{ id: string; username: string; email: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...(username && { username }) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(err.message || 'Registration failed');
  }

  return res.json();
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Password update failed' }));
    throw new Error(err.message || 'Password update failed');
  }

  return res.json();
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser | null }> {
  let res = await fetch('/api/auth/me');

  if (res.status === 401 && await refreshSession()) {
    res = await fetch('/api/auth/me');
  }

  if (!res.ok) {
    return { user: null };
  }

  return res.json();
}

export async function updateProfile(payload: {
  username?: string;
  bio?: string;
  avatar_url?: string;
}): Promise<AuthUser> {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(err.message || 'Failed to update profile');
  }

  // IAM returns the updated user object directly (or wrapped in { data }).
  const data = await res.json();
  return (data?.data ?? data) as AuthUser;
}

/**
 * Upload a new avatar image. Posts multipart to the Next proxy, which forwards
 * to IAM; IAM stores the file and returns the updated user (with avatar_url).
 */
export async function uploadAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.set('avatar', file);

  const res = await fetch('/api/auth/avatar', {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Avatar upload failed' }));
    throw new Error(err.message || err.error || 'Avatar upload failed');
  }

  const data = await res.json();
  return (data?.data ?? data) as AuthUser;
}
