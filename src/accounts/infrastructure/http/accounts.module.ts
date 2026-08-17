import { Router } from "express";
import { DataSource } from "typeorm";
import { buildEmailSender } from "../../../shared-kernel/infrastructure/email/build-email-sender";
import { LocalFileStorage } from "../../../shared-kernel/infrastructure/storage/LocalFileStorage";
import { LoginUser } from "../../application/use-cases/LoginUser";
import { RefreshAccessToken } from "../../application/use-cases/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { RequestPasswordReset } from "../../application/use-cases/RequestPasswordReset";
import { ResendVerificationEmail } from "../../application/use-cases/ResendVerificationEmail";
import { ResetPassword } from "../../application/use-cases/ResetPassword";
import { UpdateProfile } from "../../application/use-cases/UpdateProfile";
import { VerifyEmail } from "../../application/use-cases/VerifyEmail";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { JwtTokenService } from "../security/JwtTokenService";
import { TypeOrmEmailVerificationTokenRepository } from "../persistence/typeorm-email-verification-token.repository";
import { TypeOrmPasswordResetTokenRepository } from "../persistence/typeorm-password-reset-token.repository";
import { TypeOrmRefreshTokenRepository } from "../persistence/typeorm-refresh-token.repository";
import { TypeOrmUserRepository } from "../persistence/typeorm-user.repository";
import { AccountsController } from "./accounts.controller";
import { buildAccountsRoutes } from "./accounts.routes";
import { buildAuthenticate } from "./authenticate.middleware";

export function buildAccountsModule(dataSource: DataSource): Router {
  const userRepository = new TypeOrmUserRepository(dataSource);
  const emailVerificationTokenRepository = new TypeOrmEmailVerificationTokenRepository(dataSource);
  const passwordResetTokenRepository = new TypeOrmPasswordResetTokenRepository(dataSource);
  const refreshTokenRepository = new TypeOrmRefreshTokenRepository(dataSource);
  const passwordHasher = new BcryptPasswordHasher();
  const emailSender = buildEmailSender();
  const tokenService = new JwtTokenService(requireJwtSecret());
  const fileStorage = new LocalFileStorage(
    process.env.UPLOADS_DIR ?? "uploads",
    process.env.API_PUBLIC_URL ?? "http://localhost:3000",
  );

  const registerUser = new RegisterUser(
    userRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
  );
  const verifyEmail = new VerifyEmail(userRepository, emailVerificationTokenRepository);
  const resendVerificationEmail = new ResendVerificationEmail(
    userRepository,
    emailVerificationTokenRepository,
    emailSender,
  );
  const loginUser = new LoginUser(userRepository, refreshTokenRepository, passwordHasher, tokenService);
  const refreshAccessToken = new RefreshAccessToken(userRepository, refreshTokenRepository, tokenService);
  const requestPasswordReset = new RequestPasswordReset(
    userRepository,
    passwordResetTokenRepository,
    emailSender,
  );
  const resetPassword = new ResetPassword(
    userRepository,
    passwordResetTokenRepository,
    refreshTokenRepository,
    passwordHasher,
  );
  const updateProfile = new UpdateProfile(userRepository, fileStorage);

  const controller = new AccountsController(
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loginUser,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    updateProfile,
  );

  const authenticate = buildAuthenticate(tokenService);

  return buildAccountsRoutes(controller, authenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
