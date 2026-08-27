import { Coupon } from "../entities/Coupon";

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;

  findByCode(code: string): Promise<Coupon | null>;

  /**
   * [0039]: incrementa el contador de usos con un UPDATE atómico, sin pasar
   * por el agregado. Dos pedidos que redimen el último uso del mismo cupón al
   * mismo tiempo no pueden leer ambos el mismo `redemptionsCount` y guardarlo
   * pisándose.
   */
  incrementRedemptions(code: string): Promise<void>;

  /**
   * [0061]: listado admin — tabla de bajo volumen, sin split CQ separado
   * (mismo criterio que `AttributeDefinitionRepository`).
   */
  findAll(pagination: { page: number; limit: number }): Promise<{ items: Coupon[]; total: number }>;
}
