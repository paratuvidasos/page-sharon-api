import { DomainEventPublisher } from "../../../../shared-kernel/domain/ports/DomainEventPublisher";
import { EmailSender } from "../../../../shared-kernel/domain/ports/EmailSender";
import { UserAccountDeleted } from "../../../../shared-kernel/domain/events/UserAccountDeleted";
import { generateSecureToken } from "../../../../shared-kernel/infrastructure/security/tokens";
import { buildAccountDeletedTemplate } from "../../../../shared-kernel/infrastructure/email/templates/account-deleted.template";
import { InvalidCredentialsException } from "../../../domain/exceptions/session/InvalidCredentialsException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { Email } from "../../../domain/value-objects/Email";
import { PasswordHasher } from "../../../domain/ports/PasswordHasher";
import { EmailVerificationTokenRepository } from "../../../domain/repositories/registration/EmailVerificationTokenRepository";
import { PasswordResetTokenRepository } from "../../../domain/repositories/password-reset/PasswordResetTokenRepository";
import { RefreshTokenRepository } from "../../../domain/repositories/session/RefreshTokenRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface DeleteAccountInput {
  userId: string;
  password: string;
  reason?: string | null;
}

export class DeleteAccount {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailSender: EmailSender,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.toProps().passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    if (input.reason) {
      console.info(`Cuenta ${user.id} eliminada. Motivo indicado por el usuario: ${input.reason}`);
    }

    const originalEmail = user.email.toString();
    const originalFirstName = user.toProps().firstName;
    const anonymizedEmail = Email.create(`deleted-${user.id}@sharon.invalid`);
    const unusablePasswordHash = await this.passwordHasher.hash(generateSecureToken());

    user.anonymize(anonymizedEmail, unusablePasswordHash);
    await this.userRepository.save(user);
    await this.userRepository.deleteAllAddresses(user.id);
    await this.userRepository.softDelete(user.id);

    await this.refreshTokenRepository.revokeAllForUser(user.id);
    await this.passwordResetTokenRepository.invalidateActiveByUserId(user.id);
    await this.emailVerificationTokenRepository.invalidateActiveByUserId(user.id);

    await this.domainEventPublisher.publish(new UserAccountDeleted(user.id));

    try {
      await this.emailSender.send({
        to: originalEmail,
        ...buildAccountDeletedTemplate({ firstName: originalFirstName }),
      });
    } catch (err) {
      console.error("No se pudo enviar el correo de confirmación de eliminación de cuenta:", err);
    }
  }
}
