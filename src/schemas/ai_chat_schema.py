from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Literal

class ChatMessage(BaseModel):
    """Model for a chat message"""
    role: Literal["user", "assistant", "system"] = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The content of the message")

class ConversationalAIChatRequest(BaseModel):
    """Request model for conversational AI chat"""
    messages: List[ChatMessage] = Field(..., description="The conversation history")
    context: Dict[str, Any] = Field(..., description="The deal context with property details")

class ConversationalAIChatResponse(BaseModel):
    """Response model for conversational AI chat"""
    reply: str = Field(..., description="The AI's response to the conversation")

# Keep the original models for backward compatibility
class AIChatRequest(BaseModel):
    """Request model for AI chat (single message)"""
    message: str = Field(..., description="The user's question about a deal")
    context: Dict[str, Any] = Field(..., description="The deal context with property details")

class AIChatResponse(BaseModel):
    """Response model for AI chat (single message)"""
    reply: str = Field(..., description="The AI's response to the user's question")

# New models for the "Ask Anything" feature
class AskAnythingRequest(BaseModel):
    """Request model for the Ask Anything feature"""
    message: str = Field(..., description="The user's question about a deal")

class AskAnythingResponse(BaseModel):
    """Response model for the Ask Anything feature"""
    reply: str = Field(..., description="The AI's response to the user's question")
    context_used: Optional[Dict[str, Any]] = Field(None, description="The context used to generate the response")

# Models for AI summary and FAQ
class AISummaryResponse(BaseModel):
    """Response model for AI summary"""
    summary: List[str] = Field(..., description="3-line summary of the deal")

class FAQItem(BaseModel):
    """Model for a FAQ item"""
    question: str = Field(..., description="The question")
    answer: str = Field(..., description="The answer")

class DealFAQResponse(BaseModel):
    """Response model for deal FAQ"""
    faq: List[FAQItem] = Field(..., description="List of FAQ items")
