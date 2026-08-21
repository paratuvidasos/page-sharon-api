import { NextFunction, Request, Response } from "express";
import { TokenService } from "../../domain/ports/TokenService";

/**
 * Igual que `buildAuthenticate`, pero nunca bloquea la petición: sin token
 * o con un token inválido/expirado, simplemente continúa sin `req.authUser`
 * (invitado). Pensado para rutas como el checkout, donde el mismo endpoint
 * atiende tanto a usuarios logueados como a invitados.
 */
export function buildOptionalAuthenticate(tokenService: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      next();
      return;
    }

    try {
      req.authUser = tokenService.verifyAccessToken(token);
    } catch {
      // Token inválido/expirado: se trata como invitado, no se bloquea el checkout.
    }
    next();
  };
}
