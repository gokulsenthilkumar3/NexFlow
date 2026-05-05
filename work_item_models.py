from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, declarative_base
import enum
import datetime

Base = declarative_base()

class ItemType(enum.Enum):
    EPIC = "epic"
    FEATURE = "feature"
    STORY = "story"
    TASK = "task"
    BUG = "bug"

class ItemStatus(enum.Enum):
    BACKLOG = "backlog"
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class WorkItem(Base):
    __tablename__ = "work_items"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(Enum(ItemType), default=ItemType.TASK)
    status = Column(Enum(ItemStatus), default=ItemStatus.TO_DO)
    priority = Column(String(50), default="medium")
    
    assigned_to = Column(String(100)) # User ID
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("work_items.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    subtasks = relationship("WorkItem", backref="parent", remote_side=[id])

class Sprint(Base):
    __tablename__ = "sprints"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    goal = Column(Text)
    
    items = relationship("WorkItem", backref="sprint")
