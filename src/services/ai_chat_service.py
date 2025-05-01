import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from ..schemas.ai_chat_schema import AIChatRequest, AIChatResponse, ConversationalAIChatRequest, ConversationalAIChatResponse, ChatMessage

async def process_ai_chat(request: AIChatRequest) -> AIChatResponse:
    """
    Process an AI chat request using DeepSeek model via Fireworks API

    Args:
        request: The AI chat request containing the message and context

    Returns:
        AI chat response with the AI's reply

    Raises:
        HTTPException: If there's an error with the API request
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        # Generate AI response
        if use_fallback:
            reply = _get_fallback_ai_response(request)
        else:
            try:
                reply = await _generate_ai_response(request)
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                reply = _get_fallback_ai_response(request)

        # Create and return the response
        return AIChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing AI chat: {str(e)}")


async def _generate_ai_response(request: AIChatRequest) -> str:
    """
    Generate an AI response using DeepSeek model via Fireworks API

    Args:
        request: The AI chat request containing the message and context

    Returns:
        The AI's response to the user's question

    Raises:
        requests.RequestException: If there's an error with the API request
    """
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")

    # Create a prompt for the AI chat
    prompt = _create_ai_chat_prompt(request)

    # Send the prompt to DeepSeek model via Fireworks API
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "accounts/fireworks/models/llama-v3-8b-instruct",
        "messages": [
            {
                "role": "system",
                "content": "You are a commercial real estate deal analyst. Answer the user's question using the context provided below. Only respond with a short, relevant, professional answer as if you're advising an investor or analyst."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
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

    return reply


def _create_ai_chat_prompt(request: AIChatRequest) -> str:
    """
    Create a prompt for the AI chat

    Args:
        request: The AI chat request containing the message and context

    Returns:
        Prompt for the AI model
    """
    # Format the context as a string
    context_str = json.dumps(request.context, indent=2)

    prompt = f"""You are a commercial real estate deal analyst. Answer the user's question using the context provided below.

CONTEXT:
{context_str}

QUESTION:
{request.message}

Only respond with a short, relevant, professional answer as if you're advising an investor or analyst."""

    return prompt


def _get_fallback_ai_response(request: AIChatRequest) -> str:
    """
    Provide a fallback response for AI chat

    Args:
        request: The AI chat request containing the message and context

    Returns:
        A fallback response based on the request
    """
    # Extract key metrics from the context
    context = request.context
    message = request.message.lower()

    # Calculate some basic metrics
    acquisition_price = context.get("acquisition_price", 0)
    construction_cost = context.get("construction_cost", 0)
    square_footage = context.get("square_footage", 1)  # Avoid division by zero
    projected_rent_per_sf = context.get("projected_rent_per_sf", 0)
    vacancy_rate = context.get("vacancy_rate", 0)
    operating_expenses_per_sf = context.get("operating_expenses_per_sf", 0)
    exit_cap_rate = context.get("exit_cap_rate", 0)

    # Calculate NOI
    gross_potential_income = square_footage * projected_rent_per_sf
    effective_gross_income = gross_potential_income * (1 - vacancy_rate / 100)
    operating_expenses = square_footage * operating_expenses_per_sf
    net_operating_income = effective_gross_income - operating_expenses

    # Calculate total project cost
    project_cost = acquisition_price + construction_cost

    # Calculate estimated exit value
    estimated_exit_value = 0
    if exit_cap_rate > 0:
        estimated_exit_value = net_operating_income / (exit_cap_rate / 100)

    # Calculate development margin
    development_margin = 0
    if project_cost > 0:
        development_margin = (estimated_exit_value - project_cost) / project_cost * 100

    # Calculate price per square foot
    price_per_sf = 0
    if square_footage > 0:
        price_per_sf = project_cost / square_footage

    # Generate a response based on the question
    if "irr" in message or "return" in message:
        # Estimate a plausible IRR based on the development margin
        estimated_irr = development_margin / 5  # Simple approximation
        return f"Based on the provided metrics, the projected IRR for the {context.get('project_name', 'project')} is estimated at approximately {estimated_irr:.1f}%, assuming a {exit_cap_rate}% exit cap rate and standard market conditions."

    elif "cap rate" in message:
        return f"The exit cap rate for the {context.get('project_name', 'project')} is {exit_cap_rate}%, which is {_assess_cap_rate(exit_cap_rate)} for a {context.get('property_type', 'commercial')} property in {context.get('location', 'this market')}."

    elif "noi" in message or "net operating income" in message:
        return f"The projected Net Operating Income (NOI) for the {context.get('project_name', 'project')} is ${net_operating_income:,.2f}, based on the provided rent and expense assumptions."

    elif "margin" in message or "profit" in message:
        return f"The development margin for the {context.get('project_name', 'project')} is projected at {development_margin:.1f}%, which is {_assess_margin(development_margin)} for a {context.get('property_type', 'commercial')} development."

    elif "cost" in message or "budget" in message:
        return f"The total project cost for the {context.get('project_name', 'project')} is ${project_cost:,.2f} (${price_per_sf:.2f}/SF), including acquisition (${acquisition_price:,.2f}) and construction (${construction_cost:,.2f})."

    elif "rent" in message or "income" in message:
        return f"The projected rent for the {context.get('project_name', 'project')} is ${projected_rent_per_sf:.2f}/SF, resulting in a gross potential income of ${gross_potential_income:,.2f} annually."

    elif "vacancy" in message:
        return f"The projected vacancy rate for the {context.get('project_name', 'project')} is {vacancy_rate}%, which is {_assess_vacancy(vacancy_rate, context.get('property_type', 'commercial'))} for a {context.get('property_type', 'commercial')} property in {context.get('location', 'this market')}."

    elif "exit" in message or "sale" in message:
        return f"The estimated exit value for the {context.get('project_name', 'project')} is ${estimated_exit_value:,.2f}, based on a {exit_cap_rate}% cap rate applied to the projected NOI of ${net_operating_income:,.2f}."

    else:
        return f"Based on the provided metrics, the {context.get('project_name', 'project')} shows a development margin of {development_margin:.1f}% with a projected NOI of ${net_operating_income:,.2f}. The total project cost is ${project_cost:,.2f} (${price_per_sf:.2f}/SF) with an estimated exit value of ${estimated_exit_value:,.2f} at a {exit_cap_rate}% cap rate."


