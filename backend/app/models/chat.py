import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True) # Optional for now
    title = Column(String(255), default="New Conversation")
    is_pinned = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.timestamp")
    tags = relationship("ConversationTag", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(50)) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class ConversationTag(Base):
    __tablename__ = "conversation_tags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"))
    tag_name = Column(String(100))

    # Relationships
    conversation = relationship("Conversation", back_populates="tags")
