import { describe, expect, it } from "vitest";
import { SetDefaultShippingAddress } from "../../../../src/accounts/application/use-cases/addresses/SetDefaultShippingAddress";
import { AddressNotFoundException } from "../../../../src/accounts/domain/exceptions/addresses/AddressNotFoundException";
import { ArchivedAddressException } from "../../../../src/accounts/domain/exceptions/addresses/ArchivedAddressException";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

describe("SetDefaultShippingAddress", () => {
  it("marca la dirección elegida como default y desmarca las demás", async () => {
    const a1 = buildAddress({ id: "addr-1", isDefaultShipping: true });
    const a2 = buildAddress({ id: "addr-2", isDefaultShipping: false });
    const user = buildUser({ id: "user-1", addresses: [a1, a2] });
    const userRepository = createFakeUserRepository([user]);

    const result = await new SetDefaultShippingAddress(userRepository).execute({
      userId: "user-1",
      addressId: "addr-2",
    });

    expect(result.isDefault).toBe(true);
    expect(user.findAddressById("addr-1")!.isDefaultShipping).toBe(false);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("lanza ArchivedAddressException si la dirección está archivada", async () => {
    const address = buildAddress({ id: "addr-1", isArchived: true });
    const user = buildUser({ id: "user-1", addresses: [address] });
    const userRepository = createFakeUserRepository([user]);

    await expect(
      new SetDefaultShippingAddress(userRepository).execute({ userId: "user-1", addressId: "addr-1" }),
    ).rejects.toThrow(ArchivedAddressException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(
      new SetDefaultShippingAddress(userRepository).execute({ userId: "no-existe", addressId: "addr-1" }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("lanza AddressNotFoundException si la dirección no pertenece al usuario", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);
    await expect(
      new SetDefaultShippingAddress(userRepository).execute({ userId: "user-1", addressId: "no-existe" }),
    ).rejects.toThrow(AddressNotFoundException);
  });
});
