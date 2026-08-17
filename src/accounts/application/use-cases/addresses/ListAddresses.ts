import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface ListAddressesInput {
  userId: string;
}

export class ListAddresses {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListAddressesInput): Promise<AddressResult[]> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    return user.addresses.map(toAddressResult);
  }
}
