import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { AddProductToWishlist } from "../../application/use-cases/AddProductToWishlist";
import { CheckWishlistMembership } from "../../application/use-cases/CheckWishlistMembership";
import { ListWishlist } from "../../application/use-cases/ListWishlist";
import { RemoveProductFromWishlist } from "../../application/use-cases/RemoveProductFromWishlist";
import { AddToWishlistRequestSchema } from "./schemas/add-to-wishlist.schema";
import { ListWishlistQuerySchema } from "./schemas/list-wishlist.schema";
import "./schemas/remove-from-wishlist.schema";
import { WishlistMembershipQuerySchema } from "./schemas/wishlist-membership.schema";
import { WishlistProductIdParamsSchema } from "./schemas/wishlist-item-response.schema";

export class WishlistController {
  constructor(
    private readonly addProductToWishlist: AddProductToWishlist,
    private readonly removeProductFromWishlist: RemoveProductFromWishlist,
    private readonly listWishlist: ListWishlist,
    private readonly checkWishlistMembership: CheckWishlistMembership,
  ) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  add = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { productId } = AddToWishlistRequestSchema.parse(req.body);
    const result = await this.addProductToWishlist.execute({ userId, productId });
    res.status(201).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { productId } = WishlistProductIdParamsSchema.parse(req.params);
    await this.removeProductFromWishlist.execute({ userId, productId });
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = ListWishlistQuerySchema.parse(req.query);
    const result = await this.listWishlist.execute({ userId, page: query.page, limit: query.limit });
    res.status(200).json(result);
  };

  membership = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { productIds } = WishlistMembershipQuerySchema.parse(req.query);
    const result = await this.checkWishlistMembership.execute({ userId, productIds });
    res.status(200).json({ productIds: result });
  };
}
