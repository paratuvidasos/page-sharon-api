import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../../domain/exceptions/UnauthorizedException";
import { AccessTokenPayload, TokenService } from "../../domain/ports/TokenService";

declare global {
  namespace Express {
    interface Request {
      authUser?: AccessTokenPayload;
    }
  }
}

export function buildAuthenticate(tokenService: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      next(new UnauthorizedException());
      return;
    }

    try {
      req.authUser = tokenService.verifyAccessToken(token);
      next();
    } catch {
      next(new UnauthorizedException());
    }
  };
}
