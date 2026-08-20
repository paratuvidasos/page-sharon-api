import { User } from "../entities/User";
import { Email } from "../value-objects/Email";

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  deleteAddress(addressId: string): Promise<void>;
  /**
   * Borra todas las direcciones del usuario. El soft-delete de `users` no
   * dispara el `ON DELETE CASCADE` de `user_addresses` (esa constraint solo
   * reacciona a un DELETE físico), así que la eliminación de cuenta debe
   * limpiar las direcciones explícitamente para no dejar PII huérfana.
   */
  deleteAllAddresses(userId: string): Promise<void>;
  /**
   * Soft-delete: marca `deletedAt` para que el usuario deje de aparecer en
   * los `find()` normales y su email quede libre para reuso (ver índice
   * único condicional en UserOrmEntity). Se llama después de anonimizar y
   * guardar los datos del usuario, nunca antes.
   */
  softDelete(userId: string): Promise<void>;
}
