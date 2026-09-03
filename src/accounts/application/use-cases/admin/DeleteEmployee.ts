import { STAFF_ROLES } from "../../../domain/enums/UserRole";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { LogoutAllSessions } from "../session/LogoutAllSessions";

/** Elimina el acceso de un miembro de staff (soft-delete) y cierra sus sesiones activas. */
export class DeleteEmployee {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logoutAllSessions: LogoutAllSessions,
  ) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user || !STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
      throw new UserNotFoundException();
    }

    await this.userRepository.softDelete(input.userId);
    await this.logoutAllSessions.execute({ userId: input.userId });
  }
}
