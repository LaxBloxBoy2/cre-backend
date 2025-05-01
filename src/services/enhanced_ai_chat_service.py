import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..models.chat import ChatMessage
from ..models.user import User
from ..schemas.ai_chat_schema import ChatMessage as ChatMessageSchema
from ..schemas.chat_schema import ChatMessageResponse
from ..action_detection_service import extract_action_from_reply, execute_action
from ..conversation_state_service import get_or_create_conversation_state
from ..workflow_service import detect_workflow_intent, process_workflow_step

async def generate_deal_system_message(deal: Deal) -> str:
    """
    Generate a system message with deal context for the AI

    Args:
        deal: The deal object

    Returns:
        System message with deal context
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

    system_message = f"""You are a commercial real estate AI assistant. You are analyzing a deal with the following details:

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

Guide users step-by-step through deal analysis, underwriting, lease upload, and report generation. You can ask questions, remember previous steps, and trigger actions when the user confirms.

Respond clearly, explain assumptions, and reference deal metrics in your reasoning. Be concise but thorough in your analysis.

You can suggest actionable steps. If you say any of the following phrases, the system will automatically execute the corresponding action:
- "Approve this deal" - The system will change the deal status to approved (Managers/Admins only)
- "Generate a report" - The system will generate a PDF report for this deal
- "Tag this deal as X, Y, Z" - The system will add the specified tags to the deal
"""
    return system_message

def detect_user_intent(message: str) -> str:
    """
    Detect the user's intent from their message

    Args:
        message: The user's message

    Returns:
        The detected intent
    """
    message_lower = message.lower()

    # Check for deal quality questions
    if any(phrase in message_lower for phrase in ["is this deal good", "good deal", "worth investing", "should i invest", "good investment"]):
        return "deal_quality"

    # Check for risk assessment questions
    if any(phrase in message_lower for phrase in ["risk", "risky", "downside", "concerns", "red flags", "problems"]):
        return "risk_assessment"

    # Check for summary requests
    if any(phrase in message_lower for phrase in ["summary", "summarize", "overview", "memo", "generate memo", "generate summary"]):
        return "generate_summary"

    # Check for financial analysis requests
    if any(phrase in message_lower for phrase in ["irr", "cap rate", "noi", "cash flow", "return", "dscr", "debt service", "financial"]):
        return "financial_analysis"

    # Default intent
    return "general_question"

def enhance_system_message(system_message: str, intent: str, deal: Deal) -> str:
    """
    Enhance the system message based on the detected intent

    Args:
        system_message: The base system message
        intent: The detected intent
        deal: The deal object

    Returns:
        Enhanced system message
    """
    if intent == "deal_quality":
        system_message += """
Focus on evaluating the overall quality of this deal. Analyze the IRR, DSCR, and other key metrics to determine if this is a good investment opportunity. Consider the property type, location, and any red flags. Provide a clear recommendation.
"""
    elif intent == "risk_assessment":
        system_message += """
Focus on identifying and explaining the risks associated with this deal. Consider market risks, property-specific risks, financial risks, and any red flags. Provide a balanced assessment of the risk factors.
"""
    elif intent == "generate_summary":
        system_message += """
Generate a concise investment summary for this deal. Structure your response like a professional investment memo with key sections including property overview, financial highlights, investment rationale, and risks. Be persuasive but honest about the deal's merits and challenges.
"""
    elif intent == "financial_analysis":
        system_message += """
Provide a detailed financial analysis of this deal. Focus on key metrics like NOI, IRR, cap rate, and DSCR. Explain what these metrics mean in the context of this specific deal and how they compare to industry benchmarks.
"""

    # Add status-based guidance
    if deal.status == "draft":
        system_message += """
Note that this deal is still in draft status, which means it has not been fully reviewed or approved. Your analysis should be preliminary and subject to further due diligence.
"""
    elif deal.status == "rejected":
        system_message += """
