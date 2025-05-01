import re
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..models.user import User
from .conversation_state_service import get_or_create_conversation_state, update_conversation_state_for_deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define workflow steps
UNDERWRITING_STEPS = [
    "start",
    "acquisition_price",
    "construction_cost",
    "square_footage",
    "projected_rent",
    "vacancy_rate",
    "operating_expenses",
    "exit_cap_rate",
    "calculate_metrics",
    "review_metrics",
    "generate_report"
]

def detect_workflow_intent(message: str) -> Optional[str]:
    """
    Detect workflow intent from user message

    Args:
        message: User message

    Returns:
        Detected workflow intent or None
    """
    message_lower = message.lower()

    # Check for underwriting workflow
    if any(phrase in message_lower for phrase in [
        "walk me through underwriting",
        "help me underwrite",
        "let's underwrite",
        "start underwriting",
        "analyze this deal",
        "walk through the numbers"
    ]):
        return "underwriting"

    # Check for lease upload workflow
    if any(phrase in message_lower for phrase in [
        "upload a lease",
        "can i upload a lease",
        "upload lease",
        "analyze a lease",
        "extract lease terms"
    ]):
        return "lease_upload"

    # Check for report generation workflow
    if any(phrase in message_lower for phrase in [
        "generate a report",
        "create a report",
        "make a report",
        "generate report",
        "produce a report"
    ]):
        return "generate_report"

    # No workflow intent detected
    return None

def extract_numeric_value(message: str) -> Optional[float]:
    """
    Extract a numeric value from a message

    Args:
        message: User message

    Returns:
        Extracted numeric value or None
    """
    # Look for currency patterns like $5.2M, $1.5 million, $500,000, etc.
    currency_patterns = [
        r'\$\s*(\d+(?:\.\d+)?)\s*million',  # $5.2 million
        r'\$\s*(\d+(?:\.\d+)?)\s*m\b',       # $5.2m
        r'\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)',  # $5,200,000.00
    ]

    for pattern in currency_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            value_str = match.group(1).replace(',', '')
            value = float(value_str)

            # Convert millions to absolute value
            if 'million' in pattern or 'm\b' in pattern:
                value *= 1_000_000

            return value

    # Look for numeric patterns like 5.2, 1.5, 500000, etc.
    numeric_patterns = [
        r'(\d+(?:\.\d+)?)\s*million',  # 5.2 million
        r'(\d+(?:\.\d+)?)\s*m\b',       # 5.2m
        r'(\d+(?:,\d{3})*(?:\.\d+)?)',  # 5,200,000.00
    ]

    for pattern in numeric_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            value_str = match.group(1).replace(',', '')
            value = float(value_str)

            # Convert millions to absolute value
            if 'million' in pattern or 'm\b' in pattern:
                value *= 1_000_000

            return value

    # Look for percentage patterns like 5.2%, 1.5 percent, etc.
    percentage_patterns = [
        r'(\d+(?:\.\d+)?)\s*%',        # 5.2%
        r'(\d+(?:\.\d+)?)\s*percent',  # 5.2 percent
    ]

    for pattern in percentage_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            value_str = match.group(1)
            value = float(value_str) / 100  # Convert to decimal
            return value

    return None

def extract_input_for_step(message: str, step: str) -> Optional[float]:
    """
    Extract input for a specific step from a message

    Args:
        message: User message
        step: Current step

    Returns:
        Extracted input or None
    """
    # Extract numeric value
    value = extract_numeric_value(message)

    # Return value if found
    if value is not None:
        return value

    return None

def get_next_step(current_step: str, task: str) -> str:
    """
    Get the next step in a workflow

    Args:
        current_step: Current step
        task: Current task

    Returns:
        Next step
    """
    if task == "underwriting":
        try:
            current_index = UNDERWRITING_STEPS.index(current_step)
            if current_index < len(UNDERWRITING_STEPS) - 1:
                return UNDERWRITING_STEPS[current_index + 1]
        except ValueError:
            # Step not found, start from beginning
            return UNDERWRITING_STEPS[0]

        # Default to first step
        return UNDERWRITING_STEPS[0]

    # Default to None for unknown tasks
    return None

