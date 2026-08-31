import { Router } from "express";
import { DataSource } from "typeorm";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildEmailSender } from "../../../shared-kernel/infrastructure/email/build-email-sender";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { buildFileStorage } from "../../../shared-kernel/infrastructure/storage/build-file-storage";
import { AddAddress } from "../../application/use-cases/addresses/AddAddress";
import { ArchiveAddress } from "../../application/use-cases/addresses/ArchiveAddress";
import { DeleteAddress } from "../../application/use-cases/addresses/DeleteAddress";
import { GetAddressById } from "../../application/use-cases/addresses/GetAddressById";
import { DeleteAccount } from "../../application/use-cases/profile/DeleteAccount";
import { ListAddresses } from "../../application/use-cases/addresses/ListAddresses";
import { LoginUser } from "../../application/use-cases/session/LoginUser";
import { LoginWithGoogle } from "../../application/use-cases/session/LoginWithGoogle";
import { LogoutAllSessions } from "../../application/use-cases/session/LogoutAllSessions";
import { LogoutUser } from "../../application/use-cases/session/LogoutUser";
import { RefreshAccessToken } from "../../application/use-cases/session/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/registration/RegisterUser";
import { RegisterUserForCheckout } from "../../application/use-cases/registration/RegisterUserForCheckout";
import { RequestPasswordReset } from "../../application/use-cases/password-reset/RequestPasswordReset";
import { ResendVerificationEmail } from "../../application/use-cases/registration/ResendVerificationEmail";
import { ResetPassword } from "../../application/use-cases/password-reset/ResetPassword";
import { RestoreAddress } from "../../application/use-cases/addresses/RestoreAddress";
import { SetDefaultShippingAddress } from "../../application/use-cases/addresses/SetDefaultShippingAddress";
import { UpdateAddress } from "../../application/use-cases/addresses/UpdateAddress";
import { ListCustomers, GetOrderSummaryForUsersPort } from "../../application/use-cases/admin/ListCustomers";
import { ReactivateCustomer } from "../../application/use-cases/admin/ReactivateCustomer";
import { SuspendCustomer } from "../../application/use-cases/admin/SuspendCustomer";
import { GetCustomerContact } from "../../application/use-cases/profile/GetCustomerContact";
import { GetProfile } from "../../application/use-cases/profile/GetProfile";
import { GetUserLocalePreference } from "../../application/use-cases/profile/GetUserLocalePreference";
import { UpdateLocalePreference } from "../../application/use-cases/profile/UpdateLocalePreference";
import { SetPassword } from "../../application/use-cases/profile/SetPassword";
import { UpdateProfile } from "../../application/use-cases/profile/UpdateProfile";
import { VerifyEmail } from "../../application/use-cases/registration/VerifyEmail";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { ClerkBackendIdentityVerifier } from "../security/ClerkBackendIdentityVerifier";
import { TypeOrmEmailVerificationTokenRepository } from "../persistence/registration/typeorm-email-verification-token.repository";
import { TypeOrmPasswordResetTokenRepository } from "../persistence/password-reset/typeorm-password-reset-token.repository";
import { TypeOrmRefreshTokenRepository } from "../persistence/session/typeorm-refresh-token.repository";
import { TypeOrmUserQueryRepository } from "../persistence/typeorm-user-query.repository";
import { TypeOrmUserRepository } from "../persistence/typeorm-user.repository";
import { AccountsController } from "./accounts.controller";
import { buildAccountsRoutes } from "./accounts.routes";
import { AddressesController } from "./addresses/addresses.controller";

export interface AccountsModule {
  router: Router;
  registerUserForCheckout: RegisterUserForCheckout;
  loginUser: LoginUser;
  /** [0033]: `orders` resuelve por acá la dirección guardada elegida en el checkout. */
  getAddressById: GetAddressById;
  /** Correo y nombre del comprador con sesión, para la pasarela y el correo de confirmación. */
  getCustomerContact: GetCustomerContact;
  /** [0070]: puertos que `localization` consume para leer/guardar la preferencia de idioma/moneda de la cuenta. */
  getUserLocalePreference: GetUserLocalePreference;
  updateLocalePreference: UpdateLocalePreference;
  /** [0063]: listado de clientes y bloqueo/reactivación para el panel administrativo. */
  listCustomers: ListCustomers;
  suspendCustomer: SuspendCustomer;
  reactivateCustomer: ReactivateCustomer;
}

export function buildAccountsModule(
  dataSource: DataSource,
  getOrderSummaryForUsersPort: GetOrderSummaryForUsersPort,
): AccountsModule {
  const userRepository = new TypeOrmUserRepository(dataSource);
  const userQueryRepository = new TypeOrmUserQueryRepository(dataSource);
  const emailVerificationTokenRepository = new TypeOrmEmailVerificationTokenRepository(dataSource);
  const passwordResetTokenRepository = new TypeOrmPasswordResetTokenRepository(dataSource);
  const refreshTokenRepository = new TypeOrmRefreshTokenRepository(dataSource);
  const passwordHasher = new BcryptPasswordHasher();
  const emailSender = buildEmailSender();
  const tokenService = new JwtTokenService(requireJwtSecret());
  const fileStorage = buildFileStorage();
  const clerkIdentityVerifier = new ClerkBackendIdentityVerifier(requireClerkSecretKey());

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
  const loginWithGoogle = new LoginWithGoogle(
    userRepository,
    refreshTokenRepository,
    clerkIdentityVerifier,
    tokenService,
  );
  const registerUserForCheckout = new RegisterUserForCheckout(
    userRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
  );
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
  const logoutUser = new LogoutUser(refreshTokenRepository);
  const logoutAllSessions = new LogoutAllSessions(refreshTokenRepository);
  const listCustomers = new ListCustomers(userQueryRepository, getOrderSummaryForUsersPort);
  const suspendCustomer = new SuspendCustomer(userRepository, logoutAllSessions);
  const reactivateCustomer = new ReactivateCustomer(userRepository);
  const getProfile = new GetProfile(userRepository);
  const setPassword = new SetPassword(userRepository, passwordHasher);
  const deleteAccount = new DeleteAccount(
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    emailVerificationTokenRepository,
    passwordHasher,
    emailSender,
    domainEventBus,
  );

  const controller = new AccountsController(
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loginUser,
    loginWithGoogle,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    logoutUser,
    logoutAllSessions,
    getProfile,
    deleteAccount,
    setPassword,
  );

  const addAddress = new AddAddress(userRepository);
  const listAddresses = new ListAddresses(userRepository);
  const updateAddress = new UpdateAddress(userRepository);
  const deleteAddress = new DeleteAddress(userRepository);
  const setDefaultShippingAddress = new SetDefaultShippingAddress(userRepository);
  const archiveAddress = new ArchiveAddress(userRepository);
  const restoreAddress = new RestoreAddress(userRepository);
  const getAddressById = new GetAddressById(userRepository);
  const getCustomerContact = new GetCustomerContact(userRepository);
  const getUserLocalePreference = new GetUserLocalePreference(userRepository);
  const updateLocalePreference = new UpdateLocalePreference(userRepository);

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

  return {
    router: buildAccountsRoutes(controller, addressesController, authenticate),
    registerUserForCheckout,
    loginUser,
    getAddressById,
    getCustomerContact,
    getUserLocalePreference,
    updateLocalePreference,
    listCustomers,
    suspendCustomer,
    reactivateCustomer,
  };
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}

function requireClerkSecretKey(): string {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY no está configurado.");
  }
  return secretKey;
}
