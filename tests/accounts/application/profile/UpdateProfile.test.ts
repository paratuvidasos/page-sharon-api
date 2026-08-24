import { describe, expect, it } from "vitest";
import { UpdateProfile } from "../../../../src/accounts/application/use-cases/profile/UpdateProfile";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildUser } from "../../domain/fixtures";
import { createFakeFileStorage, createFakeUserRepository } from "../fakes";

describe("UpdateProfile", () => {
  it("actualiza nombre/apellido/teléfono sin tocar el avatar si no se sube archivo", async () => {
    const user = buildUser({ id: "user-1", avatarUrl: "https://cdn.example.com/old.png" });
    const userRepository = createFakeUserRepository([user]);
    const fileStorage = createFakeFileStorage();

    const result = await new UpdateProfile(userRepository, fileStorage).execute({
      userId: "user-1",
      firstName: "Ana María",
      lastName: "Ruiz Gómez",
      phone: "+573001112233",
    });

    expect(result.avatarUrl).toBe("https://cdn.example.com/old.png");
    expect(fileStorage.save).not.toHaveBeenCalled();
    expect(user.toProps().firstName).toBe("Ana María");
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("sube el avatar y reemplaza avatarUrl cuando se pasa avatarFile", async () => {
    const user = buildUser({ id: "user-1", avatarUrl: null });
    const userRepository = createFakeUserRepository([user]);
    const fileStorage = createFakeFileStorage();

    const result = await new UpdateProfile(userRepository, fileStorage).execute({
      userId: "user-1",
      firstName: "Ana",
      lastName: "Ruiz",
      phone: null,
      avatarFile: { buffer: Buffer.from("img"), mimeType: "image/png", originalName: "avatar.png" },
    });

    expect(fileStorage.save).toHaveBeenCalledWith({
      buffer: Buffer.from("img"),
      mimeType: "image/png",
      originalName: "avatar.png",
      folder: "avatars",
    });
    expect(result.avatarUrl).toBe("https://cdn.example.com/avatars/uploaded.png");
    expect(user.avatarUrl).toBe("https://cdn.example.com/avatars/uploaded.png");
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    const fileStorage = createFakeFileStorage();

    await expect(
      new UpdateProfile(userRepository, fileStorage).execute({
        userId: "no-existe",
        firstName: "Ana",
        lastName: "Ruiz",
        phone: null,
      }),
    ).rejects.toThrow(UserNotFoundException);
  });
});