def _assess_cap_rate(cap_rate: float) -> str:
    """Assess whether a cap rate is favorable"""
    if cap_rate < 4:
        return "very aggressive"
    elif cap_rate < 5:
        return "aggressive"
    elif cap_rate < 6:
        return "moderate"
    elif cap_rate < 7:
        return "conservative"
    else:
        return "very conservative"


def _assess_margin(margin: float) -> str:
    """Assess whether a development margin is favorable"""
    if margin < 10:
        return "below market expectations"
    elif margin < 15:
        return "within market expectations"
    elif margin < 20:
        return "favorable"
    else:
        return "highly favorable"


def _assess_vacancy(vacancy_rate: float, property_type: str) -> str:
    """Assess whether a vacancy rate is favorable"""
    if property_type.lower() == "multifamily":
        if vacancy_rate < 3:
            return "very low"
        elif vacancy_rate < 5:
            return "low"
        elif vacancy_rate < 8:
            return "average"
        else:
            return "high"
    else:  # Commercial
        if vacancy_rate < 5:
            return "very low"
        elif vacancy_rate < 8:
            return "low"
        elif vacancy_rate < 12:
            return "average"
        else:
            return "high"


async def process_conversational_ai_chat(request: ConversationalAIChatRequest) -> ConversationalAIChatResponse:
    """
    Process a conversational AI chat request using DeepSeek model via Fireworks API

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        Conversational AI chat response with the AI's reply

    Raises:
        HTTPException: If there's an error with the API request
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        # Generate AI response
        if use_fallback:
            reply = _get_fallback_conversational_ai_response(request)
        else:
            try:
                reply = await _generate_conversational_ai_response(request)
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                reply = _get_fallback_conversational_ai_response(request)

        # Create and return the response
        return ConversationalAIChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing conversational AI chat: {str(e)}")


async def _generate_conversational_ai_response(request: ConversationalAIChatRequest) -> str:
    """
    Generate a conversational AI response using DeepSeek model via Fireworks API

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        The AI's response to the conversation

    Raises:
        requests.RequestException: If there's an error with the API request
    """
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")

    # Format the conversation history for display
    formatted_messages = "\n".join([f"{msg.role}: {msg.content}" for msg in request.messages])

    # Check if context is empty or completely missing
    context = request.context
    context_empty = not context or len(context) == 0

    # Define critical fields for different types of analysis
    basic_fields = ["project_name", "location", "property_type"]
    financial_fields = ["acquisition_price", "construction_cost", "square_footage", "projected_rent_per_sf"]
    risk_fields = ["vacancy_rate", "operating_expenses_per_sf", "exit_cap_rate"]
    all_critical_fields = basic_fields + financial_fields + risk_fields

    # Check which fields are missing
    missing_fields = [field for field in all_critical_fields if field not in context or context.get(field) in [None, "", 0]]

    # Determine the context completeness level
    if context_empty:
        context_level = "empty"
    elif len(missing_fields) > len(all_critical_fields) / 2:
        context_level = "mostly_missing"
    elif missing_fields:
        context_level = "partially_missing"
    else:
        context_level = "complete"

    # Create a personality prompt that sets the tone for all conversations
    personality_prompt = """You are a senior commercial real estate investment analyst. Speak in clear, professional, and helpful language. Your goal is to assist analysts and managers in evaluating CRE deals using logic, financial metrics, and institutional reasoning. Never make up numbers. Always ask for missing context when needed."""

    # Create a system message based on context availability
    if context_level == "empty":
        system_message = f"""{personality_prompt}

