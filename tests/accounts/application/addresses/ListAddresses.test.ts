import { describe, expect, it } from "vitest";
import { ListAddresses } from "../../../../src/accounts/application/use-cases/addresses/ListAddresses";
import { UserNotFoundException } from "../../../../src/accounts/domain/exceptions/UserNotFoundException";
import { buildAddress, buildUser } from "../../domain/fixtures";
import { createFakeUserRepository } from "../fakes";

describe("ListAddresses", () => {
  it("devuelve todas las direcciones del usuario, incluidas las archivadas", async () => {
    const user = buildUser({
      id: "user-1",
      addresses: [buildAddress({ id: "addr-1", isArchived: false }), buildAddress({ id: "addr-2", isArchived: true })],
    });
    const userRepository = createFakeUserRepository([user]);

    const result = await new ListAddresses(userRepository).execute({ userId: "user-1" });

    expect(result.map((a) => a.id)).toEqual(["addr-1", "addr-2"]);
  });

  it("devuelve una lista vacía si el usuario no tiene direcciones", async () => {
    const user = buildUser({ id: "user-1", addresses: [] });
    const userRepository = createFakeUserRepository([user]);

    expect(await new ListAddresses(userRepository).execute({ userId: "user-1" })).toEqual([]);
  });

  it("lanza UserNotFoundException si el usuario no existe", async () => {
    const userRepository = createFakeUserRepository([]);
    await expect(new ListAddresses(userRepository).execute({ userId: "no-existe" })).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
