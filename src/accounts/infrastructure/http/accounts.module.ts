import { Router } from "express";
import { DataSource } from "typeorm";
import { buildEmailSender } from "../../../shared-kernel/infrastructure/email/build-email-sender";
import { LocalFileStorage } from "../../../shared-kernel/infrastructure/storage/LocalFileStorage";
import { AddAddress } from "../../application/use-cases/addresses/AddAddress";
import { ArchiveAddress } from "../../application/use-cases/addresses/ArchiveAddress";
import { DeleteAddress } from "../../application/use-cases/addresses/DeleteAddress";
import { ListAddresses } from "../../application/use-cases/addresses/ListAddresses";
import { LoginUser } from "../../application/use-cases/session/LoginUser";
import { RefreshAccessToken } from "../../application/use-cases/session/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/registration/RegisterUser";
import { RequestPasswordReset } from "../../application/use-cases/password-reset/RequestPasswordReset";
import { ResendVerificationEmail } from "../../application/use-cases/registration/ResendVerificationEmail";
import { ResetPassword } from "../../application/use-cases/password-reset/ResetPassword";
import { RestoreAddress } from "../../application/use-cases/addresses/RestoreAddress";
import { SetDefaultShippingAddress } from "../../application/use-cases/addresses/SetDefaultShippingAddress";
import { UpdateAddress } from "../../application/use-cases/addresses/UpdateAddress";
import { UpdateProfile } from "../../application/use-cases/profile/UpdateProfile";
import { VerifyEmail } from "../../application/use-cases/registration/VerifyEmail";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { JwtTokenService } from "../security/JwtTokenService";
import { TypeOrmEmailVerificationTokenRepository } from "../persistence/registration/typeorm-email-verification-token.repository";
import { TypeOrmPasswordResetTokenRepository } from "../persistence/password-reset/typeorm-password-reset-token.repository";
import { TypeOrmRefreshTokenRepository } from "../persistence/session/typeorm-refresh-token.repository";
import { TypeOrmUserRepository } from "../persistence/typeorm-user.repository";
import { AccountsController } from "./accounts.controller";
import { buildAccountsRoutes } from "./accounts.routes";
import { AddressesController } from "./addresses/addresses.controller";
import { buildAuthenticate } from "./session/authenticate.middleware";

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

  const addAddress = new AddAddress(userRepository);
  const listAddresses = new ListAddresses(userRepository);
  const updateAddress = new UpdateAddress(userRepository);
  const deleteAddress = new DeleteAddress(userRepository);
  const setDefaultShippingAddress = new SetDefaultShippingAddress(userRepository);
  const archiveAddress = new ArchiveAddress(userRepository);
  const restoreAddress = new RestoreAddress(userRepository);

  const addressesController = new AddressesController(
    addAddress,
    listAddresses,
    updateAddress,
    deleteAddress,
    setDefaultShippingAddress,
    archiveAddress,
    restoreAddress,
  );

  const authenticate = buildAuthenticate(tokenService);

  return buildAccountsRoutes(controller, addressesController, authenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