The user has asked a question, but no deal context was provided. Ask the user to provide key financial inputs such as acquisition price, projected rent, square footage, exit cap rate, etc. Respond naturally as a professional would.

Here is the current conversation:
{formatted_messages}

Respond conversationally and professionally. Do not make up any financial metrics."""

    elif context_level == "mostly_missing":
        # Format the available context
        available_context = {k: v for k, v in context.items() if k not in missing_fields and v not in [None, "", 0]}
        available_context_str = json.dumps(available_context, indent=2) if available_context else "No valid context provided"

        system_message = f"""{personality_prompt}

The user has provided some deal information, but many critical values are missing. Here's what we know so far:

{available_context_str}

The following information is still needed: {', '.join(missing_fields)}.

Politely ask for the missing values, and once you have enough data, continue the financial analysis.

Here is the current conversation:
{formatted_messages}

Respond conversationally and professionally. Do not make up any financial metrics."""

    elif context_level == "partially_missing":
        # Format the available context
        available_context_str = json.dumps({k: v for k, v in context.items() if k not in missing_fields and v not in [None, "", 0]}, indent=2)

        system_message = f"""{personality_prompt}

The user has provided most of the deal information, but some values are still missing. Here's what we know so far:

{available_context_str}

The following information would be helpful to complete the analysis: {', '.join(missing_fields)}.

You can work with the available information, but politely mention that additional data would improve the analysis.

Here is the current conversation:
{formatted_messages}

Respond conversationally and professionally. You can calculate metrics based on available data, but clearly state any assumptions you're making."""

    else:  # complete context
        # Create a system message with the complete context
        context_str = json.dumps(context, indent=2)

        system_message = f"""{personality_prompt}

You are a smart commercial real estate analyst. Use the complete deal context below to answer the user's question or provide insight.

Deal Context:
{context_str}

Based on this context, you can:
- Calculate or explain IRR, Cap Rate, NOI, development margin
- Summarize the deal in plain English
- Flag risks or unrealistic assumptions
- Suggest next steps (e.g. "Would you like a PDF report?")

Here is the current conversation:
{formatted_messages}

Respond conversationally and professionally. Use your financial expertise to provide valuable insights."""

    # Format the conversation history
    messages = [
        {"role": "system", "content": system_message}
    ]

    # Add the conversation history
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    # Send the prompt to DeepSeek model via Fireworks API
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "accounts/fireworks/models/llama-v3-8b-instruct",
        "messages": messages,
        "max_tokens": 500,
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

    return reply


