import { Request, Response } from "express";
import { LoginUser } from "../../application/use-cases/LoginUser";
import { RefreshAccessToken } from "../../application/use-cases/RefreshAccessToken";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { ResendVerificationEmail } from "../../application/use-cases/ResendVerificationEmail";
import { VerifyEmail } from "../../application/use-cases/VerifyEmail";
import { InvalidRefreshTokenException } from "../../domain/exceptions/InvalidRefreshTokenException";
import { LoginRequestSchema } from "./schemas/login.schema";
import "./schemas/refresh-token.schema";
import { RegisterRequestSchema } from "./schemas/register.schema";
import { ResendVerificationEmailRequestSchema } from "./schemas/resend-verification-email.schema";
import { VerifyEmailQuerySchema } from "./schemas/verify-email.schema";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const GENERIC_REGISTER_MESSAGE =
  "Si el correo ingresado es válido, revisa tu bandeja de entrada para continuar.";

const GENERIC_RESEND_MESSAGE =
  "Si el correo ingresado corresponde a una cuenta sin verificar, te reenviamos el enlace.";

export class AccountsController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly verifyEmail: VerifyEmail,
    private readonly resendVerificationEmail: ResendVerificationEmail,
    private readonly loginUser: LoginUser,
    private readonly refreshAccessToken: RefreshAccessToken,
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
}
