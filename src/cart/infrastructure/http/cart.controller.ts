import { Request, Response } from "express";
import { InsufficientStockException } from "../../domain/exceptions/InsufficientStockException";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { AddItemToCart } from "../../application/use-cases/AddItemToCart";
import { ApplyCouponToCart } from "../../application/use-cases/ApplyCouponToCart";
import { ClearCart } from "../../application/use-cases/ClearCart";
import { GetCart } from "../../application/use-cases/GetCart";
import { MergeGuestCartIntoUserCart } from "../../application/use-cases/MergeGuestCartIntoUserCart";
import { RemoveCartItem } from "../../application/use-cases/RemoveCartItem";
import { RemoveCouponFromCart } from "../../application/use-cases/RemoveCouponFromCart";
import { UpdateCartItemQuantity } from "../../application/use-cases/UpdateCartItemQuantity";
import { CartOwner } from "../../application/cart-owner";
import { CartOwnerType } from "../../domain/enums/CartOwnerType";
import { AddCartItemRequestSchema } from "./schemas/add-cart-item.schema";
import { ApplyCouponRequestSchema } from "./schemas/apply-coupon.schema";
import { CartItemParamsSchema, UpdateCartItemRequestSchema } from "./schemas/update-cart-item.schema";

export class CartController {
  constructor(
    private readonly getCart: GetCart,
    private readonly addItemToCart: AddItemToCart,
    private readonly updateCartItemQuantity: UpdateCartItemQuantity,
    private readonly removeCartItem: RemoveCartItem,
    private readonly clearCart: ClearCart,
    private readonly applyCouponToCart: ApplyCouponToCart,
    private readonly removeCouponFromCart: RemoveCouponFromCart,
    private readonly mergeGuestCartIntoUserCart: MergeGuestCartIntoUserCart,
  ) {}

  getCartHandler = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getCart.execute(resolveCartOwner(req));
    res.status(200).json(result);
  };

  addItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { variantId, quantity } = AddCartItemRequestSchema.parse(req.body);
    try {
      const result = await this.addItemToCart.execute({ owner: resolveCartOwner(req), variantId, quantity });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof InsufficientStockException) {
        res
          .status(err.statusCode)
          .json({ error: err.code, message: err.message, availableQuantity: err.availableQuantity });
        return;
      }
      throw err;
    }
  };

  updateItemQuantityHandler = async (req: Request, res: Response): Promise<void> => {
    const { itemId } = CartItemParamsSchema.parse(req.params);
    const { quantity } = UpdateCartItemRequestSchema.parse(req.body);
    try {
      const result = await this.updateCartItemQuantity.execute({ owner: resolveCartOwner(req), itemId, quantity });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof InsufficientStockException) {
        res
          .status(err.statusCode)
          .json({ error: err.code, message: err.message, availableQuantity: err.availableQuantity });
        return;
      }
      throw err;
    }
  };

  removeItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { itemId } = CartItemParamsSchema.parse(req.params);
    const result = await this.removeCartItem.execute({ owner: resolveCartOwner(req), itemId });
    res.status(200).json(result);
  };

  clearCartHandler = async (req: Request, res: Response): Promise<void> => {
    const result = await this.clearCart.execute(resolveCartOwner(req));
    res.status(200).json(result);
  };

  applyCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const { code } = ApplyCouponRequestSchema.parse(req.body);
    const result = await this.applyCouponToCart.execute({ owner: resolveCartOwner(req), code });
    res.status(200).json(result);
  };

  removeCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const result = await this.removeCouponFromCart.execute(resolveCartOwner(req));
    res.status(200).json(result);
  };

  mergeHandler = async (req: Request, res: Response): Promise<void> => {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    if (!req.guestCartId) {
      const result = await this.getCart.execute({
        ownerType: CartOwnerType.USER,
        userId: req.authUser.sub,
        guestId: null,
      });
      res.status(200).json(result);
      return;
    }

    const result = await this.mergeGuestCartIntoUserCart.execute({
      guestId: req.guestCartId,
      userId: req.authUser.sub,
    });
    res.clearCookie("guest_cart_id", { httpOnly: true, sameSite: "lax", path: "/api/v1/cart" });
    res.status(200).json(result);
  };
}

function resolveCartOwner(req: Request): CartOwner {
  if (req.authUser) {
    return { ownerType: CartOwnerType.USER, userId: req.authUser.sub, guestId: null };
  }
  return { ownerType: CartOwnerType.GUEST, userId: null, guestId: req.guestCartId! };
}
