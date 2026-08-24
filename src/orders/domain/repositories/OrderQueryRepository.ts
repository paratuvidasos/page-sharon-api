import { OrderStatus } from "../enums/OrderStatus";
import { PaymentMethod } from "../enums/PaymentMethod";

export interface OrderHistoryFilter {
  userId: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
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
