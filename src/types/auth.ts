export interface AuthUser {
  id: string;
  username: string;
  email: string;
  tenant_id: string;
  created_at: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
}
