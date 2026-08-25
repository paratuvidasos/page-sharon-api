import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface GetCustomerContactInput {
  userId: string;
}

export interface GetCustomerContactResult {
  email: string;
  fullName: string;
}

/**
 * Correo y nombre completo del comprador, para la pasarela de pago y para el
 * correo de confirmación ([0036] y [0039]).
 *
 * Existe aparte de `GetProfile` porque `orders` no necesita —ni debe recibir—
 * el perfil entero (avatar, rol, teléfono): un puerto que expone lo mínimo
 * es más difícil de convertir sin querer en una fuga de datos del usuario.
 */
export class GetCustomerContact {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetCustomerContactInput): Promise<GetCustomerContactResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const props = user.toProps();
    return {
      email: props.email.toString(),
      fullName: `${props.firstName} ${props.lastName}`.trim(),
    };
  }
}
