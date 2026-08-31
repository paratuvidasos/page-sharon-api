import { escapeHtml } from "./escape-html";
import { PALETTE, renderEmailLayout, SANS_FONT } from "./email-layout";

export interface OrderConfirmationLine {
  productName: string;
  sku: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderConfirmationData {
  orderNumber: string;
  currency: string;
  items: OrderConfirmationLine[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCost: number;
  shippingMethodLabel: string;
  total: number;
  shippingAddress: {
    recipientName: string;
    city: string;
    stateProvince: string;
    streetLine1: string;
    streetLine2: string | null;
  };
}

/**
 * [0039]: correo de confirmación de compra.
 *
 * Reutiliza `renderEmailLayout` para no duplicar la identidad visual de
 * Sharon (paleta, tipografías, estructura) que ya usan los correos de
 * verificación y de recuperación de contraseña. El resumen del pedido va en
 * el slot `detailsHtml`, agregado justamente para esto.
 *
 * Todo lo que viene de datos del pedido pasa por `escapeHtml`: el nombre de
 * un producto o de un destinatario puede traer comillas o signos que romperían
 * el marcado.
 */
export function renderOrderConfirmationEmail(order: OrderConfirmationData): string {
  const money = (amount: number): string => formatAmount(amount, order.currency);

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${PALETTE.line}; font-family:${SANS_FONT}; font-size:14px; color:${PALETTE.ink};">
            ${escapeHtml(item.productName)}
            <div style="font-size:12px; color:${PALETTE.inkSoft};">${escapeHtml(item.sku)} · x${item.quantity}</div>
          </td>
          <td style="padding:10px 0; border-bottom:1px solid ${PALETTE.line}; font-family:${SANS_FONT}; font-size:14px; color:${PALETTE.ink}; text-align:right; white-space:nowrap;">
            ${money(item.lineTotal)}
          </td>
        </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false): string => `
        <tr>
          <td style="padding:6px 0; font-family:${SANS_FONT}; font-size:${strong ? "16px" : "14px"}; color:${strong ? PALETTE.ink : PALETTE.inkSoft}; ${strong ? "font-weight:600;" : ""}">${label}</td>
          <td style="padding:6px 0; font-family:${SANS_FONT}; font-size:${strong ? "16px" : "14px"}; color:${strong ? PALETTE.ink : PALETTE.inkSoft}; text-align:right; white-space:nowrap; ${strong ? "font-weight:600;" : ""}">${value}</td>
        </tr>`;

  const discountRow =
    order.discount > 0
      ? totalRow(
          `Descuento${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}`,
          `−${money(order.discount)}`,
        )
      : "";

  const address = order.shippingAddress;
  const detailsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
      ${totalRow("Subtotal", money(order.subtotal))}
      ${discountRow}
      ${totalRow(escapeHtml(order.shippingMethodLabel), order.shippingCost === 0 ? "Gratis" : money(order.shippingCost))}
      ${totalRow("Total", `${escapeHtml(order.currency)} ${money(order.total)}`, true)}
    </table>
    <div style="margin-top:20px; padding:16px; background-color:${PALETTE.cream2}; border-radius:12px; font-family:${SANS_FONT}; font-size:13px; line-height:1.6; color:${PALETTE.inkSoft};">
      <strong style="color:${PALETTE.ink};">Envío a</strong><br />
      ${escapeHtml(address.recipientName)}<br />
      ${escapeHtml(address.streetLine1)}${address.streetLine2 ? `, ${escapeHtml(address.streetLine2)}` : ""}<br />
      ${escapeHtml(address.city)}, ${escapeHtml(address.stateProvince)}
    </div>`;

  return renderEmailLayout({
    previewText: `Tu pedido ${order.orderNumber} está confirmado.`,
    heading: "¡Gracias por tu compra!",
    bodyHtml: `<p style="margin:0;">Recibimos tu pago y ya estamos preparando tu pedido <strong>${escapeHtml(order.orderNumber)}</strong>. Te avisamos apenas salga para tu dirección.</p>`,
    detailsHtml,
    ctaLabel: "Ver mi pedido",
    ctaUrl: buildOrderUrl(order.orderNumber),
    footerNote: "Guarda este correo como constancia de tu compra.",
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);
}

function buildOrderUrl(orderNumber: string): string {
  const base = process.env.FRONTEND_URL ?? "http://localhost:5190";
  return `${base}/pedidos/${encodeURIComponent(orderNumber)}`;
}
