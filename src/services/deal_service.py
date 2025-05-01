import uuid
import json
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from ..models.deal import Deal
from ..models.user import User
from ..schemas.deal_schema import DealRequest, ROIResponse, DealCreate, DealUpdate
from .activity_log_service import log_action
from .security_service import can_edit_deal
from ..utils.logging_utils import get_logger
from ..utils.tag_utils import parse_tags

# Get logger
logger = get_logger(__name__)


def calculate_roi(deal: DealRequest) -> ROIResponse:
    """
    Calculate Return on Investment (ROI) for a real estate deal

    Args:
        deal: The deal request containing property price and rental income

    Returns:
        ROI response with calculated ROI percentage
    """
    # Calculate ROI: (Annual Rental Income / Property Price) * 100
    roi = (deal.rental_income * 12 / deal.property_price) * 100
    # Round to 2 decimal places
    roi = round(roi, 2)
    return ROIResponse(roi=roi)


def calculate_deal_metrics(
    acquisition_price: float,
    construction_cost: float,
    projected_rent_per_sf: float,
    square_footage: float,
    vacancy_rate: float,
    operating_expenses_per_sf: float,
    exit_cap_rate: float
) -> dict:
    """
    Calculate financial metrics for a real estate deal

    Args:
        acquisition_price: The acquisition price of the property
        construction_cost: The construction/renovation cost
        projected_rent_per_sf: The projected rent per square foot
        square_footage: The total square footage of the property
        vacancy_rate: The projected vacancy rate (as a decimal, e.g., 0.05 for 5%)
        operating_expenses_per_sf: The operating expenses per square foot
        exit_cap_rate: The exit capitalization rate (as a decimal, e.g., 0.06 for 6%)

    Returns:
        Dictionary with calculated metrics (projected_irr, dscr, noi)
    """
    # Calculate total project cost
    total_cost = acquisition_price + construction_cost

    # Estimate NOI (Net Operating Income)
    gross_rent = projected_rent_per_sf * square_footage
    effective_rent = gross_rent * (1 - vacancy_rate)
    operating_expenses = operating_expenses_per_sf * square_footage
    noi = effective_rent - operating_expenses

    # DSCR estimate (assuming fixed debt service of 8% of total cost per year)
    debt_service = 0.08 * total_cost
    dscr = round(noi / debt_service, 2) if debt_service > 0 else None

    # IRR estimate — simplified 5-year hold with exit
    exit_value = noi / (exit_cap_rate if exit_cap_rate > 0 else 0.06)  # Prevent division by zero
    gain = exit_value - total_cost
    irr = round(((gain / total_cost) / 5) * 100, 2) if total_cost > 0 else None

    return {
        "projected_irr": irr,
        "dscr": dscr,
        "noi": round(noi, 2),
        "exit_value": round(exit_value, 2)
    }


def get_deal(db: Session, deal_id: str, current_user=None, include_property_attributes=True):
    """
    Get a deal by ID

    Args:
        db: Database session
        deal_id: Deal ID
        current_user: Current user (optional, for setting can_edit flag)
        include_property_attributes: Whether to include property attributes (default: True)

    Returns:
        Deal object
    """
    query = db.query(Deal).filter(Deal.id == deal_id)

    # Include property attributes if requested
    if include_property_attributes:
        query = query.options(joinedload(Deal.property_attributes))

    deal = query.first()

    # Set can_edit flag if current_user is provided
    if deal and current_user:
        deal.can_edit = can_edit_deal(current_user, deal)

    return deal


def get_deals(db: Session, skip: int = 0, limit: int = 100, user_id: str = None, org_id: str = None,
           status: str = None, tags: str = None, irr_gt: float = None, irr_lt: float = None,
           dscr_gt: float = None, dscr_lt: float = None, current_user=None, visibility: str = None):
    """
    Get all deals, optionally filtered by various criteria

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        user_id: User ID to filter by
        org_id: Organization ID to filter by
        status: Status to filter by
        tags: Comma-separated list of tags to filter by (OR condition)
        irr_gt: Filter by IRR greater than this value
        irr_lt: Filter by IRR less than this value
        dscr_gt: Filter by DSCR greater than this value
        dscr_lt: Filter by DSCR less than this value

    Returns:
        List of Deal objects
    """
    query = db.query(Deal)

    # Filter by user ID if provided
    if user_id:
        query = query.filter(Deal.user_id == user_id)

    # Filter by organization ID if provided
    if org_id:
        query = query.filter(Deal.org_id == org_id)

    # Filter by status if provided
    if status:
        query = query.filter(Deal.status == status)

    # Filter by tags if provided
    if tags:
        # Parse the tags
        tag_list = parse_tags(tags)
        if tag_list:
            # Create a filter for each tag (OR condition)
            from sqlalchemy import or_
            tag_filters = [Deal.tags.like(f'%{tag}%') for tag in tag_list]
            query = query.filter(or_(*tag_filters))

    # Filter by IRR if provided
    if irr_gt is not None:
        query = query.filter(Deal.projected_irr >= irr_gt)
    if irr_lt is not None:
        query = query.filter(Deal.projected_irr <= irr_lt)

    # Filter by DSCR if provided
    if dscr_gt is not None:
        query = query.filter(Deal.dscr >= dscr_gt)
    if dscr_lt is not None:
        query = query.filter(Deal.dscr <= dscr_lt)

    # Filter by visibility if provided
    if visibility:
        query = query.filter(Deal.visibility == visibility)

    # Get deals
    deals = query.offset(skip).limit(limit).all()

    # Set can_edit flag if current_user is provided
    if current_user:
        for deal in deals:
            deal.can_edit = can_edit_deal(current_user, deal)

    return deals


