import { Currency } from "../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../shared-kernel/domain/enums/PaymentMethod";
import {
  Order,
  OrderShipmentSnapshot,
  OrderStatusChange,
  ShippingAddressSnapshot,
} from "../domain/entities/Order";
import { OrderStatus } from "../domain/enums/OrderStatus";

export interface OrderSummaryLine {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: Currency;
  exchangeRate: number;
  items: OrderSummaryLine[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  shippingCost: number;
  shippingMethodCode: string;
  shippingMethodLabel: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string | null;
  paymentFailureMessage: string | null;
  shippingAddress: ShippingAddressSnapshot;
  /** [0047]: guía y transportadora. `null` hasta que el pedido se despacha. */
  shipment: OrderShipmentSnapshot | null;
  /** [0043]: historial de estados con la fecha de cada cambio. */
  statusHistory: OrderStatusChange[];
  placedAt: Date;
  paidAt: Date | null;
}

/**
 * DTO de salida del pedido, compartido por el checkout ([0038]), la pantalla
 * de confirmación ([0039]) y el reintento ([0040]), para que las tres
 * respondan exactamente la misma forma.
 *
 * Nunca expone la entidad de dominio ni la de TypeORM (regla 6 del CLAUDE.md
 * del repo), y deja fuera el correo del invitado: ya lo conoce quien hizo la
 * compra, y devolverlo abriría una fuga si alguien adivinara un número de
 * pedido.
 */
export function buildOrderSummary(order: Order): OrderSummary {
  const props = order.toProps();
  return {
    id: props.id,
    orderNumber: props.orderNumber,
    status: props.status,
    currency: props.currency,
    exchangeRate: props.exchangeRate,
    items: props.items,
    subtotal: props.subtotal,
    couponCode: props.couponCode,
    discount: props.discount,
    shippingCost: props.shippingCost,
    shippingMethodCode: props.shippingMethodCode,
    shippingMethodLabel: props.shippingMethodLabel,
    total: props.total,
    paymentMethod: props.paymentMethod,
    paymentMethodLabel: props.paymentMethodLabel,
    paymentFailureMessage: props.paymentFailureMessage,
    shippingAddress: props.shippingAddress,
    shipment: props.shipment,
    statusHistory: props.statusHistory,
    placedAt: props.placedAt,
    paidAt: props.paidAt,
  };
}
