import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0066]: el banner que el panel quiere editar o borrar ya no existe. */
export class BannerNotFoundException extends DomainException {
  readonly code = "BANNER_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("El banner no existe.");
  }
}
