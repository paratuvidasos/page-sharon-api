import { NextFunction, Request, Response } from "express";
import { ForbiddenException } from "../../domain/exceptions/ForbiddenException";
import { UnauthorizedException } from "../../domain/exceptions/UnauthorizedException";

/**
 * Genérico y sin conocer `UserRole` de `accounts` — el rol viaja como
 * `string` suelto en `AccessTokenPayload` (ver
 * `shared-kernel/domain/ports/TokenService.ts`), así que este middleware
 * recibe el valor esperado como string en vez de importar el enum de otro
 * módulo (ver regla 2 del CLAUDE.md del repo). Debe montarse después de
 * `authenticate`.
 */
export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new UnauthorizedException());
      return;
    }
    if (req.authUser.role !== role) {
      next(new ForbiddenException());
      return;
    }
    next();
  };
}
