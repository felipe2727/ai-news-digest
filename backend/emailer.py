from __future__ import annotations

import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from supabase import create_client

from models import Digest

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent / "templates"


def _parse_picks(digest: Digest) -> list[dict]:
    """Parse project_recommendations JSON string into a list of dicts."""
    try:
        picks = json.loads(digest.project_recommendations)
        if isinstance(picks, list):
            return picks[:3]
    except (json.JSONDecodeError, TypeError):
        pass
    return []


def render_html(digest: Digest) -> str:
    """Render the digest as HTML using the Jinja2 template."""
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("digest.html")
    return template.render(digest=digest, project_picks=_parse_picks(digest))


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
    picks = _parse_picks(digest)
    if picks:
        lines.append("--- Build This ---")
        for i, p in enumerate(picks, 1):
            lines.append(f"  {i}. {p.get('name', 'Unnamed')} [{p.get('category', 'tool')}]")
            lines.append(f"     {p.get('description', '')}")
            lines.append(f"     Why: {p.get('why', '')}")
            if p.get("url"):
                lines.append(f"     {p['url']}")
            lines.append("")
    return "\n".join(lines)


def _get_subscriber_emails() -> list[str]:
    """Fetch confirmed subscriber emails from Supabase."""
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return []
    try:
        client = create_client(url, key)
        result = client.table("subscribers").select("email").eq("confirmed", True).execute()
        return [row["email"] for row in (result.data or [])]
    except Exception as e:
        logger.warning("Failed to fetch subscribers: %s", e)
        return []


def send_digest(digest: Digest, config: dict) -> None:
    """Send the digest email via Gmail SMTP to config recipients + subscribers."""
    email_cfg = config["email"]
    sender = email_cfg["sender_email"]
    password = email_cfg["sender_password"]

    # Merge config recipients with database subscribers, deduplicate
    config_recipients = email_cfg.get("recipients", [])
    subscriber_emails = _get_subscriber_emails()
    all_recipients = list(dict.fromkeys(config_recipients + subscriber_emails))

    if not all_recipients:
        logger.warning("No recipients to send to")
        return

    logger.info("Sending digest to %d recipients (%d subscribers)", len(all_recipients), len(subscriber_emails))

    html = render_html(digest)
    plain = render_plaintext(digest)
    subject = f"AI News Digest - {digest.generated_at.strftime('%b %d, %Y')}"

    try:
        with smtplib.SMTP_SSL(email_cfg["smtp_server"], email_cfg["smtp_port"]) as server:
            server.login(sender, password)
            for recipient in all_recipients:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = sender
                msg["To"] = recipient
                msg.attach(MIMEText(plain, "plain"))
                msg.attach(MIMEText(html, "html"))
                server.send_message(msg)
                logger.info("Sent to %s", recipient)
    except Exception as e:
        logger.error("Failed to send email: %s", e)
        raise
