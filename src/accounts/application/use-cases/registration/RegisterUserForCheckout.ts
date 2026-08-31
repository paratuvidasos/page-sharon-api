import { EmailSender } from "../../../../shared-kernel/domain/ports/EmailSender";
import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../../shared-kernel/infrastructure/security/tokens";
import { buildVerifyEmailTemplate } from "../../../../shared-kernel/infrastructure/email/templates/verify-email.template";
import { EmailVerificationToken } from "../../../domain/entities/registration/EmailVerificationToken";
import { User } from "../../../domain/entities/User";
import { UserRole } from "../../../domain/enums/UserRole";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { EmailAlreadyRegisteredException } from "../../../domain/exceptions/registration/EmailAlreadyRegisteredException";
import { PasswordHasher } from "../../../domain/ports/PasswordHasher";
import { EmailVerificationTokenRepository } from "../../../domain/repositories/registration/EmailVerificationTokenRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { Email } from "../../../domain/value-objects/Email";

export interface RegisterUserForCheckoutInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS ?? 24,
);

/**
 * Variante de `RegisterUser` para creación de cuenta en el mismo request del
 * checkout de invitado: a diferencia de `RegisterUser` (que responde igual
 * exista o no el correo, para no filtrar qué correos están registrados en un
 * formulario de signup independiente), aquí el invitado ya está en medio de
 * una acción síncrona (pagar + crear cuenta) y necesita saber de inmediato
 * si el correo ya tiene cuenta, para poder iniciar sesión en su lugar.
 */
export class RegisterUserForCheckout {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RegisterUserForCheckoutInput): Promise<User> {
    const email = Email.create(input.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyRegisteredException();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: generateId(),
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: null,
      avatarUrl: null,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      jobTitle: null,
      emailVerifiedAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      addresses: [],
      clerkUserId: null,
      preferredLocale: null,
      preferredCurrency: null,
    });

    await this.userRepository.save(user);

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

    await this.sendEmailSafely({
      to: email.toString(),
      ...buildVerifyEmailTemplate({ firstName: input.firstName, verificationUrl }),
    });

    return user;
  }

  private async sendEmailSafely(message: Parameters<EmailSender["send"]>[0]): Promise<void> {
    try {
      await this.emailSender.send(message);
    } catch (err) {
      console.error("No se pudo enviar el correo de la cuenta:", err);
    }
  }
}
