import { EmailVerificationToken } from "../../../../domain/entities/registration/EmailVerificationToken";
import { EmailVerificationTokenOrmEntity } from "../../entities/registration/EmailVerificationTokenOrmEntity";

export class EmailVerificationTokenMapper {
  static toDomain(orm: EmailVerificationTokenOrmEntity): EmailVerificationToken {
    return EmailVerificationToken.create({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      expiresAt: orm.expiresAt,
      usedAt: orm.usedAt,
    });
  }

  static toOrm(token: EmailVerificationToken): EmailVerificationTokenOrmEntity {
    const props = token.toProps();
    const orm = new EmailVerificationTokenOrmEntity();
    orm.id = props.id;
    orm.userId = props.userId;
    orm.tokenHash = props.tokenHash;
    orm.expiresAt = props.expiresAt;
    orm.usedAt = props.usedAt;
    return orm;
  }
}
