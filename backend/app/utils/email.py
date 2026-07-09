import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _build_otp_html(otp: str, purpose: str = "registration") -> str:
    action = "complete your registration" if purpose == "register" else "reset your password"
    return f"""
    <html>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px 24px;">
                  <p style="margin:0;font-size:28px;">🛡️</p>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">
                    CrimeVision
                  </h1>
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                    Karnataka State Police
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px 32px 24px;">
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">Hello Officer,</p>
                  <p style="color:#e2e8f0;font-size:15px;margin:0 0 24px;">
                    Use the OTP below to {action}. This code is valid for <strong style="color:#60a5fa;">10 minutes</strong>.
                  </p>
                  <!-- OTP Box -->
                  <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Your OTP</p>
                    <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#3b82f6;font-family:monospace;">
                      {otp}
                    </p>
                  </div>
                  <p style="color:#64748b;font-size:13px;margin:0;">
                    If you did not request this, please ignore this email. Do not share this OTP with anyone.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#0f172a;padding:20px 32px;border-top:1px solid #334155;text-align:center;">
                  <p style="margin:0;color:#475569;font-size:11px;">
                    © CrimeVision · Karnataka State Police · Unauthorized access is prohibited under the IT Act, 2000.
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


def send_otp_email(to_email: str, otp: str, purpose: str = "register"):
    """Sends a styled OTP email."""
    subject_map = {
        "register": "CrimeVision — Your Registration OTP",
        "reset": "CrimeVision — Your Password Reset OTP",
    }
    subject = subject_map.get(purpose, "CrimeVision — Your OTP")
    html_body = _build_otp_html(otp, purpose)
    return send_email(to_email, subject, html_body)


def send_email(to_email: str, subject: str, body: str):
    """
    Core email sender. Falls back to console printing in local dev mode (SMTP_SERVER=localhost).
    Supports Gmail SMTP (port 587 with STARTTLS) and standard SMTP servers.
    """
    if settings.SMTP_SERVER == "localhost":
        # Dev mode — print to console so developer can see the OTP
        print("========== EMAIL INTERCEPTED ==========")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print("=======================================")
        return True

    try:
        message = MIMEMultipart("alternative")
        message["From"] = settings.MAIL_FROM
        message["To"] = to_email
        message["Subject"] = subject
        # Attach as HTML if body looks like HTML, else plain text
        mime_type = "html" if body.strip().startswith("<") else "plain"
        message.attach(MIMEText(body, mime_type))

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)

        print(f"[EMAIL] Sent '{subject}' to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False

