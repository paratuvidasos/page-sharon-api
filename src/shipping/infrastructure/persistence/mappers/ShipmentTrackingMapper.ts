import { ShipmentTracking } from "../../../domain/entities/ShipmentTracking";
import { ShipmentTrackingOrmEntity } from "../entities/ShipmentTrackingOrmEntity";

export class ShipmentTrackingMapper {
  static toOrm(tracking: ShipmentTracking): ShipmentTrackingOrmEntity {
    const props = tracking.toProps();

    const orm = new ShipmentTrackingOrmEntity();
    orm.id = props.id;
    orm.orderId = props.orderId;
    orm.carrierCode = props.carrierCode;
    orm.trackingNumber = props.trackingNumber;
    orm.status = props.status;
    orm.events = props.events.map((event) => ({
      status: event.status,
      description: event.description,
      location: event.location,
      occurredAt: event.occurredAt.toISOString(),
    }));
    orm.lastSyncedAt = props.lastSyncedAt;
    orm.createdAt = props.createdAt;
    return orm;
  }

  static toDomain(orm: ShipmentTrackingOrmEntity): ShipmentTracking {
    return ShipmentTracking.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      carrierCode: orm.carrierCode,
      trackingNumber: orm.trackingNumber,
      status: orm.status,
      events: orm.events.map((event) => ({
        status: event.status,
        description: event.description,
        location: event.location,
        occurredAt: new Date(event.occurredAt),
      })),
      lastSyncedAt: orm.lastSyncedAt,
      createdAt: orm.createdAt,
    });
  }
}
