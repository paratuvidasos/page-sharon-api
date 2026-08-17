import { PasswordResetToken } from "../../entities/password-reset/PasswordResetToken";

export interface PasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  invalidateActiveByUserId(userId: string): Promise<void>;
}
