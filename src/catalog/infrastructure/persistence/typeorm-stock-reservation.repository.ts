import { DataSource, EntityManager } from "typeorm";
import { StockReservationStatus } from "../../domain/enums/StockReservationStatus";
import { VariantOutOfStockException } from "../../domain/exceptions/VariantOutOfStockException";
import {
  StockReservationLine,
  StockReservationRepository,
} from "../../domain/repositories/StockReservationRepository";
import { StockReservationOrmEntity } from "./entities/StockReservationOrmEntity";

/**
 * Normaliza lo que devuelve `query()` para un `UPDATE ... RETURNING`.
 *
 * TypeORM no devuelve las filas directamente en ese caso: devuelve
 * `[filas, cantidadAfectada]`. Leerlo como si fuera el arreglo de filas es
 * silencioso y desastroso — `result.length` da 2 siempre (y nunca 0, así que
 * un "no alcanzó el stock" jamás se detectaría), y al iterarlo se obtienen el
 * arreglo interno y un número en vez de las filas.
 */
function returnedRows<T>(raw: unknown): T[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  // Forma [filas, cantidad] de UPDATE/DELETE ... RETURNING.
  if (raw.length === 2 && Array.isArray(raw[0]) && typeof raw[1] === "number") {
    return raw[0] as T[];
  }
  return raw as T[];
}

export class TypeOrmStockReservationRepository implements StockReservationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async hold(referenceId: string, lines: StockReservationLine[], expiresAt: Date): Promise<void> {
    if (lines.length === 0) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const failed: string[] = [];

      for (const line of lines) {
        // El descuento condicional es lo que hace segura la concurrencia: el
        // WHERE y el UPDATE ocurren en la misma sentencia atómica, así que
        // dos transacciones que se pelean la última unidad no pueden ganar
        // ambas. Leer el stock y después decidir sí permitiría sobreventa.
        const updated = returnedRows<{ id: string }>(
          await manager.query(
            `UPDATE product_variants
                SET stock_quantity = stock_quantity - $1
              WHERE id = $2 AND stock_quantity >= $1
              RETURNING id`,
            [line.quantity, line.variantId],
          ),
        );

        if (updated.length === 0) {
          failed.push(line.variantId);
          continue;
        }

        await manager.insert(StockReservationOrmEntity, {
          referenceId,
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          status: StockReservationStatus.HELD,
          expiresAt,
        });
      }

      if (failed.length > 0) {
        // El throw revierte la transacción entera, así que las líneas que sí
        // alcanzaron recuperan su stock: se aparta el pedido completo o
        // ninguna parte de él.
        throw new VariantOutOfStockException(failed);
      }
    });
  }

  async commit(referenceId: string): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(StockReservationOrmEntity)
      .set({ status: StockReservationStatus.COMMITTED, resolvedAt: () => "now()" })
      .where("reference_id = :referenceId AND status = :status", {
        referenceId,
        status: StockReservationStatus.HELD,
      })
      .execute();
  }

  async release(referenceId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.giveBackStock(
        manager,
        "reference_id = $1 AND status = $2",
        [referenceId, StockReservationStatus.HELD],
      );
    });
  }

  async releaseExpired(now: Date): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      return this.giveBackStock(
        manager,
        "status = $1 AND expires_at <= $2",
        [StockReservationStatus.HELD, now],
      );
    });
  }

  /**
   * Marca como liberadas las reservas que cumplen la condición y devuelve sus
   * unidades al stock.
   *
   * El UPDATE ... RETURNING hace de candado: solo las filas que esta
   * transacción logró pasar de HELD a RELEASED devuelven stock, así que dos
   * barridos simultáneos no pueden devolver las mismas unidades dos veces.
   */
  private async giveBackStock(
    manager: EntityManager,
    condition: string,
    params: unknown[],
  ): Promise<number> {
    const released = returnedRows<{ variant_id: string; quantity: number }>(
      await manager.query(
        `UPDATE stock_reservations
            SET status = '${StockReservationStatus.RELEASED}', resolved_at = now()
          WHERE ${condition}
          RETURNING variant_id, quantity`,
        params,
      ),
    );

    for (const row of released) {
      await manager.query(
        `UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
        [row.quantity, row.variant_id],
      );
    }

    return released.length;
  }
}
