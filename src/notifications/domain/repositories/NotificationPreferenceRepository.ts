import { NotificationPreference } from "../entities/NotificationPreference";

/**
 * [0044]: preferencias de canal.
 *
 * `findByUserId` devuelve `null` cuando la persona nunca las tocó; quien
 * llama aplica `NotificationPreference.defaultsFor`. No se crea una fila al
 * registrarse un usuario porque eso obligaría a `notifications` a escuchar el
 * alta de cuentas de `accounts` para algo que se resuelve con un valor por
 * defecto.
 */
export interface NotificationPreferenceRepository {
  findByUserId(userId: string): Promise<NotificationPreference | null>;

  save(preference: NotificationPreference): Promise<void>;
}