def create_deal(db: Session, deal: DealCreate, user_id: str, org_id: str = None):
    """
    Create a new deal

    Args:
        db: Database session
        deal: Deal data
        user_id: User ID
        org_id: Organization ID

    Returns:
        Created Deal object
    """
    # Convert underwriting_result to JSON string if provided
    underwriting_result_str = None
    if deal.underwriting_result:
        underwriting_result_str = json.dumps(deal.underwriting_result)

    # If org_id is not provided, get it from the user
    if not org_id:
        from ..models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.org_id:
            org_id = user.org_id

    # Process tags if provided
    tags_str = None
    if deal.tags:
        normalized_tags = parse_tags(deal.tags)
        if normalized_tags:
            tags_str = ','.join(normalized_tags)

    # Calculate financial metrics
    metrics = calculate_deal_metrics(
        acquisition_price=deal.acquisition_price,
        construction_cost=deal.construction_cost,
        projected_rent_per_sf=deal.projected_rent_per_sf,
        square_footage=deal.square_footage,
        vacancy_rate=deal.vacancy_rate,
        operating_expenses_per_sf=deal.operating_expenses_per_sf,
        exit_cap_rate=deal.exit_cap_rate
    )

    # Use provided IRR/DSCR if available, otherwise use calculated values
    projected_irr = deal.projected_irr if deal.projected_irr is not None else metrics["projected_irr"]
    dscr = deal.dscr if deal.dscr is not None else metrics["dscr"]

    # Create new deal
    db_deal = Deal(
        id=str(uuid.uuid4()),
        user_id=user_id,
        org_id=org_id,
        project_name=deal.project_name,
        location=deal.location,
        property_type=deal.property_type,
        acquisition_price=deal.acquisition_price,
        construction_cost=deal.construction_cost,
        square_footage=deal.square_footage,
        projected_rent_per_sf=deal.projected_rent_per_sf,
        vacancy_rate=deal.vacancy_rate,
        operating_expenses_per_sf=deal.operating_expenses_per_sf,
        exit_cap_rate=deal.exit_cap_rate,
        underwriting_result=underwriting_result_str,
        ai_memo=deal.ai_memo,
        status=deal.status,
        tags=tags_str,
        projected_irr=projected_irr,
        dscr=dscr
    )

    # Add deal to database
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)

    # Log the action
    try:
        # Get the user's name
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "Unknown"

        log_action(
            db=db,
            user_id=user_id,
            org_id=org_id,
            action="created",
            message=f"{user_name} created a new deal: {db_deal.project_name}.",
            deal_id=db_deal.id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    return db_deal


def update_deal(db: Session, deal_id: str, deal: DealUpdate, user_id: str = None, org_id: str = None):
    """
    Update a deal

    Args:
        db: Database session
        deal_id: Deal ID
        deal: Deal data
        user_id: User ID (for authorization)
        org_id: Organization ID (for authorization)

    Returns:
        Updated Deal object
    """
    # Get deal
    db_deal = get_deal(db, deal_id=deal_id)
    if not db_deal:
        logger.warning(f"Deal not found during update - ID: {deal_id}, requested by user: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if user is authorized to update this deal
    if user_id and db_deal.user_id != user_id:
        # If user is not the owner, check if they are in the same organization
        if org_id and db_deal.org_id == org_id:
            # User is in the same organization, allow update
            pass
        else:
            logger.warning(
                f"Unauthorized update attempt - User: {user_id} (org: {org_id}) "
                f"tried to update deal: {deal_id} (owner: {db_deal.user_id}, org: {db_deal.org_id})"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this deal"
            )

    # Get the old status for comparison
    old_status = db_deal.status

    # Update deal data
    deal_data = deal.model_dump(exclude_unset=True)

    # Convert underwriting_result to JSON string if provided
    if "underwriting_result" in deal_data and deal_data["underwriting_result"] is not None:
        deal_data["underwriting_result"] = json.dumps(deal_data["underwriting_result"])

    # Process tags if provided
    if "tags" in deal_data and deal_data["tags"] is not None:
        normalized_tags = parse_tags(deal_data["tags"])
        if normalized_tags:
            deal_data["tags"] = ','.join(normalized_tags)
        else:
            deal_data["tags"] = None

    # Recalculate financial metrics if any relevant fields are updated
    should_recalculate = any(field in deal_data for field in [
        "acquisition_price", "construction_cost", "projected_rent_per_sf",
        "square_footage", "vacancy_rate", "operating_expenses_per_sf", "exit_cap_rate"
    ])

    if should_recalculate:
        # Get current values, overriding with updated values if provided
        acquisition_price = deal_data.get("acquisition_price", db_deal.acquisition_price)
        construction_cost = deal_data.get("construction_cost", db_deal.construction_cost)
        projected_rent_per_sf = deal_data.get("projected_rent_per_sf", db_deal.projected_rent_per_sf)
        square_footage = deal_data.get("square_footage", db_deal.square_footage)
        vacancy_rate = deal_data.get("vacancy_rate", db_deal.vacancy_rate)
        operating_expenses_per_sf = deal_data.get("operating_expenses_per_sf", db_deal.operating_expenses_per_sf)
        exit_cap_rate = deal_data.get("exit_cap_rate", db_deal.exit_cap_rate)

        # Calculate metrics
        metrics = calculate_deal_metrics(
            acquisition_price=acquisition_price,
            construction_cost=construction_cost,
            projected_rent_per_sf=projected_rent_per_sf,
            square_footage=square_footage,
            vacancy_rate=vacancy_rate,
            operating_expenses_per_sf=operating_expenses_per_sf,
            exit_cap_rate=exit_cap_rate
        )

        # Only update IRR/DSCR if not explicitly provided in the update
        if "projected_irr" not in deal_data:
            deal_data["projected_irr"] = metrics["projected_irr"]
        if "dscr" not in deal_data:
            deal_data["dscr"] = metrics["dscr"]

    # Update deal
    for key, value in deal_data.items():
        setattr(db_deal, key, value)

    # Commit changes
    db.commit()
    db.refresh(db_deal)

    # Log the action
    try:
        # Get the user's name
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "Unknown"

        # Check if the status was changed
        if "status" in deal_data and old_status != db_deal.status:
            log_action(
                db=db,
                user_id=user_id,
                org_id=db_deal.org_id,
                action="status_changed",
                message=f"{user_name} changed the status of {db_deal.project_name} from {old_status} to {db_deal.status}.",
                deal_id=db_deal.id
            )
        else:
            log_action(
                db=db,
                user_id=user_id,
                org_id=db_deal.org_id,
                action="updated",
                message=f"{user_name} updated the deal: {db_deal.project_name}.",
                deal_id=db_deal.id
            )
    except ValueError:
        # Ignore errors in activity logging
        pass

    return db_deal


def delete_deal(db: Session, deal_id: str, user_id: str = None, org_id: str = None):
    """
    Delete a deal

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID (for authorization)
        org_id: Organization ID (for authorization)

    Returns:
        None
    """
    # Get deal
    db_deal = get_deal(db, deal_id=deal_id)
    if not db_deal:
        logger.warning(f"Deal not found during delete - ID: {deal_id}, requested by user: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if user is authorized to delete this deal
    if user_id and db_deal.user_id != user_id:
        # If user is not the owner, check if they are in the same organization and have appropriate role
        if org_id and db_deal.org_id == org_id:
            # Check if user has appropriate role (Owner or Manager)
            from ..models.user import User
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.org_role in ["Owner", "Manager"]:
                # User is in the same organization and has appropriate role, allow delete
                pass
            else:
                logger.warning(
                    f"Unauthorized delete attempt - User: {user_id} (org: {org_id}, role: {user.org_role}) "
                    f"tried to delete deal: {deal_id} (owner: {db_deal.user_id}, org: {db_deal.org_id})"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this deal"
                )
        else:
            logger.warning(
                f"Unauthorized delete attempt - User: {user_id} (org: {org_id}) "
                f"tried to delete deal: {deal_id} (owner: {db_deal.user_id}, org: {db_deal.org_id})"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this deal"
            )

    # Log the action before deleting
    try:
        # Get the user's name
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "Unknown"

        log_action(
            db=db,
            user_id=user_id,
            org_id=db_deal.org_id,
            action="deleted",
            message=f"{user_name} deleted the deal: {db_deal.project_name}.",
            deal_id=db_deal.id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Delete deal
    db.delete(db_deal)
    db.commit()

    return None
