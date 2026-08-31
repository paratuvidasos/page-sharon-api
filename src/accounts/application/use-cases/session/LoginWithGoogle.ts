import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../../shared-kernel/infrastructure/security/tokens";
import { AccountInactiveException } from "../../../domain/exceptions/session/AccountInactiveException";
import { RefreshToken } from "../../../domain/entities/session/RefreshToken";
import { User } from "../../../domain/entities/User";
import { UserRole } from "../../../domain/enums/UserRole";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { ClerkIdentityVerifier } from "../../../domain/ports/ClerkIdentityVerifier";
import { TokenService } from "../../../../shared-kernel/domain/ports/TokenService";
import { RefreshTokenRepository } from "../../../domain/repositories/session/RefreshTokenRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { Email } from "../../../domain/value-objects/Email";
import {
  ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS,
  REFRESH_TOKEN_TTL_DAYS,
} from "../../session-policy";

export interface LoginWithGoogleInput {
  sessionToken: string;
  rememberMe?: boolean;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface LoginWithGoogleResult {
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

/**
 * Contraparte de `LoginUser` para "Continuar con Google": el frontend ya hizo
 * el login con Clerk, acá solo se verifica ese token del lado del servidor y
 * se vincula/crea la cuenta local, para no bifurcar el resto del sistema
 * (carrito, checkout, etc. siguen viendo el mismo accessToken de siempre).
 */
export class LoginWithGoogle {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly clerkIdentityVerifier: ClerkIdentityVerifier,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginWithGoogleInput): Promise<LoginWithGoogleResult> {
    const identity = await this.clerkIdentityVerifier.verifySessionToken(input.sessionToken);
    const email = Email.create(identity.email);

    const existingUser = await this.userRepository.findByEmail(email);
    const user = existingUser ?? this.createUserFromGoogleIdentity(email, identity);

    if (!user.isActive()) {
      throw new AccountInactiveException();
    }

    user.linkClerkIdentity(identity.clerkUserId);
    await this.userRepository.save(user);

    const now = new Date();
    const accessToken = this.tokenService.signAccessToken(
      { sub: user.id, email: user.email.toString(), role: user.role },
      ACCESS_TOKEN_TTL_MINUTES * 60,
    );

    const refreshTtlDays = input.rememberMe
      ? REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS
      : REFRESH_TOKEN_TTL_DAYS;
    const rawRefreshToken = generateSecureToken();
    const refreshTokenExpiresAt = new Date(now.getTime() + refreshTtlDays * 24 * 60 * 60 * 1000);

    const refreshToken = RefreshToken.create({
      id: generateId(),
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: refreshTokenExpiresAt,
      revokedAt: null,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    });
    await this.refreshTokenRepository.save(refreshToken);

    const props = user.toProps();

    return {
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_MINUTES * 60,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt,
      user: {
        id: user.id,
        email: props.email.toString(),
        firstName: props.firstName,
        lastName: props.lastName,
        role: props.role,
      },
    };
  }

  private createUserFromGoogleIdentity(
    email: Email,
    identity: { clerkUserId: string; firstName: string; lastName: string },
  ): User {
    return User.create({
      id: generateId(),
      email,
      passwordHash: null,
      firstName: identity.firstName || "Usuario",
      lastName: identity.lastName || "",
      phone: null,
      avatarUrl: null,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      jobTitle: null,
      emailVerifiedAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      addresses: [],
      clerkUserId: null,
      preferredLocale: null,
      preferredCurrency: null,
    });
  }
}
