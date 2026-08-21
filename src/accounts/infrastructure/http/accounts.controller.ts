import { Request, Response } from "express";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { ResendVerificationEmail } from "../../application/use-cases/ResendVerificationEmail";
import { VerifyEmail } from "../../application/use-cases/VerifyEmail";
import { RegisterRequestSchema } from "./schemas/register.schema";
import { ResendVerificationEmailRequestSchema } from "./schemas/resend-verification-email.schema";
import { VerifyEmailQuerySchema } from "./schemas/verify-email.schema";

const GENERIC_REGISTER_MESSAGE =
  "Si el correo ingresado es válido, revisa tu bandeja de entrada para continuar.";

const GENERIC_RESEND_MESSAGE =
  "Si el correo ingresado corresponde a una cuenta sin verificar, te reenviamos el enlace.";

export class AccountsController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly verifyEmail: VerifyEmail,
    private readonly resendVerificationEmail: ResendVerificationEmail,
  ) {}

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
}
