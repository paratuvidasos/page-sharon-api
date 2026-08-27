import { escapeHtml } from "./escape-html";
import { PALETTE, renderEmailLayout, SANS_FONT } from "./email-layout";

export interface ReviewRejectedEmailData {
  reason: string;
  catalogUrl: string;
}

/**
 * [0064]: correo al cliente cuando el admin rechaza su reseña, con el
 * motivo — "el cliente que dejó la reseña puede ser notificado si su
 * reseña fue rechazada, con el motivo" (AC).
 */
export function renderReviewRejectedEmail(data: ReviewRejectedEmailData): string {
  const detailsHtml = `
    <div style="padding:16px; background-color:${PALETTE.cream2}; border-radius:12px; font-family:${SANS_FONT}; font-size:13px; line-height:1.7; color:${PALETTE.inkSoft};">
      <strong style="color:${PALETTE.ink};">Motivo</strong><br />
      ${escapeHtml(data.reason)}
    </div>`;

  return renderEmailLayout({
    previewText: "Tu reseña no fue publicada.",
    heading: "Tu reseña no fue publicada",
    bodyHtml: `<p style="margin:0;">Revisamos la reseña que dejaste y decidimos no publicarla.</p>`,
    detailsHtml,
    ctaLabel: "Ver el catálogo",
    ctaUrl: data.catalogUrl,
    footerNote: "Si creés que esto es un error, podés escribirnos.",
  });
}
