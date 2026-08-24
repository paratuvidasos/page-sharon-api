import { beforeEach, describe, expect, it } from "vitest";
import { RegisterUserForCheckout } from "../../../../src/accounts/application/use-cases/registration/RegisterUserForCheckout";
import { EmailAlreadyRegisteredException } from "../../../../src/accounts/domain/exceptions/registration/EmailAlreadyRegisteredException";
import { buildUser } from "../../domain/fixtures";
import {
  createFakeEmailSender,
  createFakeEmailVerificationTokenRepository,
  createFakePasswordHasher,
  createFakeUserRepository,
} from "../fakes";

const input = { firstName: "Ana", lastName: "Ruiz", email: "ana@example.com", password: "secreto123" };

describe("RegisterUserForCheckout", () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = "https://sharon.example.com";
  });

  it("crea la cuenta y devuelve la entidad User creada", async () => {
    const userRepository = createFakeUserRepository([]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const passwordHasher = createFakePasswordHasher();
    const emailSender = createFakeEmailSender();

    const user = await new RegisterUserForCheckout(
      userRepository,
      emailVerificationTokenRepository,
      passwordHasher,
      emailSender,
    ).execute(input);

    expect(user.email.toString()).toBe("ana@example.com");
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(emailVerificationTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it("a diferencia de RegisterUser, lanza EmailAlreadyRegisteredException si el correo ya existe", async () => {
    const existing = buildUser({ id: "user-existente" });
    const userRepository = createFakeUserRepository([existing]);
    const emailVerificationTokenRepository = createFakeEmailVerificationTokenRepository();
    const passwordHasher = createFakePasswordHasher();
    const emailSender = createFakeEmailSender();

    await expect(
      new RegisterUserForCheckout(userRepository, emailVerificationTokenRepository, passwordHasher, emailSender).execute(
        input,
      ),
    ).rejects.toThrow(EmailAlreadyRegisteredException);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
