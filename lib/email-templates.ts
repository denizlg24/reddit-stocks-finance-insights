function wrapInLayout(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;">
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="font-size: 16px; font-weight: 600; color: #ffffff; letter-spacing: -0.01em;">Finance Insights</span>
              <span style="font-size: 12px; color: #666; margin-left: 12px;">AI-powered market analysis</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #555;">
              Finance Insights &mdash; Automated analysis from r/stocks
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verificationEmailHtml(url: string): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #ccc; line-height: 1.6;">
      Verify your email to complete your Finance Insights account setup.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #2dd4bf; border-radius: 2px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 13px; font-weight: 600; color: #0f0f0f; text-decoration: none; letter-spacing: 0.01em;">
            Verify Email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 16px 0 0; font-size: 12px; color: #666; line-height: 1.5;">
      If the button doesn&rsquo;t work, copy and paste this link into your browser:
    </p>
    <p style="margin: 8px 0 0; font-size: 12px; color: #888; word-break: break-all;">
      ${url}
    </p>`;

  return wrapInLayout("Verify your email", content);
}

export function analysisNotificationHtml(): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #ccc; line-height: 1.6;">
      Your weekly market analysis is ready.
    </p>
    <p style="margin: 0 0 24px; font-size: 13px; color: #999; line-height: 1.5;">
      See the attached PDF for the full report.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 16px;">
      <tr>
        <td style="background-color: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 2px; padding: 12px 20px;">
          <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Analysis Date</span>
          <br>
          <span style="font-size: 13px; color: #2dd4bf; font-weight: 600;">${today}</span>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
      This report was generated using AI-powered analysis of r/stocks discussions.
    </p>`;

  return wrapInLayout("Daily Market Analysis", content);
}
