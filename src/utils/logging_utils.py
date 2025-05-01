import logging
from typing import Optional, Dict, Any, Union
from fastapi import Request

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name
    
    Args:
        name: The name of the logger
        
    Returns:
        A logger instance
    """
    return logging.getLogger(name)

def log_action(
    logger: logging.Logger,
    action: str,
    message: str,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    level: str = "info",
    extra_data: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log an action with consistent formatting
    
    Args:
        logger: The logger to use
        action: The action being performed (e.g., "create_deal", "delete_user")
        message: The log message
        user_id: The ID of the user performing the action
        org_id: The ID of the organization
        deal_id: The ID of the deal
        level: The log level (info, warning, error)
        extra_data: Additional data to include in the log
    """
    # Build the log context
    context = {}
    if user_id:
        context["user_id"] = user_id
    if org_id:
        context["org_id"] = org_id
    if deal_id:
        context["deal_id"] = deal_id
    if extra_data:
        context.update(extra_data)
    
    # Format the log message
    log_message = f"[{action}] {message}"
    if context:
        log_message += f" - Context: {context}"
    
    # Log at the appropriate level
    if level == "warning":
        logger.warning(log_message)
    elif level == "error":
        logger.error(log_message)
    else:
        logger.info(log_message)

def log_request_info(
    logger: logging.Logger,
    request: Request,
    message: str,
    level: str = "info"
) -> None:
    """
    Log information about a request
    
    Args:
        logger: The logger to use
        request: The FastAPI request object
        message: The log message
        level: The log level (info, warning, error)
    """
    # Get user information if available
    user_info = ""
    try:
        if hasattr(request.state, "user"):
            user_info = f" - User: {request.state.user.id}"
    except:
        pass
    
    # Format the log message
    log_message = f"{message} - Path: {request.url.path}{user_info} - Method: {request.method}"
    
    # Log at the appropriate level
    if level == "warning":
        logger.warning(log_message)
    elif level == "error":
        logger.error(log_message)
    else:
        logger.info(log_message)
