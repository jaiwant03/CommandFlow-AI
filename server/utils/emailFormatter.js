/**
 * Email Formatter Utility
 * Formats email content into clean, professional, well-structured Plain Text and HTML.
 * Eliminates congested run-on walls of text and guarantees generous line gaps,
 * paragraph spacing, clear salutation separation, and elegant sign-off in Gmail.
 */

function formatEmailContent({ subject = 'CommandFlow AI Notification', content = '', htmlContent = '', senderName = 'Jaiwant Karrun' }) {
  // If htmlContent is already a rich HTML document, check if it needs paragraph enhancement
  let rawText = (content || '').trim();

  if (!rawText && htmlContent) {
    rawText = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }

  // 1. Separate Salutation
  let salutation = '';
  let bodyText = rawText;

  const salutationRegex = /^((?:Dear|Respected|Hi|Hello|Hey|Good\s+(?:morning|afternoon|evening)|To\s+whom\s+it\s+may\s+concern)[^\n,:]*[,:])\s*/i;
  const salutationMatch = bodyText.match(salutationRegex);
  if (salutationMatch) {
    salutation = salutationMatch[1].trim();
    bodyText = bodyText.substring(salutationMatch[0].length).trim();
  } else {
    salutation = 'Dear Sir/Madam,';
  }

  // 2. Separate Sign-off / Signature
  let signoffClosing = 'Regards,';
  let signoffName = senderName;

  const signoffRegex = /(?:\n\s*|\.\s+)((?:Regards|Warm regards|Best regards|Kind regards|With regards|Yours sincerely|Yours faithfully|Sincerely|Thanks & Regards|Thanks and regards|Yours truly)[,\s]*([\s\S]*))$/i;
  let signoffMatch = bodyText.match(signoffRegex);
  
  if (!signoffMatch) {
    const thankYouSignoff = /(?:\n\s*)((?:Thank you|Thanks)[,\s]*\n+[\s\S]+)$/i;
    signoffMatch = bodyText.match(thankYouSignoff);
  }

  if (signoffMatch) {
    const fullSignoff = signoffMatch[1].trim();
    bodyText = bodyText.substring(0, bodyText.lastIndexOf(signoffMatch[1])).trim().replace(/\.$/, '.');

    const signoffLines = fullSignoff.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (signoffLines.length >= 2) {
      signoffClosing = signoffLines[0].replace(/,+$/, '') + ',';
      signoffName = signoffLines.slice(1).join('\n');
    } else if (signoffLines.length === 1) {
      const parts = signoffLines[0].split(/,\s*/);
      if (parts.length >= 2) {
        signoffClosing = parts[0] + ',';
        signoffName = parts.slice(1).join(' ') || senderName;
      } else {
        signoffClosing = signoffLines[0].replace(/,+$/, '') + ',';
      }
    }
  }

  // 3. Extract and balance body paragraphs
  let paragraphs = [];

  if (bodyText.includes('\n\n')) {
    paragraphs = bodyText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  } else if (bodyText.includes('\n')) {
    paragraphs = bodyText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  } else {
    // If text is a monolithic run-on wall of text, split by sentences (2-3 sentences per paragraph)
    const sentences = (bodyText.match(/[^.!?]+(?:[.!?]+|$)/g) || [bodyText])
      .map(s => s.trim())
      .filter(Boolean);

    let current = [];
    for (const sentence of sentences) {
      current.push(sentence);
      // Group 2 sentences per paragraph, or break if paragraph length exceeds 200 chars
      const currentLength = current.join(' ').length;
      if (current.length >= 2 || currentLength >= 220) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    }
    if (current.length > 0) {
      paragraphs.push(current.join(' '));
    }
  }

  if (paragraphs.length === 0 && bodyText) {
    paragraphs = [bodyText];
  }

  // 4. Generate structured Plain Text (always has clean double line-breaks)
  const plainText = [
    salutation,
    '',
    ...paragraphs.flatMap(p => [p, '']),
    signoffClosing,
    signoffName
  ].join('\n').trim();

  // 5. Generate executive HTML Email Template for Gmail (mobile + desktop)
  const paragraphsHtml = paragraphs.map(p => 
    `<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.75; color: #334155; -webkit-font-smoothing: antialiased;">${p.replace(/\n/g, '<br/>')}</p>`
  ).join('');

  const signoffHtml = `
    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #e2e8f0; font-size: 15px; line-height: 1.6; color: #334155;">
      <div style="margin-bottom: 4px; color: #64748b; font-weight: 500;">${signoffClosing}</div>
      <div style="font-weight: 600; color: #0f172a; font-size: 15px;">${signoffName.replace(/\n/g, '<br/>')}</div>
    </div>
  `.trim();

  const formattedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 28px 12px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); overflow: hidden; margin: 0 auto; text-align: left;">
          <!-- Top Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 20px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">CommandFlow AI</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Communication</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Letter Body -->
          <tr>
            <td style="padding: 32px 28px 24px 28px; background-color: #ffffff;">
              <!-- Salutation -->
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; line-height: 1.6; color: #0f172a;">
                ${escapeHtml(salutation)}
              </p>

              <!-- Body Paragraphs with generous line gap and line height -->
              ${paragraphsHtml}

              <!-- Sign-off -->
              ${signoffHtml}
            </td>
          </tr>

          <!-- Bottom Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; line-height: 1.5; color: #94a3b8;">
              Dispatched automatically via <strong style="color: #2563eb;">CommandFlow AI Platform</strong>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return {
    plainText,
    html: formattedHtml,
    paragraphs,
    salutation,
    signoff: `${signoffClosing}\n${signoffName}`
  };
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  formatEmailContent
};
