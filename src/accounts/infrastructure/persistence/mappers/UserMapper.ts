import { Address } from "../../../domain/entities/addresses/Address";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { UserAddressOrmEntity } from "../entities/addresses/UserAddressOrmEntity";
import { UserOrmEntity } from "../entities/UserOrmEntity";

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.create({
      id: orm.id,
      email: Email.create(orm.email),
      passwordHash: orm.passwordHash,
      firstName: orm.firstName,
      lastName: orm.lastName,
      phone: orm.phone,
      avatarUrl: orm.avatarUrl,
      role: orm.role,
      status: orm.status,
      emailVerifiedAt: orm.emailVerifiedAt,
      failedLoginAttempts: orm.failedLoginAttempts,
      lockedUntil: orm.lockedUntil,
      addresses: (orm.addresses ?? []).map((address) =>
        Address.create({
          id: address.id,
          label: address.label,
          recipientName: address.recipientName,
          phone: address.phone,
          countryCode: address.countryCode,
          stateProvince: address.stateProvince,
          city: address.city,
          postalCode: address.postalCode,
          streetLine1: address.streetLine1,
          streetLine2: address.streetLine2,
          isDefaultShipping: address.isDefaultShipping,
          isDefaultBilling: address.isDefaultBilling,
          isArchived: address.isArchived,
        }),
      ),
    });
  }

  static toOrm(user: User): UserOrmEntity {
    const props = user.toProps();
    const orm = new UserOrmEntity();
    orm.id = props.id;
    orm.email = props.email.toString();
    orm.passwordHash = props.passwordHash;
    orm.firstName = props.firstName;
    orm.lastName = props.lastName;
    orm.phone = props.phone;
    orm.avatarUrl = props.avatarUrl;
    orm.role = props.role;
    orm.status = props.status;
    orm.emailVerifiedAt = props.emailVerifiedAt;
    orm.failedLoginAttempts = props.failedLoginAttempts;
    orm.lockedUntil = props.lockedUntil;
    orm.addresses = props.addresses.map((address) => {
      const addressProps = address.toProps();
      const addressOrm = new UserAddressOrmEntity();
      addressOrm.id = addressProps.id;
      addressOrm.userId = props.id;
      addressOrm.label = addressProps.label;
      addressOrm.recipientName = addressProps.recipientName;
      addressOrm.phone = addressProps.phone;
      addressOrm.countryCode = addressProps.countryCode;
      addressOrm.stateProvince = addressProps.stateProvince;
      addressOrm.city = addressProps.city;
      addressOrm.postalCode = addressProps.postalCode;
      addressOrm.streetLine1 = addressProps.streetLine1;
      addressOrm.streetLine2 = addressProps.streetLine2;
      addressOrm.isDefaultShipping = addressProps.isDefaultShipping;
      addressOrm.isDefaultBilling = addressProps.isDefaultBilling;
      addressOrm.isArchived = addressProps.isArchived;
      return addressOrm;
    });
    return orm;
  }
}
