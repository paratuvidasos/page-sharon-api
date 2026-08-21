import { AddressNotFoundException } from "../../../domain/exceptions/addresses/AddressNotFoundException";
import { ArchivedAddressException } from "../../../domain/exceptions/addresses/ArchivedAddressException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface SetDefaultShippingAddressInput {
  userId: string;
  addressId: string;
}

export class SetDefaultShippingAddress {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SetDefaultShippingAddressInput): Promise<AddressResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const address = user.findAddressById(input.addressId);
    if (!address) {
      throw new AddressNotFoundException();
    }
    if (address.isArchived) {
      throw new ArchivedAddressException();
    }

    user.setDefaultShippingAddress(input.addressId);
    await this.userRepository.save(user);

    return toAddressResult(address);
  }
}
