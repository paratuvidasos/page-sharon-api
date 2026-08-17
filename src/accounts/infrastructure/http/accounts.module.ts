import { Router } from "express";
import { DataSource } from "typeorm";
import { buildEmailSender } from "../../../shared-kernel/infrastructure/email/build-email-sender";
import { LoginUser } from "../../application/use-cases/LoginUser";
import { RefreshAccessToken } from "../../application/use-cases/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { ResendVerificationEmail } from "../../application/use-cases/ResendVerificationEmail";
import { VerifyEmail } from "../../application/use-cases/VerifyEmail";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { JwtTokenService } from "../security/JwtTokenService";
import { TypeOrmEmailVerificationTokenRepository } from "../persistence/typeorm-email-verification-token.repository";
import { TypeOrmRefreshTokenRepository } from "../persistence/typeorm-refresh-token.repository";
import { TypeOrmUserRepository } from "../persistence/typeorm-user.repository";
import { AccountsController } from "./accounts.controller";
import { buildAccountsRoutes } from "./accounts.routes";

export function buildAccountsModule(dataSource: DataSource): Router {
  const userRepository = new TypeOrmUserRepository(dataSource);
  const emailVerificationTokenRepository = new TypeOrmEmailVerificationTokenRepository(dataSource);
  const refreshTokenRepository = new TypeOrmRefreshTokenRepository(dataSource);
  const passwordHasher = new BcryptPasswordHasher();
  const emailSender = buildEmailSender();
  const tokenService = new JwtTokenService(requireJwtSecret());

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

  const controller = new AccountsController(
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loginUser,
    refreshAccessToken,
  );

  return buildAccountsRoutes(controller);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
