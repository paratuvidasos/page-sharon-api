import jwt from "jsonwebtoken";
import { AccessTokenPayload, TokenService } from "../../domain/ports/TokenService";

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  signAccessToken(payload: AccessTokenPayload, ttlSeconds: number): string {
    return jwt.sign(payload, this.secret, { expiresIn: ttlSeconds });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.secret) as AccessTokenPayload;
  }
}
