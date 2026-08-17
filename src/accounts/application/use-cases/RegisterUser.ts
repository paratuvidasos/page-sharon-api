import { EmailSender } from "../../../shared-kernel/domain/ports/EmailSender";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { buildVerifyEmailTemplate } from "../../../shared-kernel/infrastructure/email/templates/verify-email.template";
import { EmailVerificationToken } from "../../domain/entities/EmailVerificationToken";
import { User } from "../../domain/entities/User";
import { UserRole } from "../../domain/enums/UserRole";
import { UserStatus } from "../../domain/enums/UserStatus";
import { PasswordHasher } from "../../domain/ports/PasswordHasher";
import { EmailVerificationTokenRepository } from "../../domain/repositories/EmailVerificationTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { Email } from "../../domain/value-objects/Email";

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS ?? 24,
);

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RegisterUserInput): Promise<void> {
    const email = Email.create(input.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      await this.sendEmailSafely({
        to: email.toString(),
        subject: "Ya tienes una cuenta con nosotros",
        html: `Hola ${existingUser.toProps().firstName}, ya existe una cuenta registrada con este correo. Si eres tú, intenta iniciar sesión o recuperar tu contraseña.`,
      });
      return;
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: generateId(),
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: null,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      addresses: [],
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
  }

  /**
   * La cuenta ya quedó creada en este punto: un fallo del proveedor de correo
   * (caído, IP no autorizada, etc.) no debe convertir un registro exitoso en
   * un error para el cliente. Se registra el fallo para poder monitorearlo.
   */
  private async sendEmailSafely(message: Parameters<EmailSender["send"]>[0]): Promise<void> {
    try {
      await this.emailSender.send(message);
    } catch (err) {
      console.error("No se pudo enviar el correo de la cuenta:", err);
    }
  }
}
