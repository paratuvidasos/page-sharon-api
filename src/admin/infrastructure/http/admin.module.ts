import { Router } from "express";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { CreateCoupon } from "../../../cart/application/use-cases/CreateCoupon";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { requireRole } from "../../../shared-kernel/infrastructure/http/require-role.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AdminController } from "./admin.controller";
import { buildAdminRoutes } from "./admin.routes";

const ADMIN_ROLE = "ADMIN";

/**
 * Módulo mínimo: [0022] (marcar producto como destacado) y el alta de
 * cupones para [0027] (no hay CRUD de catálogo ni administración de
 * cupones completa en el backlog). No tiene tabla propia: llama a los
 * casos de uso que exponen `catalog`/`cart` (ver regla 2 del CLAUDE.md del
 * repo), nunca sus repositorios.
 */
export function buildAdminModule(setProductFeatured: SetProductFeatured, createCoupon: CreateCoupon): Router {
  const controller = new AdminController(setProductFeatured, createCoupon);

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
