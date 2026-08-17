import { EmailMessage, EmailSender } from "../../domain/ports/EmailSender";

export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log("--- EMAIL (dev, no se envía de verdad) ---");
    console.log(`Para: ${message.to}`);
    console.log(`Asunto: ${message.subject}`);
    console.log(message.html);
    console.log("-------------------------------------------");
  }
}
