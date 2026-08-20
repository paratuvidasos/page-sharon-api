import { DomainEvent } from "../../domain/events/DomainEvent";
import { DomainEventPublisher } from "../../domain/ports/DomainEventPublisher";

type DomainEventHandler = (event: DomainEvent) => Promise<void>;

/**
 * Bus de eventos de dominio en memoria: cada módulo se suscribe a los
 * eventos que le interesan en su propio composition root (su `*.module.ts`)
 * sin importar infraestructura de otros módulos (ver regla 2 y 3 de
 * arquitectura del CLAUDE.md del repo). Un handler que falla se registra en
 * logs pero no interrumpe a los demás suscriptores ni al publicador,
 * porque el publicador ya persistió su propio cambio y no debería
 * revertirlo por un efecto secundario de otro módulo.
 */
export class InMemoryDomainEventBus implements DomainEventPublisher {
  private readonly handlersByEventName = new Map<string, DomainEventHandler[]>();

  subscribe(eventName: string, handler: DomainEventHandler): void {
    const handlers = this.handlersByEventName.get(eventName) ?? [];
    handlers.push(handler);
    this.handlersByEventName.set(eventName, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlersByEventName.get(event.eventName) ?? [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`Error al procesar el evento "${event.eventName}":`, err);
      }
    }
  }
}

export const domainEventBus = new InMemoryDomainEventBus();
