import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidMoneyAmountException extends DomainException {
  readonly code = "INVALID_MONEY_AMOUNT";
  readonly statusCode = 400;

  constructor(amount: number) {
    super(`El monto "${amount}" no es un valor monetario válido.`);
  }
}
