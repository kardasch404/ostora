export type UserRole = "USER" | "ADMIN" | "RECRUITER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  role: UserRole | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}
