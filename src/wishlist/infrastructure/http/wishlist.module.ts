import { Router } from "express";
import { DataSource } from "typeorm";
import { UserAccountDeleted } from "../../../shared-kernel/domain/events/UserAccountDeleted";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { AddProductToWishlist } from "../../application/use-cases/AddProductToWishlist";
import { CheckWishlistMembership } from "../../application/use-cases/CheckWishlistMembership";
import { ListWishlist } from "../../application/use-cases/ListWishlist";
import { RemoveAllWishlistItemsForUser } from "../../application/use-cases/RemoveAllWishlistItemsForUser";
import { RemoveProductFromWishlist } from "../../application/use-cases/RemoveProductFromWishlist";
import { TypeOrmWishlistItemRepository } from "../persistence/typeorm-wishlist-item.repository";
import { TypeOrmWishlistQueryRepository } from "../persistence/typeorm-wishlist-query.repository";
import { WishlistController } from "./wishlist.controller";
import { buildWishlistRoutes } from "./wishlist.routes";

export function buildWishlistModule(dataSource: DataSource): Router {
  const wishlistItemRepository = new TypeOrmWishlistItemRepository(dataSource);
  const wishlistQueryRepository = new TypeOrmWishlistQueryRepository(dataSource);

  const addProductToWishlist = new AddProductToWishlist(wishlistItemRepository);
  const removeProductFromWishlist = new RemoveProductFromWishlist(wishlistItemRepository);
  const listWishlist = new ListWishlist(wishlistQueryRepository);
  const checkWishlistMembership = new CheckWishlistMembership(wishlistQueryRepository);
  const controller = new WishlistController(
    addProductToWishlist,
    removeProductFromWishlist,
    listWishlist,
    checkWishlistMembership,
  );

  const removeAllWishlistItemsForUser = new RemoveAllWishlistItemsForUser(wishlistItemRepository);
  domainEventBus.subscribe(UserAccountDeleted.eventName, async (event) => {
    await removeAllWishlistItemsForUser.execute({ userId: (event as UserAccountDeleted).userId });
  });

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);

  return buildWishlistRoutes(controller, authenticate);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}
