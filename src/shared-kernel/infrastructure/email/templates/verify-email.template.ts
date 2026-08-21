import { escapeHtml } from "./escape-html";
import { renderEmailLayout } from "./email-layout";

export interface VerifyEmailTemplateInput {
  firstName: string;
  verificationUrl: string;
}

export function buildVerifyEmailTemplate(input: VerifyEmailTemplateInput): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(input.firstName);

  return {
    subject: "Verifica tu correo",
    html: renderEmailLayout({
      previewText: "Confirma tu cuenta para empezar tus hábitos con Sharon.",
      heading: "Confirma tu correo",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hola ${firstName},</p>
        <p style="margin:0;">Gracias por crear tu cuenta en Sharon. Confírmala haciendo clic en el botón de abajo para guardar tus datos, direcciones e historial de compras.</p>
      `,
      ctaLabel: "Verificar mi correo",
      ctaUrl: input.verificationUrl,
      footerNote: "Si no creaste esta cuenta, puedes ignorar este correo.",
    }),
  };
}
