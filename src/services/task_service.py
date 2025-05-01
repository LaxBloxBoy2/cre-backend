from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from ..models.task import Task, task_assignees
from ..models.deal import Deal
from ..models.user import User
from ..schemas.task_schema import TaskCreate, TaskUpdate
from ..security_service import validate_deal_access
from ..activity_log_service import log_action

def get_tasks(db: Session, deal_id: str, user_id: str, org_id: Optional[str] = None, completed: Optional[bool] = None) -> List[Task]:
    """
    Get all tasks for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        org_id: Organization ID
        completed: Filter by completion status
        
    Returns:
        List of tasks
    """
    # Validate deal access
    validate_deal_access(db, deal_id, user_id, org_id)
    
    # Build query
    query = db.query(Task).filter(Task.deal_id == deal_id)
    
    # Apply completion filter if provided
    if completed is not None:
        query = query.filter(Task.completed == completed)
    
    # Get tasks
    tasks = query.order_by(Task.due_date).all()
    
    return tasks

def get_task(db: Session, task_id: str, user_id: str, org_id: Optional[str] = None) -> Task:
    """
    Get a task by ID
    
    Args:
        db: Database session
        task_id: Task ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Task
    """
    # Get task
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Validate deal access
    validate_deal_access(db, task.deal_id, user_id, org_id)
    
    return task

def create_task(db: Session, task: TaskCreate, user_id: str, org_id: Optional[str] = None) -> Task:
    """
    Create a new task
    
    Args:
        db: Database session
        task: Task data
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Created task
    """
    # Validate deal access
    deal = validate_deal_access(db, task.deal_id, user_id, org_id)
    
    # Create task
    db_task = Task(
        deal_id=task.deal_id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        completed=False,
        created_by=user_id
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Add assignees
    if task.assignee_ids:
        for assignee_id in task.assignee_ids:
            # Check if user exists
            user = db.query(User).filter(User.id == assignee_id).first()
            if not user:
                continue
            
            # Add assignee
            db.execute(
                task_assignees.insert().values(
                    task_id=db_task.id,
                    user_id=assignee_id
                )
            )
    
    db.commit()
    db.refresh(db_task)
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="create_task",
        message=f"Created task '{task.title}' for deal '{deal.project_name}'",
        deal_id=task.deal_id
    )
    
    return db_task

def update_task(db: Session, task_id: str, task_update: TaskUpdate, user_id: str, org_id: Optional[str] = None) -> Task:
    """
    Update a task
    
    Args:
        db: Database session
        task_id: Task ID
        task_update: Task update data
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Updated task
    """
    # Get task
    db_task = get_task(db, task_id, user_id, org_id)
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_task.deal_id).first()
    
    # Update task
    if task_update.title is not None:
        db_task.title = task_update.title
    
    if task_update.description is not None:
        db_task.description = task_update.description
    
    if task_update.priority is not None:
        db_task.priority = task_update.priority
    
    if task_update.due_date is not None:
        db_task.due_date = task_update.due_date
    
    if task_update.completed is not None:
        # Only update completed status if it's changing
        if db_task.completed != task_update.completed:
            db_task.completed = task_update.completed
            
            # Log completion status change
            if task_update.completed:
                log_action(
                    db=db,
                    user_id=user_id,
                    org_id=org_id,
                    action="complete_task",
                    message=f"Completed task '{db_task.title}' for deal '{deal.project_name}'",
                    deal_id=db_task.deal_id
                )
            else:
                log_action(
                    db=db,
                    user_id=user_id,
                    org_id=org_id,
                    action="reopen_task",
                    message=f"Reopened task '{db_task.title}' for deal '{deal.project_name}'",
                    deal_id=db_task.deal_id
                )
    
    # Update assignees if provided
    if task_update.assignee_ids is not None:
        # Remove existing assignees
        db.execute(
            task_assignees.delete().where(task_assignees.c.task_id == db_task.id)
        )
        
        # Add new assignees
        for assignee_id in task_update.assignee_ids:
            # Check if user exists
            user = db.query(User).filter(User.id == assignee_id).first()
            if not user:
                continue
            
            # Add assignee
            db.execute(
                task_assignees.insert().values(
                    task_id=db_task.id,
                    user_id=assignee_id
                )
            )
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

def delete_task(db: Session, task_id: str, user_id: str, org_id: Optional[str] = None) -> None:
    """
    Delete a task
    
    Args:
        db: Database session
        task_id: Task ID
        user_id: User ID
        org_id: Organization ID
    """
    # Get task
    db_task = get_task(db, task_id, user_id, org_id)
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_task.deal_id).first()
    
    # Delete task
    db.delete(db_task)
    db.commit()
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="delete_task",
        message=f"Deleted task '{db_task.title}' for deal '{deal.project_name}'",
        deal_id=db_task.deal_id
    )
