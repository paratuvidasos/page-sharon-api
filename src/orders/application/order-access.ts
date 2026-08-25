/**
 * Quién puede ver o accionar un pedido: su dueño autenticado, o el invitado
 * que pruebe el correo con el que lo hizo.
 *
 * Sin esto, el número de pedido sería una llave adivinable a los datos de
 * otra persona (dirección, teléfono, qué compró). Por eso, cuando la
 * verificación falla, los casos de uso responden "no existe" en vez de "no
 * tienes permiso": confirmar la existencia de un pedido ajeno ya es filtrar
 * información.
 */
export function canAccessOrder(
  orderUserId: string | null,
  orderGuestEmail: string | null,
  authUserId: string | null,
  providedEmail: string | null,
): boolean {
  if (orderUserId) {
    return authUserId === orderUserId;
  }
  return (
    orderGuestEmail != null &&
    providedEmail != null &&
    orderGuestEmail.toLowerCase() === providedEmail.toLowerCase()
  );
}
