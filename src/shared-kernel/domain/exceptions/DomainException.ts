export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }

  /**
   * Datos estructurados que acompañan al error en la respuesta HTTP.
   *
   * Existe para los errores en los que el mensaje solo no alcanza para que la
   * interfaz reaccione: "el precio de algunos productos cambió" obliga al
   * frontend a adivinar cuáles, mientras que la lista de líneas afectadas le
   * permite señalarlas ([0038]). Por defecto no hay detalles y la respuesta
   * queda igual que siempre.
   */
  details(): Record<string, unknown> | null {
    return null;
  }
}
