import { hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { PasswordResetTokenInvalidException } from "../../domain/exceptions/PasswordResetTokenInvalidException";
import { PasswordHasher } from "../../domain/ports/PasswordHasher";
import { PasswordResetTokenRepository } from "../../domain/repositories/PasswordResetTokenRepository";
import { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export class ResetPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const resetToken = await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken || !resetToken.isValid()) {
      throw new PasswordResetTokenInvalidException();
    }

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new PasswordResetTokenInvalidException();
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(passwordHash);
    await this.userRepository.save(user);

    resetToken.markAsUsed();
    await this.passwordResetTokenRepository.save(resetToken);
    await this.passwordResetTokenRepository.invalidateActiveByUserId(user.id);

    await this.refreshTokenRepository.revokeAllForUser(user.id);
  }
}
