import { describe, expect, it } from "vitest";
import { LogoutAllSessions } from "../../../../src/accounts/application/use-cases/session/LogoutAllSessions";
import { createFakeRefreshTokenRepository } from "../fakes";

describe("LogoutAllSessions", () => {
  it("delega en refreshTokenRepository.revokeAllForUser()", async () => {
    const refreshTokenRepository = createFakeRefreshTokenRepository();

    await new LogoutAllSessions(refreshTokenRepository).execute({ userId: "user-1" });

    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
  });

  it("es idempotente/no lanza para un userId que no existe", async () => {
    const refreshTokenRepository = createFakeRefreshTokenRepository();
    await expect(new LogoutAllSessions(refreshTokenRepository).execute({ userId: "no-existe" })).resolves.toBeUndefined();
  });
});
