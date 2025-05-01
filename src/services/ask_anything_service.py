import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..models.chat import ChatMessage
from ..models.user import User
from ..models.lease_analysis import LeaseAnalysis
from ..schemas.ai_chat_schema import AskAnythingRequest, AskAnythingResponse
from ..utils.logging_utils import get_logger
from .security_service import validate_deal_access

# Get logger
logger = get_logger(__name__)

async def process_ask_anything(
    db: Session,
    deal_id: str,
    user_id: str,
    request: AskAnythingRequest,
    debug_mode: bool = False
) -> Dict[str, Any]:
    """
    Process an Ask Anything request

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        request: Ask Anything request
        debug_mode: Whether to include debug information in the response

    Returns:
        Ask Anything response
    """
    try:
        # Get the deal
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate system message with deal context
        system_message, context_used = await generate_deal_system_message(db, deal)

        # Get chat history
        chat_history = get_chat_history(db, deal_id)

        # Create messages array for the API
        messages = [
            {"role": "system", "content": system_message}
        ]

        # Add chat history
        messages.extend(chat_history)

        # Add the new user message
        messages.append({"role": "user", "content": request.message})

        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            raise HTTPException(status_code=500, detail="Fireworks API key not configured")

        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "accounts/fireworks/models/llama-v3-70b-instruct",
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.3
        }

        # Try the API endpoint
        try:
            response = requests.post(
                "https://api.fireworks.ai/inference/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=60
            )
            response.raise_for_status()
            response_json = response.json()
            reply = response_json["choices"][0]["message"]["content"]
        except Exception as e1:
            logger.error(f"Error with chat completions API: {str(e1)}. Trying completions API.")
            # Try the completions API as a fallback
            # Format the messages into a prompt
            prompt = ""
            for msg in messages:
                if msg["role"] == "system":
                    prompt += f"System: {msg['content']}\\n\\n"
                elif msg["role"] == "user":
                    prompt += f"User: {msg['content']}\\n"
                elif msg["role"] == "assistant":
                    prompt += f"Assistant: {msg['content']}\\n"

            prompt += "Assistant: "

            response = requests.post(
                "https://api.fireworks.ai/inference/v1/completions",
                headers=headers,
                json={
                    "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                    "prompt": prompt,
                    "max_tokens": 1000,
                    "temperature": 0.3,
                    "stop": ["User:", "System:"]
                },
                timeout=60
            )
            response.raise_for_status()
            response_json = response.json()
            reply = response_json["choices"][0]["text"].strip()

        # Save the user message to the database
        user_message = ChatMessage(
            id=str(os.urandom(16).hex()),
            deal_id=deal_id,
            user_id=user_id,
            role="user",
            content=request.message
        )
        db.add(user_message)

        # Save the AI response to the database
        ai_message = ChatMessage(
            id=str(os.urandom(16).hex()),
            deal_id=deal_id,
            user_id=user_id,
            role="assistant",
            content=reply
        )
        db.add(ai_message)

        # Commit the changes
        db.commit()

        # Prepare the response
        result = {
            "reply": reply,
            "context_used": context_used
        }

        # Add debug information if requested
        if debug_mode:
            result["debug"] = {
                "system_message": system_message,
                "chat_history_length": len(chat_history),
                "tokens_estimated": len(system_message.split()) + sum(len(msg["content"].split()) for msg in messages)
            }

        return result

    except Exception as e:
        # Rollback the transaction in case of error
        db.rollback()
        logger.error(f"Error processing Ask Anything request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing Ask Anything request: {str(e)}")

