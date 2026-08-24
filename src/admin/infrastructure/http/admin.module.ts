import { Router } from "express";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { requireRole } from "../../../shared-kernel/infrastructure/http/require-role.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AdminController } from "./admin.controller";
import { buildAdminRoutes } from "./admin.routes";

const ADMIN_ROLE = "ADMIN";

/**
 * Módulo mínimo: solo lo necesario para [0022] (marcar producto como
 * destacado). No incluye CRUD de catálogo — no está en el backlog
 * [0013]-[0022]. No tiene tabla propia: llama al caso de uso que expone
 * `catalog` (ver regla 2 del CLAUDE.md del repo), nunca su repositorio.
 */
export function buildAdminModule(setProductFeatured: SetProductFeatured): Router {
  const controller = new AdminController(setProductFeatured);

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
