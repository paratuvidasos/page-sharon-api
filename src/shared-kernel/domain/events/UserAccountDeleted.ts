import { DomainEvent } from "./DomainEvent";

/**
 * Publicado por `accounts` cuando un usuario elimina su cuenta. Otros
 * módulos (p. ej. `orders`) lo escuchan para anonimizar su propia
 * información sin que `accounts` conozca ni acceda a sus tablas (ver
 * regla 2 y 3 de arquitectura del CLAUDE.md del repo).
 */
export class UserAccountDeleted implements DomainEvent {
  static readonly eventName = "accounts.user_account_deleted";
  readonly eventName = UserAccountDeleted.eventName;
  readonly occurredAt: Date;

  constructor(public readonly userId: string) {
    this.occurredAt = new Date();
  }
}