async def generate_deal_system_message(db: Session, deal: Deal) -> Tuple[str, Dict[str, Any]]:
    """
    Generate a system message with deal context for the AI

    Args:
        db: Database session
        deal: Deal object

    Returns:
        Tuple of (system_message, context_used)
    """
    # Format vacancy rate and exit cap rate as percentages
    vacancy_rate_pct = deal.vacancy_rate * 100 if deal.vacancy_rate < 1 else deal.vacancy_rate
    exit_cap_rate_pct = deal.exit_cap_rate * 100 if deal.exit_cap_rate < 1 else deal.exit_cap_rate

    # Format projected IRR as percentage if available
    projected_irr_str = f"{deal.projected_irr}%" if deal.projected_irr is not None else "Not calculated"

    # Get red flags from underwriting_result if available
    red_flags = "None"
    if deal.underwriting_result:
        try:
            underwriting_data = json.loads(deal.underwriting_result)
            if "red_flags" in underwriting_data and underwriting_data["red_flags"]:
                red_flags = ", ".join(underwriting_data["red_flags"])
        except (json.JSONDecodeError, TypeError):
            pass

    # Get tags if available
    tags = "None"
    if deal.tags:
        tags = deal.tags

    # Get lease analysis if available
    lease_analysis_text = "No lease analysis available"
    lease_analysis = db.query(LeaseAnalysis).filter(LeaseAnalysis.deal_id == deal.id).first()
    if lease_analysis:
        lease_analysis_text = f"""
Lease Analysis:
• Base Rent: {lease_analysis.base_rent}
• Lease Term: {lease_analysis.lease_term}
• Renewal Options: {lease_analysis.renewal_options}
• Break Clauses: {lease_analysis.break_clauses}
• Red Flags: {lease_analysis.red_flags}
"""

    # Create context used dictionary
    context_used = {
        "project_name": deal.project_name,
        "property_type": deal.property_type,
        "location": deal.location,
        "acquisition_price": deal.acquisition_price,
        "construction_cost": deal.construction_cost,
        "square_footage": deal.square_footage,
        "projected_rent_per_sf": deal.projected_rent_per_sf,
        "vacancy_rate": vacancy_rate_pct,
        "operating_expenses_per_sf": deal.operating_expenses_per_sf,
        "exit_cap_rate": exit_cap_rate_pct,
        "projected_irr": deal.projected_irr,
        "dscr": deal.dscr,
        "status": deal.status,
        "tags": tags,
        "red_flags": red_flags
    }

    # Add lease analysis to context if available
    if lease_analysis:
        context_used["lease_analysis"] = {
            "base_rent": lease_analysis.base_rent,
            "lease_term": lease_analysis.lease_term,
            "renewal_options": lease_analysis.renewal_options,
            "break_clauses": lease_analysis.break_clauses,
            "red_flags": lease_analysis.red_flags
        }

    # Create system message
    system_message = f"""You are a commercial real estate assistant. You answer questions about investment deals based on financials, risks, leases, memos, and deal tags. If context is missing, ask the user for clarification. If data looks poor, say so. Always respond clearly and as if talking to an investor.

Deal Information:
• Project Name: {deal.project_name}
• Property Type: {deal.property_type}
• Location: {deal.location}
• Price: ${deal.acquisition_price:,.2f}
• Construction Cost: ${deal.construction_cost:,.2f}
• Square Footage: {deal.square_footage:,.0f} SF
• Rent PSF: ${deal.projected_rent_per_sf:.2f}
• Vacancy Rate: {vacancy_rate_pct:.1f}%
• Operating Expenses PSF: ${deal.operating_expenses_per_sf:.2f}
• Exit Cap Rate: {exit_cap_rate_pct:.2f}%
• Projected IRR: {projected_irr_str}
• DSCR: {deal.dscr if deal.dscr is not None else "Not calculated"}
• Status: {deal.status}
• Tags: {tags}
• Red Flags: {red_flags}

{lease_analysis_text}

AI Memo:
{deal.ai_memo if deal.ai_memo else "No AI memo available"}

Remember:
1. If the user asks about IRR, reference the projected_irr value.
2. If the user asks for a summary, combine the memo and key metrics.
3. If the user asks about approval, remind them of their role and the approval process.
4. If lease information is available, include it in your reasoning.
5. Be honest about the quality of the data and ask for clarification if needed.
"""

    return system_message, context_used

def get_chat_history(db: Session, deal_id: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Get the chat history for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        limit: Maximum number of messages to return

    Returns:
        List of chat messages in the format expected by the AI model
    """
    # Get the most recent messages
    messages = db.query(ChatMessage).filter(
        ChatMessage.deal_id == deal_id
    ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()

    # Reverse the messages to get them in chronological order
    messages.reverse()

    # Format the messages for the AI model
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "role": msg.role,
            "content": msg.content
        })

    return formatted_messages
