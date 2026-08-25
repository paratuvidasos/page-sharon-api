/**
 * Re-export: el enum vive en `shared-kernel` desde la integración con Bold
 * ([0036]), porque `payments` lo comparte. Se mantiene este archivo para que
 * los imports existentes de `orders` sigan funcionando sin cambios.
 */
export { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
