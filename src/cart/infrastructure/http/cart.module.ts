import { Router } from "express";
import { DataSource } from "typeorm";
import { buildOptionalAuthenticate } from "../../../shared-kernel/infrastructure/http/optional-authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AddItemToCart } from "../../application/use-cases/AddItemToCart";
import { ApplyCouponToCart } from "../../application/use-cases/ApplyCouponToCart";
import { ClearCart } from "../../application/use-cases/ClearCart";
import { ClearCartForUser } from "../../application/use-cases/ClearCartForUser";
import { GetCart } from "../../application/use-cases/GetCart";
import { MergeGuestCartIntoUserCart } from "../../application/use-cases/MergeGuestCartIntoUserCart";
import { RemoveCartItem } from "../../application/use-cases/RemoveCartItem";
import { RemoveCouponFromCart } from "../../application/use-cases/RemoveCouponFromCart";
import { UpdateCartItemQuantity } from "../../application/use-cases/UpdateCartItemQuantity";
import { CreateCoupon } from "../../application/use-cases/CreateCoupon";
import { QuoteCoupon } from "../../application/use-cases/QuoteCoupon";
import { RedeemCoupon } from "../../application/use-cases/RedeemCoupon";
import { CatalogSnapshotPort } from "../../application/ports/CatalogSnapshotPort";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { TypeOrmCartRepository } from "../persistence/typeorm-cart.repository";
import { TypeOrmCouponRepository } from "../persistence/typeorm-coupon.repository";
import { CartController } from "./cart.controller";
import { buildCartRoutes } from "./cart.routes";

export interface CartModule {
  router: Router;
  couponRepository: CouponRepository;
  mergeGuestCartIntoUserCart: MergeGuestCartIntoUserCart;
  createCoupon: CreateCoupon;
  /** [0038]: revalida el cupón contra el subtotal real al confirmar el pedido. */
  quoteCoupon: QuoteCoupon;
  /** [0039]: cuenta el uso del cupón cuando el pago se aprueba. */
  redeemCoupon: RedeemCoupon;
  /** [0039]: vacía el carrito del usuario cuyo pedido quedó pagado. */
  clearCartForUser: ClearCartForUser;
}

export function buildCartModule(dataSource: DataSource, catalogSnapshotPort: CatalogSnapshotPort): CartModule {
  const cartRepository = new TypeOrmCartRepository(dataSource);
  const couponRepository = new TypeOrmCouponRepository(dataSource);

  const getCart = new GetCart(cartRepository, catalogSnapshotPort, couponRepository);
  const addItemToCart = new AddItemToCart(cartRepository, catalogSnapshotPort, couponRepository);
  const updateCartItemQuantity = new UpdateCartItemQuantity(cartRepository, catalogSnapshotPort, couponRepository);
  const removeCartItem = new RemoveCartItem(cartRepository, catalogSnapshotPort, couponRepository);
  const clearCart = new ClearCart(cartRepository);
  const applyCouponToCart = new ApplyCouponToCart(cartRepository, couponRepository, catalogSnapshotPort);
  const removeCouponFromCart = new RemoveCouponFromCart(cartRepository, catalogSnapshotPort, couponRepository);
  const mergeGuestCartIntoUserCart = new MergeGuestCartIntoUserCart(
    cartRepository,
    catalogSnapshotPort,
    couponRepository,
  );
  const createCoupon = new CreateCoupon(couponRepository);
  const quoteCoupon = new QuoteCoupon(couponRepository);
  const redeemCoupon = new RedeemCoupon(couponRepository);
  const clearCartForUser = new ClearCartForUser(cartRepository);

  const controller = new CartController(
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    applyCouponToCart,
    removeCouponFromCart,
    mergeGuestCartIntoUserCart,
  );

  const tokenService = new JwtTokenService(requireJwtSecret());
  const optionalAuthenticate = buildOptionalAuthenticate(tokenService);

  return {
    router: buildCartRoutes(controller, optionalAuthenticate),
    couponRepository,
    mergeGuestCartIntoUserCart,
    createCoupon,
    quoteCoupon,
    redeemCoupon,
    clearCartForUser,
  };
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
