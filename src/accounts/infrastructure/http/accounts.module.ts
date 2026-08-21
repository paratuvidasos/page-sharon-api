import { Router } from "express";
import { DataSource } from "typeorm";
import { buildEmailSender } from "../../../shared-kernel/infrastructure/email/build-email-sender";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { VerifyEmail } from "../../application/use-cases/VerifyEmail";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { TypeOrmEmailVerificationTokenRepository } from "../persistence/typeorm-email-verification-token.repository";
import { TypeOrmUserRepository } from "../persistence/typeorm-user.repository";
import { AccountsController } from "./accounts.controller";
import { buildAccountsRoutes } from "./accounts.routes";

export function buildAccountsModule(dataSource: DataSource): Router {
  const userRepository = new TypeOrmUserRepository(dataSource);
  const emailVerificationTokenRepository = new TypeOrmEmailVerificationTokenRepository(dataSource);
  const passwordHasher = new BcryptPasswordHasher();
  const emailSender = buildEmailSender();

  const registerUser = new RegisterUser(
    userRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
  );
  const verifyEmail = new VerifyEmail(userRepository, emailVerificationTokenRepository);

  const controller = new AccountsController(registerUser, verifyEmail);

  return buildAccountsRoutes(controller);
}
