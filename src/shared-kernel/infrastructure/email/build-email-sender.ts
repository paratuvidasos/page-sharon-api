import { EmailSender } from "../../domain/ports/EmailSender";
import { BrevoEmailSender } from "./BrevoEmailSender";
import { ConsoleEmailSender } from "./ConsoleEmailSender";

export function buildEmailSender(): EmailSender {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return new ConsoleEmailSender();
  }

  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "no-reply@example.com";
  const fromName = process.env.EMAIL_FROM_NAME ?? "Sharon";

  return new BrevoEmailSender(apiKey, fromAddress, fromName);
}
