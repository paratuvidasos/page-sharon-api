const PALETTE = {
  cream: "#FBF7F2",
  cream2: "#F4EDE3",
  botanicDeep: "#5E7860",
  botanicMuted: "#DEE8DC",
  ink: "#1B1815",
  inkSoft: "#4A413A",
  gold: "#C9A876",
  line: "rgba(27,24,21,.08)",
};

const SERIF_FONT = "Georgia, 'Times New Roman', serif";
const SANS_FONT = "-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export interface EmailLayoutOptions {
  previewText: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}

export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sharon</title>
  </head>
  <body style="margin:0; padding:0; background-color:${PALETTE.cream};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${opts.previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PALETTE.cream}; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#FFFFFF; border:1px solid ${PALETTE.line}; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${PALETTE.cream2}; padding:28px 32px; text-align:center;">
                <span style="font-family:${SERIF_FONT}; font-size:22px; color:${PALETTE.ink}; letter-spacing:0.5px;">Sharon<span style="color:${PALETTE.gold};">.</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 8px; text-align:center;">
                <div style="width:56px; height:56px; margin:0 auto 20px; border-radius:50%; background-color:${PALETTE.botanicMuted}; line-height:56px; font-size:20px; color:${PALETTE.botanicDeep};">&#10003;</div>
                <h1 style="margin:0 0 16px; font-family:${SERIF_FONT}; font-size:24px; font-weight:normal; color:${PALETTE.ink};">${opts.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px; font-family:${SANS_FONT}; font-size:15px; line-height:1.6; color:${PALETTE.inkSoft}; text-align:center;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 40px; text-align:center;">
                <a href="${opts.ctaUrl}" style="display:inline-block; background-color:${PALETTE.botanicDeep}; color:${PALETTE.cream}; font-family:${SANS_FONT}; font-size:15px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:8px;">${opts.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <div style="border-top:1px solid ${PALETTE.line}; padding-top:20px; text-align:center;">
                  <p style="margin:0; font-family:${SANS_FONT}; font-size:12px; line-height:1.6; color:${PALETTE.inkSoft};">${opts.footerNote}</p>
                  <p style="margin:12px 0 0; font-family:${SANS_FONT}; font-size:12px; color:${PALETTE.inkSoft};">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                    <a href="${opts.ctaUrl}" style="color:${PALETTE.botanicDeep}; word-break:break-all;">${opts.ctaUrl}</a>
                  </p>
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0; font-family:${SANS_FONT}; font-size:12px; color:${PALETTE.inkSoft}; text-align:center;">
            © ${year} Sharon — Cuidado capilar premium
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
