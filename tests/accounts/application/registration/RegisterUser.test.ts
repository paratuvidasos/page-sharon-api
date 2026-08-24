import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUser } from "../../../../src/accounts/application/use-cases/registration/RegisterUser";
import { buildUser } from "../../domain/fixtures";
import {
  createFakeEmailSender,
  createFakeEmailVerificationTokenRepository,
  createFakePasswordHasher,
  createFakeUserRepository,
} from "../fakes";

const input = { firstName: "Ana", lastName: "Ruiz", email: "ana@example.com", password: "secreto123" };

describe("RegisterUser", () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = "https://sharon.example.com";
  });

  it("crea la cuenta, guarda un token de verificación y envía el correo de verificación", async () => {
    const userRepository = createFakeUserRepository([]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const passwordHasher = createFakePasswordHasher();
    const emailSender = createFakeEmailSender();

    await new RegisterUser(userRepository, emailVerificationTokenRepository, passwordHasher, emailSender).execute(
      input,
    );

    expect(userRepository.save).toHaveBeenCalledTimes(1);
    const savedUser = (userRepository.save as any).mock.calls[0][0];
    expect(savedUser.email.toString()).toBe("ana@example.com");
    expect(savedUser.toProps().passwordHash).toBe("hashed:secreto123");
    expect(savedUser.isEmailVerified()).toBe(false);

    expect(emailVerificationTokenRepository.save).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
  });

  it("si el correo ya está registrado, NO crea cuenta nueva y solo envía un correo informativo", async () => {
    const existing = buildUser({ id: "user-existente" });
    const userRepository = createFakeUserRepository([existing]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const passwordHasher = createFakePasswordHasher();
    const emailSender = createFakeEmailSender();

    await new RegisterUser(userRepository, emailVerificationTokenRepository, passwordHasher, emailSender).execute(
      input,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(emailVerificationTokenRepository.save).not.toHaveBeenCalled();
    expect(emailSender.send).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
  });

  it("no lanza si el envío del correo de verificación falla", async () => {
    const userRepository = createFakeUserRepository([]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const passwordHasher = createFakePasswordHasher();
    const emailSender = createFakeEmailSender({ send: vi.fn().mockRejectedValue(new Error("SMTP caído")) });

    await expect(
      new RegisterUser(userRepository, emailVerificationTokenRepository, passwordHasher, emailSender).execute(input),
    ).resolves.toBeUndefined();
  });
});
