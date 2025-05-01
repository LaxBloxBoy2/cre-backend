import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..models.user import User
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

async def generate_ai_summary(
    db: Session,
    deal_id: str,
    user_id: str
) -> Dict[str, Any]:
    """
    Generate a 3-line AI summary for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Dictionary with the AI summary
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
            
        # Format vacancy rate and exit cap rate as percentages
        vacancy_rate_pct = deal.vacancy_rate * 100 if deal.vacancy_rate < 1 else deal.vacancy_rate
        exit_cap_rate_pct = deal.exit_cap_rate * 100 if deal.exit_cap_rate < 1 else deal.exit_cap_rate
        
        # Format projected IRR as percentage if available
        projected_irr_str = f"{deal.projected_irr}%" if deal.projected_irr is not None else "Not calculated"
        
        # Create system message
        system_message = f"""You are a commercial real estate analyst. Generate a concise 3-line summary of the following deal:

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

Your summary should be exactly 3 lines, with each line focusing on a different aspect:
Line 1: Property overview (location, type, size)
Line 2: Financial highlights (price, rent, IRR)
Line 3: Investment recommendation or key risk/opportunity

Be concise, professional, and highlight the most important aspects of the deal.
"""
        
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
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": "Generate a 3-line summary for this deal."}
            ],
            "max_tokens": 200,
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
            summary = response_json["choices"][0]["message"]["content"]
        except Exception as e1:
            logger.error(f"Error with chat completions API: {str(e1)}. Trying completions API.")
            # Try the completions API as a fallback
            # Format the messages into a prompt
            prompt = f"System: {system_message}\n\nUser: Generate a 3-line summary for this deal.\n\nAssistant: "
            
            response = requests.post(
                "https://api.fireworks.ai/inference/v1/completions",
                headers=headers,
                json={
                    "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                    "prompt": prompt,
                    "max_tokens": 200,
                    "temperature": 0.3,
                    "stop": ["User:", "System:"]
                },
                timeout=60
            )
            response.raise_for_status()
            response_json = response.json()
            summary = response_json["choices"][0]["text"].strip()
        
        # Split the summary into lines
        summary_lines = summary.strip().split("\n")
        
        # Ensure we have exactly 3 lines
        if len(summary_lines) < 3:
            # Add empty lines if needed
            summary_lines.extend([""] * (3 - len(summary_lines)))
        elif len(summary_lines) > 3:
            # Truncate to 3 lines
            summary_lines = summary_lines[:3]
        
        # Return the summary
        return {
            "summary": summary_lines
        }
        
    except Exception as e:
        logger.error(f"Error generating AI summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating AI summary: {str(e)}")

async def generate_deal_faq(
    db: Session,
    deal_id: str,
    user_id: str
) -> Dict[str, Any]:
    """
    Generate FAQ-style answers for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Dictionary with the FAQ-style answers
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
            
        # Format vacancy rate and exit cap rate as percentages
        vacancy_rate_pct = deal.vacancy_rate * 100 if deal.vacancy_rate < 1 else deal.vacancy_rate
        exit_cap_rate_pct = deal.exit_cap_rate * 100 if deal.exit_cap_rate < 1 else deal.exit_cap_rate
        
        # Format projected IRR as percentage if available
        projected_irr_str = f"{deal.projected_irr}%" if deal.projected_irr is not None else "Not calculated"
        
        # Create system message
        system_message = f"""You are a commercial real estate analyst. Generate FAQ-style answers for the following deal:

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

Generate answers to the following 5 questions:
1. What are the key financial metrics for this deal?
2. What are the main risks associated with this investment?
3. How does this deal compare to market benchmarks?
4. What is the expected return on investment?
5. What are the key factors that could improve the performance of this deal?

Format your response as a JSON object with question-answer pairs.
"""
        
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
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": "Generate FAQ-style answers for this deal."}
            ],
            "max_tokens": 800,
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
            faq_text = response_json["choices"][0]["message"]["content"]
        except Exception as e1:
            logger.error(f"Error with chat completions API: {str(e1)}. Trying completions API.")
            # Try the completions API as a fallback
            # Format the messages into a prompt
            prompt = f"System: {system_message}\n\nUser: Generate FAQ-style answers for this deal.\n\nAssistant: "
            
            response = requests.post(
                "https://api.fireworks.ai/inference/v1/completions",
                headers=headers,
                json={
                    "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                    "prompt": prompt,
                    "max_tokens": 800,
                    "temperature": 0.3,
                    "stop": ["User:", "System:"]
                },
                timeout=60
            )
            response.raise_for_status()
            response_json = response.json()
            faq_text = response_json["choices"][0]["text"].strip()
        
        # Parse the FAQ text into a structured format
        faq_items = []
        
        # Try to parse as JSON first
        try:
            faq_json = json.loads(faq_text)
            # Convert to our standard format
            for question, answer in faq_json.items():
                faq_items.append({
                    "question": question,
                    "answer": answer
                })
        except json.JSONDecodeError:
            # If not JSON, try to parse as text
            lines = faq_text.strip().split("\n")
            current_question = None
            current_answer = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if this is a question line
                if line.startswith("1.") or line.startswith("2.") or line.startswith("3.") or line.startswith("4.") or line.startswith("5."):
                    # Save the previous question-answer pair if exists
                    if current_question and current_answer:
                        faq_items.append({
                            "question": current_question,
                            "answer": " ".join(current_answer)
                        })
                    
                    # Start a new question-answer pair
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        current_question = parts[0].strip()
                        current_answer = [parts[1].strip()]
                    else:
                        current_question = line
                        current_answer = []
                else:
                    # Add to the current answer
                    if current_question:
                        current_answer.append(line)
            
            # Add the last question-answer pair
            if current_question and current_answer:
                faq_items.append({
                    "question": current_question,
                    "answer": " ".join(current_answer)
                })
        
        # Return the FAQ items
        return {
            "faq": faq_items
        }
        
    except Exception as e:
        logger.error(f"Error generating deal FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating deal FAQ: {str(e)}")
