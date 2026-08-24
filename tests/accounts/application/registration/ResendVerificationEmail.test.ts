import { beforeEach, describe, expect, it } from "vitest";
import { ResendVerificationEmail } from "../../../../src/accounts/application/use-cases/registration/ResendVerificationEmail";
import { buildUser } from "../../domain/fixtures";
import { createFakeEmailSender, createFakeEmailVerificationTokenRepository, createFakeUserRepository } from "../fakes";

describe("ResendVerificationEmail", () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = "https://sharon.example.com";
  });

  it("invalida el token anterior, crea uno nuevo y reenvía el correo si el usuario no está verificado", async () => {
    const user = buildUser({ id: "user-1", emailVerifiedAt: null });
    const userRepository = createFakeUserRepository([user]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const emailSender = createFakeEmailSender();

    await new ResendVerificationEmail(userRepository, emailVerificationTokenRepository, emailSender).execute({
      email: "ana@example.com",
    });

    expect(emailVerificationTokenRepository.invalidateActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(emailVerificationTokenRepository.save).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
  });

  it("no hace nada si el usuario no existe (anti-enumeración)", async () => {
    const userRepository = createFakeUserRepository([]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const emailSender = createFakeEmailSender();

    await new ResendVerificationEmail(userRepository, emailVerificationTokenRepository, emailSender).execute({
      email: "no-existe@example.com",
    });

    expect(emailVerificationTokenRepository.save).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("no hace nada si el usuario ya tiene el correo verificado", async () => {
    const user = buildUser({ id: "user-1", emailVerifiedAt: new Date() });
    const userRepository = createFakeUserRepository([user]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const emailSender = createFakeEmailSender();

    await new ResendVerificationEmail(userRepository, emailVerificationTokenRepository, emailSender).execute({
      email: "ana@example.com",
    });

    expect(emailVerificationTokenRepository.save).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });
});
