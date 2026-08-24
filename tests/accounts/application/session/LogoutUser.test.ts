import { describe, expect, it } from "vitest";
import { LogoutUser } from "../../../../src/accounts/application/use-cases/session/LogoutUser";
import { RefreshToken } from "../../../../src/accounts/domain/entities/session/RefreshToken";
import { hashToken } from "../../../../src/shared-kernel/infrastructure/security/tokens";
import { createFakeRefreshTokenRepository } from "../fakes";

const RAW_TOKEN = "raw-refresh-token";

function buildActiveToken() {
  return RefreshToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: hashToken(RAW_TOKEN),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: null,
    userAgent: null,
    ipAddress: null,
  });
}

describe("LogoutUser", () => {
  it("revoca el refresh token dado", async () => {
    const token = buildActiveToken();
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);

    await new LogoutUser(refreshTokenRepository).execute({ refreshToken: RAW_TOKEN });

    expect(token.isRevoked()).toBe(true);
    expect(refreshTokenRepository.save).toHaveBeenCalledWith(token);
  });

  it("no hace nada (no lanza) si refreshToken es null/undefined/vacío", async () => {
    const refreshTokenRepository = createFakeRefreshTokenRepository();

    await new LogoutUser(refreshTokenRepository).execute({ refreshToken: null });
    await new LogoutUser(refreshTokenRepository).execute({ refreshToken: undefined });
    await new LogoutUser(refreshTokenRepository).execute({ refreshToken: "" });

    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });

  it("no hace nada (no lanza) si el token no existe", async () => {
    const refreshTokenRepository = createFakeRefreshTokenRepository([]);
    await expect(
      new LogoutUser(refreshTokenRepository).execute({ refreshToken: "token-inexistente" }),
    ).resolves.toBeUndefined();
    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });

  it("es idempotente si el token ya estaba revocado", async () => {
    const token = buildActiveToken();
    token.revoke();
    const refreshTokenRepository = createFakeRefreshTokenRepository([token]);

    await new LogoutUser(refreshTokenRepository).execute({ refreshToken: RAW_TOKEN });

    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });
});
