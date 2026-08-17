import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { Address } from "../../../domain/entities/addresses/Address";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AddressResult, toAddressResult } from "../../dto/AddressResult";

export interface AddAddressInput {
  userId: string;
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

export class AddAddress {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: AddAddressInput): Promise<AddressResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const isFirstActiveAddress = !user.hasActiveAddresses();

    const address = Address.create({
      id: generateId(),
      label: input.alias,
      recipientName: input.recipientName,
      phone: input.phone,
      countryCode: input.countryCode,
      stateProvince: input.stateProvince,
      city: input.city,
      postalCode: input.postalCode,
      streetLine1: input.line1,
      streetLine2: input.line2,
      isDefaultShipping: isFirstActiveAddress,
      isDefaultBilling: false,
      isArchived: false,
    });

    user.addAddress(address);
    await this.userRepository.save(user);

    return toAddressResult(address);
  }
}
