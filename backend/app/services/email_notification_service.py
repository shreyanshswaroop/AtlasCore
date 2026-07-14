from email.message import EmailMessage
import smtplib

from app.core.config import get_settings


settings = get_settings()


def send_sync_email(result) -> None:
    if not settings.atlascore_sync_email_enabled:
        return

    if not (
        settings.atlascore_sync_email_to
        and settings.atlascore_sync_email_from
        and settings.smtp_host
    ):
        return

    message = EmailMessage()
    message["Subject"] = build_subject(result)
    message["From"] = settings.atlascore_sync_email_from
    message["To"] = settings.atlascore_sync_email_to
    message.set_content(build_body(result))

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        timeout=30,
    ) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()

        if settings.smtp_username and settings.smtp_password:
            smtp.login(
                settings.smtp_username,
                settings.smtp_password,
            )

        smtp.send_message(message)


def build_subject(result) -> str:
    return (
        "[AtlasCore] News sync "
        f"{result.status}: {result.total_items} items indexed"
    )


def build_body(result) -> str:
    return "\n".join(
        [
            "AtlasCore AI news sync completed.",
            "",
            f"Status: {result.status}",
            f"Started at: {result.started_at.isoformat()}",
            "Finished at: "
            + (
                result.finished_at.isoformat()
                if result.finished_at is not None
                    else "not finished"
                ),
            f"Fetched: {result.fetched}",
            f"Processed: {result.processed}",
            f"Failed: {result.failed}",
            f"Total news items indexed: {result.total_items}",
            "",
            f"Error: {result.error or 'None'}",
        ]
    )
