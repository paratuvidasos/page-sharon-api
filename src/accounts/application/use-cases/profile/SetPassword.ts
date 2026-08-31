import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { PasswordHasher } from "../../../domain/ports/PasswordHasher";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface SetPasswordInput {
  userId: string;
  newPassword: string;
}

/**
 * Primera contraseña de una cuenta que llegó solo por Google (Clerk). El
 * dominio (`User.setInitialPassword`) rechaza la operación si la cuenta ya
 * tiene contraseña — para cambiarla existe el flujo normal de reset.
 */
export class SetPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: SetPasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    user.setInitialPassword(passwordHash);
    await this.userRepository.save(user);
  }
}
