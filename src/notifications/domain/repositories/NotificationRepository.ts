import { Notification } from "../entities/Notification";

/** [0044]: puerto de escritura del buzón in-app. */
export interface NotificationRepository {
  save(notification: Notification): Promise<void>;

  findById(id: string): Promise<Notification | null>;

  /**
   * Marca como leídas todas las pendientes del usuario. Es un UPDATE masivo y
   * no un `save` por entidad a propósito: hidratar cientos de notificaciones
   * para ponerles una fecha sería trabajo puro sin ninguna invariante que
   * proteger.
   */
  markAllReadForUser(userId: string, readAt: Date): Promise<void>;
}
