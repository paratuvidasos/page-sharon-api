import { AddressNotFoundException } from "../../../domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface ArchiveAddressInput {
  userId: string;
  addressId: string;
}

export class ArchiveAddress {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ArchiveAddressInput): Promise<AddressResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const address = user.findAddressById(input.addressId);
    if (!address) {
      throw new AddressNotFoundException();
    }

    address.archive();
    await this.userRepository.save(user);

    return toAddressResult(address);
  }
}
