import smtplib
import os
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def send_test_email(to_email: str) -> dict:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        return {
            "sent": False,
            "message": "SMTP is not configured on the server. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables to enable email delivery.",
        }

    msg = MIMEText("This is a test notification from your VEHIQ fleet dashboard. Email delivery is working correctly.")
    msg["Subject"] = "VEHIQ — Test notification"
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        return {"sent": True, "message": f"Test email sent to {to_email}."}
    except Exception as e:
        return {"sent": False, "message": f"Failed to send email: {e}"}