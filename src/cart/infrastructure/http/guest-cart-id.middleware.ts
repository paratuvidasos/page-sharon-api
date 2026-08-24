import { NextFunction, Request, Response } from "express";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";

declare global {
  namespace Express {
    interface Request {
      guestCartId?: string;
    }
  }
}

const GUEST_CART_ID_COOKIE_NAME = "guest_cart_id";
const GUEST_CART_ID_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * [0023]/[0028]: identifica el carrito de un visitante no autenticado sin
 * depender del frontend — mismo mecanismo de cookie httpOnly que ya usa
 * `accounts` para `refresh_token`. Si ya hay `req.authUser` (usuario
 * logueado, ver `optionalAuthenticate`), no emite una cookie de invitado
 * nueva, pero SÍ lee una ya existente en `req.guestCartId` — `/cart/merge`
 * ([0028]) depende de eso para encontrar el carrito de invitado a fusionar
 * en la primera petición autenticada tras el login.
 */
export function ensureGuestCartId(req: Request, res: Response, next: NextFunction): void {
  const existing = req.cookies?.[GUEST_CART_ID_COOKIE_NAME];
  if (existing) {
    req.guestCartId = existing;
    next();
    return;
  }

  if (req.authUser) {
    next();
    return;
  }

  const guestCartId = generateId();
  req.guestCartId = guestCartId;
  res.cookie(GUEST_CART_ID_COOKIE_NAME, guestCartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/cart",
    expires: new Date(Date.now() + GUEST_CART_ID_TTL_MS),
  });
  next();
}
