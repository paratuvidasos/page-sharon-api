import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidSkuException extends DomainException {
  readonly code = "INVALID_SKU";
  readonly statusCode = 400;

  constructor(sku: string) {
    super(`El SKU "${sku}" no es válido.`);
  }
}
