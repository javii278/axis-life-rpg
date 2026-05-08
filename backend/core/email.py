import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")


def send_welcome_email(to_email: str, username: str) -> bool:
    """Envía el email de bienvenida tras registrarse."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"\n[DEV] Bienvenido a Axis, {username}! (no hay SMTP configurado)")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Bienvenido a Axis RPG — tu aventura comienza"
    msg["From"] = f"Axis RPG <{SMTP_USER}>"
    msg["To"] = to_email

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #e2e2f0; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 24px; margin-bottom: 4px;">AXIS<span style="color: #a78bfa;">.</span></h1>
      <p style="color: #6b7280; font-size: 13px; margin-top: 0;">The Life RPG</p>
      <hr style="border-color: #1e1e2e; margin: 24px 0;">
      <p>Hola <strong>{username}</strong>,</p>
      <p>Tu cuenta está lista. Cada hábito que completes hará crecer tu personaje con stats <em>reales</em> — sin trampa.</p>
      <p style="color: #9ca3af; font-size: 13px;">VIT · FOC · SAB · DIS · CRE · VOL</p>
      <a href="{APP_URL}/home"
         style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #7c3aed;
                color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Entrar a Axis →
      </a>
      <p style="color: #6b7280; font-size: 12px;">Si no te registraste tú, ignora este email.</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email error] {e}")
        return False


def send_reset_email(to_email: str, token: str, username: str) -> bool:
    """Envía el email de recuperación. Devuelve True si tiene éxito."""
    if not SMTP_USER or not SMTP_PASSWORD:
        # En dev sin SMTP configurado, imprime el enlace en consola
        print(f"\n[DEV] Enlace de recuperación para {username}:")
        print(f"  {APP_URL}/reset-password?token={token}\n")
        return True

    reset_url = f"{APP_URL}/reset-password?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Recupera tu contraseña — Axis RPG"
    msg["From"] = f"Axis RPG <{SMTP_USER}>"
    msg["To"] = to_email

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #e2e2f0; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 24px; margin-bottom: 4px;">AXIS<span style="color: #a78bfa;">.</span></h1>
      <p style="color: #6b7280; font-size: 13px; margin-top: 0;">The Life RPG</p>
      <hr style="border-color: #1e1e2e; margin: 24px 0;">
      <p>Hola <strong>{username}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo — el enlace expira en <strong>1 hora</strong>.</p>
      <a href="{reset_url}"
         style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #7c3aed;
                color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Restablecer contraseña →
      </a>
      <p style="color: #6b7280; font-size: 12px;">Si no solicitaste esto, ignora este email. Tu contraseña no cambiará.</p>
      <p style="color: #374151; font-size: 11px; margin-top: 32px;">Enlace directo: {reset_url}</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email error] {e}")
        return False
