import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

/** [0058]: el atributo que manda el panel administrativo no cumple sus invariantes. */
export class InvalidAttributeDefinitionException extends DomainException {
  readonly code = "INVALID_ATTRIBUTE_DEFINITION";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
