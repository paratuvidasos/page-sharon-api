import { PasswordResetToken } from "../entities/PasswordResetToken";

export interface PasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
}
