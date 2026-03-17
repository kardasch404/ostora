export class UserSummaryResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export class AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string = 'Bearer';
  user: UserSummaryResponse;
}
