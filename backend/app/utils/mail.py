from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi import UploadFile
from app.config import settings
from pathlib import Path
import os
from datetime import datetime

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
    TEMPLATE_FOLDER=Path(__file__).parent / '../templates',
)

fm = FastMail(conf)

def generate_html_email(invoice_data: dict, tracking_id: str = None) -> str:
    """Generate HTML email content from invoice data with optional tracking."""
    template_path = Path(__file__).parent / '../templates/email_template.html'
    
    # Read template
    with open(template_path, 'r', encoding='utf-8') as file:
        template = file.read()
    
    # Replace placeholders with actual data
    html_content = template.replace('{{ company_name }}', invoice_data.get('company_name', 'Webby Wonder'))
    html_content = html_content.replace('{{ company_location }}', invoice_data.get('company_location', 'Mumbai, India'))
    html_content = html_content.replace('{{ client_name }}', invoice_data.get('client_name', 'Client'))
    html_content = html_content.replace('{{ invoice_number }}', invoice_data.get('invoice_number', 'N/A'))
    html_content = html_content.replace('{{ total_amount }}', invoice_data.get('total_amount', '0'))
    html_content = html_content.replace('{{ due_date }}', invoice_data.get('due_date', 'N/A'))
    
    # Add tracking pixel if tracking_id is provided
    if tracking_id:
        tracking_pixel = f'<img src="/api/invoices/track/open/{tracking_id}" width="1" height="1" style="display:none;" alt="" />'
        html_content = html_content.replace('</body>', f'{tracking_pixel}</body>')
    
    return html_content

async def send_email(subject: str, recipients: list, invoice_data: dict = None, attachment: tuple = None, tracking_id: str = None):
    # Generate HTML content if invoice data is provided
    if invoice_data:
        body = generate_html_email(invoice_data, tracking_id)
    else:
        # Fallback to simple message if no invoice data
        body = "Please find attached the invoice."
    
    attachments = []
    if attachment:
        attachments.append(attachment)
    
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype="html",
        attachments=attachments
    )
    await fm.send_message(message)
