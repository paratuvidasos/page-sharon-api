import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

/** [0063]: levanta el bloqueo temporal de una cuenta. */
export class ReactivateCustomer {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.reactivate();
    await this.userRepository.save(user);
  }
}
