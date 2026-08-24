import { describe, expect, it } from "vitest";
import { RefreshAccessToken } from "../../../../src/accounts/application/use-cases/session/RefreshAccessToken";
import { AccountInactiveException } from "../../../../src/accounts/domain/exceptions/session/AccountInactiveException";
import { InvalidRefreshTokenException } from "../../../../src/accounts/domain/exceptions/session/InvalidRefreshTokenException";
import { RefreshToken } from "../../../../src/accounts/domain/entities/session/RefreshToken";
import { UserStatus } from "../../../../src/accounts/domain/enums/UserStatus";
import { hashToken } from "../../../../src/shared-kernel/infrastructure/security/tokens";
import { buildUser } from "../../domain/fixtures";
import { createFakeRefreshTokenRepository, createFakeTokenService, createFakeUserRepository } from "../fakes";

const RAW_TOKEN = "raw-refresh-token";

function buildActiveToken(overrides: Partial<Parameters<typeof RefreshToken.create>[0]> = {}) {
  return RefreshToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: hashToken(RAW_TOKEN),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: null,
    userAgent: null,
    ipAddress: null,
    ...overrides,
  });
}

describe("RefreshAccessToken", () => {
  it("rota el refresh token (revoca el viejo, emite uno nuevo) y firma un nuevo access token", async () => {
    const user = buildUser({ id: "user-1" });
    const userRepository = createFakeUserRepository([user]);
    const token = buildActiveToken();
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    const result = await new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
      refreshToken: RAW_TOKEN,
    });

    expect(token.isRevoked()).toBe(true);
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(2); // revocado + nuevo
    expect(result.accessToken).toBe(`access-token-for-${user.id}`);
    expect(result.refreshToken).not.toBe(RAW_TOKEN);
  });

  it("la nueva expiración es EXACTAMENTE la del token viejo (no se extiende la sesión)", async () => {
    const oldExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const user = buildUser({ id: "user-1" });
    const userRepository = createFakeUserRepository([user]);
    const token = buildActiveToken({ expiresAt: oldExpiresAt });
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    const result = await new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
      refreshToken: RAW_TOKEN,
    });

    expect(result.refreshTokenExpiresAt).toEqual(oldExpiresAt);
    const newToken = (refreshTokenRepository.save as any).mock.calls[1][0];
    expect(newToken.expiresAt).toEqual(oldExpiresAt);
  });

  it("lanza InvalidRefreshTokenException si el token no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const refreshTokenRepository = createFakeRefreshTokenRepository([]);
    const tokenService = createFakeTokenService();

    await expect(
      new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
        refreshToken: "no-existe",
      }),
    ).rejects.toThrow(InvalidRefreshTokenException);
  });

  it("lanza InvalidRefreshTokenException si el token ya fue revocado", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildActiveToken({ revokedAt: new Date() });
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    await expect(
      new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
        refreshToken: RAW_TOKEN,
      }),
    ).rejects.toThrow(InvalidRefreshTokenException);
  });

  it("lanza InvalidRefreshTokenException si el token ya expiró", async () => {
    const userRepository = createFakeUserRepository([buildUser({ id: "user-1" })]);
    const token = buildActiveToken({ expiresAt: new Date(Date.now() - 1000) });
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    await expect(
      new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
        refreshToken: RAW_TOKEN,
      }),
    ).rejects.toThrow(InvalidRefreshTokenException);
  });

  it("lanza InvalidRefreshTokenException si el token es válido pero el usuario ya no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const token = buildActiveToken();
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    await expect(
      new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
        refreshToken: RAW_TOKEN,
      }),
    ).rejects.toThrow(InvalidRefreshTokenException);
  });

  it("lanza AccountInactiveException si el usuario ya no está activo, sin rotar el token", async () => {
    const user = buildUser({ id: "user-1", status: UserStatus.SUSPENDED });
    const userRepository = createFakeUserRepository([user]);
    const token = buildActiveToken();
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);
    const tokenService = createFakeTokenService();

    await expect(
      new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService).execute({
        refreshToken: RAW_TOKEN,
      }),
    ).rejects.toThrow(AccountInactiveException);

    expect(token.isRevoked()).toBe(false);
    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });
});
