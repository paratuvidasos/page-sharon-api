import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { Order } from "../../../domain/entities/Order";
import { OrderItemOrmEntity } from "../entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "../entities/OrderOrmEntity";

export class OrderMapper {
  static toOrm(order: Order): { order: OrderOrmEntity; items: OrderItemOrmEntity[] } {
    const props = order.toProps();

    const orderOrm = new OrderOrmEntity();
    orderOrm.id = props.id;
    orderOrm.userId = props.userId;
    orderOrm.guestEmail = props.guestEmail;
    orderOrm.orderNumber = props.orderNumber;
    orderOrm.status = props.status;
    orderOrm.currency = props.currency;
    orderOrm.subtotal = props.subtotal.toFixed(2);
    orderOrm.shippingCost = props.shippingCost.toFixed(2);
    orderOrm.total = props.total.toFixed(2);
    orderOrm.paymentMethod = props.paymentMethod;
    orderOrm.paymentMethodLabel = props.paymentMethodLabel;
    orderOrm.shippingRecipientName = props.shippingAddress.recipientName;
    orderOrm.shippingPhone = props.shippingAddress.phone;
    orderOrm.shippingCountryCode = props.shippingAddress.countryCode;
    orderOrm.shippingStateProvince = props.shippingAddress.stateProvince;
    orderOrm.shippingCity = props.shippingAddress.city;
    orderOrm.shippingPostalCode = props.shippingAddress.postalCode;
    orderOrm.shippingStreetLine1 = props.shippingAddress.streetLine1;
    orderOrm.shippingStreetLine2 = props.shippingAddress.streetLine2;
    orderOrm.placedAt = props.placedAt;

    const itemsOrm = props.items.map((item) => {
      const itemOrm = new OrderItemOrmEntity();
      itemOrm.id = generateId();
      itemOrm.orderId = props.id;
      itemOrm.productId = item.productId;
      itemOrm.productName = item.productName;
      itemOrm.sku = item.sku;
      itemOrm.unitPrice = item.unitPrice.toFixed(2);
      itemOrm.quantity = item.quantity;
      itemOrm.lineTotal = item.lineTotal.toFixed(2);
      return itemOrm;
    });

    return { order: orderOrm, items: itemsOrm };
  }

  static toDomain(orderOrm: OrderOrmEntity, itemsOrm: OrderItemOrmEntity[]): Order {
    return Order.reconstitute({
      id: orderOrm.id,
      userId: orderOrm.userId,
      guestEmail: orderOrm.guestEmail,
      orderNumber: orderOrm.orderNumber,
      status: orderOrm.status,
      currency: orderOrm.currency,
      items: itemsOrm.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      subtotal: Number(orderOrm.subtotal),
      shippingCost: Number(orderOrm.shippingCost),
      total: Number(orderOrm.total),
      paymentMethod: orderOrm.paymentMethod,
      paymentMethodLabel: orderOrm.paymentMethodLabel,
      shippingAddress: {
        recipientName: orderOrm.shippingRecipientName,
        phone: orderOrm.shippingPhone,
        countryCode: orderOrm.shippingCountryCode,
        stateProvince: orderOrm.shippingStateProvince,
        city: orderOrm.shippingCity,
        postalCode: orderOrm.shippingPostalCode,
        streetLine1: orderOrm.shippingStreetLine1,
        streetLine2: orderOrm.shippingStreetLine2,
      },
      placedAt: orderOrm.placedAt,
    });
  }
}
