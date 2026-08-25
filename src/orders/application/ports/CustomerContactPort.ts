export interface CustomerContact {
  email: string;
  fullName: string;
}

/**
 * Correo y nombre del comprador con sesión iniciada.
 *
 * La pasarela los pide para el comprobante y para notificar al pagador, y el
 * pedido los necesita para el correo de confirmación ([0039]). Lo implementa
 * `accounts` con `GetProfile`.
 */
export interface CustomerContactPort {
  execute(input: { userId: string }): Promise<CustomerContact>;
}
