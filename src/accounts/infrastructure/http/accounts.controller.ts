import { Request, Response } from "express";
import { LoginUser } from "../../application/use-cases/session/LoginUser";
import { RefreshAccessToken } from "../../application/use-cases/session/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/registration/RegisterUser";
import { RequestPasswordReset } from "../../application/use-cases/password-reset/RequestPasswordReset";
import { ResendVerificationEmail } from "../../application/use-cases/registration/ResendVerificationEmail";
import { ResetPassword } from "../../application/use-cases/password-reset/ResetPassword";
import { UpdateProfile } from "../../application/use-cases/profile/UpdateProfile";
import { VerifyEmail } from "../../application/use-cases/registration/VerifyEmail";
import { InvalidRefreshTokenException } from "../../domain/exceptions/session/InvalidRefreshTokenException";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { LoginRequestSchema } from "./schemas/session/login.schema";
import "./schemas/session/refresh-token.schema";
import { RegisterRequestSchema } from "./schemas/registration/register.schema";
import { RequestPasswordResetRequestSchema } from "./schemas/password-reset/request-password-reset.schema";
import { ResendVerificationEmailRequestSchema } from "./schemas/registration/resend-verification-email.schema";
import { ResetPasswordRequestSchema } from "./schemas/password-reset/reset-password.schema";
import { UpdateProfileRequestSchema } from "./schemas/profile/update-profile.schema";
import { VerifyEmailQuerySchema } from "./schemas/registration/verify-email.schema";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const GENERIC_REGISTER_MESSAGE =
  "Si el correo ingresado es válido, revisa tu bandeja de entrada para continuar.";

const GENERIC_RESEND_MESSAGE =
  "Si el correo ingresado corresponde a una cuenta sin verificar, te reenviamos el enlace.";

const GENERIC_PASSWORD_RESET_REQUEST_MESSAGE =
  "Si el correo ingresado corresponde a una cuenta, te enviamos un enlace para recuperarla.";

export class AccountsController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly verifyEmail: VerifyEmail,
    private readonly resendVerificationEmail: ResendVerificationEmail,
    private readonly loginUser: LoginUser,
    private readonly refreshAccessToken: RefreshAccessToken,
    private readonly requestPasswordResetUseCase: RequestPasswordReset,
    private readonly resetPasswordUseCase: ResetPassword,
    private readonly updateProfileUseCase: UpdateProfile,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/accounts",
      expires: expiresAt,
    });
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const input = RegisterRequestSchema.parse(req.body);
    await this.registerUser.execute(input);
    res.status(201).json({ message: GENERIC_REGISTER_MESSAGE });
  };

  verifyEmailByToken = async (req: Request, res: Response): Promise<void> => {
    const query = VerifyEmailQuerySchema.parse(req.query);
    await this.verifyEmail.execute(query);
    res.status(200).json({ message: "Correo verificado correctamente." });
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const input = ResendVerificationEmailRequestSchema.parse(req.body);
    await this.resendVerificationEmail.execute(input);
    res.status(200).json({ message: GENERIC_RESEND_MESSAGE });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = LoginRequestSchema.parse(req.body);
    const result = await this.loginUser.execute({
      email: input.email,
      password: input.password,
      rememberMe: input.rememberMe,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    });

    this.setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

    res.status(200).json({
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
      user: result.user,
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    const result = await this.refreshAccessToken.execute({
      refreshToken,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    });

    this.setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

    res.status(200).json({
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
      user: result.user,
    });
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const input = RequestPasswordResetRequestSchema.parse(req.body);
    await this.requestPasswordResetUseCase.execute(input);
    res.status(200).json({ message: GENERIC_PASSWORD_RESET_REQUEST_MESSAGE });
  };

  resetPasswordWithToken = async (req: Request, res: Response): Promise<void> => {
    const input = ResetPasswordRequestSchema.parse(req.body);
    await this.resetPasswordUseCase.execute({ token: input.token, newPassword: input.newPassword });
    res.status(200).json({ message: "Tu contraseña se actualizó correctamente." });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }

    const input = UpdateProfileRequestSchema.parse(req.body);
    const result = await this.updateProfileUseCase.execute({
      userId: req.authUser.sub,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarFile: req.file
        ? { buffer: req.file.buffer, mimeType: req.file.mimetype, originalName: req.file.originalname }
        : null,
    });

    res.status(200).json(result);
  };
}
