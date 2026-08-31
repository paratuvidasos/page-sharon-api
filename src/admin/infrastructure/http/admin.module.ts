import { Router } from "express";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { requireRole } from "../../../shared-kernel/infrastructure/http/require-role.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AdminController, AdminControllerUseCases } from "./admin.controller";
import { buildAdminRoutes } from "./admin.routes";

const ADMIN_ROLE = "ADMIN";

/**
 * Panel administrativo: [0022] (producto destacado), [0027] (alta de cupones),
 * [0049] (zonas de cobertura y restricciones de envío) y [0047] (marcar un
 * pedido como enviado con su guía). No tiene tabla propia ni capa de dominio:
 * llama a los casos de uso que exponen `catalog`, `cart`, `shipping` y
 * `orders` (ver regla 2 del CLAUDE.md del repo), nunca sus repositorios.
 *
 * Recibe las dependencias como objeto y no como lista de parámetros porque ya
 * son varias de tres módulos distintos, y una lista posicional larga se
 * equivoca sola — mismo criterio que `buildOrdersModule`.
 */
export function buildAdminModule(useCases: AdminControllerUseCases): Router {
  const controller = new AdminController(useCases);

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);

  return buildAdminRoutes(controller, authenticate, requireRole(ADMIN_ROLE));
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
