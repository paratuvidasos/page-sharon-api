import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { buildPasswordResetTemplate } from "../../../shared-kernel/infrastructure/email/templates/password-reset.template";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken";
import { PasswordResetTokenRepository } from "../../domain/repositories/PasswordResetTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { Email } from "../../domain/value-objects/Email";

export interface RequestPasswordResetInput {
  email: string;
}

const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30,
);

export class RequestPasswordReset {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    await this.passwordResetTokenRepository.invalidateActiveByUserId(user.id);

    const rawToken = generateSecureToken();
    const resetToken = PasswordResetToken.create({
      id: generateId(),
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      usedAt: null,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    try {
      await this.emailSender.send({
        to: email.toString(),
        ...buildPasswordResetTemplate({ firstName: user.toProps().firstName, resetUrl }),
      });
    } catch (err) {
      console.error("No se pudo enviar el correo de recuperación de contraseña:", err);
    }
  }
}
