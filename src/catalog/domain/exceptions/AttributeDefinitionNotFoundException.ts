import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0058]: el atributo que el panel quiere editar o borrar ya no existe. */
export class AttributeDefinitionNotFoundException extends DomainException {
  readonly code = "ATTRIBUTE_DEFINITION_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("El atributo no existe.");
  }
}
