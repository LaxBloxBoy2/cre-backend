import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from ..schemas.ai_chat_schema import AIChatRequest, AIChatResponse, ConversationalAIChatRequest, ConversationalAIChatResponse, ChatMessage
from ..enhanced_ai_chat_service import detect_user_intent

async def process_ai_chat_v3(request: ConversationalAIChatRequest, debug_mode: bool = False) -> Dict[str, Any]:
    """
    Process an AI chat request using the enhanced AI chat service

    Args:
        request: The conversational AI chat request containing the message history and context
        debug_mode: Whether to include debug information in the response

    Returns:
        AI chat response with the AI's reply and optional debug information
    """
    try:
        # Get the last user message
        last_user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                last_user_message = msg.content
                break

        if not last_user_message:
            raise HTTPException(status_code=400, detail="No user message found in the request")

        # Detect user intent
        intent = detect_user_intent(last_user_message)

        # Create a system message based on the context and intent
        system_message = _create_enhanced_system_message(request.context, intent)

        # Format the messages for the API
        messages = [
            {"role": "system", "content": system_message}
        ]

        # Add the conversation history
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        # Generate AI response
        if use_fallback:
            # Use a fallback response
            reply = f"This is a fallback response for the enhanced AI chat service. The system is currently in fallback mode. Your message was: '{last_user_message}'. Intent detected: {intent}."
        else:
            try:
                # Call the Fireworks API
                fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
                if not fireworks_api_key:
                    raise HTTPException(status_code=500, detail="Fireworks API key not configured")

                headers = {
                    "Authorization": f"Bearer {fireworks_api_key}",
                    "Content-Type": "application/json"
                }

                # Format the messages into a prompt
                prompt = ""
                for msg in messages:
                    if msg["role"] == "system":
                        prompt += f"System: {msg['content']}\n\n"
                    elif msg["role"] == "user":
                        prompt += f"User: {msg['content']}\n"
                    elif msg["role"] == "assistant":
                        prompt += f"Assistant: {msg['content']}\n"

                prompt += "Assistant: "

                data = {
                    "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                    "prompt": prompt,
                    "max_tokens": 800,
                    "temperature": 0.3,
                    "stop": ["User:", "System:"]
                }

                # Try the API endpoint
                try:
                    response = requests.post(
                        "https://api.fireworks.ai/inference/v1/chat/completions",
                        headers=headers,
                        json={
                            "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                            "messages": messages,
                            "max_tokens": 800,
                            "temperature": 0.3
                        },
                        timeout=60
                    )
                    response.raise_for_status()
                    response_json = response.json()
                    reply = response_json["choices"][0]["message"]["content"]
                except Exception as e1:
                    print(f"Error with chat completions API: {str(e1)}. Trying completions API.")
                    # Try the completions API as a fallback
                    response = requests.post(
                        "https://api.fireworks.ai/inference/v1/completions",
                        headers=headers,
                        json=data,
                        timeout=60
                    )
                    response.raise_for_status()
                    response_json = response.json()
                    reply = response_json["choices"][0]["text"].strip()

                # Response has already been processed in the try-except block above
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                reply = f"Sorry, I encountered an error while processing your request. The system will use fallback responses for now. Your message was: '{last_user_message}'. Error: {str(e)}"

        # Prepare the response
        result = {
            "reply": reply
        }

        # Add debug information if requested
        if debug_mode:
            result["debug"] = {
                "intent": intent,
                "system_message": system_message,
                "tokens_estimated": len(system_message.split()) + sum(len(msg["content"].split()) for msg in messages),
                "fallback_mode": use_fallback
            }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing AI chat: {str(e)}")

def _create_enhanced_system_message(context: Dict[str, Any], intent: str) -> str:
    """
    Create an enhanced system message based on the context and intent

    Args:
        context: The deal context
        intent: The detected intent

    Returns:
        Enhanced system message
    """
    # Format the context as a string
    context_str = json.dumps(context, indent=2)

    # Create a base system message
    system_message = f"""You are a commercial real estate analyst. You are analyzing a deal with the following details:

{context_str}

Respond clearly, explain assumptions, and reference deal metrics in your reasoning. Be concise but thorough in your analysis.
"""

    # Enhance the system message based on the intent
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

    return system_message