def _get_fallback_conversational_ai_response(request: ConversationalAIChatRequest) -> str:
    """
    Provide a fallback response for conversational AI chat

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        A fallback response based on the request
    """
    # Extract the last user message
    last_user_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    # If no user message found, provide a generic response
    if not last_user_message:
        return "I'm here to help with your commercial real estate analysis. What would you like to know about the deal?"

    # Check if context is empty or completely missing
    context = request.context
    context_empty = not context or len(context) == 0

    # Define critical fields for different types of analysis
    basic_fields = ["project_name", "location", "property_type"]
    financial_fields = ["acquisition_price", "construction_cost", "square_footage", "projected_rent_per_sf"]
    risk_fields = ["vacancy_rate", "operating_expenses_per_sf", "exit_cap_rate"]
    all_critical_fields = basic_fields + financial_fields + risk_fields

    # Check which fields are missing
    missing_fields = [field for field in all_critical_fields if field not in context or context.get(field) in [None, "", 0]]

    # Determine the context completeness level
    if context_empty:
        return "I'd be happy to help analyze a commercial real estate deal for you. To get started, could you please provide some basic information about the property? I'll need details like the project name, location, property type, acquisition price, construction cost, square footage, projected rent per square foot, vacancy rate, operating expenses, and exit cap rate."

    elif len(missing_fields) > len(all_critical_fields) / 2:
        available_fields = [f for f in all_critical_fields if f not in missing_fields]
        return f"Thanks for providing some initial details about the deal. I see you've included information about {', '.join(available_fields)}. To complete my analysis, I'll also need {', '.join(missing_fields[:5])}{'...' if len(missing_fields) > 5 else ''}. This will help me give you a comprehensive assessment of the investment opportunity."

    elif missing_fields:
        return f"I can work with the information you've provided so far, but to give you a more accurate analysis, it would be helpful to know the {', '.join(missing_fields)} as well. Would you like me to proceed with what we have, or would you prefer to provide the additional details?"

    # If we have complete context, try to answer based on the question
    lower_message = last_user_message.lower()

    # Check for common question types and provide appropriate responses
    if any(term in lower_message for term in ["irr", "return", "yield"]):
        # Calculate a simple IRR estimate based on development margin
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0
        estimated_irr = development_margin / 5  # Simple approximation

        return f"Based on the information provided for {context.get('project_name', 'the project')}, I estimate the IRR to be approximately {estimated_irr:.1f}%. This is calculated using a development margin of {development_margin:.1f}% and an exit cap rate of {context.get('exit_cap_rate', 7)}%. Would you like me to break down the calculation in more detail?"

    elif any(term in lower_message for term in ["risk", "risky", "safe", "concern"]):
        # Assess risk based on various factors
        risk_factors = []

        # Check development margin
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0

        if development_margin < 10:
            risk_factors.append(f"The development margin of {development_margin:.1f}% is below the typical threshold of 15% for this type of investment")

        # Check vacancy rate
        vacancy_rate = context.get("vacancy_rate", 5)
        if vacancy_rate > 7:
            risk_factors.append(f"The vacancy rate of {vacancy_rate}% is higher than market average")

        # Check exit cap rate
        exit_cap_rate = context.get("exit_cap_rate", 5)
        if exit_cap_rate > 7:
            risk_factors.append(f"The exit cap rate of {exit_cap_rate}% is relatively high, which could impact your exit value")

        # Check rent assumptions
        property_type = context.get("property_type", "")
        rent_per_sf = context.get("projected_rent_per_sf", 0)

        if property_type.lower() == "office" and rent_per_sf > 50:
            risk_factors.append(f"The projected rent of ${rent_per_sf}/SF for office space seems aggressive in the current market")
        elif property_type.lower() == "retail" and rent_per_sf > 40:
            risk_factors.append(f"The projected rent of ${rent_per_sf}/SF for retail space seems aggressive given e-commerce competition")

        if not risk_factors:
            risk_factors.append("Based on the provided metrics, this appears to be a relatively balanced investment with no major red flags")

        risk_assessment = "\n".join([f"- {factor}" for factor in risk_factors])
        return f"Here's my risk assessment for {context.get('project_name', 'the project')}:\n\n{risk_assessment}\n\nWould you like me to suggest any risk mitigation strategies?"

    elif any(term in lower_message for term in ["summarize", "summary", "overview", "memo"]):
        # Generate a deal summary
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        price_per_sf = project_cost / context.get("square_footage", 1) if context.get("square_footage", 0) > 0 else 0
        noi = _calculate_noi(context)
        cap_rate = (noi / project_cost) * 100 if project_cost > 0 else 0
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0

        summary = f"""## {context.get('project_name', 'Investment')} Summary

**Property Overview:**
- Location: {context.get('location', 'N/A')}
- Property Type: {context.get('property_type', 'N/A')}
- Size: {context.get('square_footage', 0):,.0f} SF

**Financial Metrics:**
- Total Project Cost: ${project_cost:,.2f} (${price_per_sf:.2f}/SF)
- Projected NOI: ${noi:,.2f}
- Going-in Cap Rate: {cap_rate:.2f}%
- Exit Cap Rate: {context.get('exit_cap_rate', 0)}%
- Development Margin: {development_margin:.2f}%

**Investment Thesis:**
This {context.get('property_type', '')} investment in {context.get('location', '')} presents a {_assess_margin(development_margin)} opportunity with a projected development margin of {development_margin:.2f}%."""

        return f"{summary}\n\nWould you like me to generate a more detailed report or focus on any specific aspect of this investment?"

    else:
        # Create a single-message request for the fallback handler
        single_message_request = AIChatRequest(
            message=last_user_message,
            context=request.context
        )

        # Use the existing fallback handler
        return _get_fallback_ai_response(single_message_request)


def _calculate_noi(context: Dict[str, Any]) -> float:
    """Calculate Net Operating Income based on context"""
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
