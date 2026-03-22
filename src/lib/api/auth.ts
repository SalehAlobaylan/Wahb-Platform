import type { AuthUser } from '@/types';

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

export async function fetchCurrentUser(): Promise<{ user: AuthUser | null }> {
  const res = await fetch('/api/auth/me');

  if (!res.ok) {
    return { user: null };
  }

  return res.json();
}
