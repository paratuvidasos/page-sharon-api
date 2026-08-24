import { describe, expect, it } from "vitest";
import { ArchiveAddress } from "../../../../src/accounts/application/use-cases/addresses/ArchiveAddress";
import { AddressNotFoundException } from "../../../../src/accounts/domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

describe("ArchiveAddress", () => {
  it("archiva la dirección y también le retira el default shipping (regla de la entidad)", async () => {
    const address = buildAddress({ id: "addr-1", isDefaultShipping: true, isArchived: false });
    const user = buildUser({ id: "user-1", addresses: [address] });
    const userRepository = createFakeUserRepository([user]);

    const result = await new ArchiveAddress(userRepository).execute({ userId: "user-1", addressId: "addr-1" });

    expect(result.archived).toBe(true);
    expect(result.isDefault).toBe(false);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(
      new ArchiveAddress(userRepository).execute({ userId: "no-existe", addressId: "addr-1" }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("lanza AddressNotFoundException si la dirección no pertenece al usuario", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);

    await expect(
      new ArchiveAddress(userRepository).execute({ userId: "user-1", addressId: "no-existe" }),
    ).rejects.toThrow(AddressNotFoundException);
  });
});
