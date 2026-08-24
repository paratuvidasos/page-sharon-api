/**
 * Sin secuencia de base de datos: la constraint única existente en
 * `orders.order_number` es la red de seguridad ante una colisión, que es
 * extremadamente improbable con esta combinación de fecha + aleatorio.
 */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}
