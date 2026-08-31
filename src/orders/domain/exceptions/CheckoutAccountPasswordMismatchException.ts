import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/**
 * El correo del checkout ya tiene cuenta, y la contraseña que se escribió no
 * es la de esa cuenta.
 *
 * Antes esto era un EMAIL_ALREADY_REGISTERED seco que mataba la compra:
 * había que abandonar el checkout, ir a iniciar sesión y volver a armar todo.
 * Ahora solo se llega acá cuando de verdad no se pudo entrar a la cuenta, y
 * el mensaje dice qué hacer.
 */
export class CheckoutAccountPasswordMismatchException extends DomainException {
  readonly code = "CHECKOUT_ACCOUNT_PASSWORD_MISMATCH";
  readonly statusCode = 409;

  constructor() {
    super(
      "Ya tienes una cuenta con ese correo, pero la contraseña no coincide. " +
        "Inicia sesión para continuar con tu compra, o compra como invitado con otro correo.",
    );
  }
}
