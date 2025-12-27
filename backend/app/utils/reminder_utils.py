import json
from datetime import date, timedelta
from typing import List

from sqlalchemy.orm import Session

from app import models, schemas
from app.utils.mail import send_email
from app.models.invoice import Invoice
from app.models.reminder import ReminderSetting, ReminderHistory

def get_invoices_due_or_overdue(db: Session) -> List[Invoice]:
    """Fetches invoices that are due today or overdue, and unpaid."""
    today = date.today()
    invoices = db.query(Invoice).filter(
        Invoice.due_date <= today,
        Invoice.payment_status != "paid"
    ).all()
    return invoices

def get_invoices_due_soon(db: Session, days_before: int) -> List[Invoice]:
    """Fetches invoices due within a specified number of days, and unpaid."""
    today = date.today()
    due_date_threshold = today + timedelta(days=days_before)
    invoices = db.query(Invoice).filter(
        Invoice.due_date > today,
        Invoice.due_date <= due_date_threshold,
        Invoice.payment_status != "paid"
    ).all()
    return invoices

def get_reminder_settings(db: Session, user_id: int) -> ReminderSetting:
    """Fetches reminder settings for a given user."""
    return db.query(ReminderSetting).filter(ReminderSetting.user_id == user_id).first()

def create_reminder_history_entry(db: Session, invoice: Invoice, reminder_type: str, subject: str, body: str):
    """Creates an entry in the reminder history."""
    reminder_history = ReminderHistory(
        invoice_id=invoice.id,
        reminder_type=reminder_type,
        recipient_email=invoice.client.email, # Assuming client has an email
        email_subject=subject,
        email_body=body
    )
    db.add(reminder_history)
    db.commit()
    db.refresh(reminder_history)
    return reminder_history

async def send_reminder_email(db: Session, invoice: Invoice, reminder_type: str, subject: str, body: str):
    """Sends a reminder email and logs it to history."""
    # TODO: Replace with actual client email from invoice
    recipient_email = invoice.client.email 
    await send_email(
        subject=subject,
        recipients=[recipient_email],
        body=body
    )
    create_reminder_history_entry(db, invoice, reminder_type, subject, body)

async def check_and_send_reminders(db: Session):
    """
    Main function to check for invoices and send reminders based on user settings.
    This function would be called by a daily cron job.
    """
    users_with_reminders = db.query(models.User).join(ReminderSetting).filter(
        ReminderSetting.enabled == True
    ).all()

    for user in users_with_reminders:
        settings: ReminderSetting = user.reminder_setting
        if not settings:
            continue

        # Convert JSON strings to Python lists
        remind_before_due_days = json.loads(settings.remind_before_due) if settings.remind_before_due else []
        remind_after_due_days = json.loads(settings.remind_after_due) if settings.remind_after_due else []

        # Reminders before due date
        for days_before in remind_before_due_days:
            invoices = get_invoices_due_soon(db, days_before)
            for invoice in invoices:
                # Check if a reminder of this type was already sent for this invoice today
                # This needs a more robust check in a real app, e.g., by checking reminder_history
                # For now, a simple check if any reminder for this invoice was sent today
                today = date.today()
                already_reminded = db.query(ReminderHistory).filter(
                    ReminderHistory.invoice_id == invoice.id,
                    ReminderHistory.reminder_type == f"friendly_{days_before}_days_before",
                    ReminderHistory.sent_at >= today
                ).first()
                if not already_reminded:
                    subject = f"Friendly Reminder: Invoice {invoice.invoice_number} is due in {days_before} days"
                    body = settings.template_friendly or "Your invoice is due soon."
                    await send_reminder_email(db, invoice, f"friendly_{days_before}_days_before", subject, body)

        # Reminder on due date
        if settings.remind_on_due:
            invoices = get_invoices_due_or_overdue(db) # This will get invoices due today
            for invoice in invoices:
                if invoice.due_date == date.today():
                    today = date.today()
                    already_reminded = db.query(ReminderHistory).filter(
                        ReminderHistory.invoice_id == invoice.id,
                        ReminderHistory.reminder_type == "due_date",
                        ReminderHistory.sent_at >= today
                    ).first()
                    if not already_reminded:
                        subject = f"Invoice {invoice.invoice_number} is due today"
                        body = settings.template_due or "Your invoice is due today."
                        await send_reminder_email(db, invoice, "due_date", subject, body)

        # Reminders after due date (overdue)
        for days_overdue in remind_after_due_days:
            today = date.today()
            overdue_date_threshold = today - timedelta(days=days_overdue)
            invoices = db.query(Invoice).filter(
                Invoice.due_date < today,
                Invoice.due_date == overdue_date_threshold, # Only send for invoices that became overdue by 'days_overdue' today
                Invoice.payment_status != "paid"
            ).all()
            for invoice in invoices:
                reminder_type = ""
                template_body = ""
                if days_overdue == 1:
                    reminder_type = "first_overdue"
                    template_body = settings.template_first_overdue
                elif days_overdue == 7:
                    reminder_type = "second_overdue"
                    template_body = settings.template_second_overdue
                elif days_overdue >= 15: # Assuming 15 and 30+ days use final notice
                    reminder_type = "final_notice"
                    template_body = settings.template_final_notice
                
                if reminder_type:
                    already_reminded = db.query(ReminderHistory).filter(
                        ReminderHistory.invoice_id == invoice.id,
                        ReminderHistory.reminder_type == reminder_type,
                        ReminderHistory.sent_at >= today
                    ).first()
                    if not already_reminded:
                        subject = f"Reminder: Invoice {invoice.invoice_number} is {days_overdue} days overdue"
                        body = template_body or f"Your invoice is {days_overdue} days overdue."
                        await send_reminder_email(db, invoice, reminder_type, subject, body)

