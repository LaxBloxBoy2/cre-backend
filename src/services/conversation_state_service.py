import json
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from ..models.conversation_state import ConversationState
from ..schemas.conversation_state_schema import ConversationStateCreate, ConversationStateUpdate
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def get_conversation_state(db: Session, deal_id: str, user_id: str) -> Optional[ConversationState]:
    """
    Get the conversation state for a deal and user
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Conversation state or None if not found
    """
    return db.query(ConversationState).filter(
        ConversationState.deal_id == deal_id,
        ConversationState.user_id == user_id
    ).first()

def create_conversation_state(
    db: Session, 
    conversation_state: ConversationStateCreate
) -> ConversationState:
    """
    Create a new conversation state
    
    Args:
        db: Database session
        conversation_state: Conversation state data
        
    Returns:
        Created conversation state
    """
    # Convert inputs to JSON string
    inputs_str = None
    if conversation_state.inputs:
        inputs_str = json.dumps(conversation_state.inputs)
    
    # Create conversation state
    db_conversation_state = ConversationState(
        deal_id=conversation_state.deal_id,
        user_id=conversation_state.user_id,
        current_task=conversation_state.current_task,
        step=conversation_state.step,
        inputs=inputs_str
    )
    
    # Add to database
    db.add(db_conversation_state)
    db.commit()
    db.refresh(db_conversation_state)
    
    return db_conversation_state

def update_conversation_state(
    db: Session, 
    conversation_state_id: str, 
    conversation_state: ConversationStateUpdate
) -> Optional[ConversationState]:
    """
    Update an existing conversation state
    
    Args:
        db: Database session
        conversation_state_id: Conversation state ID
        conversation_state: Conversation state data
        
    Returns:
        Updated conversation state or None if not found
    """
    # Get conversation state
    db_conversation_state = db.query(ConversationState).filter(
        ConversationState.id == conversation_state_id
    ).first()
    
    # Return None if not found
    if not db_conversation_state:
        return None
    
    # Update fields
    if conversation_state.current_task is not None:
        db_conversation_state.current_task = conversation_state.current_task
    
    if conversation_state.step is not None:
        db_conversation_state.step = conversation_state.step
    
    if conversation_state.inputs is not None:
        db_conversation_state.set_inputs(conversation_state.inputs)
    
    # Commit changes
    db.commit()
    db.refresh(db_conversation_state)
    
    return db_conversation_state

def get_or_create_conversation_state(
    db: Session, 
    deal_id: str, 
    user_id: str
) -> ConversationState:
    """
    Get or create a conversation state for a deal and user
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Conversation state
    """
    # Get conversation state
    conversation_state = get_conversation_state(db, deal_id, user_id)
    
    # Create if not found
    if not conversation_state:
        conversation_state = create_conversation_state(
            db,
            ConversationStateCreate(
                deal_id=deal_id,
                user_id=user_id,
                current_task=None,
                step=None,
                inputs={}
            )
        )
    
    return conversation_state

def update_conversation_state_for_deal(
    db: Session, 
    deal_id: str, 
    user_id: str, 
    update_data: Dict[str, Any]
) -> Optional[ConversationState]:
    """
    Update the conversation state for a deal and user
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        update_data: Data to update
        
    Returns:
        Updated conversation state or None if not found
    """
    # Get conversation state
    conversation_state = get_conversation_state(db, deal_id, user_id)
    
    # Return None if not found
    if not conversation_state:
        return None
    
    # Update fields
    if "current_task" in update_data:
        conversation_state.current_task = update_data["current_task"]
    
    if "step" in update_data:
        conversation_state.step = update_data["step"]
    
    if "inputs" in update_data:
        # Get current inputs
        current_inputs = conversation_state.get_inputs()
        
        # Merge with new inputs
        current_inputs.update(update_data["inputs"])
        
        # Set inputs
        conversation_state.set_inputs(current_inputs)
    
    # Commit changes
    db.commit()
    db.refresh(conversation_state)
    
    return conversation_state

def reset_conversation_state(
    db: Session, 
    deal_id: str, 
    user_id: str
) -> Optional[ConversationState]:
    """
    Reset the conversation state for a deal and user
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Reset conversation state or None if not found
    """
    # Get conversation state
    conversation_state = get_conversation_state(db, deal_id, user_id)
    
    # Return None if not found
    if not conversation_state:
        return None
    
    # Reset fields
    conversation_state.current_task = None
    conversation_state.step = None
    conversation_state.inputs = None
    
    # Commit changes
    db.commit()
    db.refresh(conversation_state)
    
    return conversation_state
