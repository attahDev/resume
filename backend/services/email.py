

import os
import logging
import resend
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

# Resend SDK uses the API key from env automatically if set,
# but we set it explicitly for clarity.
resend.api_key = os.getenv("RESEND_API_KEY", "")

EMAIL_FROM   = os.getenv("EMAIL_FROM",   "ResumeAI <noreply@resumeai.onrender.com>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://resumeai-frontend.onrender.com")


def _reset_email_html(reset_url: str) -> str:

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password — ResumeAI</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#111;border:1px solid #1a1a1a;border-radius:4px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #1a1a1a;">
              <span style="font-size:20px;font-weight:900;color:#00FF87;letter-spacing:-0.01em;">
                ResumeAI_
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f0f0f0;line-height:1.3;">
                Reset your password
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#888;line-height:1.7;">
                We received a request to reset the password for your ResumeAI account.
                Click the button below to choose a new password.
                This link expires in <strong style="color:#f0f0f0;">15 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#00FF87;border-radius:2px;">
                    <a href="{reset_url}"
                       style="display:inline-block;padding:13px 28px;font-size:13px;
                              font-weight:700;color:#000;text-decoration:none;
                              letter-spacing:0.06em;font-family:monospace;">
                      RESET PASSWORD →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:11px;color:#00FF87;word-break:break-all;
                         font-family:monospace;background:#0d1a13;padding:10px 12px;border-radius:2px;">
                {reset_url}
              </p>

              <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password won't change until you click the link above.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">
                ResumeAI · Built for African tech professionals<br/>
                Lagos · Nairobi · Accra · Cape Town
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
"""


async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send a password reset email via Resend.
    Returns True on success, False on failure (never raises — caller logs).
    """
    if not resend.api_key:
        logger.error("RESEND_API_KEY not set — cannot send reset email")
        return False

    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    try:
        params = {
            "from":    EMAIL_FROM,
            "to":      [to_email],
            "subject": "Reset your ResumeAI password",
            "html":    _reset_email_html(reset_url),
        }
        response = resend.Emails.send(params)
        logger.info(f"Reset email sent to {to_email} — id: {response.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {to_email}: {e}")
        return False