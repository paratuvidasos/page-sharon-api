import { escapeHtml } from "./escape-html";
import { PALETTE, renderEmailLayout, SANS_FONT } from "./email-layout";

export interface OrderStatusEmailData {
  orderNumber: string;
  /** Texto ya en lenguaje de usuario ("Tu pedido va en camino"). */
  heading: string;
  message: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  orderUrl: string;
}

/**
 * [0044]: correo de cambio de estado del envío.
 *
 * Reutiliza `renderEmailLayout` para no duplicar la identidad visual de
 * Sharon, igual que el correo de confirmación ([0039]). La guía va en el slot
 * `detailsHtml` y solo aparece cuando existe: un bloque "número de guía:
 * (vacío)" en un correo de "estamos preparando tu pedido" es peor que no tener
 * el bloque.
 *
 * Todo lo que viene de datos del pedido pasa por `escapeHtml`.
 */
export function renderOrderStatusEmail(data: OrderStatusEmailData): string {
  const detailsHtml = data.trackingNumber
    ? `
    <div style="padding:16px; background-color:${PALETTE.cream2}; border-radius:12px; font-family:${SANS_FONT}; font-size:13px; line-height:1.7; color:${PALETTE.inkSoft};">
      <strong style="color:${PALETTE.ink};">Datos de tu envío</strong><br />
      ${data.carrierName ? `Transportadora: ${escapeHtml(data.carrierName)}<br />` : ""}
      Número de guía: <strong style="color:${PALETTE.ink};">${escapeHtml(data.trackingNumber)}</strong>
      ${
        data.trackingUrl
          ? `<br /><a href="${escapeHtml(data.trackingUrl)}" style="color:${PALETTE.botanicDeep};">Rastrear con la transportadora</a>`
          : ""
      }
    </div>`
    : undefined;

  return renderEmailLayout({
    previewText: `Novedades de tu pedido ${data.orderNumber}.`,
    heading: data.heading,
    bodyHtml: `<p style="margin:0;">${escapeHtml(data.message)}</p>`,
    detailsHtml,
    ctaLabel: "Ver mi pedido",
    ctaUrl: data.orderUrl,
    footerNote: "Podés cambiar por qué canal te avisamos desde tu perfil.",
  });
}
