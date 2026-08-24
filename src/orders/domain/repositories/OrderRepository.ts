import { Order } from "../entities/Order";

/**
 * Puerto de escritura del agregado `Order` (junto con sus `OrderItem`, que
 * no tienen repositorio propio — se persisten en la misma transacción de
 * `save`). Se mantiene separado del read model de `OrderQueryRepository`
 * porque no es una consulta, ver sección "Repository pattern" del CLAUDE.md
 * del repo.
 */
export interface OrderRepository {
  /**
   * Persiste un pedido recién colocado junto con sus ítems, en una sola
   * transacción.
   */
  save(order: Order): Promise<void>;

  /**
   * Anonimiza el snapshot de envío (nombre, teléfono y dirección) de todos
   * los pedidos de un usuario, conservando el resto del pedido (montos,
   * estado, método de pago) para efectos contables/legales.
   */
  anonymizeShippingSnapshotForUser(userId: string): Promise<void>;
}
