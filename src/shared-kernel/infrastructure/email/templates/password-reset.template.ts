import { escapeHtml } from "./escape-html";
import { renderEmailLayout } from "./email-layout";

export interface PasswordResetTemplateInput {
  firstName: string;
  resetUrl: string;
}

export function buildPasswordResetTemplate(input: PasswordResetTemplateInput): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(input.firstName);

  return {
    subject: "Restablece tu contraseña",
    html: renderEmailLayout({
      previewText: "Restablece la contraseña de tu cuenta en Sharon.",
      heading: "Restablece tu contraseña",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hola ${firstName},</p>
        <p style="margin:0;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para elegir una nueva.</p>
      `,
      ctaLabel: "Restablecer contraseña",
      ctaUrl: input.resetUrl,
      footerNote: "Si no solicitaste este cambio, ignora este correo — tu contraseña actual sigue siendo válida.",
    }),
  };
}