def get_prompt_for_step(step: str, deal: Deal, inputs: Dict[str, Any]) -> str:
    """
    Get the prompt for a specific step

    Args:
        step: Current step
        deal: Deal object
        inputs: Collected inputs

    Returns:
        Prompt for the step
    """
    if step == "start":
        return f"I'll help you underwrite the {deal.project_name} deal. Let's start with the acquisition price. What is the acquisition price for this property?"

    elif step == "acquisition_price":
        return "Great! Now, what is the construction cost or renovation budget for this property?"

    elif step == "construction_cost":
        return "What is the total square footage of the property?"

    elif step == "square_footage":
        return "What is the projected rent per square foot?"

    elif step == "projected_rent":
        return "What is the expected vacancy rate (as a percentage)?"

    elif step == "vacancy_rate":
        return "What are the operating expenses per square foot?"

    elif step == "operating_expenses":
        return "What is the exit cap rate you're targeting (as a percentage)?"

    elif step == "exit_cap_rate":
        return "Thanks for providing all the necessary information. Let me calculate the key metrics for this deal."

    elif step == "calculate_metrics":
        # Calculate metrics based on inputs
        acquisition_price = inputs.get("acquisition_price", deal.acquisition_price)
        construction_cost = inputs.get("construction_cost", deal.construction_cost)
        square_footage = inputs.get("square_footage", deal.square_footage)
        projected_rent = inputs.get("projected_rent", deal.projected_rent_per_sf)
        vacancy_rate = inputs.get("vacancy_rate", deal.vacancy_rate)
        operating_expenses = inputs.get("operating_expenses", deal.operating_expenses_per_sf)
        exit_cap_rate = inputs.get("exit_cap_rate", deal.exit_cap_rate)

        # Calculate NOI
        potential_gross_income = square_footage * projected_rent
        effective_gross_income = potential_gross_income * (1 - vacancy_rate)
        operating_expense_total = square_footage * operating_expenses
        noi = effective_gross_income - operating_expense_total

        # Calculate cap rate
        total_cost = acquisition_price + construction_cost
        cap_rate = noi / total_cost

        # Calculate DSCR (assuming debt service is 8% of total cost)
        debt_service = total_cost * 0.08
        dscr = noi / debt_service if debt_service > 0 else 0

        # Calculate IRR (simplified 5-year hold)
        exit_value = noi / exit_cap_rate

        # Store calculated metrics in inputs
        inputs["noi"] = noi
        inputs["cap_rate"] = cap_rate
        inputs["dscr"] = dscr
        inputs["exit_value"] = exit_value

        return f"""
Based on the information you've provided, here are the key metrics for this deal:

• Acquisition Price: ${acquisition_price:,.2f}
• Construction Cost: ${construction_cost:,.2f}
• Total Cost: ${total_cost:,.2f}
• Square Footage: {square_footage:,.0f} SF
• Projected Rent: ${projected_rent:.2f} per SF
• Vacancy Rate: {vacancy_rate*100:.1f}%
• Operating Expenses: ${operating_expenses:.2f} per SF

• Potential Gross Income: ${potential_gross_income:,.2f}
• Effective Gross Income: ${effective_gross_income:,.2f}
• Operating Expenses Total: ${operating_expense_total:,.2f}
• Net Operating Income (NOI): ${noi:,.2f}
• Cap Rate: {cap_rate*100:.2f}%
• DSCR: {dscr:.2f}
• Exit Value (based on {exit_cap_rate*100:.1f}% cap rate): ${exit_value:,.2f}

Would you like me to generate a detailed report based on this analysis?
"""

    elif step == "review_metrics":
        return "Would you like me to generate a detailed report based on this analysis?"

    elif step == "generate_report":
        return "I'll generate a detailed report for this deal. This may take a moment."

    elif step == "lease_upload":
        return "You can upload a lease for analysis. Please upload your PDF or DOCX file to /api/deals/{deal_id}/upload-lease and I'll extract the key terms."

    # Default prompt
    return "What would you like to do next?"

