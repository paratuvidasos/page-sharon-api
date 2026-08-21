import { EmailMessage, EmailSender } from "../../domain/ports/EmailSender";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export class BrevoEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
    private readonly fromName: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromAddress },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brevo respondió ${response.status} al enviar el correo: ${body}`);
    }
  }
}
