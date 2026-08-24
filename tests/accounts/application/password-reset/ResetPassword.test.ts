import { describe, expect, it } from "vitest";
import { ResetPassword } from "../../../../src/accounts/application/use-cases/password-reset/ResetPassword";
import { PasswordResetTokenInvalidException } from "../../../../src/accounts/domain/exceptions/password-reset/PasswordResetTokenInvalidException";
import { PasswordResetToken } from "../../../../src/accounts/domain/entities/password-reset/PasswordResetToken";
import { hashToken } from "../../../../src/shared-kernel/infrastructure/security/tokens";
import { buildUser } from "../../domain/fixtures";
import {
  createFakePasswordHasher,
  createFakePasswordResetTokenRepository,
  createFakeRefreshTokenRepository,
  createFakeUserRepository,
} from "../fakes";

const RAW_TOKEN = "raw-reset-token";

function buildValidToken(overrides: Partial<Parameters<typeof PasswordResetToken.create>[0]> = {}) {
  return PasswordResetToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: hashToken(RAW_TOKEN),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    ...overrides,
  });
}

describe("ResetPassword", () => {
  it("cambia la contraseña, marca el token como usado, invalida otros tokens y revoca sesiones", async () => {
    const user = buildUser({ id: "user-1", failedLoginAttempts: 3, lockedUntil: new Date() });
    const userRepository = createFakeUserRepository([user]);
    const token = buildValidToken();
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository([token]);
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    const passwordHasher = createFakePasswordHasher();

    await new ResetPassword(userRepository, passwordResetTokenRepository, refreshTokenRepository, passwordHasher).execute({
      token: RAW_TOKEN,
      newPassword: "nueva-clave-123",
    });

    expect(user.toProps().passwordHash).toBe("hashed:nueva-clave-123");
    // changePassword() también resetea el bloqueo por intentos fallidos (regla de la entidad)
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();

    expect(token.isUsed()).toBe(true);
    expect(passwordResetTokenRepository.save).toHaveBeenCalledWith(token);
    expect(passwordResetTokenRepository.invalidateActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
  });

  it("lanza PasswordResetTokenInvalidException si el token no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository([]);
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    const passwordHasher = createFakePasswordHasher();

    await expect(
      new ResetPassword(userRepository, passwordResetTokenRepository, refreshTokenRepository, passwordHasher).execute({
        token: "token-inexistente",
        newPassword: "nueva-clave-123",
      }),
    ).rejects.toThrow(PasswordResetTokenInvalidException);
  });

  it("lanza PasswordResetTokenInvalidException si el token ya fue usado", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildValidToken({ usedAt: new Date() });
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository([token]);
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    const passwordHasher = createFakePasswordHasher();

    await expect(
      new ResetPassword(userRepository, passwordResetTokenRepository, refreshTokenRepository, passwordHasher).execute({
        token: RAW_TOKEN,
        newPassword: "nueva-clave-123",
      }),
    ).rejects.toThrow(PasswordResetTokenInvalidException);
  });

  it("lanza PasswordResetTokenInvalidException si el token ya expiró", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildValidToken({ expiresAt: new Date(Date.now() - 1000) });
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository([token]);
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    const passwordHasher = createFakePasswordHasher();

    await expect(
      new ResetPassword(userRepository, passwordResetTokenRepository, refreshTokenRepository, passwordHasher).execute({
        token: RAW_TOKEN,
        newPassword: "nueva-clave-123",
      }),
    ).rejects.toThrow(PasswordResetTokenInvalidException);
  });

  it("lanza PasswordResetTokenInvalidException si el token es válido pero el usuario ya no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const token = buildValidToken();
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository([token]);
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    const passwordHasher = createFakePasswordHasher();

    await expect(
      new ResetPassword(userRepository, passwordResetTokenRepository, refreshTokenRepository, passwordHasher).execute({
        token: RAW_TOKEN,
        newPassword: "nueva-clave-123",
      }),
    ).rejects.toThrow(PasswordResetTokenInvalidException);
  });
});