def process_workflow_step(
    db: Session,
    deal: Deal,
    user: User,
    message: str,
    conversation_state: Any
) -> Tuple[str, Dict[str, Any]]:
    """
    Process a workflow step

    Args:
        db: Database session
        deal: Deal object
        user: User object
        message: User message
        conversation_state: Conversation state

    Returns:
        Tuple of (response, updated_state)
    """
    # Get current task and step
    current_task = conversation_state.current_task
    current_step = conversation_state.step
    inputs = conversation_state.get_inputs()

    # Detect workflow intent if no task is set
    if not current_task:
        workflow_intent = detect_workflow_intent(message)
        if workflow_intent:
            current_task = workflow_intent
            current_step = "start" if workflow_intent == "underwriting" else workflow_intent

            # Update conversation state
            update_conversation_state_for_deal(
                db,
                deal.id,
                user.id,
                {
                    "current_task": current_task,
                    "step": current_step,
                    "inputs": {}
                }
            )

            # Get prompt for step
            response = get_prompt_for_step(current_step, deal, inputs)

            return response, {
                "current_task": current_task,
                "step": current_step,
                "inputs": inputs
            }

    # Process current step
    if current_task == "underwriting":
        # Extract input for current step
        if current_step in ["acquisition_price", "construction_cost", "square_footage", "projected_rent", "vacancy_rate", "operating_expenses", "exit_cap_rate"]:
            value = extract_input_for_step(message, current_step)
            if value is not None:
                # Store input
                inputs[current_step] = value

                # Get next step
                next_step = get_next_step(current_step, current_task)

                # Update conversation state
                update_conversation_state_for_deal(
                    db,
                    deal.id,
                    user.id,
                    {
                        "step": next_step,
                        "inputs": inputs
                    }
                )

                # Get prompt for next step
                response = get_prompt_for_step(next_step, deal, inputs)

                return response, {
                    "current_task": current_task,
                    "step": next_step,
                    "inputs": inputs
                }

        # Handle review metrics step
        elif current_step == "review_metrics":
            if any(phrase in message.lower() for phrase in ["yes", "generate report", "create report", "please do"]):
                next_step = "generate_report"

                # Update conversation state
                update_conversation_state_for_deal(
                    db,
                    deal.id,
                    user.id,
                    {
                        "step": next_step
                    }
                )

                # Get prompt for next step
                response = get_prompt_for_step(next_step, deal, inputs)

                return response, {
                    "current_task": current_task,
                    "step": next_step,
                    "inputs": inputs
                }

        # Handle calculate metrics step
        elif current_step == "calculate_metrics":
            next_step = "review_metrics"

            # Update conversation state
            update_conversation_state_for_deal(
                db,
                deal.id,
                user.id,
                {
                    "step": next_step
                }
            )

            # Get prompt for next step
            response = get_prompt_for_step(next_step, deal, inputs)

            return response, {
                "current_task": current_task,
                "step": next_step,
                "inputs": inputs
            }

    # Handle lease upload workflow
    elif current_task == "lease_upload":
        response = f"You can upload a lease for analysis. Please upload your PDF or DOCX file to /api/deals/{deal.id}/upload-lease and I'll extract the key terms."

        return response, {
            "current_task": current_task,
            "step": current_step,
            "inputs": inputs
        }

    # Default response
    return "I'm not sure what you'd like to do next. You can say 'Walk me through underwriting this deal' to start the underwriting process, or 'Can I upload a lease?' to upload a lease for analysis.", {
        "current_task": current_task,
        "step": current_step,
        "inputs": inputs
    }