Note that this deal has been rejected. You should acknowledge this in your response and focus on explaining potential reasons for rejection based on the deal metrics.
"""

    return system_message

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

async def process_enhanced_ai_chat(
    db: Session,
    deal_id: str,
    user_id: str,
    message: str,
    debug_mode: bool = False
) -> Dict[str, Any]:
    """
    Process an enhanced AI chat request

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        message: User message
        debug_mode: Whether to include debug information in the response

    Returns:
        Chat response with the AI's reply
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

        # Get or create conversation state
        conversation_state = get_or_create_conversation_state(db, deal_id, user_id)

        # Check if this is a workflow message
        workflow_intent = detect_workflow_intent(message)

        # If this is a workflow message or we're already in a workflow, process it
        if workflow_intent or conversation_state.current_task:
            workflow_response, updated_state = process_workflow_step(
                db,
                deal,
                user,
                message,
                conversation_state
            )

            # Save the user message to the database
            user_message = ChatMessage(
                id=str(os.urandom(16).hex()),
                deal_id=deal_id,
                user_id=user_id,
                role="user",
                content=message
            )
            db.add(user_message)

            # Save the AI response to the database
            ai_message = ChatMessage(
                id=str(os.urandom(16).hex()),
                deal_id=deal_id,
                user_id=user_id,
                role="assistant",
                content=workflow_response
            )
            db.add(ai_message)

            # Commit the changes
            db.commit()

            # Prepare the response
            result = {
                "reply": workflow_response,
                "deal_id": deal_id,
                "timestamp": ai_message.timestamp
            }

            # Add debug information if requested
            if debug_mode:
                result["debug"] = {
                    "workflow": True,
                    "current_task": updated_state["current_task"],
                    "step": updated_state["step"],
                    "inputs": updated_state["inputs"]
                }

            return result

        # Generate system message with deal context
        system_message = await generate_deal_system_message(deal)

        # Detect user intent
        intent = detect_user_intent(message)

        # Enhance system message based on intent
        enhanced_system_message = enhance_system_message(system_message, intent, deal)

        # Get chat history
        chat_history = get_chat_history(db, deal_id)

        # Create messages array for the API
        messages = [
            {"role": "system", "content": enhanced_system_message}
        ]

        # Add chat history
        messages.extend(chat_history)

        # Add the new user message
        messages.append({"role": "user", "content": message})

        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            raise HTTPException(status_code=500, detail="Fireworks API key not configured")

        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "accounts/fireworks/models/llama-v3-8b-instruct",
            "messages": messages,
            "max_tokens": 800,
            "temperature": 0.3
        }

        response = requests.post(
            "https://api.fireworks.ai/inference/v1/completions",
            headers=headers,
            json=data,
            timeout=60
        )

        # Check if the request was successful
        response.raise_for_status()

        # Extract the assistant's response
        response_json = response.json()
        reply = response_json["choices"][0]["message"]["content"]

        # Save the user message to the database
        user_message = ChatMessage(
            id=str(os.urandom(16).hex()),
            deal_id=deal_id,
            user_id=user_id,
            role="user",
            content=message
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

        # Detect action in the AI reply
        action_data = extract_action_from_reply(reply)

        # Prepare the base response
        result = {
            "reply": reply,
            "deal_id": deal_id,
            "timestamp": ai_message.timestamp
        }

        # Execute the action if detected
        if action_data:
            # Execute the action
            action_result = await execute_action(
                db=db,
                action_data=action_data,
                deal_id=deal_id,
                user_id=user_id,
                user_role=user.role,
                org_id=user.org_id
            )

            # Add action result to the response
            result["action_triggered"] = action_result.get("action_triggered")
            result["status"] = action_result.get("status")

            # Add report URL if available
            if "report_url" in action_result:
                result["report_url"] = action_result.get("report_url")

        # Add debug information if requested
        if debug_mode:
            result["debug"] = {
                "intent": intent,
                "system_message": enhanced_system_message,
                "chat_history_length": len(chat_history),
                "tokens_estimated": len(enhanced_system_message.split()) + sum(len(msg["content"].split()) for msg in messages),
                "action_detected": action_data["action"] if action_data else None,
                "workflow": False
            }

        return result

    except Exception as e:
        # Rollback the transaction in case of error
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing AI chat: {str(e)}")
