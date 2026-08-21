import { hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { EmailVerificationTokenInvalidException } from "../../domain/exceptions/EmailVerificationTokenInvalidException";
import { EmailVerificationTokenRepository } from "../../domain/repositories/EmailVerificationTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";

export interface VerifyEmailInput {
  token: string;
}

export class VerifyEmail {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const verificationToken = await this.emailVerificationTokenRepository.findByTokenHash(tokenHash);

    if (!verificationToken || !verificationToken.isValid()) {
      throw new EmailVerificationTokenInvalidException();
    }

    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user) {
      throw new EmailVerificationTokenInvalidException();
    }

    user.markEmailAsVerified();
    await this.userRepository.save(user);

    verificationToken.markAsUsed();
    await this.emailVerificationTokenRepository.save(verificationToken);
  }
}
