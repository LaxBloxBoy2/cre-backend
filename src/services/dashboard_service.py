from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, date
from ..models.deal import Deal
from ..models.deal_stage import DealStage
from ..models.task import Task
from ..models.alert import DealAlert
from ..schemas.dashboard_schema import DashboardSummary, IRRTrend, IRRTrendPoint, DealLifecycle, DealLifecycleStage, RiskScore, DealStatusBreakdown, QuickActionCounts

def calculate_dashboard_summary(db: Session, user_id: Optional[str] = None) -> DashboardSummary:
    """
    Calculate dashboard summary for a user

    Args:
        db: Database session
        user_id: User ID (if None, calculates for all deals)

    Returns:
        Dashboard summary
    """
    # Base query for deals
    query = db.query(Deal)

    # Filter by user ID if provided
    if user_id:
        query = query.filter(Deal.user_id == user_id)

    # Get all deals
    deals = query.all()

    # Calculate total deals
    total_deals = len(deals)

    # Initialize counters and sums
    total_cap_rate = 0.0
    cap_rate_count = 0
    total_development_margin = 0.0
    development_margin_count = 0
    total_project_cost = 0.0
    total_rent = 0.0
    rent_count = 0
    total_irr = 0.0
    irr_count = 0
    total_dscr = 0.0
    dscr_count = 0
    deals_by_status = {}
    deals_by_type = {}

    # Process each deal
    for deal in deals:
        # Calculate project cost
        project_cost = deal.acquisition_price + deal.construction_cost
        if project_cost > 0:
            total_project_cost += project_cost

        # Count by status
        status = deal.status
        if status in deals_by_status:
            deals_by_status[status] += 1
        else:
            deals_by_status[status] = 1

        # Count by property type
        property_type = deal.property_type
        if property_type in deals_by_type:
            deals_by_type[property_type] += 1
        else:
            deals_by_type[property_type] = 1

        # Calculate cap rate
        if deal.projected_rent_per_sf and deal.square_footage and deal.vacancy_rate is not None and deal.operating_expenses_per_sf is not None and project_cost > 0:
            # Calculate NOI
            gpi = deal.square_footage * deal.projected_rent_per_sf
            egi = gpi * (1 - deal.vacancy_rate / 100)
            op_ex = deal.square_footage * deal.operating_expenses_per_sf
            noi = egi - op_ex

            # Calculate cap rate
            cap_rate = (noi / project_cost) * 100
            total_cap_rate += cap_rate
            cap_rate_count += 1

        # Calculate development margin
        if deal.projected_rent_per_sf and deal.square_footage and deal.vacancy_rate is not None and deal.operating_expenses_per_sf is not None and deal.exit_cap_rate and project_cost > 0:
            # Calculate NOI
            gpi = deal.square_footage * deal.projected_rent_per_sf
            egi = gpi * (1 - deal.vacancy_rate / 100)
            op_ex = deal.square_footage * deal.operating_expenses_per_sf
            noi = egi - op_ex

            # Calculate exit value
            exit_value = noi / (deal.exit_cap_rate / 100)

            # Calculate development margin
            development_margin = ((exit_value - project_cost) / project_cost) * 100
            total_development_margin += development_margin
            development_margin_count += 1

        # Calculate average rent
        if deal.projected_rent_per_sf:
            total_rent += deal.projected_rent_per_sf
            rent_count += 1

        # Add IRR if available
        if deal.projected_irr is not None:
            total_irr += deal.projected_irr
            irr_count += 1

        # Add DSCR if available
        if deal.dscr is not None:
            total_dscr += deal.dscr
            dscr_count += 1

    # Calculate averages
    average_cap_rate = round(total_cap_rate / cap_rate_count, 2) if cap_rate_count > 0 else 0.0
    average_development_margin = round(total_development_margin / development_margin_count, 2) if development_margin_count > 0 else 0.0
    average_rent_per_sf = round(total_rent / rent_count, 2) if rent_count > 0 else 0.0
    average_irr = round(total_irr / irr_count, 2) if irr_count > 0 else 0.0
    average_dscr = round(total_dscr / dscr_count, 2) if dscr_count > 0 else 0.0

    # Create dashboard summary
    dashboard_summary = DashboardSummary(
        total_deals=total_deals,
        average_cap_rate=average_cap_rate,
        average_development_margin=average_development_margin,
        total_project_cost=total_project_cost,
        average_rent_per_sf=average_rent_per_sf,
        average_irr=average_irr,
        average_dscr=average_dscr,
        deals_by_status=deals_by_status,
        deals_by_type=deals_by_type
    )

    return dashboard_summary

