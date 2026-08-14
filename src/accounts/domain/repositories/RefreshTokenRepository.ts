import { RefreshToken } from "../entities/RefreshToken";

export interface RefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: string): Promise<void>;
}
