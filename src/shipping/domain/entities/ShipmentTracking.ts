import { ShipmentTrackingStatus } from "../enums/ShipmentTrackingStatus";
import { InvalidShipmentTrackingException } from "../exceptions/InvalidShipmentTrackingException";

export interface ShipmentTrackingEvent {
  status: ShipmentTrackingStatus;
  description: string;
  location: string | null;
  occurredAt: Date;
}

export interface ShipmentTrackingProps {
  id: string;
  orderId: string;
  carrierCode: string;
  trackingNumber: string;
  status: ShipmentTrackingStatus;
  events: ShipmentTrackingEvent[];
  lastSyncedAt: Date | null;
  createdAt: Date;
}

export interface RegisterShipmentTrackingInput {
  id: string;
  orderId: string;
  carrierCode: string;
  trackingNumber: string;
  createdAt: Date;
}

/**
 * Agregado propio de `shipping`: el estado real que informa la
 * transportadora sobre un envío ya despachado ([0047]). No es una extensión
 * de `Order` — `orders` sigue siendo dueño de `order_status_history`; esto
 * es un historial paralelo, el de la transportadora, y vive en su propio
 * módulo (regla 4 del CLAUDE.md del repo).
 */
export class ShipmentTracking {
  private constructor(private props: ShipmentTrackingProps) {}

  static register(input: RegisterShipmentTrackingInput): ShipmentTracking {
    return new ShipmentTracking({
      id: input.id,
      orderId: input.orderId,
      carrierCode: normalize(input.carrierCode, "El código de la transportadora"),
      trackingNumber: normalize(input.trackingNumber, "El número de guía"),
      status: ShipmentTrackingStatus.PENDING,
      events: [],
      lastSyncedAt: null,
      createdAt: input.createdAt,
    });
  }

  static reconstitute(props: ShipmentTrackingProps): ShipmentTracking {
    return new ShipmentTracking(props);
  }

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get carrierCode(): string {
    return this.props.carrierCode;
  }

  get trackingNumber(): string {
    return this.props.trackingNumber;
  }

  get status(): ShipmentTrackingStatus {
    return this.props.status;
  }

  /** Reemplaza estado y eventos con lo último que informó la transportadora. */
  applySync(status: ShipmentTrackingStatus, events: ShipmentTrackingEvent[], syncedAt: Date): void {
    this.props.status = status;
    this.props.events = [...events];
    this.props.lastSyncedAt = syncedAt;
  }

  toProps(): ShipmentTrackingProps {
    return { ...this.props, events: this.props.events.map((event) => ({ ...event })) };
  }
}

function normalize(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidShipmentTrackingException(`${label} no puede estar vacío.`);
  }
  return trimmed;
}
