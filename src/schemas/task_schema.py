from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import date, datetime

class UserInfo(BaseModel):
    """Simplified user info for task assignees"""
    id: str
    name: str
    email: str
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    """Base model for task"""
    title: str = Field(..., description="Title of the task")
    description: Optional[str] = Field(None, description="Description of the task")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Priority of the task")
    due_date: date = Field(..., description="Due date of the task")

class TaskCreate(TaskBase):
    """Model for creating a new task"""
    deal_id: str = Field(..., description="The ID of the deal")
    assignee_ids: List[str] = Field([], description="List of user IDs assigned to the task")

class TaskUpdate(BaseModel):
    """Model for updating a task"""
    title: Optional[str] = Field(None, description="Title of the task")
    description: Optional[str] = Field(None, description="Description of the task")
    priority: Optional[Literal["low", "medium", "high"]] = Field(None, description="Priority of the task")
    due_date: Optional[date] = Field(None, description="Due date of the task")
    completed: Optional[bool] = Field(None, description="Whether the task is completed")
    assignee_ids: Optional[List[str]] = Field(None, description="List of user IDs assigned to the task")

class Task(TaskBase):
    """Model for a task"""
    id: str = Field(..., description="The unique identifier for the task")
    deal_id: str = Field(..., description="The ID of the deal")
    completed: bool = Field(False, description="Whether the task is completed")
    created_at: str = Field(..., description="When the task was created")
    created_by: str = Field(..., description="ID of the user who created the task")
    creator: Optional[UserInfo] = Field(None, description="User who created the task")
    assignees: List[UserInfo] = Field([], description="Users assigned to the task")
    
    class Config:
        from_attributes = True

class TaskList(BaseModel):
    """Model for a list of tasks"""
    tasks: List[Task]
    total: int
