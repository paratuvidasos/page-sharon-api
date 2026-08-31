import { CatalogSnapshotPort, OrderProductSnapshot } from "./ports/CatalogSnapshotPort";
import {
  ChangedPriceLine,
  CheckoutPriceChangedException,
} from "../domain/exceptions/CheckoutPriceChangedException";
import {
  CheckoutItemUnavailableException,
  UnavailableLine,
} from "../domain/exceptions/CheckoutItemUnavailableException";

export interface CheckoutLineInput {
  variantId: string;
  quantity: number;
  /**
   * Precio que el comprador vio en pantalla. Se usa **solo** para detectar
   * que cambió; el precio que se cobra siempre sale del catálogo.
   */
  expectedUnitPrice?: number;
}

export interface ValidatedLine {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

/**
 * [0038]: revalidación final de stock y precio, justo antes de cobrar.
 *
 * Es el corazón de la subtask "[BE] Validación final de stock y precio". El
 * precio unitario nunca se toma del body: se lee del catálogo. Lo que el
 * cliente manda solo sirve para detectar una discrepancia y avisarle antes de
 * cobrarle.
 *
 * Se acumulan todos los problemas antes de fallar, en vez de cortar en el
 * primero: al comprador le sirve más ver de una vez todo lo que tiene que
 * arreglar.
 */
export async function validateCheckoutLines(
  lines: CheckoutLineInput[],
  catalogSnapshotPort: CatalogSnapshotPort,
): Promise<ValidatedLine[]> {
  const snapshots = await catalogSnapshotPort.execute({
    variantIds: lines.map((line) => line.variantId),
  });
  const byVariantId = new Map<string, OrderProductSnapshot>(
    snapshots.map((snapshot) => [snapshot.variantId, snapshot]),
  );

  const unavailable: UnavailableLine[] = [];
  const priceChanged: ChangedPriceLine[] = [];
  const validated: ValidatedLine[] = [];

  for (const line of lines) {
    const snapshot = byVariantId.get(line.variantId);

    if (!snapshot || !snapshot.isActive || snapshot.stockQuantity < line.quantity) {
      unavailable.push({
        variantId: line.variantId,
        productName: snapshot?.productName ?? null,
        requestedQuantity: line.quantity,
        availableQuantity: snapshot?.isActive ? snapshot.stockQuantity : 0,
      });
      continue;
    }

    if (line.expectedUnitPrice != null && line.expectedUnitPrice !== snapshot.unitPrice) {
      priceChanged.push({
        variantId: line.variantId,
        productName: snapshot.productName,
        previousUnitPrice: line.expectedUnitPrice,
        currentUnitPrice: snapshot.unitPrice,
      });
      continue;
    }

    validated.push({
      productId: snapshot.productId,
      variantId: snapshot.variantId,
      productName: snapshot.productName,
      sku: snapshot.sku,
      unitPrice: snapshot.unitPrice,
      quantity: line.quantity,
    });
  }

  // La disponibilidad se reporta primero: de nada sirve avisar de un cambio
  // de precio en un producto que además se agotó.
  if (unavailable.length > 0) {
    throw new CheckoutItemUnavailableException(unavailable);
  }
  if (priceChanged.length > 0) {
    throw new CheckoutPriceChangedException(priceChanged);
  }

  return validated;
}
