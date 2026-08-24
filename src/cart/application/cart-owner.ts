import { Cart } from "../domain/entities/Cart";
import { CartOwnerType } from "../domain/enums/CartOwnerType";
import { CartRepository } from "../domain/repositories/CartRepository";
import { generateId } from "../../shared-kernel/infrastructure/ids/generate-id";

export interface CartOwner {
  ownerType: CartOwnerType;
  userId: string | null;
  guestId: string | null;
}

export async function findCartByOwner(cartRepository: CartRepository, owner: CartOwner): Promise<Cart | null> {
  return owner.ownerType === CartOwnerType.USER
    ? cartRepository.findByUserId(owner.userId!)
    : cartRepository.findByGuestId(owner.guestId!);
}

export async function getOrCreateCartByOwner(cartRepository: CartRepository, owner: CartOwner): Promise<Cart> {
  const existing = await findCartByOwner(cartRepository, owner);
  if (existing) {
    return existing;
  }
  return Cart.create({
    id: generateId(),
    ownerType: owner.ownerType,
    userId: owner.userId,
    guestId: owner.guestId,
  });
}
