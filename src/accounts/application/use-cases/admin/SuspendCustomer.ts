import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { LogoutAllSessions } from "../session/LogoutAllSessions";

/**
 * [0063]: bloqueo temporal de una cuenta ante actividad sospechosa. Cierra
 * también sus sesiones activas — dejar una sesión ya abierta viva mientras
 * la cuenta está "bloqueada" sería un hueco de seguridad real, sobre todo
 * porque el motivo típico de suspender es justamente actividad sospechosa
 * (decisión confirmada con el usuario).
 */
export class SuspendCustomer {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logoutAllSessions: LogoutAllSessions,
  ) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.suspend();
    await this.userRepository.save(user);
    await this.logoutAllSessions.execute({ userId: input.userId });
  }
}
