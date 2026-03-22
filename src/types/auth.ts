export interface AuthUser {
  id: string;
  username: string;
  email: string;
  tenant_id: string;
  created_at: string;
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
