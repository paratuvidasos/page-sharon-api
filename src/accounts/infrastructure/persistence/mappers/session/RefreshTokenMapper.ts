import { RefreshToken } from "../../../../domain/entities/session/RefreshToken";
import { RefreshTokenOrmEntity } from "../../entities/session/RefreshTokenOrmEntity";

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.create({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      expiresAt: orm.expiresAt,
      revokedAt: orm.revokedAt,
      userAgent: orm.userAgent,
      ipAddress: orm.ipAddress,
    });
  }

  static toOrm(refreshToken: RefreshToken): RefreshTokenOrmEntity {
    const props = refreshToken.toProps();
    const orm = new RefreshTokenOrmEntity();
    orm.id = props.id;
    orm.userId = props.userId;
    orm.tokenHash = props.tokenHash;
    orm.expiresAt = props.expiresAt;
    orm.revokedAt = props.revokedAt;
    orm.userAgent = props.userAgent;
    orm.ipAddress = props.ipAddress;
    return orm;
  }
}
