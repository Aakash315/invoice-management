from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class EmailStatus(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    BOUNCED = "bounced"
    FAILED = "failed"

class EmailHistory(Base):
    __tablename__ = "email_history"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    sent_to = Column(String(255), nullable=True)  # Keep for backward compatibility
    recipient = Column(String(255), nullable=True)  # New field
    subject = Column(String(500), nullable=True)
    cc = Column(Text)  # JSON string of CC recipients
    bcc = Column(Text)  # JSON string of BCC recipients
    body_preview = Column(Text)  # First 500 characters of email body
    attachment_filename = Column(String(255))
    status = Column(Enum(EmailStatus), default=EmailStatus.PENDING)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    bounced_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text)  # If email failed
    delivery_error = Column(Text)  # If delivery failed
    tracking_id = Column(String(100), unique=True, nullable=True)  # Unique tracking ID
    
    # Relationships
    invoice = relationship("Invoice", back_populates="email_history")

    def __repr__(self):
        return f"<EmailHistory(id={self.id}, invoice_id={self.invoice_id}, recipient='{self.recipient or self.sent_to}', status='{self.status.value if self.status else None}')>"

    def get_recipient(self):
        """Get the recipient email, prioritizing new field over legacy"""
        return self.recipient or self.sent_to

    def get_status_display(self):
        """Get human-readable status display"""
        if not self.status:
            return "Unknown"
        
        status_map = {
            EmailStatus.PENDING: "Pending",
            EmailStatus.SENT: "Sent",
            EmailStatus.DELIVERED: "Delivered",
            EmailStatus.OPENED: "Opened",
            EmailStatus.BOUNCED: "Bounced",
            EmailStatus.FAILED: "Failed"
        }
        return status_map.get(self.status, self.status.value)

    def get_status_color(self):
        """Get CSS color class for status"""
        if not self.status:
            return "bg-gray-100 text-gray-800"
        
        color_map = {
            EmailStatus.PENDING: "bg-yellow-100 text-yellow-800",
            EmailStatus.SENT: "bg-blue-100 text-blue-800",
            EmailStatus.DELIVERED: "bg-green-100 text-green-800",
            EmailStatus.OPENED: "bg-purple-100 text-purple-800",
            EmailStatus.BOUNCED: "bg-orange-100 text-orange-800",
            EmailStatus.FAILED: "bg-red-100 text-red-800"
        }
        return color_map.get(self.status, "bg-gray-100 text-gray-800")

    def get_formatted_sent_time(self):
        """Get formatted sent time like '15 Dec 2024, 2:30 PM'"""
        if not self.sent_at:
            return "N/A"
        return self.sent_at.strftime('%d %b %Y, %I:%M %p')

    def get_delivery_summary(self):
        """Get summary of delivery status"""
        if self.status == EmailStatus.FAILED:
            return f"Failed to send"
        elif self.status == EmailStatus.BOUNCED:
            return f"Bounced back"
        elif self.status == EmailStatus.OPENED:
            return f"Opened on {self.opened_at.strftime('%d %b %Y') if self.opened_at else 'unknown date'}"
        elif self.status == EmailStatus.DELIVERED:
            return f"Delivered on {self.delivered_at.strftime('%d %b %Y') if self.delivered_at else 'unknown date'}"
        elif self.status == EmailStatus.SENT:
            return f"Sent on {self.get_formatted_sent_time()}"
        else:
            return "Pending"

