import os
import json
import uuid
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models.chat import ChatMessage
from ..models.deal import Deal
from ..schemas.chat_schema import ChatMessageCreate, ChatMessageRequest, ChatMessageResponse
from ..schemas.ai_chat_schema import ChatMessage as AIChatMessage

def get_deal_chat_history(db: Session, deal_id: str) -> List[ChatMessage]:
    """
    Get the chat history for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        List of ChatMessage objects
    """
    return db.query(ChatMessage).filter(ChatMessage.deal_id == deal_id).order_by(ChatMessage.timestamp).all()

def save_chat_message(db: Session, user_id: str, deal_id: str, role: str, content: str) -> ChatMessage:
    """
    Save a chat message to the database
    
    Args:
        db: Database session
        user_id: User ID
        deal_id: Deal ID
        role: Message role ("user" or "assistant")
        content: Message content
        
    Returns:
        Created ChatMessage object
    """
    # Create new chat message
    db_message = ChatMessage(
        id=str(uuid.uuid4()),
        deal_id=deal_id,
        user_id=user_id,
        role=role,
        content=content
    )
    
    # Add chat message to database
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

def get_deal_context(deal: Deal) -> Dict[str, Any]:
    """
    Get the context for a deal
    
    Args:
        deal: Deal object
        
    Returns:
        Deal context as a dictionary
    """
    return {
        "project_name": deal.project_name,
        "location": deal.location,
        "property_type": deal.property_type,
        "acquisition_price": deal.acquisition_price,
        "construction_cost": deal.construction_cost,
        "square_footage": deal.square_footage,
        "projected_rent_per_sf": deal.projected_rent_per_sf,
        "vacancy_rate": deal.vacancy_rate,
        "operating_expenses_per_sf": deal.operating_expenses_per_sf,
        "exit_cap_rate": deal.exit_cap_rate
    }

def format_chat_history(chat_history: List[ChatMessage]) -> List[Dict[str, str]]:
    """
    Format chat history for the AI model
    
    Args:
        chat_history: List of ChatMessage objects
        
    Returns:
        Formatted chat history as a list of dictionaries
    """
    return [{"role": msg.role, "content": msg.content} for msg in chat_history]

async def process_chat_message(
    db: Session, 
    user_id: str, 
    deal_id: str, 
    request: ChatMessageRequest,
    deal: Deal
) -> ChatMessageResponse:
    """
    Process a chat message
    
    Args:
        db: Database session
        user_id: User ID
        deal_id: Deal ID
        request: Chat message request
        deal: Deal object
        
    Returns:
        Chat message response
    """
    # Get chat history
    chat_history = get_deal_chat_history(db, deal_id)
    
    # Save user message
    user_message = save_chat_message(db, user_id, deal_id, "user", request.message)
    
    # Format chat history for the AI model
    formatted_history = format_chat_history(chat_history)
    
    # Add the new user message
    formatted_history.append({"role": "user", "content": request.message})
    
    # Get deal context
    context = get_deal_context(deal)
    
    # Generate AI response
    ai_response = await generate_ai_response(formatted_history, context)
    
    # Save AI response
    assistant_message = save_chat_message(db, user_id, deal_id, "assistant", ai_response)
    
    # Create response
    response = ChatMessageResponse(
        reply=ai_response,
        deal_id=deal_id,
        timestamp=assistant_message.timestamp
    )
    
    return response

async def generate_ai_response(chat_history: List[Dict[str, str]], context: Dict[str, Any]) -> str:
    """
    Generate an AI response using DeepSeek model via Fireworks API
    
    Args:
        chat_history: Formatted chat history
        context: Deal context
        
    Returns:
        AI response
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        
        if use_fallback:
            return _get_fallback_response(chat_history, context)
        
        # Get Fireworks API key
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            return _get_fallback_response(chat_history, context)
        
        # Create system message with context
        context_str = json.dumps(context, indent=2)
        system_message = f"""You are a senior commercial real estate investment analyst. Speak in clear, professional, and helpful language. Your goal is to assist analysts and managers in evaluating CRE deals using logic, financial metrics, and institutional reasoning.

