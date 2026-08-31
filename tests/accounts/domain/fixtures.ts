import { UserRole } from "../../../src/accounts/domain/enums/UserRole";
import { UserStatus } from "../../../src/accounts/domain/enums/UserStatus";
import { Email } from "../../../src/accounts/domain/value-objects/Email";
import { User, UserProps } from "../../../src/accounts/domain/entities/User";
import { Address, AddressProps } from "../../../src/accounts/domain/entities/addresses/Address";

export function buildAddressProps(overrides: Partial<AddressProps> = {}): AddressProps {
  return {
    id: "address-1",
    label: "Casa",
    recipientName: "Ana Ruiz",
    phone: "+573001234567",
    countryCode: "CO",
    stateProvince: "Cundinamarca",
    city: "Bogotá",
    postalCode: "110111",
    streetLine1: "Calle 123 #45-67",
    streetLine2: null,
    isDefaultShipping: false,
    isDefaultBilling: false,
    isArchived: false,
    ...overrides,
  };
}

export function buildAddress(overrides: Partial<AddressProps> = {}): Address {
  return Address.create(buildAddressProps(overrides));
}

export function buildUserProps(overrides: Partial<UserProps> = {}): UserProps {
  return {
    id: "user-1",
    email: Email.create("ana@example.com"),
    passwordHash: "hashed-password",
    firstName: "Ana",
    lastName: "Ruiz",
    phone: null,
    avatarUrl: null,
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    addresses: [],
    clerkUserId: null,
    preferredLocale: null,
    preferredCurrency: null,
    ...overrides,
  };
}

export function buildUser(overrides: Partial<UserProps> = {}): User {
  return User.create(buildUserProps(overrides));
}
