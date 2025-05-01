import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date
from ..database import Base

# Association table for task assignees
task_assignees = Table(
    "task_assignees",
    Base.metadata,
    Column("task_id", String, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)

class Task(Base):
    """Model for tasks"""
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(Enum("low", "medium", "high", name="task_priority"), nullable=False, default="medium")
    due_date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    deal = relationship("Deal", back_populates="tasks")
    creator = relationship("User", foreign_keys=[created_by])
    assignees = relationship("User", secondary=task_assignees, backref="assigned_tasks")
    
    def __repr__(self):
        return f"<Task {self.title} for deal {self.deal_id}>"
