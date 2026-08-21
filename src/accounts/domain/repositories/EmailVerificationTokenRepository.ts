import { EmailVerificationToken } from "../entities/EmailVerificationToken";

export interface EmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  invalidateActiveByUserId(userId: string): Promise<void>;
}
