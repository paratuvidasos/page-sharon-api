import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { CartOwnerType } from "../../../domain/enums/CartOwnerType";
import { CartItemOrmEntity } from "./CartItemOrmEntity";

@Entity({ name: "carts" })
export class CartOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "owner_type", type: "enum", enum: CartOwnerType })
  ownerType!: CartOwnerType;

  @Column({ name: "user_id", type: "uuid", nullable: true, unique: true })
  @Index("ix_carts_user_id")
  userId!: string | null;

  @Column({ name: "guest_id", type: "uuid", nullable: true, unique: true })
  @Index("ix_carts_guest_id")
  guestId!: string | null;

  @Column({ name: "coupon_code", type: "varchar", length: 40, nullable: true })
  couponCode!: string | null;

  // Sin `cascade`: a diferencia de Product→ProductVariant en `catalog`
  // (que nunca quita variantes), `cart` sí necesita borrar líneas al
  // eliminar un ítem o vaciar el carrito, y el orphan removal por defecto
  // de TypeORM intenta un UPDATE a null en `cart_id` (NOT NULL) antes del
  // DELETE, lo que rompe el constraint. `TypeOrmCartRepository.save()`
  // maneja el upsert/delete de `cart_items` explícitamente en su lugar,
  // dejando esta relación solo para las lecturas (`relations: { items }`).
  @OneToMany(() => CartItemOrmEntity, (item) => item.cart)
  items!: CartItemOrmEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
