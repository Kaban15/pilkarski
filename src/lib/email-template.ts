export function renderEmailHtml(
  title: string,
  message: string,
  ctaLabel: string,
  ctaUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#0ea5e9);padding:24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#fff;line-height:48px;">PS</div>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${escapeHtml(message)}</p>
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">PilkaSport — Platforma dla polskiego futbolu</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
