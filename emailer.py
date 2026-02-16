from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from models import Digest

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent / "templates"


def render_html(digest: Digest) -> str:
    """Render the digest as HTML using the Jinja2 template."""
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("digest.html")
    return template.render(digest=digest)


def render_plaintext(digest: Digest) -> str:
    """Render a plaintext fallback of the digest."""
    lines = [
        f"AI NEWS DIGEST - {digest.generated_at.strftime('%B %d, %Y')}",
        f"{digest.total_items} items from {digest.sources_checked} sources",
        "",
        "TL;DR",
        digest.intro_summary,
        "",
    ]
    for section in digest.sections:
        lines.append(f"--- {section.title} ---")
        for item in section.items:
            lines.append(f"  [{item.source_name}] {item.title}")
            lines.append(f"  {item.url}")
            if item.summary:
                lines.append(f"  {item.summary}")
            lines.append("")
    return "\n".join(lines)


def send_digest(digest: Digest, config: dict) -> None:
    """Send the digest email via Gmail SMTP."""
    email_cfg = config["email"]
    sender = email_cfg["sender_email"]
    password = email_cfg["sender_password"]
    recipients = email_cfg["recipients"]

    html = render_html(digest)
    plain = render_plaintext(digest)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"AI News Digest - {digest.generated_at.strftime('%b %d, %Y')}"
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL(email_cfg["smtp_server"], email_cfg["smtp_port"]) as server:
            server.login(sender, password)
            server.send_message(msg)
        logger.info("Digest email sent to %s", recipients)
    except Exception as e:
        logger.error("Failed to send email: %s", e)
        raise
