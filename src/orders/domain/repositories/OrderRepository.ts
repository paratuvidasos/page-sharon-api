/**
 * Puerto de escritura para operaciones que no requieren hidratar el
 * agregado `Order` completo (que este módulo todavía no implementa —
 * hoy solo existe el read model de `OrderQueryRepository`). Se mantiene
 * separado de ese read model porque no es una consulta, ver sección
 * "Repository pattern" del CLAUDE.md del repo.
 */
export interface OrderRepository {
  /**
   * Anonimiza el snapshot de envío (nombre, teléfono y dirección) de todos
   * los pedidos de un usuario, conservando el resto del pedido (montos,
   * estado, método de pago) para efectos contables/legales.
   */
  anonymizeShippingSnapshotForUser(userId: string): Promise<void>;
}
