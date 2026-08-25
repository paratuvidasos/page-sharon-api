/**
 * [0039]: vacía el carrito del comprador cuando su pago se aprueba.
 *
 * Solo por usuario autenticado: el carrito de invitado se identifica con una
 * cookie httpOnly scopeada a `/api/v1/cart`, que no llega al webhook de la
 * pasarela. El frontend vacía el suyo al ver la confirmación.
 */
export interface ClearCartPort {
  execute(input: { userId: string }): Promise<void>;
}
