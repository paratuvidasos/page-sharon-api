import { describe, expect, it } from "vitest";
import { DeleteAddress } from "../../../../src/accounts/application/use-cases/addresses/DeleteAddress";
import { AddressNotFoundException } from "../../../../src/accounts/domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

describe("DeleteAddress", () => {
  it("borra la dirección vía deleteAddress() del repositorio", async () => {
    const address = buildAddress({ id: "addr-1", isDefaultShipping: false });
    const user = buildUser({ id: "user-1", addresses: [address] });
    const userRepository = createFakeUserRepository([user]);

    await new DeleteAddress(userRepository).execute({ userId: "user-1", addressId: "addr-1" });

    expect(userRepository.deleteAddress).toHaveBeenCalledWith("addr-1");
  });

  it("si la dirección borrada era la default activa, promueve otra y persiste al usuario", async () => {
    const wasDefault = buildAddress({ id: "addr-1", isDefaultShipping: true, isArchived: false });
    const other = buildAddress({ id: "addr-2", isDefaultShipping: false, isArchived: false });
    const user = buildUser({ id: "user-1", addresses: [wasDefault, other] });
    const userRepository = createFakeUserRepository([user]);

    await new DeleteAddress(userRepository).execute({ userId: "user-1", addressId: "addr-1" });

    expect(user.findAddressById("addr-2")!.isDefaultShipping).toBe(true);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("si la dirección borrada NO era la default activa, no promueve ni llama a save()", async () => {
    const wasDefault = buildAddress({ id: "addr-1", isDefaultShipping: true, isArchived: false });
    const notDefault = buildAddress({ id: "addr-2", isDefaultShipping: false, isArchived: false });
    const user = buildUser({ id: "user-1", addresses: [wasDefault, notDefault] });
    const userRepository = createFakeUserRepository([user]);

    await new DeleteAddress(userRepository).execute({ userId: "user-1", addressId: "addr-2" });

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("una dirección default pero ya archivada no cuenta como 'default activa'", async () => {
    const archivedButFlaggedDefault = buildAddress({ id: "addr-1", isDefaultShipping: true, isArchived: true });
    const user = buildUser({ id: "user-1", addresses: [archivedButFlaggedDefault] });
    const userRepository = createFakeUserRepository([user]);

    await new DeleteAddress(userRepository).execute({ userId: "user-1", addressId: "addr-1" });

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(
      new DeleteAddress(userRepository).execute({ userId: "no-existe", addressId: "addr-1" }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("lanza AddressNotFoundException si la dirección no pertenece al usuario", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);
    await expect(
      new DeleteAddress(userRepository).execute({ userId: "user-1", addressId: "no-existe" }),
    ).rejects.toThrow(AddressNotFoundException);
  });
});
