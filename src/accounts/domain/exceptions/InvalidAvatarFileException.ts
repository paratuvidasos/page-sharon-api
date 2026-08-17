import { DomainException } from "../../../shared-kernel/domain/exceptions/DomainException";

export class InvalidAvatarFileException extends DomainException {
  readonly code = "INVALID_AVATAR_FILE";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