Deal Context:
{context_str}

Use the deal context to inform your responses. Always consider the context when answering user questions.
Never make up numbers. Always ask for missing context when needed.

Respond concisely and professionally."""
        
        # Format messages for the API
        messages = [
            {"role": "system", "content": system_message}
        ]
        
        # Add chat history
        messages.extend(chat_history)
        
        # Send request to Fireworks API
        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "accounts/fireworks/models/deepseek-coder-6.7b",
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.3
        }
        
        response = requests.post(
            "https://api.fireworks.ai/inference/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Extract the assistant's response
        response_json = response.json()
        reply = response_json["choices"][0]["message"]["content"]
        
        return reply
    
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        return _get_fallback_response(chat_history, context)

def _get_fallback_response(chat_history: List[Dict[str, str]], context: Dict[str, Any]) -> str:
    """
    Get a fallback response when the AI API is unavailable
    
    Args:
        chat_history: Formatted chat history
        context: Deal context
        
    Returns:
        Fallback response
    """
    # Get the last user message
    last_user_message = chat_history[-1]["content"] if chat_history else ""
    
    # Check if context is empty or missing critical values
    critical_fields = ["acquisition_price", "construction_cost", "square_footage", "projected_rent_per_sf", "exit_cap_rate"]
    missing_critical_values = not context or all(context.get(field) in [None, "", 0] for field in critical_fields)
    
    # If missing critical values, ask for them
    if missing_critical_values:
        return "I'd love to help analyze this deal, but I'll need some more information. Could you please provide details such as the acquisition price, construction cost, square footage, projected rent per square foot, and exit cap rate? This will help me give you an accurate assessment."
    
    # Check for common question types and provide appropriate responses
    lower_message = last_user_message.lower()
    
    if any(term in lower_message for term in ["irr", "return", "yield"]):
        # Calculate a simple IRR estimate based on development margin
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0
        estimated_irr = development_margin / 5  # Simple approximation
        
        return f"Based on the information provided for {context.get('project_name', 'the project')}, I estimate the IRR to be approximately {estimated_irr:.1f}%. This is calculated using a development margin of {development_margin:.1f}% and an exit cap rate of {context.get('exit_cap_rate', 7)}%. Would you like me to break down the calculation in more detail?"
    
    elif any(term in lower_message for term in ["cap rate", "capitalization"]):
        # Calculate cap rate
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        cap_rate = (noi / project_cost) * 100 if project_cost > 0 else 0
        
        return f"The cap rate for {context.get('project_name', 'the project')} is approximately {cap_rate:.2f}%, based on an NOI of ${noi:,.2f} and a total project cost of ${project_cost:,.2f}."
    
    elif any(term in lower_message for term in ["noi", "net operating income"]):
        # Calculate NOI
        noi = _calculate_noi(context)
        
        return f"The Net Operating Income (NOI) for {context.get('project_name', 'the project')} is approximately ${noi:,.2f}, based on the provided rent, vacancy, and operating expense figures."
    
    else:
        return f"I'm here to help analyze {context.get('project_name', 'your deal')}. You can ask me about financial metrics like IRR, cap rate, NOI, or development margin. I can also provide risk assessments or summarize the deal for you. What would you like to know?"

def _calculate_noi(context: Dict[str, Any]) -> float:
    """
    Calculate Net Operating Income based on context
    
    Args:
        context: Deal context
        
    Returns:
        Net Operating Income
    """
    square_footage = context.get("square_footage", 0)
    rent_per_sf = context.get("projected_rent_per_sf", 0)
    vacancy_rate = context.get("vacancy_rate", 5)
    op_ex_per_sf = context.get("operating_expenses_per_sf", 0)
    
    # Calculate Gross Potential Income (GPI)
    gpi = square_footage * rent_per_sf
    
    # Calculate Effective Gross Income (EGI)
    egi = gpi * (1 - vacancy_rate / 100)
    
    # Calculate Operating Expenses
    op_ex = square_footage * op_ex_per_sf
    
    # Calculate Net Operating Income (NOI)
    noi = egi - op_ex
    
    return noi
