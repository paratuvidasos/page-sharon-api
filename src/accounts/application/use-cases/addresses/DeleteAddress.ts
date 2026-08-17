import { AddressNotFoundException } from "../../../domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface DeleteAddressInput {
  userId: string;
  addressId: string;
}

export class DeleteAddress {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteAddressInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const address = user.findAddressById(input.addressId);
    if (!address) {
      throw new AddressNotFoundException();
    }

    const wasActiveDefault = address.isDefaultShipping && !address.isArchived;

    user.removeAddress(input.addressId);
    await this.userRepository.deleteAddress(input.addressId);

    if (wasActiveDefault) {
      user.promoteFirstActiveAddressToDefault();
      await this.userRepository.save(user);
    }
  }
}
