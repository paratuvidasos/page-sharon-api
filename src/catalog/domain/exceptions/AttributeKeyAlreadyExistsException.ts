import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0058]: ya existe otro atributo con esa key — es lo que lo identifica. */
export class AttributeKeyAlreadyExistsException extends DomainException {
  readonly code = "ATTRIBUTE_KEY_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(key: string) {
    super(`Ya existe un atributo con la key "${key}".`);
  }
}
