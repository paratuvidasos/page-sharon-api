import { describe, expect, it } from "vitest";
import { GetProfile } from "../../../../src/accounts/application/use-cases/profile/GetProfile";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

describe("GetProfile", () => {
  it("devuelve el perfil mapeado del usuario encontrado", async () => {
    const user = buildUser({ id: "user-1", firstName: "Ana", phone: "+573001234567" });
    const userRepository = createFakeUserRepository([user]);
    const getProfile = new GetProfile(userRepository);

    const result = await getProfile.execute({ userId: "user-1" });

    expect(result).toEqual({
      id: "user-1",
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "Ruiz",
      phone: "+573001234567",
      avatarUrl: null,
      role: user.role,
    });
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const getProfile = new GetProfile(userRepository);

    await expect(getProfile.execute({ userId: "no-existe" })).rejects.toThrow(UserNotFoundException);
  });
});
