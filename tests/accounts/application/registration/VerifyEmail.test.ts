import { describe, expect, it } from "vitest";
import { VerifyEmail } from "../../../../src/accounts/application/use-cases/registration/VerifyEmail";
import { EmailVerificationTokenInvalidException } from "../../../../src/accounts/domain/exceptions/registration/EmailVerificationTokenInvalidException";
import { EmailVerificationToken } from "../../../../src/accounts/domain/entities/registration/EmailVerificationToken";
import { hashToken } from "../../../../src/shared-kernel/infrastructure/security/tokens";
import { buildUser } from "../../domain/fixtures";
import { createFakeEmailVerificationTokenRepository, createFakeUserRepository } from "../fakes";

const RAW_TOKEN = "raw-verification-token";

function buildValidToken(overrides: Partial<Parameters<typeof EmailVerificationToken.create>[0]> = {}) {
  return EmailVerificationToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: hashToken(RAW_TOKEN),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    ...overrides,
  });
}

describe("VerifyEmail", () => {
  it("marca el email del usuario como verificado y el token como usado", async () => {
    const user = buildUser({ id: "user-1", emailVerifiedAt: null });
    const userRepository = createFakeUserRepository([user]);
    const token = buildValidToken();
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository([token]);

    await new VerifyEmail(userRepository, emailVerificationTokenRepository).execute({ token: RAW_TOKEN });

    expect(user.isEmailVerified()).toBe(true);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(token.isUsed()).toBe(true);
    expect(emailVerificationTokenRepository.save).toHaveBeenCalledWith(token);
  });

  it("lanza EmailVerificationTokenInvalidException si el token no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository([]);

    await expect(
      new VerifyEmail(userRepository, emailVerificationTokenRepository).execute({ token: "no-existe" }),
    ).rejects.toThrow(EmailVerificationTokenInvalidException);
  });

  it("lanza EmailVerificationTokenInvalidException si el token ya fue usado", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildValidToken({ usedAt: new Date() });
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository([token]);

    await expect(
      new VerifyEmail(userRepository, emailVerificationTokenRepository).execute({ token: RAW_TOKEN }),
    ).rejects.toThrow(EmailVerificationTokenInvalidException);
  });

  it("lanza EmailVerificationTokenInvalidException si el token expiró", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildValidToken({ expiresAt: new Date(Date.now() - 1000) });
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository([token]);

    await expect(
      new VerifyEmail(userRepository, emailVerificationTokenRepository).execute({ token: RAW_TOKEN }),
    ).rejects.toThrow(EmailVerificationTokenInvalidException);
  });

  it("lanza EmailVerificationTokenInvalidException si el token es válido pero el usuario ya no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const token = buildValidToken();
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository([token]);

    await expect(
      new VerifyEmail(userRepository, emailVerificationTokenRepository).execute({ token: RAW_TOKEN }),
    ).rejects.toThrow(EmailVerificationTokenInvalidException);
  });
});
