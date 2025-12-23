from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(10), nullable=False)
    rate = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
