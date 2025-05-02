import re
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.deal import Deal
from ..models.user import User
from ..schemas.deal_schema import DealUpdate
from ..deal_service import update_deal
from ..activity_log_service import log_action
from ..report_service import generate_report
from ..utils.tag_utils import parse_tags
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def extract_action_from_reply(reply: str) -> Optional[Dict[str, Any]]:
    """
    Extract action intent from AI reply
    
    Args:
        reply: The AI's reply
        
    Returns:
        Dictionary with action details or None if no action detected
    """
    reply_lower = reply.lower()
    
    # Check for approval action
    if any(phrase in reply_lower for phrase in ["approve this deal", "let's approve it", "recommend approval", "should be approved"]):
        return {"action": "approve"}
    
    # Check for report generation action
    if any(phrase in reply_lower for phrase in ["generate report", "create a report", "prepare a report", "generate a report"]):
        return {"action": "generate_report"}
    
    # Check for tag action
    tag_match = re.search(r'tag this deal as ([\w\s,\-]+)', reply_lower)
    if tag_match:
        tag_text = tag_match.group(1).strip()
        tags = [tag.strip() for tag in tag_text.split(',')]
        return {"action": "add_tag", "tags": tags}
    
    # No action detected
    return None

async def execute_action(
    db: Session,
    action_data: Dict[str, Any],
    deal_id: str,
    user_id: str,
    user_role: str,
    org_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute the detected action
    
    Args:
        db: Database session
        action_data: Action data from extract_action_from_reply
        deal_id: Deal ID
        user_id: User ID
        user_role: User role
        org_id: Organization ID
        
    Returns:
        Dictionary with action result
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the action
    action = action_data.get("action")
    
    # Execute the action
    if action == "approve":
        return await execute_approve_action(db, deal, user, user_role)
    elif action == "generate_report":
        return await execute_generate_report_action(db, deal, user, user_role)
    elif action == "add_tag":
        return await execute_add_tag_action(db, deal, user, action_data.get("tags", []))
    else:
        return {"action_triggered": None, "status": "No action executed"}

async def execute_approve_action(
    db: Session,
    deal: Deal,
    user: User,
    user_role: str
) -> Dict[str, Any]:
    """
    Execute the approve action
    
    Args:
        db: Database session
        deal: Deal object
        user: User object
        user_role: User role
        
    Returns:
        Dictionary with action result
    """
    # Check if user has permission to approve deals
    if user_role not in ["Admin", "Manager"]:
        return {
            "action_triggered": "approve",
            "status": "Permission denied: Only Managers and Admins can approve deals"
        }
    
    # Check if deal is already approved
    if deal.status == "approved":
        return {
            "action_triggered": "approve",
            "status": "Deal is already approved"
        }
    
    # Update deal status
    deal_update = DealUpdate(status="approved")
    updated_deal = update_deal(
        db, 
        deal_id=deal.id, 
        deal=deal_update, 
        user_id=user.id, 
        org_id=user.org_id
    )
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=user.id,
            org_id=deal.org_id if deal.org_id else user.org_id,
            action="ai_approved_deal",
            message=f"{user.name} approved deal via AI chat: {deal.project_name}",
            deal_id=deal.id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return {
        "action_triggered": "approve",
        "status": "Deal has been approved"
    }

async def execute_generate_report_action(
    db: Session,
    deal: Deal,
    user: User,
    user_role: str
) -> Dict[str, Any]:
    """
    Execute the generate report action
    
    Args:
        db: Database session
        deal: Deal object
        user: User object
        user_role: User role
        
    Returns:
        Dictionary with action result
    """
    # Check if user has permission to generate reports
    if user_role not in ["Admin", "Manager", "Analyst"]:
        return {
            "action_triggered": "generate_report",
            "status": "Permission denied: Only Analysts, Managers, and Admins can generate reports"
        }
    
    # Generate the report
    try:
        report_result = await generate_report(db, deal.id, user.id)
        
        # Log the action
        try:
            log_action(
                db=db,
                user_id=user.id,
                org_id=deal.org_id if deal.org_id else user.org_id,
                action="ai_generated_report",
                message=f"{user.name} generated a report via AI chat for deal: {deal.project_name}",
                deal_id=deal.id
            )
        except ValueError:
            # Ignore errors in activity logging
            pass
        
        return {
            "action_triggered": "generate_report",
            "status": "Report has been generated",
            "report_url": report_result.get("report_url")
        }
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return {
            "action_triggered": "generate_report",
            "status": f"Error generating report: {str(e)}"
        }

async def execute_add_tag_action(
    db: Session,
    deal: Deal,
    user: User,
    tags: List[str]
) -> Dict[str, Any]:
    """
    Execute the add tag action
    
    Args:
        db: Database session
        deal: Deal object
        user: User object
        tags: List of tags to add
        
    Returns:
        Dictionary with action result
    """
    if not tags:
        return {
            "action_triggered": "add_tag",
            "status": "No tags provided"
        }
    
    # Parse and normalize the tags
    normalized_tags = parse_tags(tags)
    
    # Get existing tags
    existing_tags = deal.tags_list if hasattr(deal, "tags_list") else []
    if not existing_tags and deal.tags:
        existing_tags = deal.tags.split(",")
    
    # Merge with new tags
    merged_tags = list(set(existing_tags + normalized_tags))
    
    # Create a DealUpdate with the merged tags
    deal_update = DealUpdate(tags=merged_tags)
    
    # Update the deal
    updated_deal = update_deal(
        db, 
        deal_id=deal.id, 
        deal=deal_update, 
        user_id=user.id, 
        org_id=user.org_id
    )
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=user.id,
            org_id=deal.org_id if deal.org_id else user.org_id,
            action="ai_added_tags",
            message=f"{user.name} added tags via AI chat to deal: {deal.project_name}. Added: {', '.join(normalized_tags)}",
            deal_id=deal.id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return {
        "action_triggered": "add_tag",
        "status": f"Tags added: {', '.join(normalized_tags)}"
    }
