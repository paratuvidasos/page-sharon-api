import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { User } from "../../../domain/entities/User";
import { UserRole } from "../../../domain/enums/UserRole";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { EmployeeEmailAlreadyExistsException } from "../../../domain/exceptions/admin/EmployeeEmailAlreadyExistsException";
import { PasswordHasher } from "../../../domain/ports/PasswordHasher";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { Email } from "../../../domain/value-objects/Email";

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole.ADMIN | UserRole.EMPLOYEE;
  jobTitle: string | null;
}

export interface CreateEmployeeResult {
  id: string;
}

/**
 * Alta de un miembro de staff desde el panel administrativo. A diferencia del
 * registro de clientes (`RegisterUser`), acá el admin define la contraseña
 * inicial y la cuenta queda activa/verificada de una — no hay flujo de
 * verificación de correo para el staff.
 */
export class CreateEmployee {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateEmployeeInput): Promise<CreateEmployeeResult> {
    const email = Email.create(input.email);
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmployeeEmailAlreadyExistsException();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: generateId(),
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: null,
      avatarUrl: null,
      role: input.role,
      status: UserStatus.ACTIVE,
      jobTitle: input.jobTitle,
      emailVerifiedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      addresses: [],
      clerkUserId: null,
      preferredLocale: null,
      preferredCurrency: null,
    });

    await this.userRepository.save(user);

    return { id: user.id };
  }
}
