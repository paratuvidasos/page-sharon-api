import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestPasswordReset } from "../../../../src/accounts/application/use-cases/password-reset/RequestPasswordReset";
import { buildUser } from "../../domain/fixtures";
import {
  createFakeEmailSender,
  createFakePasswordResetTokenRepository,
  createFakeUserRepository,
} from "../fakes";

describe("RequestPasswordReset", () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = "https://sharon.example.com";
  });

  it("si el usuario existe, invalida tokens previos, guarda uno nuevo y envía el correo", async () => {
    const user = buildUser({ id: "user-1", firstName: "Ana" });
    const userRepository = createFakeUserRepository([user]);
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository();
    const emailSender = createFakeEmailSender();

    await new RequestPasswordReset(userRepository, passwordResetTokenRepository, emailSender).execute({
      email: "ana@example.com",
    });

    expect(passwordResetTokenRepository.invalidateActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(passwordResetTokenRepository.save).toHaveBeenCalledTimes(1);
    const savedToken = passwordResetTokenRepository.save.mock.calls[0][0];
    expect(savedToken.toProps().userId).toBe("user-1");
    expect(savedToken.isValid()).toBe(true);

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    expect(emailSender.send.mock.calls[0][0]).toMatchObject({ to: "ana@example.com" });
  });

  it("si el usuario NO existe, no hace nada (no crea token ni envía correo) — protección anti-enumeración", async () => {
    const userRepository = createFakeUserRepository([]);
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository();
    const emailSender = createFakeEmailSender();

    await new RequestPasswordReset(userRepository, passwordResetTokenRepository, emailSender).execute({
      email: "no-existe@example.com",
    });

    expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("no lanza si el envío de correo falla (el error se traga/loguea)", async () => {
    const user = buildUser({ id: "user-1" });
    const userRepository = createFakeUserRepository([user]);
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository();
    const emailSender = createFakeEmailSender({ send: vi.fn().mockRejectedValue(new Error("SMTP caído")) });

    await expect(
      new RequestPasswordReset(userRepository, passwordResetTokenRepository, emailSender).execute({
        email: "ana@example.com",
      }),
    ).resolves.toBeUndefined();
  });

  it("propaga el error de Email.create si el email de entrada es inválido", async () => {
    const userRepository = createFakeUserRepository([]);
    const passwordResetTokenRepository = createFakePasswordResetTokenRepository();
    const emailSender = createFakeEmailSender();

    await expect(
      new RequestPasswordReset(userRepository, passwordResetTokenRepository, emailSender).execute({
        email: "no-es-un-email",
      }),
    ).rejects.toThrow("Email inválido");
  });
});
