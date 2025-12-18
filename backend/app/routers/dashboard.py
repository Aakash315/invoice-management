from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.invoice import Invoice
from app.models.client import Client
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total invoices
    total_invoices = db.query(Invoice).count()
    
    # Total revenue
    total_revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.payment_status == "paid"
    ).scalar() or 0
    
    # Pending amount
    pending_amount = db.query(
        func.sum(Invoice.total_amount - Invoice.paid_amount)
    ).filter(
        Invoice.payment_status != "paid"
    ).scalar() or 0
    
    # Total clients
    total_clients = db.query(Client).count()
    
    # Recent invoices
    recent_invoices = db.query(Invoice).order_by(
        Invoice.created_at.desc()
    ).limit(5).all()
    
    # Add balance to recent invoices
    for invoice in recent_invoices:
        invoice.balance = invoice.total_amount - invoice.paid_amount
    
    # Monthly revenue (last 6 months)
    monthly_revenue = db.query(
        extract('month', Invoice.issue_date).label('month'),
        extract('year', Invoice.issue_date).label('year'),
        func.sum(Invoice.total_amount).label('revenue')
    ).group_by('month', 'year').order_by('year', 'month').all()
    
    # Invoice status breakdown
    status_breakdown = db.query(
        Invoice.status,
        func.count(Invoice.id).label('count')
    ).group_by(Invoice.status).all()
    
    return {
        "stats": {
            "total_invoices": total_invoices,
            "total_revenue": float(total_revenue),
            "pending_amount": float(pending_amount),
            "total_clients": total_clients
        },
        "recent_invoices": recent_invoices,
        "monthly_revenue": [
            {"month": int(r.month), "year": int(r.year), "revenue": float(r.revenue)}
            for r in monthly_revenue
        ],
        "status_breakdown": [
            {"status": r.status, "count": r.count}
            for r in status_breakdown
        ]
    }