def get_irr_trend(db: Session, period: str = '6m', user_id: Optional[str] = None, org_id: Optional[str] = None) -> IRRTrend:
    """
    Get IRR trend data

    Args:
        db: Database session
        period: Period (3m, 6m, 1y)
        user_id: User ID (optional)
        org_id: Organization ID (optional)

    Returns:
        IRR trend data
    """
    # Determine date range based on period
    today = date.today()
    if period == '3m':
        start_date = today - timedelta(days=90)
        interval_days = 7  # Weekly data points
    elif period == '6m':
        start_date = today - timedelta(days=180)
        interval_days = 14  # Bi-weekly data points
    elif period == '1y':
        start_date = today - timedelta(days=365)
        interval_days = 30  # Monthly data points
    else:
        start_date = today - timedelta(days=180)  # Default to 6m
        interval_days = 14

    # Build query
    query = db.query(Deal)

    # Apply filters
    if user_id:
        query = query.filter(Deal.user_id == user_id)
    if org_id:
        query = query.filter(Deal.org_id == org_id)

    # Get deals
    deals = query.all()

    # Generate data points
    data_points = []
    current_date = start_date
    while current_date <= today:
        # Calculate average IRR for deals at this point in time
        irr_values = [deal.projected_irr for deal in deals if deal.projected_irr is not None]
        avg_irr = sum(irr_values) / len(irr_values) if irr_values else 0.0

        # Add data point
        data_points.append(IRRTrendPoint(date=current_date, irr=avg_irr))

        # Move to next interval
        current_date += timedelta(days=interval_days)

    # Create trend
    trend = IRRTrend(data=data_points, period=period)

    return trend

def get_deal_lifecycle(db: Session, user_id: Optional[str] = None, org_id: Optional[str] = None) -> DealLifecycle:
    """
    Get deal lifecycle data

    Args:
        db: Database session
        user_id: User ID (optional)
        org_id: Organization ID (optional)

    Returns:
        Deal lifecycle data
    """
    # Build query for deals
    deal_query = db.query(Deal)

    # Apply filters
    if user_id:
        deal_query = deal_query.filter(Deal.user_id == user_id)
    if org_id:
        deal_query = deal_query.filter(Deal.org_id == org_id)

    # Get deals
    deals = deal_query.all()
    deal_ids = [deal.id for deal in deals]

    # Get stages for these deals
    stages_query = db.query(DealStage).filter(DealStage.deal_id.in_(deal_ids))
    stages = stages_query.all()

    # Group stages by name
    stages_by_name = {}
    for stage in stages:
        if stage.name not in stages_by_name:
            stages_by_name[stage.name] = {
                'count': 0,
                'total_days': 0,
                'target_days': stage.target_days
            }

        stages_by_name[stage.name]['count'] += 1
        stages_by_name[stage.name]['total_days'] += stage.target_days

    # Calculate averages
    lifecycle_stages = []
    total_avg_days = 0
    total_target_days = 0

    for name, data in stages_by_name.items():
        avg_days = data['total_days'] / data['count'] if data['count'] > 0 else 0
        target_days = data['target_days']

        lifecycle_stages.append(DealLifecycleStage(
            name=name,
            avg_days=avg_days,
            target_days=target_days
        ))

        total_avg_days += avg_days
        total_target_days += target_days

    # Sort stages by name (assuming names include order like "1. Initial", "2. Due Diligence", etc.)
    lifecycle_stages.sort(key=lambda x: x.name)

    # Create lifecycle
    lifecycle = DealLifecycle(
        stages=lifecycle_stages,
        total_avg_days=total_avg_days,
        total_target_days=total_target_days
    )

    return lifecycle

