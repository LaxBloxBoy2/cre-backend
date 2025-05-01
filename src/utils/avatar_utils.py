from models.user import User
from typing import Dict, Optional

def avatar_placeholder(user: User) -> Dict[str, str]:
    """
    Generate avatar placeholder for a user
    
    Args:
        user: User object
        
    Returns:
        Dictionary with initials and background color
    """
    # Get first letter of first name and last name
    first_initial = user.first_name[0] if user.first_name else ''
    last_initial = user.last_name[0] if user.last_name else ''
    
    # Combine initials
    initials = f"{first_initial}{last_initial}".upper()
    
    # Generate color based on user ID
    # Use hash of user ID to generate a consistent color
    color = f"#{hash(user.id) & 0xFFFFFF:06x}"
    
    return {"initials": initials, "bg": color}

def get_user_avatar(user: User) -> Dict[str, str]:
    """
    Get user avatar information
    
    Args:
        user: User object
        
    Returns:
        Dictionary with avatar information
    """
    # Check if user has an avatar URL
    if user.avatar_url:
        return {"url": user.avatar_url}
    
    # Otherwise, generate placeholder
    return avatar_placeholder(user)
