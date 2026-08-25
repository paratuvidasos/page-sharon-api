import { AddressNotFoundException } from "../../../domain/exceptions/addresses/AddressNotFoundException";
import { ArchivedAddressException } from "../../../domain/exceptions/addresses/ArchivedAddressException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface GetAddressByIdInput {
  userId: string;
  addressId: string;
}

/**
 * [0033]: resuelve una dirección guardada del usuario para usarla como
 * destino de envío en el checkout. `orders` lo consume vía puerto, sin
 * conocer nada de la infraestructura de `accounts` (ver regla 2 del CLAUDE.md
 * del repo).
 *
 * Rechaza direcciones archivadas: siguen existiendo para que los pedidos
 * viejos conserven su historia, pero no son un destino válido para un pedido
 * nuevo.
 */
export class GetAddressById {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetAddressByIdInput): Promise<AddressResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const address = user.addresses.find((current) => current.id === input.addressId);
    if (!address) {
      throw new AddressNotFoundException();
    }

    const result = toAddressResult(address);
    if (result.archived) {
      throw new ArchivedAddressException(
        "Esa dirección está archivada. Elige otra o agrega una nueva para tu pedido.",
      );
    }

    return result;
  }
}
