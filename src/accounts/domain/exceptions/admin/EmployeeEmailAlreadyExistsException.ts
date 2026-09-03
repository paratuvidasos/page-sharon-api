import { DomainException } from "../../../../shared-kernel/domain/exceptions/DomainException";

export class EmployeeEmailAlreadyExistsException extends DomainException {
  readonly code = "EMPLOYEE_EMAIL_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor() {
    super("Ya existe una cuenta con este correo.");
  }
}
