import { describe, expect, it, vi } from "vitest";
import { DeleteAccount } from "../../../../src/accounts/application/use-cases/profile/DeleteAccount";
import { InvalidCredentialsException } from "../../../../src/accounts/domain/exceptions/session/InvalidCredentialsException";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { UserStatus } from "../../../../src/accounts/domain/enums/UserStatus";
import { buildUser } from "../../domain/fixtures";
import {
  createFakeDomainEventPublisher,
  createFakeEmailSender,
  createFakeEmailVerificationTokenRepository,
  createFakePasswordHasher,
  createFakePasswordResetTokenRepository,
  createFakeRefreshTokenRepository,
  createFakeUserRepository,
} from "../fakes";

function buildDeps(user = buildUser({ id: "user-1", passwordHash: "hashed:secreto123" })) {
  const userRepository = createFakeUserRepository([user]);
  const refreshTokenRepository = createFakeRefreshTokenRepository();
  const passwordResetTokenRepository = createFakePasswordResetTokenRepository();
  const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
  const passwordHasher = createFakePasswordHasher();
  const emailSender = createFakeEmailSender();
  const domainEventPublisher = createFakeDomainEventPublisher();

  const deleteAccount = new DeleteAccount(
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
    domainEventPublisher,
  );

  return {
    user,
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
    domainEventPublisher,
    deleteAccount,
  };
}

describe("DeleteAccount", () => {
  it("anonimiza al usuario, limpia sus datos y publica UserAccountDeleted", async () => {
    const deps = buildDeps();

    await deps.deleteAccount.execute({ userId: "user-1", password: "secreto123" });

    expect(deps.user.toProps().status).toBe(UserStatus.DELETED);
    expect(deps.user.toProps().firstName).toBe("Usuario");
    expect(deps.userRepository.save).toHaveBeenCalledWith(deps.user);
    expect(deps.userRepository.deleteAllAddresses).toHaveBeenCalledWith("user-1");
    expect(deps.userRepository.softDelete).toHaveBeenCalledWith("user-1");
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
    expect(deps.passwordResetTokenRepository.invalidateActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(deps.emailVerificationTokenRepository.invalidateActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(deps.domainEventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (deps.domainEventPublisher.publish as any).mock.calls[0][0];
    expect(publishedEvent.userId).toBe("user-1");
  });

  it("envía el correo de confirmación al email ORIGINAL (antes de anonimizar)", async () => {
    const deps = buildDeps(buildUser({ id: "user-1", passwordHash: "hashed:secreto123", firstName: "Ana" }));

    await deps.deleteAccount.execute({ userId: "user-1", password: "secreto123" });

    expect(deps.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ana@example.com" }),
    );
  });

  it("lanza InvalidCredentialsException si la contraseña no coincide, y no anonimiza nada", async () => {
    const deps = buildDeps();

    await expect(deps.deleteAccount.execute({ userId: "user-1", password: "clave-incorrecta" })).rejects.toThrow(
      InvalidCredentialsException,
    );

    expect(deps.user.toProps().status).not.toBe(UserStatus.DELETED);
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.domainEventPublisher.publish).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const deleteAccount = new DeleteAccount(
      userRepository,
      createFakeRefreshTokenRepository(),
      createFakePasswordResetTokenRepository(),
      createFakeEmailVerificationTokenRepository(),
      createFakePasswordHasher(),
      createFakeEmailSender(),
      createFakeDomainEventPublisher(),
    );

    await expect(deleteAccount.execute({ userId: "no-existe", password: "x" })).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it("no lanza si el envío del correo de confirmación falla (se traga/loguea)", async () => {
    const deps = buildDeps();
    deps.emailSender.send = vi.fn().mockRejectedValue(new Error("SMTP caído"));

    await expect(deps.deleteAccount.execute({ userId: "user-1", password: "secreto123" })).resolves.toBeUndefined();
  });
});
