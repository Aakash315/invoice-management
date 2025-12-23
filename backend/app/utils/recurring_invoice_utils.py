from datetime import datetime, date, timedelta
from typing import List, Optional
import calendar

def calculate_next_date(
    current_date: date,
    frequency: str,
    interval_value: int = 1,
    day_of_week: Optional[int] = None,
    day_of_month: Optional[int] = None
) -> date:
    """
    Calculate the next due date based on recurrence rules.
    
    Args:
        current_date: The current/starting date
        frequency: Recurrence frequency (daily, weekly, monthly, quarterly, yearly)
        interval_value: How many units between recurrences (e.g., every 2 weeks)
        day_of_week: Day of week for weekly frequency (0=Monday, 6=Sunday)
        day_of_month: Day of month for monthly frequency (1-31)
    
    Returns:
        Next due date
    """
    if interval_value <= 0:
        interval_value = 1
    
    if frequency == "daily":
        return current_date + timedelta(days=interval_value)
    
    elif frequency == "weekly":
        if day_of_week is None:
            # Default to same day of week as current_date
            day_of_week = current_date.weekday()
        
        # Calculate days until next target day
        days_ahead = day_of_week - current_date.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        
        next_date = current_date + timedelta(days=days_ahead)
        return next_date + timedelta(weeks=interval_value - 1)
    
    elif frequency == "monthly":
        if day_of_month is None:
            # Default to same day as current_date
            day_of_month = current_date.day
        
        # Handle month overflow (e.g., Jan 31 -> Feb 28/29)
        try:
            # Get target month and year
            if current_date.month == 12:
                target_month = 1
                target_year = current_date.year + 1
            else:
                target_month = current_date.month + 1
                target_year = current_date.year
            
            # Use min to handle day overflow (Jan 31 -> Feb 28)
            days_in_target_month = calendar.monthrange(target_year, target_month)[1]
            target_day = min(day_of_month, days_in_target_month)
            
            next_date = date(target_year, target_month, target_day)
            return next_date + timedelta(days=interval_value * 30)  # Approximate month addition
        
        except ValueError:
            # Fallback for invalid dates (e.g., Feb 30)
            # Use the last day of the month
            if current_date.month == 12:
                target_month = 1
                target_year = current_date.year + 1
            else:
                target_month = current_date.month + 1
                target_year = current_date.year
            
            days_in_target_month = calendar.monthrange(target_year, target_month)[1]
            next_date = date(target_year, target_month, days_in_target_month)
            return next_date + timedelta(days=interval_value * 30)
    
    elif frequency == "quarterly":
        # Every 3 months
        month_increment = 3 * interval_value
        new_month = current_date.month + month_increment
        new_year = current_date.year
        
        while new_month > 12:
            new_month -= 12
            new_year += 1
        
        # Handle day overflow
        days_in_target_month = calendar.monthrange(new_year, new_month)[1]
        target_day = min(current_date.day, days_in_target_month)
        
        return date(new_year, new_month, target_day)
    
    elif frequency == "yearly":
        # Same date next year, handling leap years
        target_year = current_date.year + interval_value
        
        # Handle Feb 29 -> Feb 28 in non-leap years
        if current_date.month == 2 and current_date.day == 29:
            if not is_leap_year(target_year):
                return date(target_year, 2, 28)
        
        return date(target_year, current_date.month, current_date.day)
    
    else:
        raise ValueError(f"Unsupported frequency: {frequency}")

def is_leap_year(year: int) -> bool:
    """Check if a year is a leap year."""
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

def calculate_next_dates(
    start_date: date,
    frequency: str,
    interval_value: int = 1,
    day_of_week: Optional[int] = None,
    day_of_month: Optional[int] = None,
    count: int = 5,
    end_date: Optional[date] = None,
    max_occurrences: Optional[int] = None
) -> List[date]:
    """
    Calculate multiple next due dates.
    
    Args:
        start_date: Starting date
        frequency: Recurrence frequency
        interval_value: Interval between recurrences
        day_of_week: Day of week for weekly
        day_of_month: Day of month for monthly
        count: Number of dates to calculate
        end_date: Optional end date limit
        max_occurrences: Optional maximum number of occurrences
    
    Returns:
        List of calculated dates
    """
    dates = []
    current_date = start_date
    
    for i in range(count):
        next_date = calculate_next_date(
            current_date, frequency, interval_value, day_of_week, day_of_month
        )
        
        # Check constraints
        if end_date and next_date > end_date:
            break
        
        if max_occurrences and i + 1 >= max_occurrences:
            break
        
        dates.append(next_date)
        current_date = next_date
    
    return dates

def validate_recurrence_config(
    frequency: str,
    interval_value: int,
    day_of_week: Optional[int],
    day_of_month: Optional[int],
    start_date: date,
    end_date: Optional[date] = None
) -> List[str]:
    """
    Validate recurrence configuration and return list of errors.
    
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    # Basic validation
    if interval_value <= 0:
        errors.append("Interval value must be positive")
    
    if start_date < date.today():
        errors.append("Start date cannot be in the past")
    
    if end_date and end_date <= start_date:
        errors.append("End date must be after start date")
    
    # Frequency-specific validation
    if frequency == "weekly":
        if day_of_week is None:
            errors.append("Day of week is required for weekly frequency")
        elif not (0 <= day_of_week <= 6):
            errors.append("Day of week must be between 0 (Monday) and 6 (Sunday)")
    
    elif frequency == "monthly":
        if day_of_month is None:
            errors.append("Day of month is required for monthly frequency")
        elif not (1 <= day_of_month <= 31):
            errors.append("Day of month must be between 1 and 31")
        elif day_of_month > 29 and start_date.month == 2:
            errors.append("Day of month 30-31 is invalid for February")
    
    elif frequency == "quarterly":
        # Quarterly doesn't need additional validation currently
        pass
    
    elif frequency == "yearly":
        # Yearly doesn't need additional validation currently
        pass
    
    elif frequency == "daily":
        # Daily doesn't need additional validation
        pass
    
    else:
        errors.append(f"Invalid frequency: {frequency}")
    
    return errors

def format_frequency_display(frequency: str, interval_value: int, day_of_week: Optional[int] = None, day_of_month: Optional[int] = None) -> str:
    """
    Format frequency for display purposes.
    
    Args:
        frequency: Recurrence frequency
        interval_value: Interval between recurrences
        day_of_week: Day of week for weekly (optional)
        day_of_month: Day of month for monthly (optional)
    
    Returns:
        Human-readable frequency string
    """
    if interval_value == 1:
        interval_text = ""
    else:
        interval_text = f"every {interval_value} "
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    if frequency == "daily":
        return f"Daily{interval_text}" if interval_text else "Daily"
    
    elif frequency == "weekly":
        day_text = f" on {day_names[day_of_week]}" if day_of_week is not None else ""
        return f"{interval_text}weekly{day_text}" if interval_text else f"Weekly{day_text}"
    
    elif frequency == "monthly":
        day_text = f" on the {day_of_month}" if day_of_month is not None else ""
        return f"{interval_text}monthly{day_text}" if interval_text else f"Monthly{day_text}"
    
    elif frequency == "quarterly":
        return f"{interval_text}quarterly"
    
    elif frequency == "yearly":
        return f"{interval_text}yearly"
    
    else:
        return frequency
