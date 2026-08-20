import { escapeHtml } from "./escape-html";
import { renderEmailLayout } from "./email-layout";

export interface AccountDeletedTemplateInput {
  firstName: string;
}

export function buildAccountDeletedTemplate(input: AccountDeletedTemplateInput): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(input.firstName);

  return {
    subject: "Tu cuenta fue eliminada",
    html: renderEmailLayout({
      previewText: "Confirmamos la eliminación de tu cuenta en Sharon.",
      heading: "Tu cuenta fue eliminada",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hola ${firstName},</p>
        <p style="margin:0;">Confirmamos que tu cuenta y tus datos personales fueron eliminados de Sharon, tal como lo solicitaste. Tu historial de pedidos se conserva de forma anonimizada únicamente para efectos contables y legales.</p>
      `,
      ctaLabel: "Visitar Sharon",
      ctaUrl: process.env.FRONTEND_URL ?? "",
      footerNote: "Si no solicitaste esta eliminación, contáctanos de inmediato para revisar tu cuenta.",
    }),
  };
}
