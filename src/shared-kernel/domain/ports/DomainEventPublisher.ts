import { DomainEvent } from "../events/DomainEvent";

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
