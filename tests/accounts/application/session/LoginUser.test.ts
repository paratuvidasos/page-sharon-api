import { describe, expect, it } from "vitest";
import { LoginUser } from "../../../../src/accounts/application/use-cases/session/LoginUser";
import {
  ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS,
  REFRESH_TOKEN_TTL_DAYS,
} from "../../../../src/accounts/application/session-policy";
import { AccountInactiveException } from "../../../../src/accounts/domain/exceptions/session/AccountInactiveException";
import { AccountLockedException } from "../../../../src/accounts/domain/exceptions/session/AccountLockedException";
import { InvalidCredentialsException } from "../../../../src/accounts/domain/exceptions/session/InvalidCredentialsException";
import { UserStatus } from "../../../../src/accounts/domain/enums/UserStatus";
import { buildUser } from "../../domain/fixtures";
import {
  createFakePasswordHasher,
  createFakeRefreshTokenRepository,
  createFakeTokenService,
  createFakeUserRepository,
} from "../fakes";

// Los defaults del código son 5 intentos / 15 minutos de bloqueo
// (LOGIN_MAX_FAILED_ATTEMPTS / LOGIN_LOCKOUT_DURATION_MINUTES) — estas
// constantes se leen de process.env al importar el módulo, así que estos
// tests asumen que no hay overrides de esas env vars en el entorno de test.
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

function buildDeps(user = buildUser({ id: "user-1", passwordHash: "hashed:secreto123" })) {
  const userRepository = createFakeUserRepository([user]);
  const refreshTokenRepository = createFakeRefreshTokenRepository();
  const passwordHasher = createFakePasswordHasher();
  const tokenService = createFakeTokenService();

  return {
    user,
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    loginUser: new LoginUser(userRepository, refreshTokenRepository, passwordHasher, tokenService),
  };
}

describe("LoginUser", () => {
  it("con credenciales correctas: resetea intentos fallidos, firma tokens y guarda el refresh token", async () => {
    const deps = buildDeps(buildUser({ id: "user-1", passwordHash: "hashed:secreto123", failedLoginAttempts: 2 }));

    const result = await deps.loginUser.execute({ email: "ana@example.com", password: "secreto123" });

    expect(deps.user.failedLoginAttempts).toBe(0);
    expect(deps.userRepository.save).toHaveBeenCalledWith(deps.user);
    expect(result.accessToken).toBe(`access-token-for-${deps.user.id}`);
    expect(result.accessTokenExpiresIn).toBe(ACCESS_TOKEN_TTL_MINUTES * 60);
    expect(result.user).toEqual({
      id: deps.user.id,
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "Ruiz",
      role: deps.user.role,
    });
    expect(deps.refreshTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it("sin rememberMe usa REFRESH_TOKEN_TTL_DAYS para la expiración del refresh token", async () => {
    const deps = buildDeps();
    const before = Date.now();

    const result = await deps.loginUser.execute({ email: "ana@example.com", password: "secreto123" });

    const expectedMs = before + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(expectedMs - 1000);
    expect(result.refreshTokenExpiresAt.getTime()).toBeLessThanOrEqual(expectedMs + 5000);
  });

  it("con rememberMe:true usa REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS (más largo)", async () => {
    const deps = buildDeps();

    const result = await deps.loginUser.execute({
      email: "ana@example.com",
      password: "secreto123",
      rememberMe: true,
    });

    const withoutRememberMs = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    const withRememberMs = REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000;
    expect(withRememberMs).toBeGreaterThan(withoutRememberMs); // supuesto de la política
    expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now() + withoutRememberMs);
  });

  it("guarda userAgent/ipAddress en el refresh token cuando se pasan, o null si se omiten", async () => {
    const deps = buildDeps();

    await deps.loginUser.execute({
      email: "ana@example.com",
      password: "secreto123",
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
    });
    let saved = (deps.refreshTokenRepository.save as any).mock.calls[0][0];
    expect(saved.toProps().userAgent).toBe("Mozilla/5.0");
    expect(saved.toProps().ipAddress).toBe("127.0.0.1");

    const deps2 = buildDeps();
    await deps2.loginUser.execute({ email: "ana@example.com", password: "secreto123" });
    saved = (deps2.refreshTokenRepository.save as any).mock.calls[0][0];
    expect(saved.toProps().userAgent).toBeNull();
    expect(saved.toProps().ipAddress).toBeNull();
  });

  it("lanza InvalidCredentialsException si el email no existe (sin filtrar que no existe)", async () => {
    const userRepository = createFakeUserRepository([]);
    const loginUser = new LoginUser(
      userRepository,
      createFakeRefreshTokenRepository(),
      createFakePasswordHasher(),
      createFakeTokenService(),
    );

    await expect(loginUser.execute({ email: "no-existe@example.com", password: "x" })).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it("lanza AccountLockedException si la cuenta está bloqueada, ANTES de comparar la contraseña", async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    const deps = buildDeps(buildUser({ id: "user-1", passwordHash: "hashed:secreto123", lockedUntil }));

    // incluso con la contraseña CORRECTA, debe rechazar por bloqueo
    await expect(deps.loginUser.execute({ email: "ana@example.com", password: "secreto123" })).rejects.toThrow(
      AccountLockedException,
    );
    expect(deps.passwordHasher.compare).not.toHaveBeenCalled();
  });

  it("con contraseña incorrecta: incrementa el contador y guarda al usuario, sin bloquear todavía", async () => {
    const deps = buildDeps(buildUser({ id: "user-1", passwordHash: "hashed:secreto123", failedLoginAttempts: 1 }));

    await expect(
      deps.loginUser.execute({ email: "ana@example.com", password: "clave-incorrecta" }),
    ).rejects.toThrow(InvalidCredentialsException);

    expect(deps.user.failedLoginAttempts).toBe(2);
    expect(deps.user.lockedUntil).toBeNull();
    expect(deps.userRepository.save).toHaveBeenCalledWith(deps.user);
  });

  it(`bloquea la cuenta en el intento fallido número ${MAX_FAILED_LOGIN_ATTEMPTS}`, async () => {
    const deps = buildDeps(
      buildUser({
        id: "user-1",
        passwordHash: "hashed:secreto123",
        failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS - 1,
      }),
    );

    await expect(
      deps.loginUser.execute({ email: "ana@example.com", password: "clave-incorrecta" }),
    ).rejects.toThrow(InvalidCredentialsException);

    expect(deps.user.failedLoginAttempts).toBe(MAX_FAILED_LOGIN_ATTEMPTS);
    expect(deps.user.lockedUntil).not.toBeNull();
    expect(deps.user.isLockedOut(new Date())).toBe(true);
  });

  it("con contraseña correcta pero cuenta inactiva: lanza AccountInactiveException y NO resetea intentos fallidos", async () => {
    const deps = buildDeps(
      buildUser({
        id: "user-1",
        passwordHash: "hashed:secreto123",
        status: UserStatus.SUSPENDED,
        failedLoginAttempts: 2,
      }),
    );

    await expect(deps.loginUser.execute({ email: "ana@example.com", password: "secreto123" })).rejects.toThrow(
      AccountInactiveException,
    );

    expect(deps.user.failedLoginAttempts).toBe(2);
    expect(deps.userRepository.save).not.toHaveBeenCalled();
  });
});
