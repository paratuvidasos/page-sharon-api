import { UserRole } from "../enums/UserRole";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload, ttlSeconds: number): string;
}
