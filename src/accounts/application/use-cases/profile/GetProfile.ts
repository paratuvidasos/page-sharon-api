import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { UserRole } from "../../../domain/enums/UserRole";

export interface GetProfileInput {
  userId: string;
}

export interface GetProfileResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  hasPassword: boolean;
  preferredLocale: Locale | null;
  preferredCurrency: Currency | null;
}

export class GetProfile {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetProfileInput): Promise<GetProfileResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const props = user.toProps();

    return {
      id: props.id,
      email: props.email.toString(),
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
      avatarUrl: props.avatarUrl,
      role: props.role,
      hasPassword: user.hasPassword(),
      preferredLocale: props.preferredLocale,
      preferredCurrency: props.preferredCurrency,
    };
  }
}
