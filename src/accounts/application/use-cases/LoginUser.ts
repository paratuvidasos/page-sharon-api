import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { generateSecureToken, hashToken } from "../../../shared-kernel/infrastructure/security/tokens";
import { AccountInactiveException } from "../../domain/exceptions/AccountInactiveException";
import { AccountLockedException } from "../../domain/exceptions/AccountLockedException";
import { InvalidCredentialsException } from "../../domain/exceptions/InvalidCredentialsException";
import { RefreshToken } from "../../domain/entities/RefreshToken";
import { UserRole } from "../../domain/enums/UserRole";
import { PasswordHasher } from "../../domain/ports/PasswordHasher";
import { TokenService } from "../../domain/ports/TokenService";
import { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { Email } from "../../domain/value-objects/Email";
import {
  ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS,
  REFRESH_TOKEN_TTL_DAYS,
} from "../session-policy";

export interface LoginUserInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface LoginUserResult {
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

const MAX_FAILED_LOGIN_ATTEMPTS = Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS ?? 5);
const LOCKOUT_DURATION_MINUTES = Number(process.env.LOGIN_LOCKOUT_DURATION_MINUTES ?? 15);

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserResult> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const now = new Date();
    if (user.isLockedOut(now)) {
      const retryAfterMinutes = Math.ceil(
        ((user.lockedUntil as Date).getTime() - now.getTime()) / 60000,
      );
      throw new AccountLockedException(retryAfterMinutes);
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.toProps().passwordHash,
    );

    if (!passwordMatches) {
      user.recordFailedLoginAttempt();
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil(new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000));
      }
      await this.userRepository.save(user);
      throw new InvalidCredentialsException();
    }

    if (!user.isActive()) {
      throw new AccountInactiveException();
    }

    user.resetFailedLoginAttempts();
    await this.userRepository.save(user);

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
}
