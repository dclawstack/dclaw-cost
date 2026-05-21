from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cost_alert import CostAlert
from app.repositories.billing_record_repo import BillingRecordRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.cost_alert_repo import CostAlertRepository


async def check_budgets_and_alert(db: AsyncSession) -> int:
    """Check all active budgets; create threshold/forecast alerts where needed.
    Returns the number of new alerts created."""
    today = date.today()
    first = today.replace(day=1)
    if today.month == 12:
        last = today.replace(day=31)
    else:
        last = (today.replace(month=today.month + 1, day=1)) - timedelta(days=1)

    budget_repo = BudgetRepository(db)
    billing_repo = BillingRecordRepository(db)
    alert_repo = CostAlertRepository(db)

    budgets = await budget_repo.list_active()
    created = 0

    for budget in budgets:
        spent = await billing_repo.spend_for_scope(
            budget.scope, budget.scope_value, first, last
        )
        threshold_amount = budget.amount_usd * (budget.alert_threshold_pct / 100.0)

        # Deduplicate: skip if an unacknowledged alert already exists for this budget
        existing, _ = await alert_repo.list_filtered(
            budget_id=budget.id, acknowledged=False, limit=1
        )
        if existing:
            continue

        if spent >= threshold_amount:
            severity = "critical" if spent >= budget.amount_usd else "warning"
            pct = round((spent / budget.amount_usd) * 100, 1)
            alert = CostAlert(
                budget_id=budget.id,
                alert_type="threshold",
                current_spend_usd=spent,
                message=(
                    f"Budget '{budget.name}' has reached {pct}% "
                    f"(${spent:,.2f} of ${budget.amount_usd:,.2f})"
                ),
                severity=severity,
            )
            await alert_repo.create(alert)
            created += 1
            continue

        # Forecast alert: on-track to breach budget
        days_elapsed = max((today - first).days + 1, 1)
        total_days = (last - first).days + 1
        projected = (spent / days_elapsed) * total_days

        if projected > budget.amount_usd and spent < threshold_amount:
            alert = CostAlert(
                budget_id=budget.id,
                alert_type="forecast",
                current_spend_usd=spent,
                projected_spend_usd=round(projected, 2),
                message=(
                    f"Budget '{budget.name}' is on track to exceed its limit. "
                    f"Projected ${projected:,.2f} vs limit ${budget.amount_usd:,.2f}"
                ),
                severity="warning",
            )
            await alert_repo.create(alert)
            created += 1

    return created
