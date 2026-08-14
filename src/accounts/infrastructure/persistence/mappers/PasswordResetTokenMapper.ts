import { PasswordResetToken } from "../../../domain/entities/PasswordResetToken";
import { PasswordResetTokenOrmEntity } from "../entities/PasswordResetTokenOrmEntity";

export class PasswordResetTokenMapper {
  static toDomain(orm: PasswordResetTokenOrmEntity): PasswordResetToken {
    return PasswordResetToken.create({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      expiresAt: orm.expiresAt,
      usedAt: orm.usedAt,
    });
  }

  static toOrm(token: PasswordResetToken): PasswordResetTokenOrmEntity {
    const props = token.toProps();
    const orm = new PasswordResetTokenOrmEntity();
    orm.id = props.id;
    orm.userId = props.userId;
    orm.tokenHash = props.tokenHash;
    orm.expiresAt = props.expiresAt;
    orm.usedAt = props.usedAt;
    return orm;
  }
}
