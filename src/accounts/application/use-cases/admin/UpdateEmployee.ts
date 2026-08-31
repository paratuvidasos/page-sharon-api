import { STAFF_ROLES, UserRole } from "../../../domain/enums/UserRole";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface UpdateEmployeeInput {
  userId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  role: UserRole.ADMIN | UserRole.EMPLOYEE;
}

/** Edita nombre, puesto y rol de un miembro de staff existente. */
export class UpdateEmployee {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateEmployeeInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user || !STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
      throw new UserNotFoundException();
    }

    user.updateEmployeeProfile({
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle,
      role: input.role,
    });
    await this.userRepository.save(user);
  }
}
