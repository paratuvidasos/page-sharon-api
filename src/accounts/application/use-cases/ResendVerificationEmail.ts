import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { buildVerifyEmailTemplate } from "../../../shared-kernel/infrastructure/email/templates/verify-email.template";
import { EmailVerificationToken } from "../../domain/entities/EmailVerificationToken";
import { EmailVerificationTokenRepository } from "../../domain/repositories/EmailVerificationTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { Email } from "../../domain/value-objects/Email";

export interface ResendVerificationEmailInput {
  email: string;
}

const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS ?? 24,
);

export class ResendVerificationEmail {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: ResendVerificationEmailInput): Promise<void> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.isEmailVerified()) {
      return;
    }

    await this.emailVerificationTokenRepository.invalidateActiveByUserId(user.id);

    const rawToken = generateSecureToken();
    const verificationToken = EmailVerificationToken.create({
      id: generateId(),
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000),
      usedAt: null,
    });

    await this.emailVerificationTokenRepository.save(verificationToken);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

    try {
      await this.emailSender.send({
        to: email.toString(),
        ...buildVerifyEmailTemplate({ firstName: user.toProps().firstName, verificationUrl }),
      });
    } catch (err) {
      console.error("No se pudo reenviar el correo de verificación:", err);
    }
  }
}
