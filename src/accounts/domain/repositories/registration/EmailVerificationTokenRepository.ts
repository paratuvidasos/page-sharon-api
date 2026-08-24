import { EmailVerificationToken } from "../../entities/registration/EmailVerificationToken";

export interface EmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  invalidateActiveByUserId(userId: string): Promise<void>;
}
