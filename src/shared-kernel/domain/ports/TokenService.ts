export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload, ttlSeconds: number): string;
  verifyAccessToken(token: string): AccessTokenPayload;
}
