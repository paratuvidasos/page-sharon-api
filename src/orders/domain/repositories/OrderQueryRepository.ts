import { OrderStatus } from "../enums/OrderStatus";
import { PaymentMethod } from "../enums/PaymentMethod";

export interface OrderHistoryFilter {
  userId: string;
  /**
   * Correo de la cuenta. Se usa para recuperar los pedidos que la persona
   * hizo como invitado con ese mismo correo antes de tener sesión: son suyos
   * aunque no lleven su user_id.
   */
  userEmail: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  /**
   * [0046]: solo pedidos que ya salieron. Es lo que respalda la pestaña
   * "envíos" del perfil, que no es lo mismo que el historial de compras: un
   * pedido pagado que todavía no se despachó no es un envío.
   */
  onlyShipped?: boolean;
}

export interface OrderHistoryPagination {
  page: number;
  limit: number;
}

export interface OrderHistoryItemLine {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryShippingAddress {
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  streetLine1: string;
  streetLine2: string | null;
}

/** [0046]: datos del despacho, `null` mientras el pedido no haya salido. */
export interface OrderHistoryShipment {
  carrierCode: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
  shippedAt: Date;
  deliveredAt: Date | null;
}

export interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: Date;
  currency: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  shippingAddress: OrderHistoryShippingAddress;
  /** [0046]: sin el método, el historial no puede decir *cómo* se envió cada pedido. */
  shippingMethodCode: string;
  shippingMethodLabel: string;
  shipment: OrderHistoryShipment | null;
  items: OrderHistoryItemLine[];
}

export interface OrderHistoryPage {
  items: OrderHistoryItem[];
  total: number;
}

/**
 * Read model de solo lectura para el historial de pedidos — devuelve un DTO
 * plano en vez del agregado Order completo (ver sección "Queries" del
 * CLAUDE.md del repo).
 */
export interface OrderQueryRepository {
  listForUserHistory(
    filter: OrderHistoryFilter,
    pagination: OrderHistoryPagination,
  ): Promise<OrderHistoryPage>;

  /**
   * [0021]: puerto que `aftersales` consume (vía el caso de uso
   * `HasUserPurchasedProduct` expuesto por `orders`) para exigir compra
   * verificada antes de aceptar una reseña — ver regla 2 del CLAUDE.md del
   * repo. Cuenta cualquier pedido que no esté cancelado/reembolsado (no solo
   * los "confirmados" tipo PAID/DELIVERED): hoy no existe ningún flujo de
   * pago/cumplimiento implementado, así que un pedido recién colocado se
   * queda en PENDING indefinidamente — restringir a estados posteriores
   * dejaría "compra verificada" inalcanzable en la práctica.
   */
  hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
}
