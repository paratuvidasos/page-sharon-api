import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";
import { UserStatus } from "../enums/UserStatus";

/** [0063]: la cuenta no puede pasar de su estado actual al que pide el panel. */
export class InvalidUserStatusTransitionException extends DomainException {
  readonly code = "INVALID_USER_STATUS_TRANSITION";
  readonly statusCode = 409;

  constructor(from: UserStatus, to: UserStatus) {
    super(`La cuenta no puede pasar de ${from} a ${to}.`);
  }
}