def get_risk_score(db: Session, user_id: Optional[str] = None, org_id: Optional[str] = None) -> RiskScore:
    """
    Get global risk score

    Args:
        db: Database session
        user_id: User ID (optional)
        org_id: Organization ID (optional)

    Returns:
        Risk score
    """
    # Build query for deals
    deal_query = db.query(Deal)

    # Apply filters
    if user_id:
        deal_query = deal_query.filter(Deal.user_id == user_id)
    if org_id:
        deal_query = deal_query.filter(Deal.org_id == org_id)

    # Get deals
    deals = deal_query.all()
    deal_ids = [deal.id for deal in deals]

    # Get alerts for these deals
    alerts_query = db.query(DealAlert).filter(
        DealAlert.deal_id.in_(deal_ids),
        DealAlert.resolved == False
    )
    alerts = alerts_query.all()

    # Count alerts by severity
    high_alerts = sum(1 for alert in alerts if alert.severity == 'high')
    medium_alerts = sum(1 for alert in alerts if alert.severity == 'medium')
    low_alerts = sum(1 for alert in alerts if alert.severity == 'low')

    # Calculate risk score (0-100)
    # High alerts contribute more to the score
    max_score = 100
    high_weight = 5
    medium_weight = 3
    low_weight = 1

    weighted_sum = (high_alerts * high_weight) + (medium_alerts * medium_weight) + (low_alerts * low_weight)
    max_weighted_sum = len(deals) * high_weight * 3  # Assuming max 3 high alerts per deal

    risk_score = int((weighted_sum / max_weighted_sum) * max_score) if max_weighted_sum > 0 else 0
    risk_score = min(risk_score, 100)  # Cap at 100

    # Generate factors
    factors = []
    if high_alerts > 0:
        factors.append(f"{high_alerts} high severity alerts")
    if medium_alerts > 0:
        factors.append(f"{medium_alerts} medium severity alerts")
    if low_alerts > 0:
        factors.append(f"{low_alerts} low severity alerts")

    # Add other factors
    overdue_tasks = db.query(Task).filter(
        Task.deal_id.in_(deal_ids),
        Task.completed == False,
        Task.due_date < date.today()
    ).count()

    if overdue_tasks > 0:
        factors.append(f"{overdue_tasks} overdue tasks")

    # Create risk score
    risk = RiskScore(score=risk_score, factors=factors)

    return risk

def get_deal_status_breakdown(db: Session, user_id: Optional[str] = None, org_id: Optional[str] = None) -> DealStatusBreakdown:
    """
    Get deal status breakdown

    Args:
        db: Database session
        user_id: User ID (optional)
        org_id: Organization ID (optional)

    Returns:
        Deal status breakdown
    """
    # Build query
    query = db.query(Deal.status, func.count(Deal.id))

    # Apply filters
    if user_id:
        query = query.filter(Deal.user_id == user_id)
    if org_id:
        query = query.filter(Deal.org_id == org_id)

    # Group by status
    query = query.group_by(Deal.status)

    # Get results
    results = query.all()

    # Create breakdown
    statuses = {status: count for status, count in results}
    breakdown = DealStatusBreakdown(statuses=statuses)

    return breakdown

def get_quick_action_counts(db: Session, user_id: str, org_id: Optional[str] = None) -> QuickActionCounts:
    """
    Get quick action counts

    Args:
        db: Database session
        user_id: User ID
        org_id: Organization ID (optional)

    Returns:
        Quick action counts
    """
    # Build query for deals
    deal_query = db.query(Deal)

    # Apply filters
    if user_id:
        deal_query = deal_query.filter(Deal.user_id == user_id)
    if org_id:
        deal_query = deal_query.filter(Deal.org_id == org_id)

    # Get deals
    deals = deal_query.all()
    deal_ids = [deal.id for deal in deals]

    # Count pending tasks
    pending_tasks = db.query(Task).filter(
        Task.deal_id.in_(deal_ids),
        Task.completed == False
    ).count()

    # Count unresolved alerts
    unresolved_alerts = db.query(DealAlert).filter(
        DealAlert.deal_id.in_(deal_ids),
        DealAlert.resolved == False
    ).count()

    # Count upcoming deadlines (tasks due in the next 7 days)
    today = date.today()
    upcoming_deadline = today + timedelta(days=7)
    upcoming_deadlines = db.query(Task).filter(
        Task.deal_id.in_(deal_ids),
        Task.completed == False,
        Task.due_date >= today,
        Task.due_date <= upcoming_deadline
    ).count()

    # Create counts
    counts = QuickActionCounts(
        pending_tasks=pending_tasks,
        unresolved_alerts=unresolved_alerts,
        upcoming_deadlines=upcoming_deadlines
    )

    return counts
