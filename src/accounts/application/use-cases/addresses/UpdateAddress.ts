import { AddressNotFoundException } from "../../../domain/exceptions/addresses/AddressNotFoundException";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface UpdateAddressInput {
  userId: string;
  addressId: string;
  alias: string;
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
}

export class UpdateAddress {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateAddressInput): Promise<AddressResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const address = user.findAddressById(input.addressId);
    if (!address) {
      throw new AddressNotFoundException();
    }

    address.update({
      label: input.alias,
      recipientName: input.recipientName,
      phone: input.phone,
      countryCode: input.countryCode,
      stateProvince: input.stateProvince,
      city: input.city,
      postalCode: input.postalCode,
      streetLine1: input.line1,
      streetLine2: input.line2,
    });

    await this.userRepository.save(user);

    return toAddressResult(address);
  }
}
