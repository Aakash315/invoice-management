from sqlalchemy.orm import Session
from app.models.exchange_rate import ExchangeRate
from datetime import date

class ExchangeRateManager:
    def __init__(self, db: Session):
        self.db = db

    async def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        if from_currency == to_currency:
            return 1.0

        # For simplicity, returning a fixed rate.
        # In a real application, you would fetch this from an API and store it in the database.
        return 80.0
