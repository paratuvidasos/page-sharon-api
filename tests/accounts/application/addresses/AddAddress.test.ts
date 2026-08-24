import { describe, expect, it } from "vitest";
import { AddAddress } from "../../../../src/accounts/application/use-cases/addresses/AddAddress";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

const input = {
  userId: "user-1",
  alias: "Casa",
  recipientName: "Ana Ruiz",
  phone: "+573001234567",
  countryCode: "CO",
  stateProvince: "Cundinamarca",
  city: "Bogotá",
  postalCode: "110111",
  line1: "Calle 123 #45-67",
  line2: null,
};

describe("AddAddress", () => {
  it("la primera dirección activa se marca como default shipping automáticamente", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);

    const result = await new AddAddress(userRepository).execute(input);

    expect(result.isDefault).toBe(true);
    expect(result.archived).toBe(false);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("una segunda dirección activa NO se marca como default", async () => {
    const user = buildUser({
      id: "user-1",
      addresses: [buildAddress({ id: "addr-existente", isDefaultShipping: true, isArchived: false })],
    });
    const userRepository = createFakeUserRepository([user]);

    const result = await new AddAddress(userRepository).execute(input);

    expect(result.isDefault).toBe(false);
  });

  it("si solo hay direcciones archivadas, la nueva vuelve a ser la primera activa y se marca default", async () => {
    const user = buildUser({
      id: "user-1",
      addresses: [buildAddress({ id: "addr-archivada", isArchived: true })],
    });
    const userRepository = createFakeUserRepository([user]);

    const result = await new AddAddress(userRepository).execute(input);

    expect(result.isDefault).toBe(true);
  });

  it("mapea todos los campos de entrada al resultado", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);

    const result = await new AddAddress(userRepository).execute(input);

    expect(result).toMatchObject({
      alias: "Casa",
      recipientName: "Ana Ruiz",
      phone: "+573001234567",
      countryCode: "CO",
      stateProvince: "Cundinamarca",
      city: "Bogotá",
      postalCode: "110111",
      line1: "Calle 123 #45-67",
      line2: null,
    });
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(new AddAddress(userRepository).execute(input)).rejects.toThrow(UserNotFoundException);
  });
});
