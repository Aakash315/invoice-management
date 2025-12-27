from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app import models
from app.schemas.reminder import ReminderSetting, ReminderSettingCreate, ReminderSettingUpdate, ReminderHistory
from app.database import get_db
from app.utils.dependencies import get_current_user, get_current_active_superuser
from app.utils import reminder_utils
import json

router = APIRouter()

@router.get("/settings", response_model=ReminderSetting)
def get_user_reminder_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get reminder settings for the current user.
    """
    settings = reminder_utils.get_reminder_settings(db, current_user.id)
    if not settings:
        raise HTTPException(status_code=404, detail="Reminder settings not found")
    # Convert JSON strings back to lists before returning
    if isinstance(settings.remind_before_due, str):
        settings.remind_before_due = json.loads(settings.remind_before_due)
    if isinstance(settings.remind_after_due, str):
        settings.remind_after_due = json.loads(settings.remind_after_due)
    return settings

@router.post("/settings", response_model=ReminderSetting)
def create_user_reminder_settings(
    settings_in: ReminderSettingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create reminder settings for the current user.
    """
    existing_settings = reminder_utils.get_reminder_settings(db, current_user.id)
    if existing_settings:
        raise HTTPException(status_code=400, detail="Reminder settings already exist for this user")

    db_obj = models.ReminderSetting(
        **settings_in.dict(exclude_unset=True),
        user_id=current_user.id
    )
    # Convert lists to JSON strings for storage
    db_obj.remind_before_due = json.dumps(settings_in.remind_before_due)
    db_obj.remind_after_due = json.dumps(settings_in.remind_after_due)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    # Convert JSON strings back to lists before returning
    db_obj.remind_before_due = json.loads(db_obj.remind_before_due)
    db_obj.remind_after_due = json.loads(db_obj.remind_after_due)
    return db_obj

@router.put("/settings", response_model=ReminderSetting)
def update_user_reminder_settings(
    settings_in: ReminderSettingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update reminder settings for the current user.
    """
    settings = reminder_utils.get_reminder_settings(db, current_user.id)
    if not settings:
        raise HTTPException(status_code=404, detail="Reminder settings not found")

    update_data = settings_in.dict(exclude_unset=True)
    # Convert lists to JSON strings for storage
    if "remind_before_due" in update_data:
        update_data["remind_before_due"] = json.dumps(update_data["remind_before_due"])
    if "remind_after_due" in update_data:
        update_data["remind_after_due"] = json.dumps(update_data["remind_after_due"])

    for field in update_data:
        setattr(settings, field, update_data[field])
    db.add(settings)
    db.commit()
    db.refresh(settings)
    # Convert JSON strings back to lists before returning
    if isinstance(settings.remind_before_due, str):
        settings.remind_before_due = json.loads(settings.remind_before_due)
    if isinstance(settings.remind_after_due, str):
        settings.remind_after_due = json.loads(settings.remind_after_due)
    return settings

@router.post("/run-scheduled-reminders", status_code=202)
async def run_scheduled_reminders_endpoint(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # Only allow admin or superuser to trigger this endpoint
    current_user: models.User = Depends(get_current_active_superuser) 
):
    """
    Endpoint to manually trigger the daily reminder check.
    This would typically be called by a cron job.
    """
    background_tasks.add_task(reminder_utils.check_and_send_reminders, db)
    return {"message": "Reminder check initiated in background."}

@router.get("/{invoice_id}/history", response_model=List[ReminderHistory])
def get_invoice_reminder_history(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get reminder history for a specific invoice.
    """
    # Ensure the invoice belongs to the current user
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.created_by == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    history = db.query(models.ReminderHistory).filter(
        models.ReminderHistory.invoice_id == invoice_id
    ).all()
    return history

@router.post("/{invoice_id}/send-manual-reminder", status_code=202)
async def send_manual_reminder_endpoint(
    invoice_id: int,
    reminder_type: str, # e.g., "friendly", "due", "first_overdue"
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Send a manual reminder for a specific invoice.
    """
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.created_by == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    settings = reminder_utils.get_reminder_settings(db, current_user.id)
    if not settings:
        raise HTTPException(status_code=400, detail="Reminder settings not found for this user.")

    # Determine subject and body based on reminder_type
    subject = ""
    body = ""
    if reminder_type == "friendly":
        subject = f"Reminder: Invoice {invoice.invoice_number} is due soon"
        body = settings.template_friendly or "Your invoice is due soon."
    elif reminder_type == "due":
        subject = f"Invoice {invoice.invoice_number} is due today"
        body = settings.template_due or "Your invoice is due today."
    elif reminder_type == "first_overdue":
        subject = f"Reminder: Invoice {invoice.invoice_number} is overdue"
        body = settings.template_first_overdue or "Your invoice is overdue."
    elif reminder_type == "second_overdue":
        subject = f"Second Reminder: Invoice {invoice.invoice_number} is overdue"
        body = settings.template_second_overdue or "Your invoice is overdue."
    elif reminder_type == "final_notice":
        subject = f"Final Notice: Invoice {invoice.invoice_number} is overdue"
        body = settings.template_final_notice or "Your invoice is overdue."
    else:
        raise HTTPException(status_code=400, detail="Invalid reminder type.")
    
    # Check if client has an email
    if not invoice.client.email:
        raise HTTPException(status_code=400, detail="Client does not have an email address. Please add an email address to the client.")

    background_tasks.add_task(
        reminder_utils.send_reminder_email, db, invoice, reminder_type, subject, body
    )
    return {"message": f"Manual '{reminder_type}' reminder for invoice {invoice_id} initiated in background."}
