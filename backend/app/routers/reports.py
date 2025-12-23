from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.invoice import Invoice
from app.models.user import User
from app.models.client import Client
from app.utils.dependencies import get_current_user
from datetime import datetime, timedelta
from app.schemas.report import RevenueReportItem, TopClientReportItem, LatePayingClientsReportItem
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/late-paying-clients", response_model=List[LatePayingClientsReportItem])
async def get_late_paying_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.count(Invoice.id).label("overdue_invoices"),
        func.sum(Invoice.total_amount - Invoice.paid_amount).label("total_overdue_amount")
    ).join(Invoice, Client.id == Invoice.client_id).filter(
        Invoice.status == "overdue"
    ).group_by(Client.id, Client.name).order_by(
        func.count(Invoice.id).desc()
    ).all()

    return result

@router.get("/top-clients", response_model=List[TopClientReportItem])
async def get_top_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5,
):
    result = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).join(Invoice, Client.id == Invoice.client_id).filter(
        Invoice.status.in_(["paid", "sent", "overdue"])
    ).group_by(Client.id, Client.name).order_by(
        func.sum(Invoice.base_currency_amount).desc()
    ).limit(limit).all()

    return result

@router.get("/revenue", response_model=List[RevenueReportItem])
async def get_revenue_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None,
    group_by: str = "month",
):
    query = db.query(
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).filter(
        Invoice.status.in_(["paid", "sent", "overdue"])
    )

    if start_date:
        query = query.filter(Invoice.issue_date >= start_date)
    if end_date:
        query = query.filter(Invoice.issue_date <= end_date)

    if group_by == "day":
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year'),
            extract('month', Invoice.issue_date).label('month'),
            extract('day', Invoice.issue_date).label('day')
        ).group_by("year", "month", "day").order_by("year", "month", "day")
    elif group_by == "month":
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year'),
            extract('month', Invoice.issue_date).label('month')
        ).group_by("year", "month").order_by("year", "month")
    else: # year
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year')
        ).group_by("year").order_by("year")

    result = query.all()
    return result
