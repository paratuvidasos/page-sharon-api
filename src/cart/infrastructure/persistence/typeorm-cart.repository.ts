import { DataSource, Repository } from "typeorm";
import { Cart } from "../../domain/entities/Cart";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { CartOrmEntity } from "./entities/CartOrmEntity";
import { CartItemOrmEntity } from "./entities/CartItemOrmEntity";
import { CartMapper } from "./mappers/CartMapper";

export class TypeOrmCartRepository implements CartRepository {
  private readonly ormRepository: Repository<CartOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CartOrmEntity);
  }

  /**
   * No se deja el borrado de líneas quitadas en manos del cascade+orphan
   * removal de TypeORM sobre `items` (con la FK `cart_id` NOT NULL, el
   * orphan removal intenta primero un UPDATE poniéndola en null antes de
   * borrar, y eso rompe el constraint) — se maneja explícito: upsert de
   * las líneas vigentes + delete de las que ya no están, en una
   * transacción. `items` se deja `undefined` (no `[]`) al guardar el
   * carrito: TypeORM solo procesa la relación `OneToMany` cuando el valor
   * no es `undefined` (ver `OneToManySubjectBuilder`), así que dejarla sin
   * asignar es lo que evita que intente tocar `cart_items` por su cuenta.
   */
  async save(cart: Cart): Promise<void> {
    const orm = CartMapper.toOrm(cart);
    const items = orm.items;
    (orm as { items?: CartItemOrmEntity[] }).items = undefined;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(CartOrmEntity, orm);

      const existingItems = await manager.find(CartItemOrmEntity, {
        where: { cartId: cart.id },
        select: { id: true },
      });
      const newItemIds = new Set(items.map((item) => item.id));
      const idsToDelete = existingItems.map((item) => item.id).filter((id) => !newItemIds.has(id));

      if (idsToDelete.length > 0) {
        await manager.delete(CartItemOrmEntity, idsToDelete);
      }
      if (items.length > 0) {
        await manager.save(CartItemOrmEntity, items);
      }
    });
  }

  async findById(id: string): Promise<Cart | null> {
    const orm = await this.ormRepository.findOne({ where: { id }, relations: { items: true } });
    return orm ? CartMapper.toDomain(orm) : null;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const orm = await this.ormRepository.findOne({ where: { userId }, relations: { items: true } });
    return orm ? CartMapper.toDomain(orm) : null;
  }

  async findByGuestId(guestId: string): Promise<Cart | null> {
    const orm = await this.ormRepository.findOne({ where: { guestId }, relations: { items: true } });
    return orm ? CartMapper.toDomain(orm) : null;
  }

  async deleteByGuestId(guestId: string): Promise<void> {
    await this.ormRepository.delete({ guestId });
  }
}
