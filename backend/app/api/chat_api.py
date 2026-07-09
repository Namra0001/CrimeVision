from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import time

from app.api.deps import get_db, get_current_user
from app.models.chat import Conversation, Message
from app.services.rag_service import rag_service

router = APIRouter()

# Schema definitions
class ChatMessageBase(BaseModel):
    role: str
    content: str
    
class ChatMessageSchema(ChatMessageBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ConversationSchema(BaseModel):
    id: str
    title: str
    is_pinned: bool
    is_favorite: bool
    updated_at: datetime
    class Config:
        from_attributes = True

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    history: List[ChatMessageSchema]

def generate_title_task(db: Session, conversation_id: str, first_message: str):
    """Background task to generate a title for the conversation."""
    try:
        title = rag_service.ask(
            f"Generate a very short 3-5 word title for a conversation that starts with: '{first_message}'. Do not use quotes in your response. Do not say 'Title:'. Just output the title."
        )
        title = title.strip().strip('"').strip("'")
        
        # Avoid generic titles
        if len(title) > 50 or "sorry" in title.lower() or "error" in title.lower():
            title = "New Conversation"
            
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.title = title
            db.commit()
    except Exception as e:
        print(f"Error generating title: {e}")

@router.get("/conversations", response_model=List[ConversationSchema])
def list_conversations(
    db: Session = Depends(get_db),
    # user = Depends(get_current_user) # Uncomment when auth is strict
):
    # Fetch all non-deleted conversations
    # In a real app, filter by user.id
    conversations = db.query(Conversation).filter(
        Conversation.is_deleted == False
    ).order_by(
        desc(Conversation.is_pinned), 
        desc(Conversation.updated_at)
    ).all()
    
    return conversations

@router.post("/conversations", response_model=ConversationSchema)
def create_conversation(
    db: Session = Depends(get_db),
):
    new_conv = Conversation(title="New Conversation")
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

@router.get("/conversations/{conversation_id}", response_model=List[ChatMessageSchema])
def get_conversation_history(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id, 
        Conversation.is_deleted == False
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return conv.messages

@router.put("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: str, 
    update_data: UpdateConversationRequest,
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if update_data.title is not None:
        conv.title = update_data.title
    if update_data.is_pinned is not None:
        conv.is_pinned = update_data.is_pinned
        
    conv.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success"}

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv.is_deleted = True
    db.commit()
    return {"status": "success"}

@router.post("/ask", response_model=ChatResponse)
def ask_question(
    request: ChatRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    start_time = time.time()
    
    # 1. Get or Create Conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conv = Conversation(title="New Conversation")
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conversation_id = conv.id
    else:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
    # Check if this is the first message to trigger auto-titling
    message_count = db.query(Message).filter(Message.conversation_id == conversation_id).count()
    is_first_message = message_count == 0

    # 2. Save User Message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message,
        model_used="user"
    )
    db.add(user_msg)
    db.commit()

    # 3. Retrieve Context (last 10 messages)
    history = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp).all()
    
    # Format history for RAG service (excluding the current message which we just added)
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in history[:-1]]

    # 4. Generate AI Response
    try:
        answer = rag_service.ask(request.message, history=history_dicts, language=request.language)
    except Exception as e:
        answer = "Sorry, I encountered an error while processing your request."
        print(f"Error in chat endpoint: {e}")

    execution_time = int((time.time() - start_time) * 1000)

    # 5. Save AI Message
    ai_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
        model_used="gemini-2.5-flash",
        execution_time_ms=execution_time
    )
    db.add(ai_msg)
    
    # Update conversation timestamp
    conv.updated_at = datetime.utcnow()
    db.commit()
    
    # 6. Auto-title if first message
    if is_first_message:
        background_tasks.add_task(generate_title_task, db, conversation_id, request.message)

    # 7. Return current history
    full_history = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp).all()

    return ChatResponse(
        conversation_id=conversation_id,
        message=answer,
        history=full_history
    )
