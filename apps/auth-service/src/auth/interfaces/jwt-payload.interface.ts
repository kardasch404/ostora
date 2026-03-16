export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  roles?: string[];
  permissions: string[];
  fingerprint: string;
  iat: number;
  exp: number;
}
