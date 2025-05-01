from fastapi import APIRouter, Path, Query, Depends, HTTPException, status, Request
from typing import List, Dict
from ..schemas.crud_deal_schema import DealCreate, DealUpdate, Deal, DealList
from ..schemas.auth_schema import User
from ..services.crud_deal_service import create_deal, get_deals, get_deal, update_deal, delete_deal
from ..services.auth_service_db import get_current_active_user
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/deals", response_model=Deal)
@limiter.limit("20/minute")
async def create_deal_route(request: Request, deal: DealCreate, current_user: User = Depends(get_current_active_user)):
    """
    Create a new commercial real estate deal

    Args:
        deal: The deal data to create

    Returns:
        The created deal with ID and timestamps
    """
    return create_deal(deal)


@router.get("/deals", response_model=DealList)
@limiter.limit("20/minute")
async def get_deals_route(
    request: Request,
    skip: int = Query(0, description="Number of deals to skip"),
    limit: int = Query(100, description="Maximum number of deals to return"),
    status: str = Query(None, description="Filter deals by status"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all commercial real estate deals

    Args:
        skip: Number of deals to skip (for pagination)
        limit: Maximum number of deals to return (for pagination)
        status: Filter deals by status (optional)

    Returns:
        List of deals
    """
    deals = get_deals()

    # Filter by status if provided
    if status:
        deals = [deal for deal in deals if deal.status == status]

    # Apply pagination
    total = len(deals)
    deals = deals[skip:skip + limit]

    return DealList(deals=deals, total=total)


@router.get("/deals/{deal_id}", response_model=Deal)
@limiter.limit("20/minute")
async def get_deal_route(
    request: Request,
    deal_id: str = Path(..., description="The ID of the deal to get"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a commercial real estate deal by ID

    Args:
        deal_id: The ID of the deal to get

    Returns:
        The deal with the specified ID
    """
    return get_deal(deal_id)


@router.put("/deals/{deal_id}", response_model=Deal)
@limiter.limit("20/minute")
async def update_deal_route(
    request: Request,
    deal_update: DealUpdate,
    deal_id: str = Path(..., description="The ID of the deal to update"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a commercial real estate deal

    Args:
        deal_id: The ID of the deal to update
        deal_update: The deal data to update

    Returns:
        The updated deal
    """
    # Check if user has permission to update deals
    if current_user.role == "Analyst":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analysts are not allowed to update deals"
        )

    return update_deal(deal_id, deal_update)


@router.delete("/deals/{deal_id}", response_model=Dict[str, str])
@limiter.limit("20/minute")
async def delete_deal_route(
    request: Request,
    deal_id: str = Path(..., description="The ID of the deal to delete"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a commercial real estate deal

    Args:
        deal_id: The ID of the deal to delete

    Returns:
        A message indicating the deal was deleted
    """
    # Check if user has permission to delete deals (Admin only)
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete deals"
        )

    return delete_deal(deal_id)
