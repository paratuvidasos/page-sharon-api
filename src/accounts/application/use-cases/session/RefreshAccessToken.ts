import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../../shared-kernel/infrastructure/security/tokens";
import { AccountInactiveException } from "../../../domain/exceptions/session/AccountInactiveException";
import { InvalidRefreshTokenException } from "../../../domain/exceptions/session/InvalidRefreshTokenException";
import { RefreshToken } from "../../../domain/entities/session/RefreshToken";
import { UserRole } from "../../../domain/enums/UserRole";
import { TokenService } from "../../../domain/ports/TokenService";
import { RefreshTokenRepository } from "../../../domain/repositories/session/RefreshTokenRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { ACCESS_TOKEN_TTL_MINUTES } from "../../session-policy";

export interface RefreshAccessTokenInput {
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface RefreshAccessTokenResult {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export class RefreshAccessToken {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenResult> {
    const tokenHash = hashToken(input.refreshToken);
    const currentToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!currentToken || !currentToken.isValid()) {
      throw new InvalidRefreshTokenException();
    }

    const user = await this.userRepository.findById(currentToken.userId);
    if (!user) {
      throw new InvalidRefreshTokenException();
    }

    if (!user.isActive()) {
      throw new AccountInactiveException();
    }

    // Rotación: el token usado queda inválido y se emite uno nuevo con la misma
    // fecha de expiración, para no extender la sesión más allá de lo que ya
    // había definido "recordarme" en el login original.
    currentToken.revoke();
    await this.refreshTokenRepository.save(currentToken);

    const rawRefreshToken = generateSecureToken();
    const newRefreshToken = RefreshToken.create({
      id: generateId(),
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: currentToken.expiresAt,
      revokedAt: null,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    const accessToken = this.tokenService.signAccessToken(
      { sub: user.id, email: user.email.toString(), role: user.role },
      ACCESS_TOKEN_TTL_MINUTES * 60,
    );

    const props = user.toProps();

    return {
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_MINUTES * 60,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt: currentToken.expiresAt,
      user: {
        id: user.id,
        email: props.email.toString(),
        firstName: props.firstName,
        lastName: props.lastName,
        role: props.role,
      },
    };
  }
}
