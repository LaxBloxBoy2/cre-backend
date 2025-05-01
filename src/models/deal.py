import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base
import json

class Deal(Base):
    """Deal model for database"""
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    project_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    property_type = Column(String, nullable=False)
    acquisition_price = Column(Float, nullable=False)
    construction_cost = Column(Float, nullable=False)
    square_footage = Column(Float, nullable=False)
    projected_rent_per_sf = Column(Float, nullable=False)
    vacancy_rate = Column(Float, nullable=False)
    operating_expenses_per_sf = Column(Float, nullable=False)
    exit_cap_rate = Column(Float, nullable=False)
    underwriting_result = Column(Text, nullable=True)  # Stored as JSON string
    ai_memo = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    report_file = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    status_changed_at = Column(DateTime, nullable=True)
    status_changed_by = Column(String, nullable=True)
    admin_comment = Column(Text, nullable=True)
    tags = Column(String, nullable=True)  # Stored as comma-delimited string: "Multifamily,Core,Flagged"
    projected_irr = Column(Float, nullable=True)  # Internal Rate of Return
    dscr = Column(Float, nullable=True)  # Debt Service Coverage Ratio
    visibility = Column(String, nullable=False, default="internal")  # Options: internal, team, lp_view
    shared_with_user_ids = Column(Text, nullable=True)  # Stored as JSON string

    # Additional fields for deal details
    acquisition_date = Column(DateTime, nullable=True)
    investment_strategy = Column(String, nullable=True)  # Core, Core Plus, Value Add, Opportunistic
    seller_propensity = Column(String, nullable=True)  # Low, Medium, High
    seller_propensity_reason = Column(Text, nullable=True)
    owner_name = Column(String, nullable=True)
    owner_type = Column(String, nullable=True)  # Individual, Corporation, REIT, etc.
    owner_acquisition_date = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", backref="deals")
    organization = relationship("Organization", back_populates="deals")
    chat_messages = relationship("ChatMessage", back_populates="deal", cascade="all, delete-orphan")
    comments = relationship("DealComment", back_populates="deal", cascade="all, delete-orphan")
    conversation_states = relationship("ConversationState", back_populates="deal", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="deal", cascade="all, delete-orphan")
    alerts = relationship("DealAlert", back_populates="deal", cascade="all, delete-orphan")
    property_attributes = relationship("PropertyAttributes", back_populates="deal", cascade="all, delete-orphan", uselist=False)
    stages = relationship("DealStage", back_populates="deal", cascade="all, delete-orphan", order_by="DealStage.order")
    tasks = relationship("Task", back_populates="deal", cascade="all, delete-orphan")
    scenarios = relationship("DealScenario", back_populates="deal", cascade="all, delete-orphan")
    promote_structures = relationship("PromoteStructure", back_populates="deal", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="deal", cascade="all, delete-orphan")
    # Note: UploadedFile and LeaseAnalysis relationships are commented out for now
    # uploaded_files = relationship("UploadedFile", back_populates="deal", cascade="all, delete-orphan")
    # lease_analyses = relationship("LeaseAnalysis", back_populates="deal", cascade="all, delete-orphan")

    @property
    def underwriting_result_json(self):
        """Get underwriting result as JSON object"""
        if self.underwriting_result:
            return json.loads(self.underwriting_result)
        return None

    @underwriting_result_json.setter
    def underwriting_result_json(self, value):
        """Set underwriting result from JSON object"""
        if value is not None:
            self.underwriting_result = json.dumps(value)
        else:
            self.underwriting_result = None

    @property
    def tags_list(self):
        """Get tags as a list"""
        if self.tags:
            return [tag.strip().lower() for tag in self.tags.split(',')]
        return []

    @tags_list.setter
    def tags_list(self, value):
        """Set tags from a list"""
        if value and isinstance(value, list):
            # Normalize tags to lowercase and remove duplicates
            normalized_tags = [tag.strip().lower() for tag in value if tag.strip()]
            self.tags = ','.join(sorted(set(normalized_tags)))
        else:
            self.tags = None

    @property
    def shared_with_users(self):
        """Get shared_with_user_ids as a list"""
        if self.shared_with_user_ids:
            return json.loads(self.shared_with_user_ids)
        return []

    @shared_with_users.setter
    def shared_with_users(self, value):
        """Set shared_with_user_ids from a list"""
        if value and isinstance(value, list):
            self.shared_with_user_ids = json.dumps(value)
        else:
            self.shared_with_user_ids = None
