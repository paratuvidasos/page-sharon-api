import { describe, expect, it } from "vitest";
import { UpdateAddress } from "../../../../src/accounts/application/use-cases/addresses/UpdateAddress";
import { AddressNotFoundException } from "../../../../src/accounts/domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

const updateInput = {
  userId: "user-1",
  addressId: "addr-1",
  alias: "Oficina",
  recipientName: "Otro Nombre",
  phone: "+573009998877",
  countryCode: "CO",
  stateProvince: "Antioquia",
  city: "Medellín",
  postalCode: "050001",
  line1: "Carrera 1 #2-3",
  line2: "Piso 4",
};

describe("UpdateAddress", () => {
  it("actualiza los campos editables pero no el estado default/archivado", async () => {
    const address = buildAddress({ id: "addr-1", isDefaultShipping: true, isArchived: false });
    const user = buildUser({ id: "user-1", addresses: [address] });
    const userRepository = createFakeUserRepository([user]);

    const result = await new UpdateAddress(userRepository).execute(updateInput);

    expect(result).toMatchObject({
      alias: "Oficina",
      city: "Medellín",
      line1: "Carrera 1 #2-3",
      line2: "Piso 4",
      isDefault: true,
      archived: false,
    });
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(new UpdateAddress(userRepository).execute(updateInput)).rejects.toThrow(UserNotFoundException);
  });

  it("lanza AddressNotFoundException si la dirección no pertenece al usuario", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);
    await expect(new UpdateAddress(userRepository).execute(updateInput)).rejects.toThrow(AddressNotFoundException);
  });
});
